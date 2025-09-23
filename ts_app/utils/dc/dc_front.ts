import { Browser, ElementHandle, Page } from "rebrowser-puppeteer-core";
import { sleep } from "../help";
import { findPage, has, race, wait, wrapSelector } from "../browser/page";
import { BlockedError } from "../../types/error";
import { blockedResource, getResource, useResource } from "../../db/help";
import { DCAccount, DCTable } from "../../schema/dc";
import { SQL, sql } from "drizzle-orm";
import logger from "../../infrastructure/logger";

interface DCAuthConfig {
  project: string;
  authBtn: string;
  token?: string;
  dcQuery?: SQL;
  maxRetries?: number;
  tokenAttempts?: number;
  newTab?: boolean;
}

class DiscordAuthenticator {
  constructor(public token: string) {}

  static LOGIN_SELECTORS = [
    '//button[contains(@class, "primary")]',
    'input[name="email"]',
    '//h2[text()="You need to verify your account in order to perform this action."]',
  ];

  private async injectToken(page: Page): Promise<boolean> {
    try {
      await page.evaluate((token) => {
        const iframe = document.createElement("iframe");
        document.head.appendChild(iframe);
        const localStorage = Object.getOwnPropertyDescriptor(
          iframe.contentWindow!,
          "localStorage",
        );
        iframe.remove();
        if (localStorage) {
          Object.defineProperty(window, "localStorage", localStorage);
          window.localStorage.setItem("token", `"${token}"`);
        }
      }, this.token);
      return true;
    } catch (err) {
      console.error("[InjectToken Error]", err);
      return false;
    }
  }

  private async waitForLoginPage(page: Page): Promise<void> {
    for (let i = 0; i < 10; i++) {
      try {
        await Promise.race(
          DiscordAuthenticator.LOGIN_SELECTORS.map(async (selector) => {
            await page.waitForSelector(wrapSelector(selector), {
              timeout: 5000,
            });
          }),
        );
        return;
      } catch {
        await page.reload();
        await sleep(2000);
      }
    }
  }

  async connect(browser: Browser): Promise<boolean> {
    const page = await browser.newPage();
    try {
      await page.goto("https://discord.com", {
        waitUntil: "networkidle2",
        timeout: 90_000,
      });
      const success = await this.injectToken(page);
      await page.reload({ waitUntil: "networkidle2" });
      await sleep(5_000);
      await page.goto("https://discord.com/channels/@me", {
        waitUntil: "networkidle2",
      });
      await sleep(5_000);

      if (await has(page, 'input[name="email"]')) {
        // await page.close();
        throw new BlockedError("账号已失效");
      }
      return success;
    } finally {
      await page.close();
    }

    return false;
  }

  async authenticate(page: Page): Promise<boolean> {
    await this.waitForLoginPage(page);
    try {
      await page.evaluate(() => {
        const main = document.querySelector("main");
        if (main && main.parentElement) {
          const parent = main.parentElement;
          parent.scrollTo({
            top: parent.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    } catch {}

    const _auth = async (el: ElementHandle<Element>) => {
      logger.info("Authenticating...");
      for (let i = 0; i < 10; i++) {
        try {
          await el.click();
          await sleep(2_000);
          if (await has(page, DiscordAuthenticator.LOGIN_SELECTORS[0])) {
            await el.click();
            continue;
          }

          return true;
        } catch (err) {
          console.warn("[Auth] Click failed, retrying...", err);
          await sleep(2000);
        }
      }
      return false;
    };
    const actionMap = {
      [wrapSelector(DiscordAuthenticator.LOGIN_SELECTORS[0])]: _auth,
      [wrapSelector(DiscordAuthenticator.LOGIN_SELECTORS[1])]: () => {
        throw new BlockedError("DC 已被禁用");
      },
      [wrapSelector(DiscordAuthenticator.LOGIN_SELECTORS[2])]: () => {
        throw new BlockedError("DC 已被禁用");
      },
    };

    return await race(page, actionMap, 20_000);
  }
}

class DCAuthManager {
  static async getValidToken(
    config: DCAuthConfig,
    browser: Browser,
    onTokenBlank?: (token: string) => Promise<void>,
    onTokenUse?: (token: string) => Promise<void>,
    getTokenFn?: (project: string) => Promise<{ token: string } | null>,
  ): Promise<DiscordAuthenticator | null> {
    let token = config.token || "";
    const attempts = config.tokenAttempts ?? 10;

    const fetchToken =
      getTokenFn ||
      (async (project: string) => {
        const x = await getResource<DCAccount>(
          DCTable,
          project,
          1,
          config.dcQuery,
        );
        return { token: x.token };
      });

    for (let i = 0; i < attempts; i++) {
      if (!token) {
        const tokenData = await fetchToken(config.project);
        if (!tokenData) break;
        token = tokenData.token;
      }

      const auth = new DiscordAuthenticator(token);
      try {
        const connected = await auth.connect(browser);

        if (connected) {
          onTokenUse && (await onTokenUse(token));
          await useResource(DCTable, sql`token = ${token}`, config.project);
          return auth;
        }
      } catch (error) {
        if (error instanceof BlockedError) {
          onTokenBlank && (await onTokenBlank(token));
          await blockedResource(DCTable, sql`token = ${token}`, 1);
        } else {
          console.error("Unknown error:", error);
        }
      }

      token = "";
    }

    return null;
  }
}

export async function autoDiscordAuth(
  page: Page,
  config: DCAuthConfig,
  onTokenBlank?: (token: string) => Promise<void>,
  onTokenUse?: (token: string) => Promise<void>,
  getTokenFn?: (project: string) => Promise<{ token: string } | null>,
): Promise<boolean> {
  try {
    await wait(page, wrapSelector(config.authBtn));
  } catch {}
  const authBtn = await page.$(wrapSelector(config.authBtn));
  if (!authBtn) throw new Error("未找到授权按钮");

  const browser = page.browser();
  const retries = config.maxRetries ?? 5;

  for (let i = 0; i < retries; i++) {
    const dc = await DCAuthManager.getValidToken(
      config,
      browser,
      onTokenBlank,
      onTokenUse,
      getTokenFn,
    );
    if (!dc) throw new Error("未找到可用的DC账号");
    await page.bringToFront();
    await authBtn.click();
    await sleep(2_000);
    let authPage: Page = page;

    if (config.newTab) {
      const newPage = await findPage(browser, { urlContain: "discord.com" });
      if (newPage.ok) authPage = newPage.data;
    }

    try {
      return await dc.authenticate(authPage);
    } catch (err: any) {
      if (err instanceof BlockedError) {
        console.warn("账号已禁用");
        await blockedResource(DCTable, sql`token = ${dc.token}`, 1);
        onTokenBlank && (await onTokenBlank(dc.token));
      } else {
        console.error("授权失败:", err);
        return false;
      }
    } finally {
      if (config.newTab && authPage !== page) await authPage.close();
    }
  }

  return false;
}
