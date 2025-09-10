import { MySqlTable, TableConfig, varchar } from "drizzle-orm/mysql-core";
import { Base } from "./app";
import { sql } from "drizzle-orm";
import randomUseragent from "random-useragent";
import { metamask } from "../config/ext";
import { Wallet } from "../utils/wallet/wallet";
import { getTypeByExt } from "../utils/wallet/config";
import { PageWithCursor } from "puppeteer-real-browser";
import { signMessageWithPrivateKey } from "../utils/onchain/help";
import logger from "../infrastructure/logger";
import { Register } from "../register/decorators";
import { quickReceiveCode, sleep } from "../utils/help";
import { autoXAuth } from "../utils/twitter/x_front";
import { autoDiscordAuth } from "../utils/dc/dc_front";
import { click, wait } from "../utils/browser/page";
import { readdirSync } from "node:fs";
import path from "node:path";
import { RESOURCE_DIR } from "../config";
import { Account, tableFactor } from "../schema/base_models";

export const SpekterTable = tableFactor("spekter", {});

export type SpekterAccount = Account<typeof SpekterTable>;

interface UserInfo {
  membershipNumber: string;
  address: string;
  discordUser: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  twitterUser: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  emailAddress: string;
  emailVerified: boolean;
  username: string;
  hasSetAvatarBefore: boolean;
  hasSetBannerBefore: boolean;
  hasSetUsernameBefore: boolean;
  isFirstLogin: boolean;
}

const IMAGE_DIR = path.join(RESOURCE_DIR, "avatar"); // 替换为你的图片目录

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

@Register("spekter")
export class Spekter extends Base {
  public table: MySqlTable<TableConfig> = SpekterTable;
  private wallet = metamask;
  private walletManage = new Wallet(getTypeByExt(this.wallet));
  private oldCF: string = "";

  get headers() {
    return {
      accept: "application/json",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      "content-type": "application/json",
      origin: "https://dispatch.spekter.games",
      priority: "u=1, i",
      referer: "https://dispatch.spekter.games/",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent":
        randomUseragent.getRandom() ||
        '"Chromium";v="139", "Not:A-Brand";v="99"',
    };
  }

  async run() {
    if (this.param == "daliy") {
      await this.daily();
      return;
    }

    await this.completeTaskWork();
  }

  async completeTaskWork() {
    let q = sql`completed IN (0,1)`;
    const account = await this.getAccount<SpekterAccount>({ where: q });
    const page = await this.newBrowser(
      "https://dispatch.spekter.games/",
      [this.wallet],
      `Spekter_${account.id}`,
    );
    await this.doBase(page, account);
    let info = await this.userInfo(page);
    let user = info.account;
    await this.loginByPage(page, account);

    try {
      if (account.completed == 0) {
        (!user.discordUser.id || !user.twitterUser.id) &&
          (await this.authSocial(page, account, user));
      }
    } catch {}

    const taskStatus = await this.doTask(page, account);
    await this.uploadImage(page, user);
    info = await this.userInfo(page);
    user = info.account;
    if (taskStatus && user.hasSetAvatarBefore && user.hasSetBannerBefore) {
      await this.updateAccount(
        { completed: 2, points: info.season.experiencePoints },
        sql`id = ${account.id}`,
      );
    }
  }

  async daily() {
    let q = sql`(daliy_at is null or daliy_at < DATE_SUB(NOW(), INTERVAL 1 DAY)) AND completed >= 1`;
    const account = await this.getAccount<SpekterAccount>({ where: q });
    const page = await this.newBrowser(
      "https://dispatch.spekter.games/",
      [],
      `Spekter_${account.id}`,
    );
    await this.doBase(page, account);
    let info2 = await this.userInfo(page);
    await this.spin(page);
    let info = await this.userInfo(page);
    logger.info(
      `Daily completed; 积分增加：${info.season.experiencePoints - info2.season.experiencePoints}`,
    );
    await this.updateAccount(
      { points: info.season.experiencePoints, daliy_at: sql`NOW()` },
      sql`id = ${account.id}`,
    );
  }

