import { MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { Base } from "./app";
import { EVMAccount, EVMAccountTable } from "../schema/evm_account";
import { sql } from "drizzle-orm";
import { N1Account, N1Table } from "../schema/n1";
import { Register } from "../register/decorators";

@Register("faucet")
export class Faucet extends Base {
  public table: MySqlTable<TableConfig> = N1Table;

  get headers() {
    return {
      accept: "*/*",
      "accept-language": "zh-CN,zh;q=0.5",
      "content-type": "application/json",
      origin: "https://faucet.1money.network",
      priority: "u=1, i",
      referer: "https://faucet.1money.network/",
      "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      "x-content-type-options": "nosniff",
      "x-requested-with": "XMLHttpRequest",
    };
  }

  async run() {
    const account = await this.getAccount<N1Account>({
      where: sql`faucet_money = 0`,
    });

    let data = JSON.stringify({
      address: account.addr,
    });
    const url = "https://faucet.1money.network/api/token/mint";

    const res = await this.request<{ code: number }>("post", url, data);
    console.log(res);
    if (res.code === 0) {
      await this.updateAccountByID({ faucet_money: 1 }, account.id);
    }
  }
}
