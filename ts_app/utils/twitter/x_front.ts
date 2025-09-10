import { URL } from "url";
import { Browser, Cookie, Page } from "rebrowser-puppeteer-core";
import {
  click,
  findPage,
  has,
  newPage,
  race,
  wait,
  wrapSelector,
} from "../browser/page";
import { BlockedError, RetryError } from "../../types/error";
import logger from "../../infrastructure/logger";
import { sleep } from "../help";
import { blockedResource, getResource, useResource } from "../../db/help";
import { TwitterAccount, TwitterTable } from "../../schema/twitter";
import { sql, SQL } from "drizzle-orm";

export interface TwitterAuthConfig {
  project: string;
  auth_btn: string;
  token?: string;
  verify_follow?: number;
  ip?: string;
  stop_flag?: string;
  x_query?: SQL;
  new_tab?: boolean;
}

class TwitterAuthenticator {
  protected domain: string | null;
  static SUSPENDED_SELECTORS = [
    '//*[contains(text(), "Your account is suspended")]',
    '//*[contains(text(), "Your account has been locked")]',
    '//*[contains(text(), "Access Denied")]',
  ];

  constructor(
    private token: string,
    private url = "https://twitter.com",
  ) {
    this.token = token;
    this.url = url;
    this.domain = new URL(url).hostname;
  }

  async setCookies(browser: Browser): Promise<void> {
    const expires = Math.floor(Date.now() / 1000 + 86400 * 365);
    const cookies = [
      { name: "auth_token", value: this.token, domain: ".x.com", expires },
      { name: "auth_token", value: this.token, domain: this.domain!, expires },
    ] as Cookie[];

    await browser.setCookie(...cookies);
  }

  async checkSuspended(page: Page): Promise<boolean> {
    for (const selector of TwitterAuthenticator.SUSPENDED_SELECTORS) {
      const element = await has(page, selector);
      if (element) return true;
    }
    return false;
  }
}

class TwitterConnector extends TwitterAuthenticator {
  async connect(browserPage: Page): Promise<boolean> {
    const browser = browserPage.browser();
    await this.setCookies(browser);

    const page = await newPage(browser, "https://x.com");
    await sleep(2_000);
    try {
      const p = await this.verifyConnection(page);
      // await page.close();
      return p;
    } catch (e) {
      throw e;
    } finally {
      await page.close();
    }
  }

  async verifyConnection(page: Page): Promise<boolean> {
    await sleep(1_000);
    if (await has(page, '//*[contains(text(), "Your account is suspended")]')) {
      throw new BlockedError("Twitter账号已被暂停");
    }

    const tasks = {
      '//*[contains(text(), "Your account is suspended")]': async () => {
        throw new BlockedError("Twitter账号已被暂停");
      },
      '//*[@data-testid="SideNav_NewTweet_Button"]': async () => true,
      '//*[@data-testid="loginButton"]': async () => {
        throw new BlockedError("Twitter账号已被暂停");
      },
      '//*[contains(text(), "Your account has been locked")]': async () => {
        throw new BlockedError("Twitter账号已被暂停");
      },
      'button[data-testid="apple_sign_in_button"]': async () => {
        throw new BlockedError("Twitter账号已被暂停");
      },
      'div[data-testid="sidebarColumn"]': async () => true,
    };

    const ok = await race(page, tasks);
    return ok;
  }
}

class TwitterAuthFrontend extends TwitterConnector {
  async authenticate(
    page: Page,
    stopFlag = "",
    maxRetries = 10,
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      if (await this.checkSuspended(page))
        throw new BlockedError("Twitter账号已被暂停或锁定");

      try {
        const success = await this.tryAuthFlow(page, stopFlag);
        if (success) return true;
      } catch (e) {
        if (e instanceof RetryError) {
          logger.warn("Twitter authForFrontend 需要重试");
          continue;
        }
        throw e;
      }
    }
    return false;
  }

  async tryAuthFlow(page: Page, stopFlag: string): Promise<boolean> {
    await sleep(2_000);
    await page.bringToFront();
    for (let i = 0; i < 3; i++) {
      if (has(page, `#allow,[data-testid="OAuth_Consent_Button"]`)) {
        await click(page, `#allow,[data-testid="OAuth_Consent_Button"]`);
        return true;
      }
    }

    if (stopFlag && (await page.$(wrapSelector(stopFlag)))) return true;

    logger.warn("Twitter authForFrontend 未匹配任何元素");
    return false;
  }
}

export async function autoXAuth(
  page: Page,
  config: TwitterAuthConfig,
  blankFn?: (token: string) => Promise<void>,
  getTokenFn?: (token: string, username: string) => Promise<void>,
  source?: () => Promise<[string, string]>,
): Promise<boolean> {
  try {
    await wait(page, wrapSelector(config.auth_btn));
  } catch {}
  const authButton = await page.$(wrapSelector(config.auth_btn));
  if (!authButton) throw new Error("未找到授权按钮");

  for (let i = 0; i < 10; i++) {
    const [token, username] = await TwitterTokenHandler.getToken(
      config,
      source,
      getTokenFn,
    );
    if (!token) throw new Error("未找到可用的推特账号");

    const twitter = new TwitterAuthFrontend(token);
    try {
      await twitter.connect(page);
    } catch (e) {
      if (e instanceof BlockedError) {
        await TokenStatusHandler.handleBlankToken(
          token,
          config.project,
          blankFn,
        );
        // await blockedResource(TwitterTable, sql`token =${token}`, 1);
      }
      continue;
    }

    const authPage = await navigateToAuthPage(page, config);
    await sleep(2_000);

    try {
      if (await twitter.authenticate(authPage, config.stop_flag)) {
        useResource(TwitterTable, sql`token =${token}`, config.project);
        return true;
      }
    } catch (e) {
      if (e instanceof BlockedError) {
        await TokenStatusHandler.handleBlankToken(
          token,
          config.project,
          blankFn,
        );
        // await blockedResource(TwitterTable, sql`token =${token}`, 1);
        if (config.new_tab) {
          await authPage.close();
        } else {
          await authPage.goBack({ waitUntil: "networkidle2" });
        }
      } else {
        logger.error(`授权推特失败：${e}`);
        continue;
      }
    }
  }

  return false;
}

async function navigateToAuthPage(
  page: Page,
  config: TwitterAuthConfig,
): Promise<Page> {
  const btn = wrapSelector(config.auth_btn);
  if (config.new_tab) {
    await page.click(btn);
    const b = page.browser();
    const newPage = await findPage(b, { urlContain: "x.com" });
    if (newPage.ok) {
      return newPage.data;
    }
    return page;
  }
  await page.click(btn);
  return page;
}

class TwitterTokenHandler {
  static async getToken(
    config: TwitterAuthConfig,
    source?: () => Promise<[string, string]>,
    getTokenFn?: (token: string, username: string) => Promise<void>,
  ): Promise<[string, string]> {
    if (config.token) return [config.token, ""];
    if (!source)
      source = async () => {
        const x = await getResource<TwitterAccount>(
          TwitterTable,
          config.project,
          1,
          config.x_query,
        );
        return [x.token, x.username];
      };

    const [token, username] = await source();
    if (getTokenFn && token) await getTokenFn(token, username);
    return [token, username];
  }
}

class TokenStatusHandler {
  static async handleBlankToken(
    token: string,
    project = "",
    blankFn?: (token: string) => Promise<void>,
    isBlocked = 1,
  ): Promise<void> {
    if (project)
      await blockedResource(TwitterTable, sql`token = ${token}`, isBlocked);
    if (blankFn) await blankFn(token);
  }
}
