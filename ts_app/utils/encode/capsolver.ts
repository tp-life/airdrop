import { Solver } from "capsolver-npm/src";
import config from "../../config";
import logger from "../../infrastructure/logger";

export const recaptchav2 = async (params: {
  pageurl: string;
  siteKey: string;
}) => {
  const keys = config.app.captcha_solver;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const solver = new Solver({ apiKey: key });
      const result = await solver.recaptchav2proxyless({
        websiteURL: params.pageurl,
        websiteKey: params.siteKey,
      });
      if (result.gRecaptchaResponse) {
        return result.gRecaptchaResponse;
      }
    } catch (e) {
      logger.error("获取 CF token 失败，失败原因：" + e.message);
    }
  }
  return "";
};
