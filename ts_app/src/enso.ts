import { Base } from "./app";
import { eq, sql } from "drizzle-orm";
import { BrowserManage } from "../utils/browser";
import { Register } from "../register/decorators";
import {
  generateEmail,
  generateName,
  padToTen,
  parseEmailInfo,
  receiveCode,
  sleep,
} from "../utils/help";
import {
  click,
  has,
  input,
  newPage,
  wait,
  waitAndClick,
  wrapSelector,
} from "../utils/browser/page";
import logger from "../infrastructure/logger";
import config from "../config";
import { EnsoAccount, EnsoTable } from "../schema/enso";
import { Page } from "rebrowser-puppeteer-core";
import * as jwt from "jsonwebtoken";
import { metamask, yesCaptcha } from "../config/ext";
import randomUseragent from "random-useragent";
import { AxiosHeaders, RawAxiosRequestHeaders } from "axios";
import { signMessageWithPrivateKey } from "../utils/onchain/help";
import { waitForHcaptchaVerified } from "../utils/browser/ext";
import { Wallet } from "../utils/wallet/wallet";
import { getTypeByExt } from "../utils/wallet/config";
import { EmailAccount, EmailTable } from "../schema/emails";

interface TrackProjecResp {
  success: boolean;
  message: string;
  code: number;
}

interface CreateDefiDexResult {
  success: boolean;
  reason?: string;
  slug?: string;
}

interface ZealyUserInfo {
  name: string;
  connectedWallet?: string | null;
  xp?: number;
  rank?: number;
}

type Campaign = {
  id: string;
  name: string;
  visited: boolean;
  pointsAwarded: boolean;
  // 根据实际接口结构添加更多字段
};

type GetCampaignsResponse = {
  campaigns: Campaign[];
  total: number;
};

interface Protocol {
  // 根据实际结构定义字段，如：
  id: string;
  name: string;
  [key: string]: any;
}

interface GoogleSignResult {
  expiresIn: number;
  idToken: string;
}

const DEFIDEX_LIMIT = 5;

@Register("enso")
export class Enso extends Base {
  public table = EnsoTable;
  private dex = true;
  private campaignList: number[] = [
    10, 12, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 3, 30,
    31, 32, 33, 34, 35, 36, 37, 38, 39, 4, 40, 41, 42, 43, 44, 46, 47, 48, 49,
    5, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 6, 60, 61, 62, 63, 64, 65, 66,
    67, 68, 69, 7, 70, 71, 72, 8, 9,
  ];
  private protocols: number[] = [
    1, 10, 100, 101, 102, 104, 106, 107, 108, 109, 11, 110, 111, 112, 114, 116,
    117, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 13, 130, 131,
    132, 133, 134, 135, 138, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26, 28,
    3, 31, 32, 33, 34, 35, 36, 37, 38, 39, 4, 40, 41, 42, 43, 44, 45, 46, 47,
    48, 49, 5, 50, 51, 52, 53, 54, 56, 57, 58, 59, 6, 60, 61, 62, 63, 65, 66,
    67, 68, 69, 7, 72, 73, 74, 75, 76, 77, 78, 79, 8, 80, 81, 82, 83, 85, 86,
    87, 88, 9, 90, 91, 92, 93, 95, 96, 97, 98, 99,
  ];
  private userAgent =
    randomUseragent.getRandom() || '"Chromium";v="122", "Not:A-Brand";v="99"';

  private walletPlugs = metamask;
  private walletManage = new Wallet(getTypeByExt(this.walletPlugs));

  get headers(): RawAxiosRequestHeaders | AxiosHeaders {
    const headers: Record<string, string> = {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.7",
      priority: "u=1, i",
      referer: "https://speedrun.enso.build/apps",
      "sec-ch-ua": this.userAgent,
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
    };

    return headers;
  }

  get ensoBaseHeader() {
    return {};
  }

  get zealyHeaders() {
    return {
      accept: "application/json",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      "content-length": "0",
      origin: "https://zealy.io",
      priority: "u=1, i",
      referer: "https://zealy.io/",
      "sec-ch-ua":
        '"Microsoft Edge";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0",
      "x-next-app-key": "",
    };
  }

