import { Browser, ElementHandle, Page } from "rebrowser-puppeteer-core";
import { sleep } from "../help";
import {
  clickIfAvailable,
  disableNewPages,
  executeSteps,
  findPage,
  newPage,
  Step,
  wait,
  wrapSelector,
} from "../browser/page";
import logger from "../../infrastructure/logger";

const DEFAULT_PWD = "x9527Y9527!";

const WALLET_ID = "bfnaelmomeimhlpmgjnjophhpkkoljpa";

const WALLET_EXTENSION_URL = `chrome-extension://${WALLET_ID}/onboarding.html`;
const WALLET_EXTENSION_POPUP = `chrome-extension://${WALLET_ID}/popup.html`;

async function getWalletPage(browser: Browser): Promise<Page | null> {
  try {
    const walletPage = await findPage(browser, {
      urlContain: WALLET_ID,
    });
    if (walletPage && walletPage.ok) return walletPage.data;

    const page = await newPage(browser, WALLET_EXTENSION_URL);
    return page;
  } catch (error) {
    logger.warn("Retrying wallet page...");
    await sleep(1000);
    return await newPage(browser, WALLET_EXTENSION_URL);
  }
}

export const importPhantomByInit = async (browser: Browser, pk: string) => {
  const page = await getWalletPage(browser);
  if (!page) return false;
  const restore = disableNewPages(browser, page);
  try {
    await executeSteps(page, [
      {
        action: "click",
        selector: `${wrapSelector('//button[text()="I already have a wallet"]')}, ${wrapSelector('//button[text()="我已经有一个钱包"]')}`,
        delay: 500,
      },
      {
        action: "click",
        selector: `${wrapSelector('//div[text()="Import Recovery Phrase"]')}, ${wrapSelector('//div[text()="导入私钥"]')}`,
        delay: 600,
      },
      { action: "input", selector: '//input[@name="name"]', value: "phantom" },
      {
        action: "input",
        selector: '//textarea[@name="privateKey"]',
        value: pk,
        delay: 500,
      },
      {
        action: "click",
        selector: 'button[data-testid="onboarding-form-submit-button"]',
        delay: 1000,
      },
      {
        action: "input",
        selector: 'input[data-testid="onboarding-form-password-input"]',
        value: DEFAULT_PWD,
        delay: 500,
      },
      {
        action: "input",
        selector: 'input[data-testid="onboarding-form-confirm-password-input"]',
        value: DEFAULT_PWD,
        delay: 500,
      },
      {
        action: "click",
        selector:
          'input[data-testid="onboarding-form-terms-of-service-checkbox"]',
        delay: 800,
      },
      {
        action: "click",
        selector: 'button[data-testid="onboarding-form-submit-button"]',
        delay: 800,
      },
    ]);

    try {
      await wait(page, `svg[aria-label="Status: pass"]`, 10_000);
      const cn = await wait(
        page,
        `${wrapSelector('//button[text()="Continue"]')}, ${wrapSelector('//button[text()="继续"]')}`,
        10_000,
      );
      if (cn) {
        await cn.click();
      }
    } catch {}
    const start = await wait(
      page,
      `${wrapSelector('//button[text()="Start"]')}, ${wrapSelector('//button[text()="开始"]')}`,
      90_000,
    );

    if (!start) {
      logger.error("Import failed: 未找到可用的开始按钮");
      return false;
    }

    await start.click();

    await page.close();
    return true;
  } catch (error) {
    console.error("Import failed:", error);
    await page.close();
    return false;
  } finally {
    restore();
  }
};

