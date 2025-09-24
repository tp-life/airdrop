import type { Browser, ElementHandle, Page } from "rebrowser-puppeteer-core";
import {
  by_click,
  by_input,
  by_wait,
  click,
  executeSteps,
  findPage,
  has,
  newPage,
  race,
  wait,
  wrapSelector,
} from "../browser/page";
import logger from "../../infrastructure/logger";
import { sleep } from "../help";
import { BlockedError } from "../../types/error";

export class Gmail {
  constructor(
    private email: string,
    private password: string,
  ) {}

  async login(browser: Browser) {
    const page = await newPage(
      browser,
      "https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&dsh=S1796385929%3A1758699945373759&ifkv=AfYwgwVF-7PhpR69v7300JTqRE0No8UGiRxfCON3jtZ8EtlaQIy-Ab322mT-uB9rFGBO_azIKbcJ9g&rip=1&sacu=1&service=mail&flowName=GlifWebSignIn&flowEntry=ServiceLogin",
    );
    await executeSteps(page, [
      by_wait(`input[name="identifier"]`),
      by_input(`input[name="identifier"]`, this.email),
      by_click(`#identifierNext`),
      by_input(`input[name="Passwd"]`, this.password),
      by_click(`#passwordNext`),
    ]);

    const cond = {
      '//div[text()="Mail"]': async () => true,
    };

    const ok = await race(page, cond);
    return ok;
  }

  async authenticate(page: Page): Promise<boolean> {
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
          await click(page, `//span[text()="Continue"]`);
          if (await has(page, `div[data-authuser="0"]`)) {
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
      '`div[data-authuser="0"]`': _auth,
      [wrapSelector(`input[name="identifier"]`)]: () => {
        throw new BlockedError("Gmail 已被禁用");
      },
    };

    return await race(page, actionMap, 20_000);
  }

  async authByFront(page: Page, btn: string, newTab = false) {
    try {
      await wait(page, wrapSelector(btn));
    } catch {}
    const authBtn = await page.$(wrapSelector(btn));
    if (!authBtn) throw new Error("未找到授权按钮");

    const browser = page.browser();

    await page.bringToFront();
    await authBtn.click();
    await sleep(2_000);
    let authPage: Page = page;

    if (newTab) {
      const newPage = await findPage(browser, {
        urlContain: "accounts.google.com",
      });
      if (newPage.ok) authPage = newPage.data;
    }

    try {
      return await this.authenticate(authPage);
    } catch (err: any) {
      if (err instanceof BlockedError) {
        console.warn("账号已禁用");
      } else {
        console.error("授权失败:", err);
        return false;
      }
    } finally {
      if (newTab && authPage !== page) await authPage.close();
    }
  }
}
