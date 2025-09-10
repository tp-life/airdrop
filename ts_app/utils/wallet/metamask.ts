import logger from "../../infrastructure/logger";
import { sleep } from "../help";
import {
  disableNewPages,
  findPage,
  retryAction,
  waitAndClick,
  waitForPageWithMoreThanOne,
  wrapSelector,
} from "../browser/page";
import { Browser, Page } from "rebrowser-puppeteer-core";

const extHomeUrl =
  "chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html";
const DEFAULT_PWD = "x9527Y9527!";
const MAX_RETRIES = 20;

async function ensureCheckboxChecked(page: Page): Promise<void> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    await sleep(1000);
    const checkbox = await page.$(
      'input[data-testid="onboarding-terms-checkbox"]',
    );
    if (!checkbox) {
      if ([4, 11].includes(i)) {
        logger.warn(`[${i}]未找到 checkbox，刷新页面`);
        await page.reload({ timeout: 8000 });
        await sleep(1000);
      }
      continue;
    }

    const isChecked = await page.evaluate(
      (el) => el.classList.contains("check-box__checked"),
      checkbox,
    );
    logger.info(`checkbox 状态：${isChecked}`);
    if (!isChecked) await checkbox.click();
    return;
  }
  throw new Error("无法勾选条款 checkbox");
}

async function switchToChinese(page: Page): Promise<void> {
  try {
    await sleep(1200);
    const option = await page.$(
      wrapSelector(
        `//select[contains(@class, 'dropdown__select')]/option[text() = "中文(简体)"]`,
      ),
    );
    if (option) {
      const value = await (await option.getProperty("value")).jsonValue();
      await page.select(".dropdown__select", value as string);
    }
  } catch (e) {
    logger.warn(`切换语言失败: ${e}`);
  }
}

export async function importWallet(
  browser: Browser,
  privateKey: string,
): Promise<boolean> {
  const page = await browser.newPage();
  await page.goto(extHomeUrl, { waitUntil: "networkidle2" });
  // await sleep(1000);
  const restore = disableNewPages(browser, page);
  try {
    await waitForPageWithMoreThanOne(browser);
    await sleep(300);
    // const page = (await browser.pages())[1];
    // await page.goto(extHomeUrl);
    // await sleep(500);

    await ensureCheckboxChecked(page);
    await switchToChinese(page);

    // 点击创建钱包 + 同意协议
    await retryAction(async () => {
      await page.click('button[data-testid="onboarding-create-wallet"]');
      await sleep(200);
      await page.click('button[data-testid="metametrics-i-agree"]');
    }, 5);
    await sleep(1000);
    logger.info("设置密码");
    // 设置密码
    await page.type('input[data-testid="create-password-new"]', DEFAULT_PWD);
    await sleep(500);
    await page.type(
      'input[data-testid="create-password-confirm"]',
      DEFAULT_PWD,
    );
    await sleep(800);
    await page.click('input[data-testid="create-password-terms"]');
    await sleep(800);
    await page.click('button[data-testid="create-password-wallet"]');

    // 稍后提醒我
    await waitAndClick(page, 'button[data-testid="secure-wallet-later"]');
    await sleep(1400);
    await waitAndClick(
      page,
      'input[data-testid="skip-srp-backup-popover-checkbox"]',
    );
    await sleep(800);
    await page.click('button[data-testid="skip-srp-backup"]');
    await sleep(800);
    await page.click('button[data-testid="onboarding-complete-done"]');
    await sleep(900);
    await page.click('button[data-testid="pin-extension-next"]');
    await sleep(900);
    await page.click('button[data-testid="pin-extension-done"]');
    await sleep(1000);
    await page.mouse.click(10, 10, { delay: 1000 });
    await sleep(1000);

    const accountImport = await page.waitForSelector(
      'button[data-testid="account-menu-icon"]',
      { timeout: 10_000 },
    );
    if (!accountImport) {
      logger.error("可能rpc加载异常");
      return false;
    }

    logger.info("导入钱包");
    // 打开菜单
    for (let i = 0; i < 10; i++) {
      try {
        await page.click('button[data-testid="account-menu-icon"]', {});
        if (
          !(await page.waitForSelector(
            `button[data-testid="multichain-account-menu-popover-action-button"]`,
            { timeout: 10_000 },
          ))
        ) {
          continue;
        }
        break;
      } catch {
        logger.info(`第[${i + 1}]次尝试点击展开账户按钮失败`);
        await page.reload({ timeout: 8000 });
        await sleep(1800);
      }
    }

    // 导入账户
    await sleep(2000);
    if (
      !(await page.waitForSelector(
        `button[data-testid="multichain-account-menu-popover-action-button"]`,
        { timeout: 40_000 },
      ))
    ) {
      // throw new Error("未找到 Add account or ... 按钮");
      // return false;
    }
    const addAccountBtn = await page.$(
      wrapSelector(
        `button[data-testid="multichain-account-menu-popover-action-button"]`,
      ),
    );
    if (!addAccountBtn) throw new Error("点击 account or ... 按钮");
    await addAccountBtn.click();
    await sleep(900);

    await retryAction(() =>
      page.click(wrapSelector(`//button[text()="导入账户"]`)),
    );

    // 输入私钥
    for (let i = 0; i < 10; i++) {
      try {
        await page.type("#private-key-box", privateKey, { delay: 10 });
        logger.info(`第[${i + 1}]次尝试导入私钥成功`);
        break;
      } catch (e) {
        logger.info(`第[${i + 1}]次尝试导入私钥失败`);
        await sleep(1200);
      }
    }
    logger.success("私钥导入成功 befa");
    // 点击“导入”按钮
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find(
        (b) => b.textContent === "导入",
      );
      if (!btn) throw new Error("未找到导入按钮");
      btn.click();
    });
    logger.success("私钥导入成功");
  } catch (e) {
    logger.error(`私钥导入失败: ${e}`);
    return false;
  } finally {
    await page.close();
    restore();
  }

  return true;
}