export const importPhantom = async (
  browser: Browser,
  pk: string,
): Promise<boolean> => {
  const page = await getWalletPage(browser);
  if (!page) return false;

  try {
    await executeSteps(page, [
      {
        action: "click",
        selector: '//div[@data-testid="settings-menu-open-button"]',
        delay: 500,
      },
      {
        action: "click",
        selector: '//div[@data-testid="sidebar_menu-button-add_account"]',
        delay: 600,
      },
      {
        action: "click",
        selector: '//p[contains(text(), "导入私钥")]',
        delay: 600,
      },
      { action: "input", selector: '//input[@name="name"]', value: "phantom" },
      {
        action: "input",
        selector: '//textarea[@name="privateKey"]',
        value: pk,
        delay: 500,
      },
      { action: "click", selector: '//button[@type="submit"]', delay: 1000 },
    ]);

    await page.close();
    return true;
  } catch (error) {
    console.error("Import failed:", error);
    await page.close();
    return false;
  }
};

export const doSomethingByPhantom = async (
  browser: Browser,
  idleTimes: number = 5,
  must: boolean = false,
): Promise<boolean> => {
  let called = false;
  let idle = 0;
  let okTimes = 0;
  let notFoundPrimaryBtn = 0;

  for (let i = 0; i < 60; i++) {
    await sleep(1000);

    if (notFoundPrimaryBtn > 5) {
      throw new Error(
        `钱包插件连续 ${notFoundPrimaryBtn} 次未找到可点击按钮，可能是余额不足或网络错误`,
      );
    }

    const walletPage = await findPage(browser, {
      urlContain: WALLET_ID,
    });
    if (!walletPage || !walletPage.ok) {
      // logger.warn(`未找到插件页`);

      if (must && okTimes < 1) {
        i = 0; // 强制重试
        continue;
      }
      if (idle >= idleTimes) {
        logger.info(`钱包处理逻辑完成，退出循环`);
        break;
      }
      idle++;
      continue;
    }

    const pluginPage = walletPage.data;

    await pluginPage.bringToFront();
    called = true;
    idle = 0; // 一旦找到了插件页并处理，重置 idle

    logger.info(`检查插件按钮状态，当前页面URL: ${pluginPage.url()}`);

    try {
      await pluginPage.waitForSelector(
        `button[data-testid="primary-button"], ${wrapSelector('//button[text()="Confirm anyway"]')},${wrapSelector('//button[text()="仍然确认"]')}`,
        { timeout: 3000 },
      );
      console.log("start something");
      const success = await clickIfAvailable(
        pluginPage,
        `button[data-testid="primary-button"], ${wrapSelector('//button[text()="Confirm anyway"]')},${wrapSelector('//button[text()="仍然确认"]')}`,
      );

      if (success) {
        okTimes++;
        notFoundPrimaryBtn = 0;
        logger.info(`成功点击插件按钮，累计成功次数: ${okTimes}`);
      } else {
        notFoundPrimaryBtn++;
        logger.warn(
          `找到按钮但不可点击 (disabled)，计数 +1 -> ${notFoundPrimaryBtn}`,
        );
      }
    } catch (e: any) {
      notFoundPrimaryBtn++;
      logger.warn(`点击插件按钮失败: ${e.message}`);
    }

    await sleep(500);
  }

  return called;
};

export const openTest = async (browser: Browser): Promise<boolean> => {
  try {
    const page = await browser.newPage();
    await page.bringToFront();
    await page.goto(WALLET_EXTENSION_POPUP, { waitUntil: "domcontentloaded" });
    logger.info("打开测试网成功");
    await sleep(2_000);
    await wait(page, `button[data-testid="settings-menu-open-button"]`, 30_000);
    const action = [
      {
        action: "click",
        selector: 'button[data-testid="settings-menu-open-button"]',
        delay: 2_000,
      },
      {
        action: "click",
        selector: 'button[data-testid="sidebar_menu-button-settings"]',
        delay: 2_500,
      },
      {
        action: "click",
        selector: "#settings-item-developer-settings",
        delay: 1_000,
      },
      {
        action: "click",
        selector: 'button[data-testid="toggleTestNetwork"]',
        delay: 1_000,
      },
    ];
    await executeSteps(page, action as Step[]);
    page.close();
    return true;
  } catch (err) {
    logger.error(`启动测试网失败${err.message}`);
  }
  return false;
};
