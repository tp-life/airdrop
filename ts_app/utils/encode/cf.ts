import logger from "../../infrastructure/logger";
import { getRandomElement, sleep } from "../help";
import { HttpClient } from "../http";
import { cf } from "./2captcha";

export type QueryParam = {
  siteKey: string;
  url: string;
  proxy?: string;
};

export async function queryToken(
  param: QueryParam,
  kind: "self" | "solver" = "self",
) {
  if (kind === "self") {
    return await selfQuery(param);
  } else if (kind == "solver") {
    return await cf({ siteKey: param.siteKey, pageurl: param.url });
  }
}

async function selfQuery(param: QueryParam) {
  const host = [
    // "http://192.168.1.21:8000",
    // "http://192.168.1.23:8000",
    "http://192.168.1.24:8000",
    "http://192.168.1.25:8000",
  ];
  const url = "/api/turnstile";
  const uidPayload = {
    url: param.url,
    sitekey: param.siteKey,
    key: "168",
    proxy: param.proxy,
  };
  const headers = {
    "Content-Type": "application/json",
  };

  const baseURI = getRandomElement(host);
  const client = new HttpClient({ baseURL: baseURI });
  const uidResp = await client.post<{ uid: string }>(url, uidPayload, {
    headers: headers,
  });
  if (!uidResp || !uidResp?.data?.uid) {
    logger.error("获取 CF uid 失败");
    return "";
  }
  console.log("获取 CF uid 成功：", uidResp.data);
  const queryURL = `/api/turnstile/result/${uidResp?.data?.uid}`;

  for (let i = 0; i < 30; i++) {
    const queryResp = await client.get<{ token?: string; status: string }>(
      queryURL,
    );
    if (queryResp?.data?.status === "error") {
      console.log(queryResp);
      logger.error("获取 CF 结果失败");
      return "";
    }
    if (!queryResp?.data || !queryResp?.data?.token) {
      await sleep(2_000);
      continue;
    }

    if (queryResp?.data?.token) {
      return queryResp?.data?.token;
    }
  }
  logger.info("获取 CF token 失败");
  return "";
}
