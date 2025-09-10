import { Browser, Page } from "rebrowser-puppeteer-core";
import { sleep } from "../help";
import {
  click,
  clickIfAvailable,
  disableNewPages,
  executeSteps,
  findPage,
  has,
  hs,
  input,
  newPage,
  Step,
  wait,
  wrapSelector,
} from "../browser/page";
import logger from "../../infrastructure/logger";
import { InsufficientBalance } from "../../types/error";

// 常量
const OKX_EXTENSION_ID = "mcohilncbfahbmgdjkbpemcciiolgcge";
const OKX_EXTENSION_URL = `chrome-extension://${OKX_EXTENSION_ID}/notification.html`;
const OKX_PASSWORD = "abc123456";
const DEFAULT_WAIT_TIME = 5000;
const DEFAULT_SLEEP_TIME = 2000;

async function getWalletPage(browser: Browser): Promise<Page | null> {
  try {
    const walletPage = await findPage(browser, {
      urlContain: OKX_EXTENSION_ID,
    });
    if (walletPage && walletPage.ok) return walletPage.data;

    const page = await newPage(browser, OKX_EXTENSION_URL);
    return page;
  } catch (error) {
    logger.warn("Retrying wallet page...");
    await sleep(1000);
    return await newPage(browser, OKX_EXTENSION_URL);
  }
}

export async function importOKXByPrivateKey(
  browser: Browser,
  privateKey: string,
): Promise<boolean> {
  if (!privateKey || privateKey.length < 40) {
    console.error("importOKXByPrivateKey() received invalid private_key");
    return false;
  }
  const page = await getWalletPage(browser);
  await sleep(DEFAULT_SLEEP_TIME);

  const restore = disableNewPages(browser, page);
  try {
    await sleep(DEFAULT_WAIT_TIME);

    if (await has(page, wrapSelector("//*[contains(text(),'请输入密码')]"))) {
      await input(page, "input[type='password']", OKX_PASSWORD);
      await click(page, "//button[text()='解锁']");
      await sleep(DEFAULT_SLEEP_TIME);
      await page.close();
      return true;
    }

    // 执行导入步骤
    const success = await executeImportSteps(page, privateKey);
    await page.close();
    return success;
  } catch (e) {
    console.error(`OKX import failed: ${e}`);
    return false;
  } finally {
    restore();
  }
}

async function executeImportSteps(
  page: Page,
  privateKey: string,
): Promise<boolean> {
  // 导入步骤
  const steps: Step[] = [
    hs(
      "click",
      `${wrapSelector('//span[text()="导入已有钱包"]')}, ${wrapSelector("//span[text()='Import wallet']")}`,
      800,
    ),
    hs(
      "click",
      `${wrapSelector("//div[text()='Seed phrase or private key']")}, ${wrapSelector("//div[text()='助记词或私钥']")}`,
      800,
    ),
    hs("click", "div[data-e2e-okd-tabs-pane='2']", 800),
    hs("input", 'textarea[data-testid="okd-input"]', 800, privateKey),
    hs("click", "(//button[@data-testid='okd-button'])[1]", 800),
    hs("click", "(//button[@data-testid='okd-button'])[1]", 800),
    hs(
      "click",
      `${wrapSelector("//div[text()='密码验证']")}, ${wrapSelector("//div[text()='Password']")}`,
      800,
    ),
    hs("click", "button[data-testid='okd-button']", 800),
    hs("input", "(//input[@type='password'])[1]", 800, OKX_PASSWORD),
    hs("input", "(//input[@type='password'])[2]", 800, OKX_PASSWORD),
    hs("click", "button[data-testid='okd-button']", 800),
    hs("click", "button[data-testid='okd-button']", 2000),
  ];

  await executeSteps(page, steps);

  return true;
}

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

    if (notFoundPrimaryBtn > 5) {
      throw new Error(
        `钱包插件连续 ${notFoundPrimaryBtn} 次未找到可点击按钮，可能是余额不足或网络错误`,
      );
    }

    const walletPage = await findPage(browser, {
      urlContain: OKX_EXTENSION_ID,
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
      if (await checkInsufficientBalance(pluginPage)) {
        logger.error(`当前交易 余额不足`);
        throw new InsufficientBalance("当前交易 余额不足");
      }

      await wait(pluginPage, ".btn-fill-highlight");
      console.log("start something");
      const success = await clickIfAvailable(pluginPage, `.btn-fill-highlight`);

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

async function checkInsufficientBalance(page: Page): Promise<boolean> {
  const nodes = await page.$$(
    wrapSelector("//*[contains(text(),'足够') or contains(text(),'enough')]"),
  );
  if (nodes.length > 0) {
    console.error("Insufficient balance");
    await click(page, "button[data-testid='page-container-footer-cancel']");
    return true;
  }
  return false;
}
