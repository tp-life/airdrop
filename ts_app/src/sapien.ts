import { MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { Base } from "./app";
import { SapienAccount, SapienTable } from "../schema/sapien";
import { sql } from "drizzle-orm";
import { signMessageWithPrivateKey } from "../utils/onchain/help";
import { Register } from "../register/decorators";
import { metamask } from "../config/ext";
import { Wallet } from "../utils/wallet/wallet";
import { getTypeByExt } from "../utils/wallet/config";
import {
  click,
  clickElement,
  getCookies,
  getElement,
  has,
  input,
  wait,
  wrapSelector,
} from "../utils/browser/page";
import { getRandomElement, quickReceiveCode, sleep } from "../utils/help";
import { Page } from "rebrowser-puppeteer-core";
import { autoXAuth } from "../utils/twitter/x_front";
import { autoDiscordAuth } from "../utils/dc/dc_front";
import logger from "../infrastructure/logger";
import { RESOURCE_DIR } from "../config";
import path from "path";
import { readdirSync } from "fs";

const IMAGE_DIR = path.join(RESOURCE_DIR, "books"); // 替换为你的图片目录

// 读取目录并返回随机一张图片路径
function getRandomImage(): string {
  const files = readdirSync(IMAGE_DIR);
  const imageFiles = files.filter((file) =>
    /\.(png|jpe?g|gif|webp)$/i.test(file),
  );

  if (imageFiles.length === 0) {
    throw new Error("No image files found in directory.");
  }

  const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)];
  return path.join(IMAGE_DIR, randomFile);
}

@Register("sapien")
export class Sapien extends Base {
  public table: MySqlTable<TableConfig> = SapienTable;
  private ext = metamask;
  private wallet = new Wallet(getTypeByExt(this.ext));
  private cookie = "";

  get headers() {
    return {
      accept: "application/json",
      "accept-language": "zh-CN,zh;q=0.9",
      "content-type": "application/json",
      origin: "https://app.sapien.io",
      priority: "u=1, i",
      "privy-app-id": "cm05notwe04i9tkaqro03obfj",
      "privy-ca-id": "5bb8f379-5df4-48ec-bd94-6ca550f879a7",
      "privy-client": "react-auth:2.14.2",
      referer: "https://app.sapien.io/",
      "sec-ch-ua":
        '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      cookie: this.cookie,
    };
  }

  async run() {
    let q = sql`(daily_at IS NULL OR locked_at < DATE_SUB(NOW(), INTERVAL 1 DAY) ) AND (locked_at is null OR locked_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE))`;
    const account = await this.getAccount<SapienAccount>({
      where: q,
    });
    const page = await this.loginByPage(account);
    if (!page) {
      throw new Error("登录失败");
    }
    await this.browser.startTurnstile(page);
    await this.getToken();

    await this.setUserInfo(page, account);
    for (let i = 0; i < 5; i++) {
      try {
        if (await this.uploadImage(page)) {
          await this.updateAccount(
            { daily_at: sql`NOW()` },
            sql`id = ${account.id}`,
          );
        }
      } catch (error) {
        console.error("上传图片失败:", error);
      }
    }

    try {
      if (!account.is_bind_social && (await this.bindSocial(page, account))) {
        await this.updateAccount(
          { is_bind_social: 1 },
          sql`id = ${account.id}`,
        );
      }
    } catch (error) {
      logger.error(`更新社交信息失败`);
    }

    await this.getPoints(page, account);
  }