  async openPage(account: EnsoAccount) {
    const exts = [this.walletPlugs];
    if (account.runDex && this.dex) {
      exts.push(yesCaptcha);
    }
    this.browser = new BrowserManage(
      this.userDataDir(`enso_${account.id}`),
      exts,
    );
    const page = await this.browser.open({
      url: "https://speedrun.enso.build/apps",
      pk: this.pk,
    });
    if (!page) {
      return null;
    }
    return page;
  }

  async run() {
    let q = sql`(locked_at is null OR locked_at < DATE_SUB(NOW(), INTERVAL 300 MINUTE))`;
    if (this.args["arg"] == "reg") {
      q = sql`(locked_at is null OR locked_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)) AND is_bind_zealy = 0`;
    } else if (this.args["arg"] == "daily") {
      q = sql`(locked_at is null OR locked_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)) AND is_bind_zealy = 1 AND (daliy_at IS NULL OR daliy_at < CURDATE()) AND run_dex=1`;
    }

    const account = await this.getAccount<EnsoAccount>({ where: q });
    this.pk = this.decodePK(account.pk);

    const customToken = await this.loginByAPI(account);
    if (!customToken) {
      logger.error("未获取自定义 token");
      return;
    }

    const idToken = await this.signInWithCustomToken(customToken);
    console.log("id Token :", idToken);
    if (!idToken) {
      logger.error("未获取 id token");
      return;
    }

    const runDex = account.runDex && this.dex;
    try {
      let page = null;
      if (!account.isBindZealy || runDex) {
        page = await this.openPage(account);
        if (!(await this.loginEnso(page))) {
          return;
        }
      }

      if (!account.isBindZealy) {
        if (!(await this.bindZealy(account))) {
          return;
        }
        await this.checkBound(account, idToken);
      }

      if (runDex) {
        const doPromise = this.do(account, idToken);
        const defxPromise = this.defx();

        await Promise.all([doPromise, defxPromise]);
      } else {
        await this.do(account, idToken);
      }

      const userInfo = await this.userInfo(account.zealyUserID, idToken);
      logger.info(`当前用户数据: ${JSON.stringify(userInfo)}`);
      let doc = { daliy_at: sql`NOW()` } as any;
      if (userInfo.xp || userInfo.rank) {
        doc = { ...doc, points: userInfo.xp, rank: userInfo.rank };
      }
      await this.updateAccount(doc, sql`id = ${account.id}`);
    } catch (err) {
      logger.error(`执行过程当中可能发生一些问题。${err}`);
    }

    logger.warn("执行结束");
    await sleep(3_000);
  }

  async defx() {
    const page = await newPage(this.browser.browser);
    await sleep(3_000);
    for (let i = 0; i < DEFIDEX_LIMIT; i++) {
      await page.goto("https://speedrun.enso.build/categories/de-fi", {
        waitUntil: "networkidle2",
      });
      try {
        const btn = await page.waitForSelector(
          wrapSelector(`//span[text()='DeFi DEX']`),
          { timeout: 30_000 },
        );
        if (!btn) {
          continue;
        }
        let sugre = this.generateProjectSlug();
        if (sugre.length > 15) {
          sugre = sugre.length > 15 ? sugre.slice(0, 15) : sugre;
        }
        await btn.click();

        await sleep(800);
        await input(page, `#name`, sugre);

        await sleep(800);
        await input(page, `#subdomain`, sugre);

        await sleep(800);
        await input(page, `#twitter`, sugre);
        if (!(await waitForHcaptchaVerified(page))) {
          logger.error("等待yes插件驗證碼通過失敗");
          await sleep(1_000);
          continue;
        }
        await sleep(3_000);
        await click(page, '//button[text()="Submit"]');
        const closeBtn = await wait(page, '//button[text()="Close"]', 20_000);
        if (closeBtn) {
          await sleep(2_000);
          await click(page, '//button[text()="Close"]');
        }
      } catch (err) {
        logger.error(`DeFi DEX 异常了，可能验证码没有过去。${err}`);
        await sleep(1_000);
      }
    }

    return true;
  }

  async bindZealy(account: EnsoAccount) {
    try {
      if (!account.isRegisterZealy) {
        if (!(await this.register(account))) {
          logger.error("zealy 注册失败");
          await sleep(20_000);
          return false;
        }
      }

      return await this.doBind(account);
    } catch (err) {
      logger.error(`${err}`);
    }
    return false;
  }

