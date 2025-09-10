import { SingleStoreTable, TableConfig } from "drizzle-orm/singlestore-core";
import { Base } from "./app";
import { eq, sql } from "drizzle-orm";
import { BrowserManage } from "../utils/browser";
import { Register } from "../register/decorators";
import { randProxyIP } from "../utils/proxy-ip";
import { generateEmail, generateName, receiveCode, sleep } from "../utils/help";
import {
  click,
  has,
  input,
  waitAndClick,
  wrapSelector,
} from "../utils/browser/page";
import logger from "../infrastructure/logger";
import { ReceiveEmailWithHttp } from "../utils/email";
import config from "../config";
import { EnsoAccount, EnsoTable } from "../schema/enso";
import { Page } from "rebrowser-puppeteer-core";
import * as jwt from "jsonwebtoken";
import { metamask } from "../config/ext";
import { importWallet, walletDoSomething } from "../utils/wallet/metamask";
import { AesHelper } from "../utils/encode/aes";
import { ZealyAccount, ZealyTable } from "../schema/zealy";

@Register("zealy")
export class Zealy extends Base {
  public table = ZealyTable;

  async run() {
    try {
      await this.register();
    } catch (err) {
      logger.error(`运行发生错误: ${err}`);
    }
  }

  async register() {
    this.ip = await randProxyIP();
    // this.ip = {"host": "127.0.0.1", port: 6152}
    let email = generateEmail();
    this.browser = new BrowserManage(
      this.userDataDir(`zealy_${email}`),
      [],
      this.ip,
    );
    const page = await this.browser.open({ url: "https://zealy.io/signup" });
    await page.bringToFront();
    // await page.goto("https://zealy.io/signup")
    await page.waitForNetworkIdle();

    if (await has(page, 'button[aria-label="Close"]')) {
      click(page, 'button[aria-label="Close"]');
    }

    if (!(await input(page, "#email", email))) {
      logger.error("输入邮箱错误");
      return false;
    }
    await sleep(2000);
    await waitAndClick(page, "button ::-p-text(Continue with email)");

    const inputEle = await page.waitForSelector(
      'input[autocomplete="one-time-code"]',
      { timeout: 20000 },
    );
    if (!inputEle) {
      logger.error("未等到验证码输入框");
      return false;
    }

    const emialOpts = {
      host: config.email.host,
      user: config.email.user,
      password: config.email.password,
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

    const nameEle = await page.waitForSelector('input[name="name"]', {
      timeout: 5000,
    });
    const name = generateName().replace(".", "_").replace("-", "_");
    nameEle.type(name);

    if (await has(page, "p ::-p-text(This username is already taken)")) {
      nameEle.type(name + "123_123");
    }

    await sleep(3000);
    await click(page, 'button[aria-label="Next"]');
    await sleep(2000);
    await waitAndClick(page, "button ::-p-text(Get started)");
    await page.goto(
      "https://zealy.io/cw/enso/questboard/ed7a48b8-c972-4098-841e-21b6d6f44fca/27c7d639-ef02-491d-9dba-d070cfd6b794",
    );
    // await page.waitForNetworkIdle()
    const cookies = await this.browser.browser.cookies();
    console.log(cookies);
    const access_token = cookies.filter(
      (item) => item.domain.includes("zealy.io") && item.name == "access_token",
    );
    let set: ZealyAccount = {
      email: email,
      password: config.email.password,
      cookies: cookies.map((item) => `${item.name}=${item.value}`).join(";"),
    } as ZealyAccount;
    // let set: {} = { isRegisterZealy: 1, email: email, emailPass: config.email.password }
    if (!!access_token.length) {
      const token = jwt.decode(access_token[0].value, { json: true });
      set = { ...set, userID: token.userId };
    }

    await this.insertAccount(set);
    await sleep(30000 * 1000);
  }
}
