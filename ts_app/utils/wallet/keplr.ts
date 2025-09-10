import { Browser, ElementHandle, Page } from "rebrowser-puppeteer-core";
import { sleep } from "../help";
import {
  clickIfAvailable,
  closePage,
  disableNewPages,
  executeSteps,
  findPage,
  hs,
  newPage,
  Step,
  wait,
  wrapSelector,
} from "../browser/page";
import logger from "../../infrastructure/logger";

const DEFAULT_PWD = "9527Y952123";

const WALLET_ID = "dmkamcknogkgcdfhhbddcghachkejeap";

const WALLET_EXTENSION_URL = `chrome-extension://${WALLET_ID}/register.html`;
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

export const importWallet = async (browser: Browser, pk: string) => {
  const page = await getWalletPage(browser);
  if (!page) return false;
  const restore = disableNewPages(browser, page);
  try {
    await executeSteps(page, [
      {
        action: "click",
        selector: ` ${wrapSelector('//div[text()="导入已有钱包"]')}`,
        delay: 800,
      },
      {
        action: "click",
        selector: ` ${wrapSelector('//div[text()="使用助记词或私钥"]')}`,
        delay: 800,
      },
      {
        action: "click",
        selector: ` ${wrapSelector('//button[text()="私钥"]')}`,
        delay: 800,
      },

      {
        action: "input",
        selector: 'input[type="password"]',
        value: pk,
        delay: 800,
      },
      {
        action: "click",
        selector: 'button[type="submit"]',
        delay: 1000,
      },
      hs("input", `input[name="name"]`, 1000, "My Wallet"),
      {
        action: "input",
        selector: 'input[name="password"]',
        value: DEFAULT_PWD,
        delay: 1000,
      },
      {
        action: "input",
        selector: 'input[name="confirmPassword"]',
        value: DEFAULT_PWD,
        delay: 1000,
      },
      hs("click", '//div[text()="下一步"]', 3_000),
      hs("click", `//div[text()="保存"]`, 5_000),
      {
        action: "click",
        selector: '//div[text()="完成"]',
        delay: 800,
      },
    ]);

    // await page.close();
    return true;
  } catch (error) {
    console.error("Import keplr failed:", error);
    // await page.close();
    return false;
  } finally {
    restore();
  }
};

export const doSomething = async (
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
    await closePage(browser, { urlContain: "github" }, true);
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
      await pluginPage.waitForSelector(`button[color="primary"]`, {
        timeout: 3000,
      });
      console.log("start something");
      const success = await clickIfAvailable(
        pluginPage,
        `button[color="primary"]`,
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
  await closePage(browser, { urlContain: "github" }, true);
  return called;
};