  async loginEnso(page: Page) {
    console.log("開始執行登錄enso");
    await page.bringToFront();
    await click(page, wrapSelector('//button[text()="Connect"]'));
    await waitAndClick(page, 'button[aria-label="Connect to Connect wallet"]');
    await sleep(800);
    await waitAndClick(page, wrapSelector('//div[text()="MetaMask"]'));
    await sleep(800);
    await this.walletManage.doSomethingFn(this.browser.browser, 2);
    await sleep(1000);
    await click(page, '//button[text()="Sign message"]');
    await sleep(1000);
    if (!(await this.walletManage.doSomethingFn(this.browser.browser, 2))) {
      return false;
    }

    if (
      !(await page.waitForSelector(wrapSelector('img[alt="Energy tank"]'), {
        timeout: 10000,
      }))
    ) {
      logger.error("登录enso平台失败");
      return false;
    }

    return true;
  }

  async doBind(account: EnsoAccount) {
    const page = await this.browser.browser.newPage();
    await page.bringToFront();
    await page.goto(
      "https://zealy.io/cw/enso/questboard/ed7a48b8-c972-4098-841e-21b6d6f44fca/27c7d639-ef02-491d-9dba-d070cfd6b794",
      { waitUntil: "networkidle2" },
    );
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForNetworkIdle();

    await sleep(2_000);
    if (await has(page, 'button[aria-label="Close"]')) {
      click(page, 'button[aria-label="Close"]');
    }
    await sleep(2_000);
    if (has(page, wrapSelector("//button[text()='Join Enso']"))) {
      await click(page, wrapSelector("//button[text()='Join Enso']"));
    }

    await sleep(2000);
    await click(
      page,
      wrapSelector('//button[contains(text(), "Connect wallet")]'),
    );
    try {
      await waitAndClick(page, wrapSelector('//div[text()="MetaMask"]'));
      await sleep(800);
      await this.walletManage.doSomethingFn(this.browser.browser, 2);
      await sleep(1000);
      await click(page, 'button[data-testid="rk-auth-message-button"]');
      await sleep(1000);
      if (!(await this.walletManage.doSomethingFn(this.browser.browser, 2))) {
        return false;
      }
    } catch (error) {}

    await click(
      page,
      wrapSelector('//button[contains(text(), "Connect Zealy")]'),
    );
    try {
      await page.waitForNetworkIdle();
    } catch (error) {}

    await sleep(6000);
    logger.info("开始等待结果");

    if (
      await page.waitForSelector(".grayscale", {
        timeout: 15_000,
        visible: true,
      })
    ) {
      logger.success("zealy 绑定成功");
      await this.updateAccount(
        { isBindZealy: 1 } as EnsoAccount,
        sql`id = ${account.id}`,
      );
      return true;
    }
    logger.error("zealy 绑定失败");
    return false;
  }

  async checkBound(account: EnsoAccount, token: string) {
    const payload = {
      userId: this.checkSum(account.addr),
      zealyId: account.zealyUserID,
    };
    await this.request(
      "post",
      `https://speedrun.enso.build/api/wallet-connections`,
      payload,
      { headers: { ...this.headers, Authorization: `Bearer ${token}` } },
    );
  }