  async spin(page: PageWithCursor) {
    const url = "https://public.api.on3.one/api/Rewards/spin";
    let data = JSON.stringify({});
    const resp = await this.requestByFetch(page, "post", url, data);
    if (!resp) return;
  }

  async uploadImage(page: PageWithCursor, user: UserInfo) {
    await page.goto("https://dispatch.spekter.games/settings", {
      waitUntil: "networkidle2",
    });

    await wait(page, 'input[name="UserAvatar"]');

    if (!user.hasSetAvatarBefore) {
      const fileElement = await page.waitForSelector(
        'input[name="UserAvatar"]',
      );
      const file = getRandomImage();
      await fileElement.uploadFile(file);

      // 等待特定API响应
      await page.waitForResponse(
        async (res) => {
          const isTargetAPI =
            res.url() === "https://public.api.on3.one/api/User/profile";
          if (!isTargetAPI) return false;

          // 获取响应状态码
          const status = res.status();

          return status === 200;
        },
        { timeout: 90_000 },
      );
    }

    if (!user.hasSetBannerBefore) {
      const bannerElement = await page.waitForSelector(
        'input[name="UserBanner"]',
      );
      const bannerFile = getRandomImage();
      await bannerElement.uploadFile(bannerFile);
      await page.waitForResponse(
        async (res) => {
          const isTargetAPI =
            res.url() === "https://public.api.on3.one/api/User/profile";
          if (!isTargetAPI) return false;

          // 获取响应状态码
          const status = res.status();

          return status === 200;
        },
        { timeout: 90_000 },
      );
    }
    return true;
  }

  async doTask(page: PageWithCursor, accoutn: SpekterAccount) {
    let tasks = await this.quests(page);
    if (!tasks.length) {
      return tasks.length === 0;
    }
    for (const task of tasks) {
      await this.completeTask(page, task.id);
      await sleep(2_000);
    }

    tasks = await this.quests(page);
    if (tasks.length === 0) {
      await this.updateAccount({ completed: 1 }, sql`id = ${accoutn.id}`);
    }
    return tasks.length === 0;
  }

  async completeTask(page: PageWithCursor, campaignId: string) {
    const token = await this.cf(false);
    let data = JSON.stringify({
      securityToken: token,
      campaignId,
    });

    const r = await this.requestByFetch<{
      wasSuccessful: boolean;
      errors: any[];
    }>(page, "post", "https://public.api.on3.one/api/Quests/complete", data);
    if (!r.wasSuccessful) {
      logger.error(
        `Failed to complete task ${campaignId}: ${JSON.stringify(r.errors)}`,
      );
    }
    return r.wasSuccessful;
  }

  async authSocial(
    page: PageWithCursor,
    account: SpekterAccount,
    user: UserInfo,
  ) {
    await page.goto("https://dispatch.spekter.games/settings", {
      waitUntil: "networkidle2",
    });

    if (!user.twitterUser.id) {
      await this.bindX(page, account);
      await page.waitForNavigation();
    }

    if (!user.discordUser.id) {
      await this.bindDc(page, account);
      await page.waitForNavigation();
    }

    await page.bringToFront();
    try {
      await wait(
        page,
        `//span[text()="${account.addr.substring(0, 8).toLowerCase()}"]`,
      );
    } catch {}
  }

  async loginByPage(page: PageWithCursor, account: SpekterAccount) {
    await wait(page, `//span[text()="Sign in"]`);

    await click(page, `//span[text()="Sign in"]`);
    await sleep(1_000);
    await click(page, `//span[text()="MetaMask"]`);
    await sleep(1_500);
    await this.walletManage.doSomethingFn(this.browser.browser, 2);
    await click(page, `button[data-testid="sign-in-button"]`);
    await sleep(1_500);
    await this.walletManage.doSomethingFn(this.browser.browser, 2);
    await wait(
      page,
      `//span[text()="${account.addr.substring(0, 8).toLowerCase()}"]`,
    );
  }

