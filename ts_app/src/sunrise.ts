import { MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { Base } from "./app";
import { SunriseAccount, SunriseTable } from "../schema/sunrise";
import { keplr, metamask } from "../config/ext";
import { Wallet } from "../utils/wallet/wallet";
import { getTypeByExt } from "../utils/wallet/config";
import { BrowserManage } from "../utils/browser";
import { sql } from "drizzle-orm";
import { Register } from "../register/decorators";
import logger from "../infrastructure/logger";
import {
  click,
  executeSteps,
  has,
  hs,
  scrollOverflowElement,
  wait,
} from "../utils/browser/page";
import {
  importWallet as importKeplr,
  doSomething as keplrDoSomething,
} from "../utils/wallet/keplr";
import { sleep } from "../utils/help";
import { importWallet, walletDoSomething } from "../utils/wallet/metamask";
import { signMessageWithPrivateKey } from "../utils/onchain/help";
import { Secp256k1 } from "@cosmjs/crypto";
import { toBase64 } from "@cosmjs/encoding";

@Register("sunrise")
export class Sunrise extends Base {
  public table = SunriseTable;
  private walletPlugs = keplr;

  async openPage(account: SunriseAccount) {
    const exts = [this.walletPlugs, metamask];

    this.browser = new BrowserManage(
      this.userDataDir(`sunrise_${account.id}`),
      exts,
      this.ip,
    );
    const page = await this.browser.open({
      url: "https://airdrop.sunriselayer.io/flow",
    });
    if (!page) {
      return null;
    }

    await importKeplr(this.browser.browser, account.pk);
    await sleep(3_000);
    await importWallet(this.browser.browser, account.kyc_private);

    await page.reload({ waitUntil: "networkidle2" });

    return page;
  }

  async run() {
    let amt = 10;
    const a = Number(this.args["arg"]);

    amt = a || amt;

    const q = sql`coins >0 AND is_registered =0 AND (locked_at is null OR locked_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE))`;
    // const q = sql`id = 4187`;
    const account = await this.getAccount<SunriseAccount>({ where: q });

    // await this.query(account);
    await this.createRegister(account);
    return;
  }

  async front(account: SunriseAccount) {
    const page = await this.openPage(account);
    if (!page) return;

    // await click(page, '//p[text()="Connect Keplr Wallet"]');

    const step1 = [
      hs("click", '//p[text()="Connect Keplr Wallet"]'),
      hs("click", `//span[text()="Keplr"]`),
    ];

    await executeSteps(page, step1);
    await sleep(3_000);
    await keplrDoSomething(this.browser.browser, 2);
    await wait(page, `//button[text()="Disconnect Keplr Wallet"]`);

    const step2 = [
      hs("click", `//p[text()="Connect Wallet"]`),
      hs("click", `//div[text()="MetaMask"]`),
    ];
    await executeSteps(page, step2);
    await sleep(3_000);
    await walletDoSomething(this.browser.browser, 2);
    await wait(page, `//button[text()="Disconnect EVM Wallet"]`);

    await click(page, '//button[text()="Next"]');
    await sleep(2_000);
    for (let i = 0; i < 5; i++) {
      await click(page, `//button[text()="Register to airdrop"]`);
      await sleep(1_000);
      await scrollOverflowElement(page);
      await sleep(1_000);
      await click(page, `//button[text()="Accept"]`);
      await sleep(1_000);
      await keplrDoSomething(this.browser.browser, 2);
      await sleep(1_000);
      if (!(await has(page, `//button[text()="Register to airdrop"]`))) {
        break;
      }
      await sleep(1_000);
    }

    if (await has(page, `//button[text()="Register to airdrop"]`)) {
      return;
    }
    await this.updateAccount({ is_registered: 1 }, sql`id=${account.id}`);
  }

  async query(account: SunriseAccount) {
    const url = `https://airdrop.sunriselayer.io/api/register/allocation?cosmosAddresses=${account.addr}&evmAddress=${account.kyc_address}`;
    const info = await this.request<{ allocation: string }>("get", url);
    if (!info) {
      logger.error("未获取到指定的用户信息");
      return;
    }

    const allocation = info.allocation;

    // 处理分配信息
    console.log(`用户 ${account.id} 的分配信息为：${allocation}`);
    await this.updateAccount(
      { coins: Number(allocation) },
      sql`id = ${account.id}`,
    );
  }

  async createRegister(account: SunriseAccount) {
    if (await this.checkRegister(account)) {
      await this.updateAccount({ is_registered: 1 }, sql`id=${account.id}`);
    }

    const url = "https://airdrop.sunriselayer.io/api/register";

    const header = {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9",
      "clq-app-id": "sunrise",
      "content-type": "application/json",
      origin: "https://airdrop.sunriselayer.io",
      priority: "u=1, i",
      referer: "https://airdrop.sunriselayer.io/flow",
      "request-id": "|a021c2834fa04cbfa742b351caabf6fb.7b4251888aae4697",
      "sec-ch-ua":
        '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      traceparent: "00-a021c2834fa04cbfa742b351caabf6fb-7b4251888aae4697-01",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    };

    const payload = {
      walletCosmos: await this.signByKeplr(account),
      walletEVM: await this.signByEVM(account),
    };

    const res = await this.request<{ walletCosmos: string; walletEVM: string }>(
      "post",
      url,
      payload,
      { headers: header },
    );

    if (!res) {
      logger.error("未获取到指定的用户信息");
      return;
    }

    if (await this.checkRegister(account)) {
      await this.updateAccount({ is_registered: 1 }, sql`id=${account.id}`);
    }
  }

  async checkRegister(account: SunriseAccount) {
    const header = {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9",
      "clq-app-id": "sunrise",
      "content-type": "application/json",
      origin: "https://airdrop.sunriselayer.io",
      priority: "u=1, i",
      referer: "https://airdrop.sunriselayer.io/flow",
      "request-id": "|a021c2834fa04cbfa742b351caabf6fb.7b4251888aae4697",
      "sec-ch-ua":
        '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      traceparent: "00-a021c2834fa04cbfa742b351caabf6fb-7b4251888aae4697-01",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    };
    const url = `https://airdrop.sunriselayer.io/api/register?address=${account.addr}`;
    const res = await this.request<{ isRegistered: boolean }>(
      "get",
      url,
      {},
      { headers: header },
    );
    if (!res) {
      logger.error("未获取到指定的用户信息");
      return false;
    }
    return res.isRegistered;
  }

  async signByEVM(account: SunriseAccount) {
    const message = `Welcome to Sunrise Airdrop!\nAddress: ${account.kyc_address.toLowerCase()}`;
    const sign = await signMessageWithPrivateKey(account.kyc_private, message);
    return {
      address: account.kyc_address,
      signature: sign,
      chainId: 1,
    };
  }

  async signByKeplr(account: SunriseAccount) {
    const url = `http://192.168.1.150:9010/Keplr?privateKey=${account.pk}&address=${account.addr}`;
    const res = await this.request("get", url);

    if (!res) {
      logger.error("签名信息错误");
      return;
    }
    const privKey = Uint8Array.from(Buffer.from(account.pk, "hex"));
    const { pubkey } = await Secp256k1.makeKeypair(privKey);
    const pubKeyCompressed = Secp256k1.compressPubkey(pubkey);
    const pubKeyBase64 = toBase64(pubKeyCompressed);
    return {
      address: account.addr,
      signature: res,
      pubKey: pubKeyBase64,
    };
  }
}