  async register(account: EnsoAccount) {
    const page = await newPage(this.browser.browser, "https://zealy.io/signup");
    let email = account.email;
    let password = account.password;
    if (!account.email) {
      const emailInfo = await this.getEmail("enso", true);
      email = emailInfo.email;
      password = emailInfo.password;
    }
    if (!email) return;

    await this.updateAccount({ email, password }, sql`id = ${account.id}`);

    if (await has(page, 'button[aria-label="Close"]')) {
      click(page, 'button[aria-label="Close"]');
    }
    await sleep(1000);
    await input(page, "#email", email);
    await sleep(1000);
    await waitAndClick(page, "button ::-p-text(Continue with email)");

    // const inputEle = await page.waitForSelector('input[autocomplete="one-time-code"]', { timeout: 10_000, visible: true, hidden: false })
    const inputEle = await wait(
      page,
      'input[autocomplete="one-time-code"]',
      10_000,
    );
    logger.info("准备注册zealy");
    if (!inputEle) {
      logger.error("未等到验证码输入框");
      return false;
    }

    const emailConnctInfo = parseEmailInfo(email, password);
    const emialOpts = {
      host: emailConnctInfo.host,
      user: emailConnctInfo.user,
      password: emailConnctInfo.pwd,
      from: "hello@zealy.io",
      to: email,
      maxEmails: 1,
    };

    const code = await receiveCode(emialOpts, /code:\s*([a-zA-Z0-9]+)/);
    if (!code) {
      logger.error("获取验证码失败");
      return false;
    }

    await inputEle.type(code, { delay: 30 });
    await sleep(1_000);
    const nameEle = await page.waitForSelector('input[name="name"]', {
      timeout: 5000,
    });
    const name = padToTen(generateName().replace(".", "_").replace("-", "_"));
    nameEle.type(name);

    await sleep(1_500);
    if (await has(page, "p ::-p-text(This username is already taken)")) {
      nameEle.type(name + "123_123");
    }

    await sleep(1_500);
    if (await has(page, "p ::-p-text(This username is already taken)")) {
      nameEle.type(name + "123_123");
    }

    await sleep(3000);
    await click(page, 'button[aria-label="Next"]');
    await sleep(2000);
    await waitAndClick(page, "button ::-p-text(Get started)", 10_000);
    await sleep(2000);
    await page.goto(
      "https://zealy.io/cw/enso/questboard/ed7a48b8-c972-4098-841e-21b6d6f44fca/27c7d639-ef02-491d-9dba-d070cfd6b794",
    );

    const cookies = await this.browser.browser.cookies();

    const access_token = cookies.filter(
      (item) => item.domain.includes("zealy.io") && item.name == "access_token",
    );
    const cookie_str = cookies
      .map((item) => `${item.name}=${item.value}`)
      .join(";");
    let set: EnsoAccount = {
      isRegisterZealy: 1,
      zealyCookies: cookie_str,
    } as EnsoAccount;
    if (!!access_token.length) {
      const token = jwt.decode(access_token[0].value, { json: true });
      set = { ...set, zealyUserID: token.userId };
      account.zealyUserID = token.userId;
    }
    await this.updateAccount(set, eq(sql`id`, account.id));

    // const result = await this.connecWallet(account.addr, this.pk, cookie_str)
    // logger.info(`zealy 绑定钱包 ${account.addr} 结果：${result}`)
    await sleep(2_000);
    page.close();
    return true;
  }

  async connecWallet(addr: string, pk: string, cookies: string) {
    const nonc = await this.zelayNonc(cookies);
    if (!nonc) {
      return false;
    }

    const headers = { ...this.zealyHeaders, Cookie: cookies };

    const url = "https://api-v2.zealy.io/api/authentication/verify-signature";
    const msg = {
      address: this.checkSum(addr),
      chainId: 1,
      domain: "zealy.io",
      issuedAt: new Date().toISOString(),
      nonce: nonc,
      statement: "Sign in to Zealy",
      uri: "https://zealy.io",
      version: "1",
    };
    const message = `zealy.io wants you to sign in with your Ethereum account:\n${msg.address}\n\n${msg.statement}\n\nURI: ${msg.uri}\nVersion: ${msg.version}\nChain ID: ${msg.chainId}\nNonce: ${msg.nonce}\nIssued At: ${msg.issuedAt}`;

    const payload = {
      message: msg,
      network: "eth-mainnet",
      signature: await signMessageWithPrivateKey(pk, message),
    };
    const res = await this.request("post", url, payload, { headers: headers });
    return res;
  }

  async zelayNonc(cookies: string) {
    const url = "https://api-v2.zealy.io/api/authentication/nonce";
    const headers = { ...this.zealyHeaders, Cookie: cookies };
    const res = await this.request("post", url, {}, { headers: headers });
    console.log(res);
    return res;
  }

  async do(account: EnsoAccount, idToken: string) {
    if (!account.zealyUserID) {
      logger.error("缺少zealy user id");
      return;
    }

    await this.doCampaignsV2(account, idToken);
    await this.doProtocolsV2(account, idToken);

    return true;
  }

