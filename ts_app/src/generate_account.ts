import { MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { Base } from "./app";

export class GenerateAccount extends Base {
  public table: MySqlTable<TableConfig>;
}
