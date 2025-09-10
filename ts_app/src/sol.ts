import {
  mysqlTable,
  MySqlTable,
  TableConfig,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";
import { Account, baseColumns } from "../schema/base_models";
import { Base } from "./app";
import { sql } from "drizzle-orm";
import { Solana } from "../utils/onchain/sol";
import { Register } from "../register/decorators";
import logger from "../infrastructure/logger";

const PUMFUN = mysqlTable(`pump_fun`, {
  ...baseColumns(),
  address: varchar("address", { length: 256 }),
  private_key: varchar("private_key", { length: 256 }),
  finished: tinyint("finished"),
});

type PUMFUNAccount = Account<typeof PUMFUN>;

@Register("sol")
export class Sol extends Base {
  public table: MySqlTable<TableConfig> = PUMFUN;

  async run() {
    let q = sql`register =1 AND finished = 0`;
    const account = await this.getAccount<PUMFUNAccount>({
      where: q,
    });
    const wallet = new Solana(account.private_key);

    const amt = await wallet.getSOLBalanceByAddress(account.address);
    if (amt < 0.001) {
      await this.updateAccount({ finished: 2 }, sql`id = ${account.id}`);
      logger.error(`Insufficient SOL balance for account ${account.id}`);
      return;
    }

    let tx = await wallet.closeEmptySPLTokenAccounts(account.private_key);
    if (tx.err) {
      logger.error(
        `Error closing SPL token accounts for account ${account.id}: ${tx.err}`,
      );
      return;
    }

    tx = await wallet.transferAllSOL(
      null,
      "Bt6bJiHdgwYK3z6DF6AuFPTHZ7y2pJyU84uJU5Ztping",
    );
    if (tx.err) {
      logger.error(
        `Error transferring all SOL for account ${account.id}: ${tx.err}`,
      );
      return;
    }

    await this.updateAccount({ finished: 1 }, sql`id = ${account.id}`);
  }
}