  async doTask(account: EnsoAccount, id: number, action: string) {
    const h = {
      ...this.headers,
      accept: "text/x-component",
      "content-type": "text/plain;charset=UTF-8",
      "next-action": action,
    };

    const req = `["${this.checkSum(account.addr)}",${id},"${account.zealyUserID}"]`;

    const url = "https://speedrun.enso.build/apps";
    const res = await this.request("post", url, req, { headers: h });

    return res;
  }

  async doProtocolsV2(account: EnsoAccount, token: string) {
    let successful = 0;
    let failed = 0;
    const h = { ...this.headers, authorization: `Bearer ${token}` };
    const url = `https://speedrun.enso.build/api/get-all-visited-protocols?zealyUserId=${account.zealyUserID}`;
    const res = await this.request<{ visitedProtocolIds: number[] }>(
      "get",
      url,
      {},
      { headers: h },
    );
    if (!res) {
      return false;
    }

    const waitDo = this.protocols.filter(
      (item) => !res.visitedProtocolIds.includes(item),
    );

    for (let i = 0; i < waitDo.length; i++) {
      const campaign = waitDo[i];
      const success = await this.doTask(
        account,
        campaign,
        "70123a780352108bbd2d3e6c191a02440255c77bb7",
      );
      if (success) {
        successful++;
      } else {
        failed++;
      }
      logger.info(` 完成协议列表进度: ${i + 1}/${waitDo.length}...`);
      await sleep(200);
    }

    logger.success(` ✓ ${successful} dari ${waitDo.length}  protocols selesai`);
    logger.info(
      `protocols 总数：${waitDo.length}, 成功完成：${successful} 失败：${failed}`,
    );
  }

  async doCampaignsV2(account: EnsoAccount, token: string) {
    let successful = 0;
    let failed = 0;
    const h = { ...this.headers, authorization: `Bearer ${token}` };
    const url = `https://speedrun.enso.build/api/get-all-visited-campaigns?zealyUserId=${account.zealyUserID}`;
    const res = await this.request<{ visitedCampaignIds: number[] }>(
      "get",
      url,
      {},
      { headers: h },
    );
    if (!res) {
      return false;
    }

    const waitDo = this.campaignList.filter(
      (item) => !res.visitedCampaignIds.includes(item),
    );

    for (let i = 0; i < waitDo.length; i++) {
      const campaign = waitDo[i];
      const success = await this.doTask(
        account,
        campaign,
        "7073fb07dd02c4eb387df029d2f687aab0c1f248c7",
      );
      if (success) {
        successful++;
      } else {
        failed++;
      }
      logger.info(` 完成活动列表进度: ${i + 1}/${waitDo.length}...`);
      await sleep(200);
    }

    logger.success(` ✓ ${successful} dari ${waitDo.length} campaign selesai`);
    logger.info(
      `Campaigns 活动总数：${waitDo.length}, 成功完成：${successful} 失败：${failed}`,
    );
  }

  async doProtocols(account: EnsoAccount) {
    let successfulProtocols = 0;
    let failedProtocols = 0;
    const protocols = await this.getProtocol(account.zealyUserID);
    if (!protocols.length) {
      logger.warn(`无法获取Protocol活动列表，因为服务器错误`);
      return;
    }

    const pendingProtocols = protocols.filter(
      (p) => !p.visited && !p.pointsAwarded,
    );
    if (pendingProtocols.length === 0) {
      logger.success(`所有Protocol活动已结束或者已完成！`);
      return;
    }

    for (let j = 0; j < pendingProtocols.length; j++) {
      const protocol = pendingProtocols[j];
      const success = await this.completeProtocol(
        this.checkSum(account.addr),
        protocol.id,
        protocol.name,
        account.zealyUserID,
      );
      if (success) {
        successfulProtocols++;
      } else {
        failedProtocols++;
      }
      logger.info(`完成活动协议进度: ${j + 1}/${pendingProtocols.length}...`);
      await sleep(200);
    }
    logger.success(
      ` ┊ ✓ ${successfulProtocols} dari ${pendingProtocols.length} protocols selesai`,
    );
    logger.info(
      `Proticls 活动总数：${pendingProtocols.length}, 成功完成：${successfulProtocols} 失败：${failedProtocols}`,
    );
  }

