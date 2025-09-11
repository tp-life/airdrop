import { decimal, MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { ITHACA_RPC } from "../config/rpc";
import { Register } from "../register/decorators";
import { Account, tableFactor } from "../schema/base_models";
import { SuperBridge } from "../utils/onchain/super_bridge";
import { Base } from "./app";
import { sql } from "drizzle-orm";

const IthacaTable = tableFactor("ithaca_bridge", {
  amt: decimal("amt", { precision: 10, scale: 6 }),
  l2: decimal("l2", { precision: 10, scale: 6 }),
});

type IthacaAccount = Account<typeof IthacaTable>;

@Register("ithaca")
export class Ithaca extends Base {
  private l2Contract = "0x4200000000000000000000000000000000000010";
  private bridgeContract = "0x9228665c0D8f9Fc36843572bE50B716B81e042BA";
  public table: MySqlTable<TableConfig> = IthacaTable;

  async run() {
    await this.toL2();
  }

  async l2eth(addr: string, pk: string) {
    const br = new SuperBridge(this.l2Contract, addr, pk);
    const s = await br.b2bs("0.09", ITHACA_RPC);
    console.log(s);
  }

  async toL2() {
    let q = sql`completed = 0 `;
    const account = await this.getAccount<IthacaAccount>({ where: q });
    const br = new SuperBridge(this.bridgeContract, account.addr, this.pk);
    const s = await br.b2bs("0.01");
    if (s) {
      await this.updateAccountByID({ completed: 1, l2: 0.01 }, account.id);
    }
  }
}
