import { Solver } from "@2captcha/captcha-solver";
import config from "../../config";
import logger from "../../infrastructure/logger";

export async function cf(params: { pageurl: string; siteKey: string }) {
  const keys = config.app.twoCaptcha_keys;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const solver = new Solver(key);
      const result = await solver.cloudflareTurnstile({
        pageurl: params.pageurl,
        sitekey: params.siteKey,
      });
      if (result.data) {
        return result.data;
      }
    } catch (e) {
      logger.error("获取 CF token 失败，失败原因：" + e.message);
    }
  }
  return "";
}

export async function recaptcha(params: { pageurl: string; siteKey: string }) {
  const keys = config.app.twoCaptcha_keys;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const solver = new Solver(key);
      const result = await solver.recaptcha({
        pageurl: params.pageurl,
        googlekey: params.siteKey,
      });
      if (result.data) {
        return result.data;
      }
    } catch (e) {
      logger.error("获取 CF token 失败，失败原因：" + e.message);
    }
  }
  return "";
}