  async doCampaigns(account: EnsoAccount) {
    let successfulCampaigns = 0;
    let failedCampaigns = 0;
    const campaigns = await this.getCampaigns(account.zealyUserID);
    if (campaigns.length === 0) {
      logger.warn(`无法获取Campaigns活动列表，因为服务器错误`);
      return;
    }
    const pendingCampaigns = campaigns.filter(
      (c) => !c.visited && !c.pointsAwarded,
    );

    if (pendingCampaigns.length === 0) {
      logger.success(`所有Campaigns活动已结束或者已完成！`);
      return;
    }
    for (let j = 0; j < pendingCampaigns.length; j++) {
      const campaign = pendingCampaigns[j];
      const success = await this.completeCampaign(
        this.checkSum(account.addr),
        campaign.id,
        account.zealyUserID,
      );
      if (success) {
        successfulCampaigns++;
      } else {
        failedCampaigns++;
      }
      logger.info(` 完成活动列表进度: ${j + 1}/${pendingCampaigns.length}...`);
      await sleep(200);
    }
    logger.success(
      ` ✓ ${successfulCampaigns} dari ${pendingCampaigns.length} campaign selesai`,
    );
    logger.info(
      `Campaigns 活动总数：${pendingCampaigns.length}, 成功完成：${successfulCampaigns} 失败：${failedCampaigns}`,
    );
  }

  async doDefiDex(account: EnsoAccount, token: string) {
    let successfulDexes = 0;
    let failedDexes = 0;

    for (let j = 0; j < DEFIDEX_LIMIT; j++) {
      const projectSlug = this.generateProjectSlug();
      const success = await this.createDefiDex(
        projectSlug + ".widget",
        this.checkSum(account.addr),
        account.zealyUserID,
        token,
      );
      if (success.success) {
        successfulDexes++;
      } else {
        failedDexes++;
        if (!success && j === 0) break;
      }
      await sleep(1000);
    }

    logger.info(
      `完成 DeFiDex数据: success :${successfulDexes}、fail: ${failedDexes}`,
    );
  }

  async getProtocol(zealyUserId: string) {
    const limit = 10;
    const totalPages = 12;
    let allProtocols: Protocol[] = [];

    for (let page = 1; page <= totalPages; page++) {
      const response = await this.request<{ protocols: Protocol[] }>(
        "get",
        `https://speedrun.enso.build/api/get-protocols?page=${page}&limit=${limit}&zealyUserId=${zealyUserId}`,
      );

      allProtocols = allProtocols.concat(response.protocols);
      logger.info(` ┊ → 获取协议列表 (页面 ${page}/${totalPages})...`);
      await sleep(2000);
    }

    logger.success(` ┊ ✓ ${allProtocols.length} 条协议`);
    await sleep(100);
    return allProtocols;
  }

  async completeProtocol(
    address: string,
    protocolId: string,
    protocolName: string,
    zealyUserId: string,
  ): Promise<boolean> {
    try {
      const payload = {
        userId: address,
        protocolId,
        zealyUserId,
      };
      const response = await this.request<TrackProjecResp>(
        "post",
        "https://speedrun.enso.build/api/track-protocol",
        payload,
      );

      if (response.message === "Points awarded and visit recorded") {
        return true;
      } else {
        throw new Error(response.message || "Gagal menyelesaikan protocol");
      }
    } catch (err: any) {
      logger.error(
        ` ┊ ✗ Gagal menyelesaikan protocol ${protocolName} (ID: ${protocolId}): ${err}`,
      );

      return false;
    }
  }

  async userInfo(zealyUserId: string, idToken: string) {
    try {
      const response = await this.request<ZealyUserInfo>(
        "get",
        `https://speedrun.enso.build/api/zealy/user/${zealyUserId}`,
        {},
        { headers: { ...this.headers, Authorization: `Bearer ${idToken}` } },
      );
      logger.success(` ┊ ✓ Info user diterima: ${response.name}`);
      await sleep(100);

      return {
        name: response.name || "Unknown",
        connectedWallet: response.connectedWallet || "Unknown",
        xp: response.xp || 0,
        rank: response.rank || 0,
      };
    } catch (error) {}
    return {
      name: "Unknown",
      connectedWallet: "Unknown",
      xp: 0,
      rank: 0,
    };
  }