async function getPluginPage(browser: Browser): Promise<Page | null> {
  const pages = await browser.pages();
  const pluginPage = pages.find((p) =>
    p.url().includes("nkbihfbeogaeaoehlefnkodbefgpgknn"),
  );
  return pluginPage || null;
}

async function hasConnectionError(page: Page): Promise<boolean> {
  const elements = await page.$$(
    wrapSelector('//p[text()="Error while connecting to the custom network."]'),
  );
  return elements.length > 0;
}

async function clickPrimaryButtonIfAvailable(page: Page): Promise<boolean> {
  const buttons = await page.$$(
    'button[data-testid="confirm-btn"], button[data-testid="confirm-footer-button"],button[data-testid="confirmation-submit-button"],.btn-primary',
  );
  if (buttons.length === 0) return false;

  const isDisabled = await page.evaluate(
    (el) => el.hasAttribute("disabled"),
    buttons[0],
  );
  if (isDisabled) return false;

  await buttons[buttons.length - 1].click(); // 点击最后一个按钮（通常是“确认”）
  return true;
}

export async function walletDoSomething(
  browser: Browser,
  idleTimes: number = 5,
  must: boolean = false,
): Promise<boolean> {
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

    const pluginPage = await getPluginPage(browser);
    if (!pluginPage) {
      logger.warn(`未找到插件页`);

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
    await pluginPage.bringToFront();
    called = true;
    idle = 0; // 一旦找到了插件页并处理，重置 idle

    try {
      if (await hasConnectionError(pluginPage)) {
        logger.warn(`检测到连接错误提示，尝试刷新页面`);
        // await pluginPage.reload({ timeout: 8000 });
        await sleep(2000);
        continue;
      }
    } catch (e) {
      logger.warn(`检查连接错误提示失败: ${e}`);
    }

    logger.info(`检查插件按钮状态，当前页面URL: ${pluginPage.url()}`);

    try {
      await pluginPage.waitForSelector(
        'button[data-testid="confirm-btn"], button[data-testid="confirm-footer-button"],button[data-testid="confirmation-submit-button"]',
        { timeout: 3000 },
      );
      console.log("start something");
      const success = await clickPrimaryButtonIfAvailable(pluginPage);

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
}

export interface rpcOption {
  name: string;
  chainID: string;
  rpcUrl: string;
  symbol: string;
  explorerUrl: string;
}

export async function setRpc(browser: Browser, opt: rpcOption) {
  logger.info(`开始配置 RPC 节点`);
  const newPage = await browser.newPage();
  await newPage.goto(
    "chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#settings/networks/add-network",
  );
  await sleep(1000);

  try {
    const elements = await newPage.$$("input.form-field__input");
    logger.info(`使用 $$() 找到${elements.length}个输入框`);
    if (elements.length != 5) {
      logger.warn(`使用 $$() 找到的输入框数量不对， len:${elements.length}`);
      return `使用 $$() 找到的输入框数量不对， len:${elements.length}`;
    }
    await elements[0].type(opt.name, { delay: 10 });
    await sleep(800);
    await elements[1].type(opt.rpcUrl, { delay: 10 });
    await sleep(1800);
    for (let j = 0; j < 10; j++) {
      await elements[2].click({ clickCount: 3 });
      await elements[2].press("Backspace");
      await elements[2].type(opt.chainID, { delay: 500 });
      await sleep(800);
      await newPage.mouse.click(10, 10, { delay: 500 });
      await sleep(800);
      await elements[3].click({ clickCount: 3 });
      await elements[3].press("Backspace");
      await elements[3].type(opt.symbol, { delay: 300 });
      await sleep(800);
      await elements[4].click({ clickCount: 3 });
      await elements[4].press("Backspace");
      await elements[4].type(opt.explorerUrl, { delay: 30 });
      await sleep(200);
      await newPage.mouse.click(10, 10, { delay: 300 });
      await sleep(600);
      try {
        await newPage.click("button.btn-primary");
        await sleep(2000);
        await newPage.click("h6.box--color-primary-inverse");
        logger.info(`[${j}]已切换至自定义网络:${opt.name}`);
        break;
      } catch (e) {
        logger.warn(`点击切换网络按钮失败:${e}`);
        await sleep(2000);
      }
    }
  } catch (e) {
    logger.error(`小狐狸网络设置界面无法匹配到输入框:${e}`);
  } finally {
    await newPage.close();
  }
  await sleep(1500);
}
