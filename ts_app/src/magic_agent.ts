import { sql } from "drizzle-orm";
import { Base } from "./app";
import { MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { MagicAccount, MagicTable } from "../schema/magic";
import { BrowserManage } from "../utils/browser";
import { ElementHandle, Locator, Page } from "rebrowser-puppeteer-core";
import {
  click,
  findPage,
  getLocalStorageItem,
  has,
  input,
  race,
  scrollOverflowElement,
  SelectorTaskItem,
  wait,
} from "../utils/browser/page";
import logger from "../infrastructure/logger";
import { receiveCode, sleep } from "../utils/help";
import { Register } from "../register/decorators";
import { metamask, yesCaptcha } from "../config/ext";
import { waitForRecaptcha } from "../utils/browser/ext";
import config from "../config";
import { walletDoSomething } from "../utils/wallet/metamask";

@Register("magic")
export class MagicAgent extends Base {
  public table: MySqlTable<TableConfig> = MagicTable;

  async run() {
    const q = sql`amt = -1 and point > 2000`;
    // const q = sql`id = 8657`;
    const account = await this.getAccount<MagicAccount>({ where: q });
    const ok = !account.agent && !account.bindWallet;

    const ext = [yesCaptcha];
    if (ok) {
      ext.push(metamask);
    }

    this.browser = new BrowserManage(
      this.userDataDir(`magic_${account.id}`),
      ext,
      this.ip,
    );

    try {
      const page = await this.browser.open({
        url: "https://newton.xyz/app/login",
        pk: this.decodePK(account.pk),
      });
      if (!(await this.login(page, account))) {
        logger.error("登录失败");
        return;
      }

      if (ok && !(await this.loginMain())) {
        logger.error("登录积分账号失败");
        return;
      }
      await page.bringToFront();
      // await this.deposit(page);
      await this.checkAirdrop(page, account);
    } catch (err) {
      logger.error(`登录报错：${err}`);
    }

    await sleep(5_000);
  }

  async loginMain(): Promise<boolean> {
    const page = await this.browser.browser.newPage();
    await page.bringToFront();
    await page.goto("https://www.magicnewton.com/portal/rewards", {
      waitUntil: "networkidle2",
    });

    if (!(await wait(page, `(//button)[6]`, 30_000))) {
      return false;
    }

    await click(page, `(//button)[6]`);

    await walletDoSomething(this.browser.browser, 3);

    await sleep(2_000);

    await click(page, `//p[text()="Sign"]`);
    await walletDoSomething(this.browser.browser, 2);
    if (
      !(await waitForRecaptcha(page), `input[autocomplete="one-time-code"]`)
    ) {
      logger.error("未成功通过谷歌验证器");
      return false;
    }
    await wait(page, `//h3[text()="CREDITS COLLECTED"]`, 20_000);
    await page.close();
    return true;
  }

  async checkAirdrop(page: Page, account: MagicAccount) {
    await page.goto("https://newton.xyz/app/airdrop", {
      waitUntil: "networkidle2",
    });

    await sleep(5_000);

    if (await has(page, `//button[text()="Activate Reward Wallet"]`)) {
      await click(page, `//button[text()="Activate Reward Wallet"]`);
      await sleep(2_000);
    } else if (await has(page, '//button[text()="Continue"]')) {
      await click(page, '//button[text()="Continue"]');
      await sleep(2_000);
    }

    const btn = await wait(page, '//button[text()="Continue"]', 90_000);
    if (!btn) {
      logger.error("等待 continue 按钮失败");
      return 0;
    }
    await sleep(1_000);

    if (!(await scrollOverflowElement(page, 2))) {
      logger.error("查看协议无法滚动到最底部");
      return false;
    }
    await sleep(1_000);
    await click(page, `button[data-state="unchecked"]`);
    await sleep(1_000);
    await click(page, '//button[text()="Continue"]');
    await sleep(2_000);

    const r = await this.checkEligible(page, account);
    if (r === false) {
      return false;
    }

    await this.updateAccount({ amt: r }, sql`id = ${account.id}`);
  }

  async connectWallet(account: MagicAccount) {
    const page = await findPage(this.browser.browser, {
      urlContain: "www.magicnewton.com/portal/rewards",
    });

    if (!page?.ok) {
      logger.error("暂时没有找到可用页面");
      return false;
    }

    await page.data.bringToFront();
    const confirm = await wait(page.data, `//div[text()="Confirm Connection"]`);
    if (!confirm) {
      logger.error("确认链接失败");
      return false;
    }
    await confirm.click();
    await this.updateAccount({ bindWallet: 1 }, sql`id = ${account.id}`);

    await sleep(5_000);

    if (!(await wait(page.data, `//div[text()="Connected"]`, 90_000))) {
      logger.error("链接钱包失败");
      return false;
    }

    await sleep(1_000);
    await click(page.data, '//button[text()="Continue"]');
    await sleep(1_000);
    if ((await wait(page.data, `//p[text()="Not Eligible"]`), 15_000)) return 0;
    return 1;
  }

  async checkEligible(page: Page, account: MagicAccount) {
    if (!(await wait(page, `//div[text()="Connected"]`, 5_000))) {
      if (await has(page, `//button[text()="Connect"]`)) {
        await click(page, `//button[text()="Connect"]`);
        await sleep(2_000);
        return await this.connectWallet(account);
      }
      return false;
    }

    await sleep(1_000);
    await click(page, '//button[text()="Continue"]');

    if ((await wait(page, `//p[text()="Not Eligible"]`), 15_000)) return 0;
    return 1;
  }

  async deposit(page: Page) {
    await click(page, `//button[text()="Start Agent"]`);
    await sleep(3_000);

    if (!(await wait(page, `input[type="number"]`, 90_000))) {
      logger.error("等待输入金额框错误");
      return false;
    }
    await input(page, `input[type="number"]`, "5");
    await sleep(1_000);
    await click(page, `//p[text()="Select token"]`);
    await sleep(2_000);
    logger.info("即将选择 eth");
    await click(page, `(//p[text()="Ethereum"])[2]`);
    logger.info("即将选择 eth 结束");
    await sleep(2_000);
    await click(page, `//button[text()="Weekly"]`);
    await sleep(2_000);
    await click(page, `//span[text()="Daily"]`);
    await sleep(2_000);
    await click(page, `//button[text()="MM/DD/YY"]`);
    await sleep(2_000);

    const now = formatDateOffsetFromToday(1);
    await click(page, `//div[aria-label="Choose ${now}"]`);
    await sleep(2_000);
    await click(page, `//button[text()="Continue"]`);
    await sleep(1_000);
  }

  async login(page: Page, account: MagicAccount) {
    const emailInput = await wait(page, `input[placeholder="Email address"]`);
    if (!emailInput) {
      logger.error(`获取 email 输入框错误`);
      return false;
    }
    await sleep(2_000);

    await emailInput.type(account.email);
    await sleep(3_000);
    await wait(page, `//button[text()="Continue"]`);
    await click(page, `//button[text()="Continue"]`);

    await sleep(5_000);
    await page.bringToFront();
    for (let i = 0; i < 10; i++) {
      logger.info(`第${i + 1} 次查找验证码`);
      if (
        !(await waitForRecaptcha(page), `input[autocomplete="one-time-code"]`)
      ) {
        logger.error("未成功通过谷歌验证器");
        continue;
      }

      if (await has(page, '//button[text()="Continue"]')) {
        await click(page, '//button[text()="Continue"]');
      }
      const codeInput = await wait(
        page,
        `input[autocomplete="one-time-code"]`,
        3_000,
      );
      if (!codeInput) {
        logger.error("等待验证码输入框错误");
        continue;
      }
      break;
    }

    const codeInput = await wait(
      page,
      `input[autocomplete="one-time-code"]`,
      90_000,
    );
    if (!codeInput) {
      logger.error("等待验证码输入框错误");
      return;
    }

    const code = await receiveCode(
      {
        user: config.email.user,
        password: config.email.password,
        from: "noreply@trymagic.com",
        to: account.email,
        host: config.email.host,
      },
      /(\d{6})/,
    );

    logger.info(`验证码为：${code}`);

    if (!code) {
      logger.error("未获取到验证码");
      return;
    }

    await input(page, `input[autocomplete="one-time-code"]`, code);

    const start = await wait(page, `//button[text()="Start Agent"]`, 90_000);
    if (!start) {
      logger.error("登录失败了");
      return;
    }

    if (!account.agentAddress) {
      const address = await this.getWalletAddress(page);
      if (!address) return;

      await this.updateAccount(
        { agentAddress: address },
        sql`id=${account.id}`,
      );
    }

    await sleep(5_000);
    return page;
  }

  async getWalletAddress(page: Page) {
    const userInfo = await getLocalStorageItem(page, "passport-store");
    if (!userInfo) {
      logger.error("未获取到用户本地信息");
      return "";
    }

    const token = userInfo?.state?.accessToken;
    const header = {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9",
      "content-type": "application/json;charset=UTF-8",
      origin: "https://newton.xyz",
      priority: "u=1, i",
      referer: "https://newton.xyz/",
      "sec-ch-ua": '"Brave";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "sec-gpc": "1",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
      authorization: `Bearer ${token}`,
    };

    const res = await this.request<{ public_address: string }>(
      "get",
      "https://api.identity.magiclabs.com/v1/user",
      {},
      { headers: header },
    );

    if (!res) {
      logger.error("获取用户地址失败");
      return "";
    }
    return res.public_address;
  }
}

/**
 * 获取带英文序数后缀的日期数字，例如 1st, 2nd, 3rd, 4th...
 */
function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * 将日期格式化为类似 "Tuesday, June 24th, 2025" 的格式
 * @param dateInput 可传入 Date 实例或 ISO 字符串
 * @returns 格式化后的字符串
 */
export function formatDateToReadable(dateInput: Date | string): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) throw new Error("Invalid date");

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = getOrdinal(date.getDate());
  const year = date.getFullYear();

  return `${weekday}, ${month} ${day}, ${year}`;
}

/**
 * 获取今天偏移指定天数后的日期格式字符串
 * @param offsetDays 与今天的偏移天数，默认是 0（今天），可传负数（如 -1 表示昨天）
 * @returns 格式化后的字符串
 */
export function formatDateOffsetFromToday(offsetDays: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatDateToReadable(date);
}