  generateProjectSlug(): string {
    const words = [
      ...new Set([
        "lucky",
        "star",
        "nova",
        "cool",
        "hoki",
        "prime",
        "sky",
        "neo",
        "blaze",
        "tech",
        "moon",
        "pulse",
        "vibe",
        "spark",
        "glow",
        "ace",
        "zen",
        "flash",
        "bolt",
        "wave",
        "fire",
        "storm",
        "dream",
        "edge",
        "flow",
        "peak",
        "rush",
        "light",
        "force",
        "dash",
        "glint",
        "surge",
        "breeze",
        "shade",
        "frost",
        "flame",
        "core",
        "drift",
        "bloom",
        "quest",
        "wind",
        "tide",
        "dawn",
        "dusk",
        "mist",
        "cloud",
        "ridge",
        "vale",
        "forge",
        "link",
        "beam",
        "spire",
        "gleam",
        "twist",
        "loop",
        "arc",
        "vault",
        "crux",
        "nexus",
        "orbit",
        "zest",
        "chill",
        "haze",
        "glory",
        "swift",
        "bold",
        "vivid",
        "pure",
        "clear",
        "bright",
        "epic",
        "grand",
        "royal",
        "noble",
        "wild",
        "free",
        "soar",
        "rise",
        "shine",
        "grow",
        "vapor",
        "trail",
        "echo",
        "swing",
        "shift",
        "turn",
        "blend",
        "craft",
        "seek",
        "hunt",
        "roam",
        "sail",
        "climb",
        "reach",
        "touch",
        "ignite",
        // 自然类
        "Sky",
        "River",
        "Ocean",
        "Forest",
        "Mountain",
        "Dawn",
        "Sunset",
        "Storm",
        "Rain",
        "Snow",
        "Leaf",
        "Stone",
        "Cliff",
        "Valley",
        "Meadow",
        "Brook",
        "Aurora",
        "Comet",
        "Tide",
        "Canyon",

        // 动物类
        "Wolf",
        "Fox",
        "Bear",
        "Hawk",
        "Falcon",
        "Raven",
        "Lynx",
        "Panther",
        "Tiger",
        "Lion",
        "Eagle",
        "Owl",
        "Falcon",
        "Cobra",
        "Viper",
        "Badger",
        "Otter",
        "Bison",
        "Elk",
        "Falcon",

        // 品质/特质类
        "Valor",
        "Honor",
        "Glory",
        "Noble",
        "Brave",
        "True",
        "Just",
        "Sage",
        "Vigil",
        "Zenith",
        "Merit",
        "Virtue",
        "Verity",
        "Solace",
        "Haven",
        "Haven",
        "Purity",
        "Clarity",
        "Serene",
        "Tranquil",

        // 抽象概念类
        "Echo",
        "Fable",
        "Myth",
        "Legend",
        "Omen",
        "Oracle",
        "Riddle",
        "Saga",
        "Sonnet",
        "Verse",
        "Aura",
        "Essence",
        "Ether",
        "Mirage",
        "Phantom",
        "Specter",
        "Vision",
        "Whisper",
        "Wisp",
        "Zenith",

        // 其他独特名称
        "Onyx",
        "Jasper",
        "Flint",
        "Garnet",
        "Amber",
        "Ember",
        "Cinder",
        "Asher",
        "Slate",
        "Granite",
        "Marble",
        "Obsidian",
        "Quartz",
        "Sable",
        "Sterling",
        "Crimson",
        "Indigo",
        "Saffron",
        "Umber",
        "Zephyr",
      ]),
    ];

    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const number = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    return `${word1}${word2}${number}`.toLowerCase();
  }