  async doBase(page: PageWithCursor, account: SpekterAccount) {
    const rsp = await this.login(page, account);
    if (!rsp.user.account.emailAddress || !rsp.user.account.emailVerified) {
      await this.setEmail(page, rsp.user.account, account);
    }
    if (
      !rsp.user.account.username ||
      rsp.user.account.username != account.addr.substring(0, 8).toLowerCase()
    ) {
      await this.updateUserName(page, account);
    }

    if (rsp.user.account.isFirstLogin) {
      await this.onboard(page, account);
    }
  }

  async bindX(page: PageWithCursor, account: SpekterAccount) {
    const that = this;
    const ok = await autoXAuth(
      page,
      {
        token: account.x_token,
        project: "spekter",
        auth_btn: `//div[contains(@class,"bg-twitter")]//button[normalize-space(text())="Connect"]`,
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

  async bindDc(page: PageWithCursor, account: SpekterAccount) {
    const that = this;
    const ok = await autoDiscordAuth(
      page,
      {
        token: account.dc_token,
        project: "spekter",
        authBtn: `//div[contains(@class,"bg-discord")]//button[normalize-space(text())="Connect"]`,
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

  async onboard(page: PageWithCursor, account: SpekterAccount) {
    const url = "https://public.api.on3.one/api/User/complete-onboarding";
    const cf = await this.cf();
    let data = JSON.stringify({
      referral: {
        code: "aFhLtNvL",
        source: "",
      },
      securityToken: cf,
    });
    const resp = await this.requestByFetch<{
      wasSuccessful: boolean;
      errors: any[];
    }>(page, "post", url, data);

    if (!resp.wasSuccessful) {
      throw new Error(`Failed to onboard: ${resp.errors.join(", ")}`);
    }
    return true;
  }

  async cf(old = false) {
    if (old && this.oldCF) {
      return this.oldCF;
    }

    this.oldCF = await this.getCfToken(
      "https://dispatch.spekter.games/",
      "0x4AAAAAAAZQImNuBBIfxNfH",
    );
    return this.oldCF;
  }

  async updateUserName(page: PageWithCursor, account: SpekterAccount) {
    let data = JSON.stringify({
      username: account.addr.substring(0, 8).toLowerCase(),
    });

    const url = "https://public.api.on3.one/api/User/profile";
    const resp = await this.requestByFetch<{
      wasSuccessful: boolean;
      errors: any[];
    }>(page, "post", url, data);

    if (!resp.wasSuccessful) {
      throw new Error(`Failed to update username: ${resp.errors.join(", ")}`);
    }
    return true;
  }

  async setEmail(
    page: PageWithCursor,
    user: UserInfo,
    account: SpekterAccount,
  ) {
    if (user.emailAddress && user.emailVerified) {
      return true;
    }

    if (!account.email) {
      const { email, password } = await this.getEmail("spekter", true);
      account.email = user.emailAddress;
      account.email_pass = password;
      await this.updateAccount(
        { email, email_pass: password },
        sql`id =${account.id}`,
      );
    }

    let data = JSON.stringify({
      fromEmbeddedWallet: false,
      emailAddress: account.email,
      emailNotifications: {
        platformNotifications: true,
        newsletterNotifications: true,
      },
    });

    let url = "https://public.api.on3.one/api/User/profile";

    const resp = await this.requestByFetch<{
      wasSuccessful: boolean;
      errors: any[];
    }>(page, "post", url, data);
    if (!resp?.wasSuccessful) {
      throw new Error(`Failed to set email: ${resp.errors.join(", ")}`);
    }

    const verifyURL = await quickReceiveCode(
      account.email,
      account.email_pass,
      null,
      /Verify e-mail\s*\[?(https:\/\/dispatch\.spekter\.games\/verify[^\]\s]*)\]?/i,
    );
    const nurl = new URL(verifyURL);
    const tValue = nurl.searchParams.get("t");
    if (!tValue) {
      throw new Error("Failed to get verification token");
    }

    url = "https://public.api.on3.one/api/User/email-verify";
    data = JSON.stringify({ verificationToken: tValue });

    const rp = await this.requestByFetch<{
      wasSuccessful: boolean;
      errors: any[];
    }>(page, "post", url, data);
    if (!rp?.wasSuccessful) {
      throw new Error(`Failed to verify email: ${rp.errors.join(", ")}`);
    }

    return true;
  }

  async authPayload(page: PageWithCursor, account: SpekterAccount) {
    const url = "https://public.api.on3.one/api/Auth/payload";
    let data = JSON.stringify({
      address: account.addr,
      chainId: "42161",
    });
    const rsp = await this.requestByFetch<{
      payload: {
        domain: string;
        address: string;
        tenant: string;
        statement: string;
        uri: string;
        version: string;
        nonce: string;
        issued_at: string;
        expiration_time: string;
        chain_id: string;
      };
    }>(page, "post", url, data);

    if (!rsp) {
      throw new Error("获取钱包签名数据失败");
    }
    return rsp;
  }

  async login(page: PageWithCursor, account: SpekterAccount) {
    const payload = await this.authPayload(page, account);
    const {
      domain,
      address,
      tenant,
      statement,
      uri,
      version,
      nonce,
      issued_at,
      chain_id,
      expiration_time,
    } = payload.payload;

    const url = "https://public.api.on3.one/api/Auth/login";
    const msg = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}\n\nURI: ${uri}\nVersion: ${version}\nChain ID: ${chain_id}\nNonce: ${nonce}\nIssued At: ${issued_at}\nExpiration Time: ${expiration_time}`;
    const sign = await signMessageWithPrivateKey(this.pk, msg);
    let data = JSON.stringify({
      payload: {
        payload: {
          domain,
          address,
          tenant,
          statement,
          uri,
          version,
          nonce,
          issued_at,
          chain_id,
          expiration_time,
          invalid_before: null,
        },
        signature: sign,
      },
    });
    const rsp = await this.requestByFetch<{
      address: string;
      token: string;
      error: string;
      user: {
        account: UserInfo;
      };
    }>(page, "post", url, data);

    if (!rsp) {
      throw new Error("钱包登录失败");
    }
    if (!rsp.token) {
      logger.error(`钱包登录失败:${rsp.error}`);
      throw new Error("钱包登录失败:" + rsp.error);
    }
    this.jwt = rsp.token;
    return rsp;
  }

  async userInfo(page: PageWithCursor) {
    const url = "https://public.api.on3.one/api/Auth/user";
    const rsp = await this.requestByFetch<{
      account: UserInfo;
      season: {
        experiencePoints: number;
      };
    }>(page, "get", url);

    if (!rsp) {
      throw new Error("获取用户信息失败");
    }
    if (!rsp.account) {
      throw new Error("获取用户信息失败:");
    }
    return rsp;
  }

  async quests(page: PageWithCursor) {
    const url = "https://public.api.on3.one/api/Quests/quests";
    const resp = await this.requestByFetch<{
      twitterPostCampaigns: {
        id: string;
        // tweetId: string;
        userEntryStatus: string;
        requirements: {
          connectedTelegram: boolean;
          connectedDiscord: boolean;
        };
      }[];
      customCampaigns: {
        id: string;
        userEntryStatus: string;
        requirements: {
          connectedTelegram: boolean;
          connectedDiscord: boolean;
        };
      }[];
    }>(page, "get", url);
    if (!resp) {
      throw new Error("获取任务列表失败");
    }
    if (!resp.twitterPostCampaigns) {
      throw new Error("获取任务列表失败");
    }
    return resp.twitterPostCampaigns
      .filter(
        (item) => !item.userEntryStatus && !item.requirements.connectedTelegram,
      )
      .concat(
        resp.customCampaigns.filter(
          (item) =>
            !item.userEntryStatus && !item.requirements.connectedTelegram,
        ),
      );
  }
}
