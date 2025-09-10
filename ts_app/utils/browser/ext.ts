import logger from "../../infrastructure/logger";
import { sleep } from "../help";
import { disableNewPages, has, newPage, wrapSelector } from "./page";
import type { Browser, Page } from "rebrowser-puppeteer-core";

export async function settingYesCaptcha(
  browser: Browser,
  yesCaptchaKeys: string[],
): Promise<boolean> {
  const page = await newPage(
    browser,
    "chrome-extension://jiofmdifioeejeilfkpegipdjiopiekl/option/index.html",
  );
  const restore = disableNewPages(browser, page);
  try {
    for (const key of yesCaptchaKeys) {
      const inputSelector = ".MuiInput-input";
      const saveButtonXPath = '//button[contains(text(),"save")]';

      try {
        await page.waitForSelector(inputSelector, { timeout: 5000 });
        await page.click(inputSelector, { clickCount: 3 });
        await page.type(inputSelector, key, { delay: 20 });

        await page.waitForSelector(wrapSelector(saveButtonXPath), {
          timeout: 5000,
        });
        const saveButton = await page.$(wrapSelector(saveButtonXPath));
        if (!saveButton) return false;
        await saveButton.click();

        await sleep(1000);
      } catch (err) {
        console.error("Error setting key:", key, err);
        return false;
      }
    }

    const inputValue = await page.$eval(
      ".MuiInput-input",
      (el) => (el as HTMLInputElement).value,
    );
    if (!inputValue) return false;

    const cloudflareXPath = '//span[text()="cloudflare"]';
    const switchSelector = ".PrivateSwitchBase-input";
    const finalSaveXPath = '//button[contains(text(), "save")]';

    try {
      const cloudflareBtn = await page.$(wrapSelector(cloudflareXPath));
      if (!cloudflareBtn) return true;
      await cloudflareBtn.click();

      await page.waitForSelector(switchSelector, { timeout: 3000 });
      const switchInput = await page.$(switchSelector);
      if (!switchInput) return true;
      await switchInput.click();

      const finalSaveBtn = await page.$(wrapSelector(finalSaveXPath));
      if (finalSaveBtn) {
        await finalSaveBtn.click();
      }
    } catch (err) {
      console.error("Error in final configuration:", err);
      return false;
    }
  } finally {
    page.close();
    restore();
  }

  return true;
}

/**
 * 检查页面是否已通过 hCaptcha 验证（最多等待 90 秒）
 * @param page Puppeteer 的页面对象
 * @param timeout 最大等待时间（毫秒），默认 90 秒
 * @param interval 轮询间隔（毫秒），默认 1000 毫秒
 * @returns Promise<boolean> 是否已验证成功
 */
export async function waitForHcaptchaVerified(
  page: Page,
  timeout = 90_000,
  interval = 1000,
  ele = "",
): Promise<boolean> {
  const maxAttempts = Math.floor(timeout / interval);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const token = await page.evaluate(() => {
        const el = document.querySelector(
          'textarea[name="h-captcha-response"], input[name="h-captcha-response"]',
        ) as HTMLInputElement | null;

        return el?.value?.trim() || "";
      });

      if (token.length > 0) {
        return true;
      }

      if (ele) {
        const b = await has(page, ele);
        if (b) {
          logger.success(`找到自定义元素 ${ele}，人机验证通过`);
          return true;
        }
      }
    } catch (err) {
      console.warn(
        `尝试检查 hCaptcha 状态时出错（第 ${attempt + 1} 次）:`,
        err,
      );
    }

    await sleep(interval);
  }

  console.warn("⏰ 超过最大等待时间，hCaptcha 仍未验证通过");
  return false;
}

export async function waitForRecaptcha(
  page: Page,
  timeout = 90_000,
  interval = 1000,
  ele = "",
) {
  logger.loading("请等待手动完成 reCAPTCHA 验证...");

  const maxAttempts = Math.floor(timeout / interval);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const token = await page.evaluate(() => {
        const selectors = [
          "#g-recaptcha-response",
          // '[name="g-recaptcha-response"]',
          // 'textarea[name*="recaptcha"]',
          // '[id*="recaptcha-response"]',
        ];
        const el = document.querySelector(
          selectors.join(", "),
        ) as HTMLInputElement | null;
        return el?.value?.trim() || "";
      });

      if (token.length > 0) {
        logger.success("人机验证通过");
        return true;
      }

      if (ele) {
        const b = await has(page, ele);
        if (b) {
          logger.success(`找到自定义元素 ${ele}，人机验证通过`);
          return true;
        }
      }
    } catch (err) {
      console.warn(
        `尝试检查 reCAPTCHA 状态时出错（第 ${attempt + 1} 次）:`,
        err,
      );
    }

    await sleep(interval);
  }

  console.warn("⏰ 超过最大等待时间，reCAPTCHA 仍未验证通过");
  return false;
}
