import { sql } from "drizzle-orm";
import { Base } from "./app";
import { ethers } from "ethers";
import { ETH_RPC } from "../config/rpc";
import { MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { EVMAccount, EVMAccountTable } from "../schema/evm_account";
import logger from "../infrastructure/logger";
import { Register } from "../register/decorators";

@Register("evm")
export class EVMAccounts extends Base {
  public table: MySqlTable<TableConfig> = EVMAccountTable;
  apiKey = "WEQTT3M2CEYM2A2B19B6GG9ENUTCUF2ADD";

  async run() {
    if (this.param == "tx") {
      await this.queryTxTotal();
      return;
    }
  }

  async queryTxTotal() {
    const account = await this.getAccount<EVMAccount>({
      // where: sql`id = 2945`,
      where: sql`tx_count = 0`,
    });

    const provider = new ethers.JsonRpcProvider(ETH_RPC);

    // const address = "0xA6ef0D999A75312F29C3b86dc03DF9a31716fFA8";
    const address = account.address;
    const txCount = await provider.getTransactionCount(address);
    logger.info(`该地址的外发交易次数: ${txCount}`);
    if (txCount > 0) {
      await this.updateAccount({ tx_count: txCount }, sql`id = ${account.id}`);
    }
  }

  async getTotalInteractions(address: string) {
    const res = await this.request<{
      result: any[];
      status: string;
      message: string;
    }>(
      "get",
      `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&startblock=0&address=${address}&endblock=99999999&apikey=${this.apiKey}`,
    );

    if (res.status !== "1") {
      console.error("获取失败:", res.message);
      return;
    }

    const txs = res.result;
    console.log(`总交互次数（发送 + 接收）: ${txs.length}`);
    return txs.length;
  }
}