  async createDefiDex(
    projectSlug: string,
    address: string,
    zealyUserId: string,
    token: string,
  ): Promise<CreateDefiDexResult> {
    try {
      const payload = {
        userId: address,
        projectSlug,
        zealyUserId,
        projectType: "shortcuts-widget",
      };

      const h = {
        ...this.headers,
        authorization: `Bearer ${token}`,
        Referer: "https://speedrun.enso.build/create/de-fi/shortcuts-widget",
      } as any;
      delete h["Referrer-Policy"];
      // delete(h, 'Referrer-Policy')
      const res = await this.request<TrackProjecResp>(
        "post",
        "https://speedrun.enso.build/api/track-project-creation",
        payload,
        {
          headers: h,
        },
      );

      if (res?.success) {
        logger.success(` ┊ ✓ DeFiDex dibuat: ${projectSlug}`);
        await sleep(100);
        return { success: true, slug: projectSlug };
      }

      if (res.code === 3) {
        logger.warn(` ┊ ⚠️ Batas harian DeFiDex tercapai: ${res.message}`);
        return { success: false, reason: res.message };
      }

      throw new Error(res.message || "Gagal membuat DeFiDex");
    } catch (err: any) {
      logger.error(` ┊ ✗ Gagal membuat DeFiDex: ${err}`);
      return { success: false, reason: err };
    }
  }

  async getCampaigns(zealyUserId: string) {
    const limit = 10;
    let allCampaigns: Campaign[] = [];
    let page = 1;
    try {
      while (true) {
        const response = await this.request<GetCampaignsResponse>(
          "get",
          `https://speedrun.enso.build/api/get-campaigns?page=${page}&limit=${limit}&zealyUserId=${zealyUserId}`,
        );
        const { campaigns, total } = response;

        allCampaigns = allCampaigns.concat(campaigns);
        logger.info(
          ` ┊ → 获取活动列表 (页面 ${page}/${Math.ceil(total / limit)})...`,
        );

        if (page * limit >= total) break;

        page++;
        await sleep(2000);
      }

      logger.success(` ┊ ✓ ${allCampaigns.length} 条活动`);
      await sleep(100);
      return allCampaigns;
    } catch (err: any) {
      logger.error(` ┊ ✗ 获取活动列表 错误: ${err}`);
      await sleep(100);
      return [];
    }
  }

  async completeCampaign(
    address: string,
    campaignId: string,
    zealyUserId: string,
  ) {
    const payload = {
      userId: address,
      campaignId,
      zealyUserId,
    };

    const response = await this.request<{ message: string }>(
      "post",
      "https://speedrun.enso.build/api/track-campaign",
      payload,
    );

    if (response.message === "Points awarded and visit recorded") {
      return true;
    }
    logger.error(response.message || "Gagal menyelesaikan campaign");
    return false;
  }

  async getNonce() {
    const url = "https://speedrun.enso.build/api/auth/nonce";
    const res = await this.request<{ nonce: string }>("get", url);
    if (!res) {
      return "";
    }
    return res.nonce;
  }

  async loginByAPI(account: EnsoAccount) {
    const nonc = await this.getNonce();
    if (!nonc) {
      return "";
    }
    const url = "https://speedrun.enso.build/api/firebase-custom-token";
    const addr = this.checkSum(account.addr);
    const currtime = new Date().toISOString();
    const message = `speedrun.enso.build wants you to sign in with your Ethereum account:\n${addr}\n\nSign in with Ethereum to the app.\n\nURI: https://speedrun.enso.build\nVersion: 1\nChain ID: 1\nNonce: ${nonc}\nIssued At: ${currtime}`;
    const sign = await signMessageWithPrivateKey(this.pk, message);
    const payload = {
      message: message,
      signature: sign,
    };

    const res = await this.request<{ customToken: string }>(
      "post",
      url,
      payload,
    );
    if (!res) {
      logger.error("登录enso失败");
      return "";
    }
    return res.customToken;
  }

  async signInWithCustomToken(token: string) {
    const url =
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyB0WVedFIoRpOwzoAOkgzlr2Y_R3I_j4fk";

    const playload = {
      returnSecureToken: true,
      token: token,
    };

    const herader = {
      accept: "*/*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      "content-type": "application/json",
      origin: "https://speedrun.enso.build",
      priority: "u=1, i",
      "sec-ch-ua":
        randomUseragent.getRandom() ||
        '"Chromium";v="122", "Not:A-Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "x-client-version": "Chrome/JsCore/11.4.0/FirebaseCore-web",
    };

    const res = await this.request<GoogleSignResult>("post", url, playload, {
      headers: herader,
    });
    if (!res) return null;

    return res.idToken;
  }
}
