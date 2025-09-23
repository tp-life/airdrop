import axios from "axios";
import logger from "../infrastructure/logger";
import { HttpProxyAgent } from "http-proxy-agent";
import config, { ENV_DEV } from "../config";
import https from "https";

interface ApiResponse {
  error: {
    code: number;
    message: string;
  };
  flag: string;
  host: string;
  port: number;
  memo: string;
}

export interface ProxyIP {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

async function getRandProxyIP(area?: string): Promise<ProxyIP> {
  // let h = false;
  // if (config.app.debug) {
  //   h = config.app.debug;
  // }
  const instance = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false, // ❌ 不验证 SSL 证书
    }),
  });
  for (let i = 0; i < 10; i++) {
    try {
      const url = `${config.app.ip_url}?area=${area}`;
      const response = await instance.get<ApiResponse>(url);
      let { host, port } = response.data;

      if (!!process.env.PROXY_HOST) {
        host = process.env.PROXY_HOST;
      }

      try {
        const agent = new HttpProxyAgent(`http://${host}:${port}`);
        const start = performance.now();
        await axios.get("http://www.gstatic.com/generate_204", {
          timeout: 5000,
          httpAgent: agent,
          httpsAgent: agent,
        });
        logger.info(
          `经测试,IP[${host}:${port}]可用,耗时:${performance.now() - start}ms`,
        );
        return { host: host, port: port };
      } catch (e) {
        logger.warn(`检测到代理IP[${host}:${port}]不可用:${e}`);
      }
    } catch (e) {
      logger.error(`😱 不能获取到IP:${e}`);
    }
  }
  return { host: "", port: 0 };
}

interface ProxyByUser {
  success: boolean;
  data: ProxyIP;
}

async function getRandProxyIPByUserName(area?: string): Promise<ProxyIP> {
  for (let i = 0; i < 10; i++) {
    try {
      const url = `${config.app.ip_url}?region=${area}`;
      const response = await axios.get<ProxyByUser>(url);

      if (!response.data.success) {
        logger.error("获取代理IP地址错误");
        continue;
      }
      const { host, port, username, password } = response.data.data;

      try {
        const agent = new HttpProxyAgent(
          `http://${username}:${password}@${host}:${port}`,
        );
        const start = performance.now();
        await axios.get("http://www.gstatic.com/generate_204", {
          timeout: 5000,
          httpAgent: agent,
          httpsAgent: agent,
        });
        logger.info(
          `经测试,IP[${host}:${port}]可用,耗时:${performance.now() - start}ms`,
        );
        return response.data.data;
      } catch (e) {
        logger.warn(`检测到代理IP[${host}:${port}]不可用:${e}`);
      }
    } catch (e) {
      logger.error(`😱 不能获取到IP:${e}`);
    }
  }
  return { host: "", port: 0 };
}

export async function randProxyIP(area?: string): Promise<ProxyIP> {
  if (area == undefined) {
    area = "";
  }

  if (config.app.debug && config.app.debug_proxy) {
    const parsed = new URL(config.app.debug_proxy);
    const port = parsed.port || (parsed.protocol === "https:" ? 443 : 80);

    return {
      host: parsed.hostname,
      port: Number(port),
    };
  }

  let fn = getRandProxyIP;

  if (process.env.NODE_ENV === ENV_DEV) {
    fn = getRandProxyIPByUserName;
  }

  const fetchPromises: Promise<ProxyIP>[] = Array.from({ length: 1 }, () =>
    fn(area),
  );
  try {
    const firstResp = await Promise.race(fetchPromises);
    if (!!process.env.PROXY_HOST) {
      firstResp.host = process.env.PROXY_HOST;
    }
    return firstResp;
  } catch (e) {}
  return { host: "", port: 0 };
}
