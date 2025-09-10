import path from "path";
import { ABI_DIR } from "../../config";
import { readFileSync } from "fs";
import { EvmWallet } from "./evm";
import { SEPOLIA_RPC } from "../../config/rpc";
import logger from "../../infrastructure/logger";
import { ethers } from "ethers";
import { HttpClient } from "../http";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { TransactionsResponse } from "../../types/super_bridge";

async function sha256(data: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const bytes = enc.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(hashBuffer);
}

function base64Url(bytes: Uint8Array): string {
  let str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// 统计前导零比特数
function countLeadingZeros(bytes: Uint8Array): number {
  let bits = 0;
  for (const b of bytes) {
    if (b === 0) {
      bits += 8;
      continue;
    }
    for (let j = 7; j >= 0; j--) {
      if (((b >> j) & 1) === 0) bits++;
      else return bits;
    }
    return bits;
  }
  return bits;
}

interface ProofOfWorkResult {
  nonce: number;
  hash: string;
}

/**
 * 简易 PoW 算法
 * @param {number} ts 时间戳（毫秒）
 * @param {number} difficulty 需要的前导零比特数
 */
async function proofOfWork(
  ts: number,
  difficulty: number,
): Promise<ProofOfWorkResult> {
  const prefix = String(ts) + ":";
  let nonce = 0;

  while (true) {
    const message = prefix + nonce;
    const hash = await sha256(message);

    if (countLeadingZeros(hash) >= difficulty) {
      return {
        nonce,
        hash: base64Url(hash),
      };
    }

    nonce++;

    // 避免卡死主线程（浏览器下）
    if ((nonce & 0x3fff) === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }
}

export class SuperBridge {
  private abi = JSON.parse(
    readFileSync(path.join(ABI_DIR, "superbridge.json"), "utf8"),
  );
  private httClient: HttpClient = null;

  get headers() {
    return {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9",
      "if-none-match": 'W/"1a-yjqXTzxRN5aZoNI0DW8mf56Cuk8"',
      origin: "https://odyssey-fba0638ec5f46615.testnets.rollbridge.app",
      priority: "u=1, i",
      referer: "https://odyssey-fba0638ec5f46615.testnets.rollbridge.app/",
      "sec-ch-ua":
        '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    };
  }

  get client() {
    if (!this.httClient) {
      this.httClient = new HttpClient({
        timeout: 30_000,
        proxy: this.ip,
      });
    }
    return this.httClient;
  }

  constructor(
    private contract: string,
    private addr: string,
    private pk: string,
    private ip: string = "",
  ) {}

  async b2bs(amt: string, rpc = SEPOLIA_RPC): Promise<string> {
    const wallet = new EvmWallet(rpc, {
      privateKey: this.pk,
      gasBumpPercent: 15, // gasLimit +15%
      priorityBumpPercent: 30, // 小费 +30%
      gasExtra: 5000n,
    });
    const tx = await wallet.callWithAbi(
      this.contract,
      this.abi,
      "bridgeETHTo",
      [this.addr, 200000, "0x7375706572627269646765"],
      ethers.parseEther(amt),
    );

    if (!tx) {
      logger.error(`bridgeETHTo failed`);
      return "";
    }
    return tx.hash;
  }

  async opFinalise(id: string) {
    const url = "https://api.superbridge.app/api/bridge/op_finalise";
    let data = JSON.stringify({ id });
    const res = await this.bizRequest("post", url, data);
    if (!res) {
      throw new Error(`opFinalise failed`);
    }
    return res;
  }

  async queryActivity(deploymentId: string, evmAddress: string) {
    const url = "https://api.superbridge.app/api/v6/bridge/activity";
    let data = JSON.stringify({
      id: {
        deploymentId,
      },
      evmAddress,
      cursor: null,
      filters: {},
      multichainTokens: [],
    });
    const res = await this.bizRequest<TransactionsResponse>("post", url, data);
    if (!res) {
      throw new Error(`queryActivity failed`);
    }
    return res;
  }

  async getPow() {
    const url = "https://api.superbridge.app/api/v1/pow";
    const res = await this.request<{ bits: number; window: number }>(
      "get",
      url,
    );
    if (!res) {
      return { bits: 10, window: 1000 };
    }
    return res;
  }

  async bizRequest<T>(
    method: "get" | "post" | "put",
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    stopFn?: (data: AxiosResponse) => boolean,
  ): Promise<T> {
    const pow = await this.getPow();
    const cfg = config ?? { headers: this.headers };
    if (!cfg?.headers) {
      cfg.headers = this.headers;
    }

    let ts = Date.now(),
      a = Math.floor(ts / pow.window) * pow.window;
    console.log(a);
    const result = await proofOfWork(a, pow.bits);
    cfg.headers = {
      ...cfg.headers,
      "x-pow-hash": result.hash,
      "x-pow-nonce": `${result.nonce}`,
      "x-pow-ts": `${a}`,
    };

    return this.request(method, url, data, config, stopFn);
  }

  async request<T>(
    method: "get" | "post" | "put",
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    stopFn?: (data: AxiosResponse) => boolean,
  ): Promise<T> {
    const cfg = config ?? { headers: this.headers };

    if (!cfg?.headers) {
      cfg.headers = this.headers;
    }

    try {
      let res;
      if (method == "get") {
        res = await this.httClient.get<T>(url, cfg, stopFn);
      }

      if (method == "post") {
        res = await this.httClient.post<T>(url, data, cfg, stopFn);
      }

      if (method == "put") {
        res = await this.httClient.put<T>(url, data, cfg, stopFn);
      }

      return res.data;
    } catch (err) {
      const errorMsg = err.response
        ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data || {})}`
        : err.message;
      logger.error(
        `${method}: ${url} ->-> 请求失败: ${errorMsg} . data ： ${JSON.stringify(data)}, config : ${JSON.stringify(cfg)}`,
      );
    }
    return null;
  }
}
