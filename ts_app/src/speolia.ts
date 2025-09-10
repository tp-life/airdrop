import {
  datetime,
  decimal,
  MySqlTable,
  mysqlTable,
  serial,
  TableConfig,
  varchar,
} from "drizzle-orm/mysql-core";
import { Base } from "./app";
import { Account } from "../schema/base_models";
import { sql } from "drizzle-orm";
import { EvmWallet } from "../utils/onchain/evm";
import { SEPOLIA_RPC } from "../config/rpc";
import logger from "../infrastructure/logger";
import { Register } from "../register/decorators";

const speoliaTable = mysqlTable("sepolia", {
  id: serial("id").primaryKey(),
  locked_at: datetime("locked_at"),
  address: varchar("address", { length: 255 }),
  private_key: varchar("private_key", { length: 255 }),
  from_id: serial("from_id"),
  amt: decimal("amt"),
});

type SpeoliaAccount = Account<typeof speoliaTable>;

@Register("speolia")
export class Speolia extends Base {
  public table: MySqlTable<TableConfig> = speoliaTable;

  async run() {
    const to = await this.getTo();
    let w = new EvmWallet(SEPOLIA_RPC, { privateKey: to.private_key });
    const _amt = await w.getBalance(to.address);
    if (Number(_amt) > 0) {
      return;
    }
    const from = await this.getFrom(to.from_id);
    const wallet = new EvmWallet(SEPOLIA_RPC, { privateKey: from.private_key });
    const amt = await wallet.getBalance(from.address);
    if (Number(amt) <= 0.2) {
      logger.error("Insufficient balance");
      await this.updateAccountByID({ amt: amt }, from.id);
      return;
    }
    if (!to.from_id) {
      await this.updateAccountByID({ from_id: from.id }, to.id);
    }

    await wallet.sendNative(to.address, "0.2");

    const fAmt = await wallet.getBalance(from.address);
    if (Number(fAmt) > 0) {
      await this.updateAccountByID({ amt: fAmt }, from.id);
    }
    const tAmt = await wallet.getBalance(to.address);
    if (Number(tAmt) > 0) {
      await this.updateAccountByID({ amt: tAmt }, to.id);
    }
  }

  async getFrom(id = 0) {
    let q = sql`amt > 0.2 and from_id = 0`;
    if (id) {
      q = sql`amt > 0.2 and from_id = 0 and id = ${id}`;
    }
    const account = await this.getAccount<SpeoliaAccount>({
      where: q,
      hasIP: false,
      lockTime: 5,
    });
    return account;
  }

  async getTo() {
    let q = sql`amt = 0`;
    const account = await this.getAccount<SpeoliaAccount>({
      where: q,
      hasIP: false,
    });
    return account;
  }
}
