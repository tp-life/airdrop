import { Page } from "rebrowser-puppeteer-core";
import { phantom } from "../config/ext";
import { BrowserManage } from "../utils/browser";
import { getTypeByExt } from "../utils/wallet/config";
import { Wallet } from "../utils/wallet/wallet";
import { Base } from "./app";
import { N1Account, N1Table } from "../schema/n1";
import logger from "../infrastructure/logger";
import { sql } from "drizzle-orm";
import { generateName, sleep } from "../utils/help";
import { Register } from "../register/decorators";
import { openTest } from "../utils/wallet/phantom";
import {
  click,
  executeSteps,
  getCookies,
  has,
  hs,
  Step,
  wait,
  wrapSelector,
} from "../utils/browser/page";
import { AxiosResponse } from "axios";
import { autoXAuth } from "../utils/twitter/x_front";

@Register("n1")
export class N1 extends Base {
  public table = N1Table;
  private walletPlugs = phantom;
  private walletManage = new Wallet(getTypeByExt(this.walletPlugs));
  private inviteCode = "tping";
  private x_client = "3DY1VXLUowY0FxSGtaQVZmWXFQOUI6MTpjaQ";
  private cookies = "";

  get headers() {
    const h: Record<string, string> = {
      accept: "*/*",
      "accept-language": "zh-CN,zh;q=0.8",
      origin: "https://01.xyz",
      priority: "u=1, i",
      referer: "https://01.xyz/",
      "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "sec-gpc": "1",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    };
    if (this.cookies) {
      h["cookie"] = this.cookies;
    }
    return h;
  }

  async run() {
    if (this.args["arg"] == "faucet") {
      await this.doFaucet();
    } else if (this.args["arg"] == "trade") {
      await this.doTrade();
    }
  }

  async doTrade() {
    const q = sql`(locked_at is null OR locked_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE))  AND amt > 10  AND (daliy_at is null OR daliy_at < DATE_SUB(NOW(), INTERVAL 1 DAY))`;
    // const q = sql`id = 12030`;
    const account = await this.getAccount<N1Account>({ where: q });
    this.pk = this.decodePK(account.pk);
    try {
      const page = await this._login(account);
      await this.faucet(account);
      await this.trade(page, account);
    } catch (err) {
      logger.error(`N1 任务执行错误，${err}`);
      logger.error(`错误堆栈：, ${err.stack}`); // 包含具体的文件位置
    } finally {
      await this.updatePoint(account);

      await this.browser.close();
    }
  }

  async doFaucet() {
    const q = sql`(faucet is null OR faucet < DATE_SUB(NOW(), INTERVAL 30 MINUTE))`;
    const account = await this.getAccount<N1Account>({
      where: q,
      lockKey: "faucet",
    });
    this.pk = this.decodePK(account.pk);

    try {
      const page = await this._login(account);

      const info = await this.getUserInfo(account);
      if (!info.profile.account_id) {
        logger.error(`${account.addr} 获取用户信息错误，可能用户未注册？`);
        return;
      }

      if (!info.profile.x_verified) {
        await this.bindX(page, account);
      }

      await this.faucet(account);
    } catch (err) {
      logger.error(`N1 任务执行错误，${err}`);
      logger.error(`错误堆栈：, ${err.stack}`); // 包含具体的文件位置
    } finally {
      await this.updatePoint(account);
      await this.browser.close();
    }
  }

  async _login(account: N1Account): Promise<Page> {
    let ok = false;
    const page = await this.openPage(account);
    if (await this.checkUser(account)) {
      ok = await this.login(page);
    } else {
      ok = await this.register(page, account);
    }

    if (!ok) {
      throw new Error("N1 任务登录或者注册账号失败");
    }
    await this.setAuth();

    if (!account.fromReferralCode) {
      await this.useReferral(account);
    }

    return page;
  }

  async setAuth() {
    const { strCookie, kmap } = await getCookies(this.browser.browser, [
      "__Host-next-auth.csrf-token",
      "__Secure-next-auth.callback-url",
      "walletToken",
    ]);

    this.cookies = strCookie;
    if ("walletToken" in kmap) {
      this.jwt = kmap["walletToken"];
    }
  }

  async getReferral() {
    const q = sql`referral_code > '' AND referral_flag = 1`;
    const account = await this.getAccount<N1Account>({
      where: q,
      lockKey: "referral_locked",
      raise: false,
      hasIP: false,
    });
    if (account) {
      this.inviteCode = account.referralCode;
    }
    return this.inviteCode;
  }

  async faucet(account: N1Account) {
    const inputDate = new Date(account.faucet);
    const now = new Date();

    // 获取当前时间减去 24 小时（毫秒）
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 比较
    if (inputDate > twentyFourHoursAgo) {
      logger.info("24 小时内已经领取过了，请稍等");
      return;
    }

    const url = `https://01.xyz/api/account-faucet`;

    const fail = (resp: AxiosResponse): boolean => {
      const data = <{ error?: string }>resp.data;
      return data?.error.includes("Address has already received");
    };

    const res = await this.request<{ error?: string; airdropTxId?: string }>(
      "post",
      url,
      {
        wallet_address: account.addr,
      },
      {},
      fail,
    );

    if (res && !!res?.airdropTxId) {
      await this.updateAccount({ faucet: sql`NOW()` }, sql`id = ${account.id}`);
    }

    return res;
  }

  async trade(page: Page, account: N1Account) {
    await page.goto(`https://01.xyz/trade`, { waitUntil: "networkidle2" });
    const ori = await this.userAmount(account.userID);

    for (let i = 0; i < 5; i++) {
      try {
        if (await has(page, `//div[text()="Close Position"]`)) {
          await click(page, `//div[text()="Close Position"]`);
          await sleep(4_000);
          await click(page, `//span[text()="Market Close"]`);
          await sleep(3_000);
        }

        const amt = await this.userAmount(account.userID);

        const mark = await wait(page, `#market__trigger`);
        await sleep(2000);
        // await click(page, `#market__trigger`);
        await mark.click();
        await sleep(3000);
        if (!(await has(page, `//span[text()="Place Market Buy Order"]`))) {
          await sleep(3_000);
          continue;
        }
        await sleep(3000);
        let ins = "50";
        const a = Number(account.amt);
        if (a > 30000) {
          ins = "5";
        } else if (a > 15000) {
          ins = "10";
        } else if (a > 10000) {
          ins = "20";
        } else if (a > 3000) {
          ins = "30";
        }
        await page.locator(`#sliderPercentage`).fill(ins);
        // await input(page, `#sliderPercentage`, "50");
        await sleep(3_000);
        // await click(page, `//span[text()="Place Market Buy Order"]`);
        await page
          .locator(wrapSelector(`//span[text()="Place Market Buy Order"]`))
          .click();

        if (
          !(await wait(
            page,
            `//*[contains(text(), "Market Order Executed")]`,
            15_000,
          ))
        ) {
          await sleep(3_000);
          continue;
        }

        await sleep(3_000);
        const close = await wait(
          page,
          `//div[text()="Close Position"]`,
          10_000,
        );
        if (close) {
          await sleep(3_000);
          await close.click();
          await sleep(4_000);
          await click(page, `//span[text()="Market Close"]`);
        }
        if (amt.amount < 20) {
          break;
        }
      } catch (error) {
        logger.error(`进行交易出现错误：${error?.message}， 即将开始下次循环`);
      }
      logger.success("当前账户完成每日交易成功");
      await sleep(5_000);
    }

    if (await has(page, `//div[text()="Close Position"]`)) {
      await click(page, `//div[text()="Close Position"]`);
      await sleep(4_000);
      await click(page, `//span[text()="Market Close"]`);
      await sleep(3_000);
    }

    const newAmt = await this.userAmount(account.userID);
    if (newAmt.amount < ori.amount) {
      logger.success(
        `账户${account.userID}交易成功，金额增加${newAmt.amount - ori.amount}`,
      );
      await this.updateAccount(
        { daliyAt: sql`now()` },
        sql`id = ${account.id}`,
      );
      return;
    } else {
      logger.error(`账户${account.userID}交易失败，金额未增加`);
    }
  }

  async bindX(page: Page, account: N1Account) {
    await page.goto("https://01.xyz/portfolio", { waitUntil: "networkidle2" });
    if (!(await wait(page, `//p[text()="Verify account"]`, 20_000))) {
      return true;
    }

    const that = this;

    const ok = await autoXAuth(
      page,
      {
        token: account.xToken,
        project: "n1",
        auth_btn: `//p[text()="Verify account"]`,
        x_query: sql`created_at > '2025-07-01 00:00:00'`,
      },
      async (token: string) => {
        await that.updateAccount({ xToken: "" }, sql`id = ${account.id}`);
      },
      async (token: string, u: string) => {
        await that.updateAccount({ xToken: token }, sql`id = ${account.id}`);
      },
    );

    if (!ok) return false;

    await sleep(3_000);
    for (let i = 0; i < 5; i++) {
      const info = await this.getUserInfo(account);
      if (info.profile.x_verified) {
        return true;
      }
      await sleep(2_000);
    }
    return false;
  }

  async login(page: Page) {
    if (!(await wait(page, `button -> Connect Wallet`))) {
      logger.error("等待链接钱包按钮失败");
      return false;
    }

    let action: Step[] = [
      hs("click", `button -> Connect Wallet`),
      hs("click", `:scope >>> ::-p-text(Phantom)`, 1_000),
      hs(
        "click",
        `& >>> button[data-testid="select-hardware-wallet-connect-button"]`,
      ),
    ];

    await executeSteps(page, action);

    if (!(await this.walletManage.doSomethingFn(this.browser.browser, 3))) {
      logger.error("点击钱包确认失败");
      return false;
    }

    return true;
  }

  async register(page: Page, account: N1Account) {
    if (!(await wait(page, `button -> Connect Wallet`))) {
      logger.error("等待链接钱包按钮失败");
      return false;
    }

    let action: Step[] = [
      hs("click", `button -> Connect Wallet`),
      hs("click", `:scope >>> ::-p-text(Phantom)`, 2_000),
      hs(
        "click",
        `& >>> button[data-testid="select-hardware-wallet-connect-button"]`,
        2_000,
      ),
    ];

    await executeSteps(page, action);

    if (!(await this.walletManage.doSomethingFn(this.browser.browser, 3))) {
      logger.error("点击钱包确认失败");
      return false;
    }

    if (!(await wait(page, `:scope >>> ::-p-text(Devnet)`))) {
      return false;
    }

    await click(page, `:scope >>> ::-p-text(Devnet)`);
    await sleep(3_000);

    for (let i = 0; i < 5; i++) {
      await click(page, `:scope >>> ::-p-text(Continue)`);
      await sleep(5_000);
      await this.walletManage.doSomethingFn(this.browser.browser, 3);
      await sleep(3_000);
      if (
        await has(
          page,
          `:scope >>> ::-p-text(Failed to deposit 100 of token ID 0)`,
        )
      ) {
        continue;
      }

      if (await has(page, `:scope >>> ::-p-text(Try Again)`)) {
        await click(page, `:scope >>> ::-p-text(Try Again)`);
        await sleep(3_000);
      }

      if (await wait(page, `:scope >>> ::-p-text(Continue)`, 300_000)) {
        let hasUser = false;
        for (let j = 0; j < 3; j++) {
          hasUser = !!(await this.checkUser(account));
          if (hasUser) break;
        }

        if (!hasUser) {
          continue;
        }
        await sleep(2_000);
        await click(page, `:scope >>> ::-p-text(Continue)`);
        await sleep(2_000);
        await this.walletManage.doSomethingFn(this.browser.browser, 1);

        await page.reload({ waitUntil: "networkidle2" });
        await sleep(2_000);
        if (await has(page, `button -> Connect Wallet`)) {
          await click(page, `button -> Connect Wallet`);
          await sleep(2_000);
          await this.walletManage.doSomethingFn(this.browser.browser, 1);
        }

        return true;
      }
    }
    return false;
  }

  async openPage(account: N1Account) {
    const exts = [this.walletPlugs];

    this.browser = new BrowserManage(
      this.userDataDir(`n1_${account.id}`),
      exts,
      this.ip,
    );
    const page = await this.browser.open({
      url: "https://01.xyz/faucet",
      pk: this.pk,
    });
    if (!page) {
      return null;
    }
    if (!(await openTest(this.browser.browser))) {
      throw new Error("未成功启用测试网");
    }
    return page;
  }

  async checkUser(account: N1Account) {
    const url = `https://zo-devnet.n1.xyz/user?pubkey=${account.addr}`;
    const fail = (resp: AxiosResponse): boolean => {
      return (<string>resp.data).includes("UserNotFound");
    };
    const user = await this.request<{ accountIds: number[] }>(
      "get",
      url,
      {},
      {},
      fail,
    );
    if (typeof user == "string" || !user.accountIds.length) {
      return false;
    }

    const userID = user.accountIds.length ? user.accountIds[0] : "";

    if (!account.userID) {
      await this.updateAccount({ userID: userID }, sql`id = ${account.id}`);
      account.userID = user.accountIds[0];
    }

    return userID;
  }

  async getUserInfo(account: N1Account) {
    const url = `https://01.xyz/api/socials?wallet_address=${account.addr}`;

    const info = await this.request<{
      profile: { x_verified: boolean; account_id: number };
    }>("get", url);
    return info;
  }

  async userRanking(account: N1Account) {
    const url = `https://01.xyz/api/points/user-ranking?wallet_address=${account.addr}`;
    const info = await this.request<{
      ranking: { traded_volume: number; rank: number };
    }>("get", url);

    return info;
  }

  async userAmount(uid: number): Promise<{ token: string; amount: number }> {
    if (!uid) {
      return { token: "", amount: 0 };
    }
    const url = `https://zo-devnet.n1.xyz/account/${uid}`;
    const info = await this.request<{
      balances: { token: string; amount: number }[];
    }>("get", url);
    if (!info || !info.balances.length) {
      return { token: "", amount: 0 };
    }

    return info.balances[0];
  }

  async updatePoint(account: N1Account) {
    if (!account.userID) return;
    const rank = await this.userRanking(account);
    const amount = await this.userAmount(account.userID);
    if (!amount && !rank) {
      logger.error("获取用户排名和余额错误");
      return;
    }
    let doc = {};
    if (rank) {
      doc = { rank: rank.ranking.rank, points: rank.ranking.traded_volume };
    }

    if (amount?.amount > 0) {
      doc = { ...doc, amt: amount.amount };
    }

    await this.updateAccount(doc, sql`id = ${account.id}`);

    if (!account.referralCode && rank && rank.ranking.traded_volume > 10000) {
      await this.setRegerral(account);
    }
  }

  async useReferral(account: N1Account) {
    if (!!account.fromReferralCode) {
      return;
    }

    const code = await this.getReferral();
    const url = "https://01.xyz/api/referral";

    const rs = await this.request<{ data: string }>("get", url);
    if (rs && rs.data) {
      await this.updateAccount(
        { fromReferralCode: rs.data },
        sql`id = ${account.id}`,
      );

      await this.updateAccount(
        { referralToal: sql`${account.referralToal} + 1` },
        sql`referral_code = ${rs.data}`,
      );
      return;
    }

    const res = await this.request<{ message?: string; error?: string }>(
      "post",
      url,
      {
        joinReferralCode: code,
      },
    );
    if (!res?.error) {
      await this.updateAccount(
        { fromReferralCode: code },
        sql`id = ${account.id}`,
      );

      await this.updateAccount(
        { referralToal: sql`${account.referralToal} + 1` },
        sql`referral_code = ${code}`,
      );
    }
    return res;
  }

  async setRegerral(account: N1Account) {
    if (!!account.referralCode || !this.jwt) {
      return true;
    }

    const url = `https://01.xyz/api/referral/code`;
    const resp = await this.request<{ data: string }>("get", url);
    if (resp && resp.data) {
      await this.updateAccount(
        { referralCode: resp.data },
        sql`id = ${account.id}`,
      );
      return;
    }

    let username = account.addr.substring(0, 10).toLocaleLowerCase();

    let checkOK: boolean = false;

    for (let i = 0; i < 10; i++) {
      const checkURL = `https://01.xyz/api/referral/check-code?referralCode=${username}`;

      const resp = await this.request<{ data: boolean }>("get", checkURL);
      if (resp && resp.data) {
        checkOK = true;
        break;
      }

      username = (account.addr.substring(0, 4) + generateName())
        .substring(0, 10)
        .toLocaleLowerCase();
      await sleep(500);
    }

    if (!checkOK) {
      return;
    }

    const res = await this.request<{ message?: string; error?: string }>(
      "post",
      url,
      { referralCode: username },
    );

    if (!res || res?.error) return;

    await this.updateAccount(
      { referralCode: username },
      sql`id = ${account.id}`,
    );
  }
}
