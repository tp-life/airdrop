import { MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { Register } from "../register/decorators";
import { Base } from "./app";
import { Account, tableFactor } from "../schema/base_models";

const RialoTable = tableFactor("rialo");

type RialoAccount = Account<typeof RialoTable>;

@Register("rialo")
export class Rialo extends Base {
  public table: MySqlTable<TableConfig>;

  async run() {}
}