  async uploadImage(page: Page) {
    await page.goto(
      "https://app.sapien.io/t/tag?tagFlowNodeId=8810cad9-4783-452e-b88c-8c5cced1d3e3",
      { waitUntil: "networkidle2" },
    );

    await wait(page, `//h4[text()="选择或拖放图像文件..."]`, 90_000);

    const fileElement = await page.waitForSelector("input[type=file]");
    const file = getRandomImage();
    await fileElement.uploadFile(file);

    await sleep(5_000);

    await wait(page, `//h4[text()="1 个文件已上传"]`, 60_000);
    await sleep(3_000);
    // 获取所有 .chakra-select 元素并随机选择选项
    // await page.$$eval("select.chakra-select", (selects) => {
    //   selects.forEach(async (select) => {
    //     const options = Array.from(select.options);
    //     if (options.length > 1) {
    //       // 随机选一个（排除默认第一个的话从 index 1 开始）
    //       const randomIndex = Math.floor(Math.random() * options.length);
    //       select.selectedIndex = randomIndex;

    //       // 手动触发 change 事件（某些框架如 React 需要）
    //       const event = new Event("change", { bubbles: true });
    //       select.dispatchEvent(event);
    //       await sleep(1_000);
    //     }
    //   });
    // });

    // const getRandom = (min: number, max: number) =>
    //   Math.floor(Math.random() * (max - min + 1)) + min;
    // await sleep(800);
    // await input(
    //   page,
    //   `input[placeholder="estimatedWordCount"]`,
    //   getRandom(50, 1000).toString(),
    // );

    await sleep(1_000);
    await click(page, `//label`);
    await sleep(800);
    await click(page, `//button[text()="提交"]`);
    await sleep(1_200);
    await wait(page, `//button[text()="选择一个任务"]`, 60_000);
    return true;
  }

  async setUserInfo(page: Page, account: SapienAccount) {
    const userInfo = await this.userInfo(page);
    if (!userInfo) {
      return false;
    }

    if (!userInfo.email) {
      await this.bindEmail(account);
    }

    if (!userInfo.location.length) {
      await this.setLocation(page);
    }

    if (userInfo.referralLink) {
      await this.updateAccount(
        { referral_code: userInfo.referralLink },
        sql`id = ${account.id}`,
      );
      await this.updateAccount(
        { referral_total: sql`referral_total + 1` },
        sql`referral_code = ${account.from_referral_code}`,
      );
    }
  }

  async bindSocial(page: Page, account: SapienAccount) {
    let links = await this.queryLink();
    let needDo = links
      .map((item) => item.type)
      .filter(
        (item) =>
          item.includes("twitter_oauth") || item.includes("discord_oauth"),
      );

    if (needDo.length > 1) {
      return true;
    }

    await page.goto("https://app.sapien.io/t/points/dashboard", {
      waitUntil: "networkidle2",
    });

    if (!needDo.includes("twitter_oauth")) {
      try {
        await wait(page, `div[walkthrough-id="connect-twitter"]`, 60_000);
      } catch {}
      await this.bindX(page, account);
      await page.waitForNavigation();
    }
    if (!needDo.includes("discord_oauth")) {
      try {
        await wait(page, `div[walkthrough-id="connect-discord"]`, 90_000);
      } catch {}
      await this.bindDc(page, account);
      await page.waitForNavigation();
    }

    await wait(page, `div[walkthrough-id="connect-twitter"]`, 60_000);
    links = await this.queryLink();
    needDo = links
      .map((item) => item.type)
      .filter(
        (item) =>
          item.includes("twitter_oauth") || item.includes("discord_oauth"),
      );

    if (needDo.length > 1) {
      return true;
    }
    return false;
  }

  async bindX(page: Page, account: SapienAccount) {
    const that = this;
    const ok = await autoXAuth(
      page,
      {
        token: account.x_token,
        project: "sapien",
        auth_btn: `div[walkthrough-id="connect-twitter"] button`,
        x_query: sql`created_at > '2025-07-31 00:00:00'`,
      },
      async (token: string) => {
        await that.updateAccount({ x_token: "" }, sql`id = ${account.id}`);
      },
      async (token: string, u: string) => {
        await that.updateAccount({ x_token: token }, sql`id = ${account.id}`);
      },
    );

    return ok;
  }

  async bindDc(page: Page, account: SapienAccount) {
    const that = this;
    const ok = await autoDiscordAuth(
      page,
      {
        token: account.dc_token,
        project: "sapien",
        authBtn: `div[walkthrough-id="connect-discord"] button`,
      },
      async (token: string) => {
        await that.updateAccount({ dc_token: "" }, sql`id = ${account.id}`);
      },
      async (token: string) => {
        await that.updateAccount({ dc_token: token }, sql`id = ${account.id}`);
      },
    );

    return ok;
  }

  async getToken() {
    const { strCookie, kmap } = await getCookies(
      this.browser.browser,
      [],
      ".sapien.io",
    );
    this.cookie = strCookie;
    this.jwt = kmap["privy-token"];
  }

