import type { Browser } from "rebrowser-puppeteer-core";
import { click, disableNewPages, getText, input, newPage } from "./page";
import config from "../../config";
import { sleep } from "../help";

export const setCaptchaSolver = async (browser: Browser) => {
  const page = await newPage(
    browser,
    "chrome-extension://pgojnojmmhpofjgdmaebadhbocahppod/www/index.html#/popup",
  );

  const restore = disableNewPages(browser, page);
  try {
    for (const key of config.app.captcha_solver) {
      const inputSelector = 'input[placeholder="Please input your API key"]';
      const saveButtonXPath = '//span[contains(text(),"Balance")]';

      try {
        await page.waitForSelector(inputSelector, { timeout: 5000 });
        await input(page, inputSelector, key);

        await click(page, saveButtonXPath);
        await sleep(5_000);
        const amt = await getText(page, ".text-balance");

        if (Number(amt.replace("$", "")) > 0) {
          await page.close();
          return true;
        }

        await sleep(1000);
      } catch (err) {
        console.error("Error setting key:", key, err);
        await page.close();
        return false;
      }
    }
  } finally {
    restore();
  }
};
