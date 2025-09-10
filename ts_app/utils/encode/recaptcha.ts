import { HttpClient } from "../http"; //
import * as base64 from "base-64";

interface SolverConfig {
  siteKey: string;
  siteUrl: string;
  userAgent?: string;
  grecaptchaCookie?: string | null;
  cbValue?: string;
  proxy?: string | null;
}

export async function solveCaptcha({
  siteKey,
  siteUrl,
  userAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  cbValue = "phia893uehwb",
  proxy = null,
}: SolverConfig): Promise<{ token: string; time: string }> {
  const startTime = Date.now();
  const client = new HttpClient({
    proxy: proxy || undefined,
    headers: {
      "user-agent": userAgent,
    },
    retry: { retries: 3, retryDelay: 1000 },
  });

  // 1. 获取 renderUrl
  const siteHtml = (await client.get<string>(siteUrl)).data;
  let renderUrl: string;
  const match = siteHtml.match(
    /['"](https:\/\/www\.[^/]+\/recaptcha\/[^'"]+)['"]/,
  );
  if (match) {
    renderUrl = match[1];
  } else {
    const staticV = "i7X0JrnYWy9Y_5EYdoFM79kV";
    renderUrl = `https://www.google.com/recaptcha/${staticV}/recaptcha__en.js`;
  }

  // 2. 获取版本 v 和 api
  const r = (await client.get<string>(renderUrl)).data;
  let v: string, api: string;
  const srcMatch = r.match(/po\.src\s*=\s*'(https:\/\/[^\']+)';/);
  if (srcMatch) {
    v = srcMatch[1].split("/")[5];
    api = renderUrl.split(".js")[0];
    const parts = api.split("/");
    if (!parts.includes("api2") && !parts.includes("enterprise")) {
      api += "2";
    }
  } else {
    v = renderUrl.split("/")[5];
    api = "https://www.google.com/recaptcha/api2";
  }

  // 3. 获取 co 值
  const parts = siteUrl.split("/");
  const base = parts.length > 2 ? `https://${parts[2]}` : siteUrl;
  const urlPort = base + ":443";
  const co = base64.encode(urlPort).replace(/=/g, ".");

  // 4. 获取 recaptcha-token
  const anchorParams: Record<string, string> = {
    ar: "1",
    k: siteKey,
    co,
    hl: "en",
    v,
    sa: "action",
    size: "invisible",
    cb: cbValue,
  };
  const anchor = (
    await client.get<string>(`${api}/anchor`, {
      params: anchorParams,
      headers: {
        referer: siteUrl + "/",
        "user-agent": userAgent,
      },
    })
  ).data;
  console.log(anchor, "#####");
  const anchorUrl =
    `${api}/anchor` +
    Object.entries(anchorParams)
      .map(([k, v]) => `&${k}=${v}`)
      .join("");
  const recaptchaToken = anchor
    .split('recaptcha-token" value="')[1]
    .split('">')[0];

  // 5. 请求 reload
  const reloadParams: Record<string, string> = {
    v,
    co,
    reason: "q",
    size: "invisible",
    hl: "en",
    k: siteKey,
    c: recaptchaToken,
    chr: "%5B61%2C36%2C84%5D",
    vh: "13599012192",
    bg: "",
  };
  const reload = (
    await client.post<string>(
      `${api}/reload?k=${siteKey}`,
      new URLSearchParams(reloadParams),
      {
        headers: {
          referer: anchorUrl,
          "user-agent": userAgent,
        },
      },
    )
  ).data;
  const rrespToken = reload.split('"rresp","')[1].split('"')[0];

  return {
    token: rrespToken,
    time: ((Date.now() - startTime) / 1000).toFixed(3),
  };
}