  async getRerrferCode(account: SapienAccount) {
    if (account.from_referral_code) {
      return account.from_referral_code;
    }

    const q = sql`referral_code is not null AND referral_total < 10 AND (referral_locked  < DATE_SUB(NOW(), INTERVAL 5 MINUTE) OR referral_locked IS NULL)`;
    const rerrferAccount = await this.getAccount<SapienAccount>({
      where: q,
      raise: false,
      hasIP: false,
      lockKey: "referral_locked",
      // orderBy: sql`referral_total DESC`,
    });

    let code =
      "https://app.sapien.io/join/CyanLimpetMichel?utm_source=user_referral&utm_medium=referral&utm_campaign=CyanLimpetMichel";
    if (rerrferAccount) {
      code = rerrferAccount.referral_code;
    }

    account.from_referral_code = code;
    await this.updateAccount(
      { from_referral_code: code },
      sql`id = ${account.id}`,
    );

    return code;
  }

  async loginByPage(account: SapienAccount) {
    const url = await this.getRerrferCode(account);
    const page = await this.newBrowser(
      url,
      [this.ext],
      `sapien_${account.id}`,
      false,
    );
    await sleep(5_000);
    await page.bringToFront();
    const avatar = await wait(page, `//button[text()="登录"]`, 60_000);
    if (!avatar) {
      throw new Error("用户头像未找到");
    }
    await avatar.click();
    await sleep(800);
    await click(page, `//div[text()="Continue with a wallet"]`);
    await sleep(800);
    await click(page, `//span[text()="MetaMask"]`);
    await sleep(800);
    let ok = await this.wallet.doSomethingFn(this.browser.browser, 5);
    if (!ok) {
      throw new Error("登录失败");
    }
    await sleep(3_000);
    if (await has(page, `//button[text()="开始"]`)) {
      await click(page, `//button[text()="开始"]`);
      await sleep(2_000);
      await this.wallet.doSomethingFn(this.browser.browser, 2);
    }

    await sleep(3_000);

    if (await has(page, `//button[text()="接受"]`)) {
      await click(page, `//button[text()="接受"]`);
      await sleep(1_000);
      await click(page, `//button[text()="跳过简介"]`);
    }

    const e = await wait(page, `.chakra-menu__menu-button`, 90_000);
    return !!e ? page : null;
  }

  async login(account: SapienAccount) {
    const siteKey = "0x4AAAAAAADnPIDROrmt1Wwj";
    const pageurl = "https://app.sapien.io/";
    const token = await this.getCfToken(pageurl, siteKey);
    if (!token) {
      throw new Error("获取 CF token 失败");
    }

    const nonceURL = "https://privy.sapien.io/api/v1/siwe/init";
    const nPayload = { address: account.addr, token };
    const nonceResp = await this.request<{
      nonce: string;
      address: string;
      expires_at: string;
    }>("post", nonceURL, nPayload);
    if (!nonceResp || !nonceResp?.nonce) {
      throw new Error("获取 nonce 失败");
    }

    const signURL = "https://privy.sapien.io/api/v1/siwe/authenticate";
    const msg = `app.sapien.io wants you to sign in with your Ethereum account:\n${nonceResp.address}\n\nBy signing, you are proving you own this wallet and logging in. This does not initiate a transaction or cost any fees.\n\nURI: https://app.sapien.io\nVersion: 1\nChain ID: 8453\nNonce: ${nonceResp.nonce}\nIssued At: ${nonceResp.expires_at}\nResources:\n- https://privy.io`;
    const sign = await signMessageWithPrivateKey(account.pk, msg);
    const payload = {
      message: msg,
      signature: sign,
      chainId: "eip155:8453",
      walletClientType: "metamask",
      connectorType: "injected",
      mode: "login-or-sign-up",
    };

    const resp = await this.request("post", signURL, payload);
    if (!resp) {
      throw new Error("钱包登录失败");
    }
  }

  async queryLink() {
    let data = JSON.stringify({
      refresh_token: "deprecated",
    });
    const url = "https://privy.sapien.io/api/v1/sessions";

    const res = await this.request<{
      user: { linked_accounts: { type: string }[] };
    }>("post", url, data);
    if (!res) {
      return [];
    }
    return res.user.linked_accounts;
  }

  async checkEmail(account: SapienAccount) {
    if (account.email) {
      return;
    }

    const { email, password } = await this.getEmail("sapien", true);
    account.email = email;
    account.email_password = password;
    await this.updateAccount(
      { email: email, email_password: password },
      sql`id = ${account.id}`,
    );
  }

  async bindEmail(account: SapienAccount) {
    await this.checkEmail(account);

    let url = "https://privy.sapien.io/api/v1/passwordless/init";
    let data = JSON.stringify({
      email: account.email,
    });

    let res = await this.request<{ success: boolean }>("post", url, data);
    if (!res || !res.success) {
      logger.error("发送邮箱验证码失败");
      return false;
    }

    await sleep(5_000);
    const code = await quickReceiveCode(account.email, account.email_password);
    if (!code) {
      logger.error("获取邮箱验证码失败");
      return false;
    }

    url = "https://privy.sapien.io/api/v1/passwordless/link";
    data = JSON.stringify({
      email: account.email,
      code: code,
    });

    const r = await this.request<{ linked_accounts: { type: string }[] }>(
      "post",
      url,
      data,
    );
    if (!r) {
      logger.error("绑定邮箱失败");
      return false;
    }

    return true;
  }

  async userInfo(page: Page) {
    let data = JSON.stringify({
      query: `query session {
      currentUser {
        id
        email
        referralLink
        givenName
        familyName
        username
        isTagger
        isCustomer
        isOperator
        isAdmin
        hasCompletedOnboarding
        activeAvatarId
        acceptedTermsOfServiceAt
        lastWorldIdVerification
        isWorldIdVerified
        activeReferrals
        totalReferrals
        location {
          country
          id
          isCurrent
          updatedAt
        }
        points {
          tentativeValue
          finalizedValue
          displayValue
          rejectedValue
          updated
        }
        usdc {
          tentativeValue
          finalizedValue
        }
        streak {
          streakLength
        }
        multiplier {
          id
          displayValue
          updated
        }
      }
      currentOrganization {
        id
        name
        moduleTypes
        isPrepaid
      }
      preferences: userPreferences {
        language: preferredLanguage
        avatarType
      }
    }`,
      variables: {},
    });

    const url = "https://server.sapien.io/graphql";
    const resp = await this.requestByFetch<{
      data: {
        currentUser: {
          email: string;
          referralLink: string;
          location: { country: string }[];
        };
      };
    }>(page, "post", url, data);
    if (!resp) {
      logger.error("获取用户信息失败");
      return null;
    }

    return resp.data.currentUser;
  }

  async setLocation(page: Page) {
    const area = getRandomElement(["China", "Japan", "Armenia", "Canada"]);
    const url = "https://server.sapien.io/graphql";
    let data = JSON.stringify({
      query: `mutation updateUserLocation($input: MutationUpdateUserLocationInput!) {
      updateUserLocation(input: $input) {
        country
      }
    }`,
      variables: { input: { country: area } },
    });

    const resp = await this.requestByFetch<{
      data: {
        updateUserLocation: { country: string };
      };
    }>(page, "post", url, data);

    if (!resp) {
      logger.error("更新用户位置失败");
      return null;
    }

    return resp.data.updateUserLocation;
  }

  async getPoints(page: Page, account: SapienAccount) {
    let data = JSON.stringify({
      query: `query gameMenu {
      user: currentUser {
        usdc {
          displayValue
        }
        points {
          tentativeValue
          finalizedValue
          displayValue
          rejectedValue
          updated
        }
        streak {
          streakLength
        }
        multiplier {
          id
          displayValue
          updated
        }
      }
    }`,
      variables: {},
    });
    const url = "https://server.sapien.io/graphql";
    const resp = await this.requestByFetch<{
      data: {
        user: { points: { tentativeValue: string; finalizedValue: string } };
      };
    }>(page, "post", url, data);

    if (!resp || !resp.data?.user?.points) {
      logger.error("获取用户积分情况失败");
      return;
    }
    await this.updateAccount(
      {
        points: resp.data?.user?.points?.finalizedValue,
        under_points: resp.data?.user?.points?.tentativeValue,
      },
      sql`id =${account.id}`,
    );
  }
}
