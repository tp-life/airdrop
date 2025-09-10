import {
  mysqlTable,
  serial,
  varchar,
  int,
  boolean,
  datetime,
} from "drizzle-orm/mysql-core";
import { Account } from "./base_models";

export const DCTable = mysqlTable(`dc_token`, {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 100 }),
  account: varchar("account", { length: 100 }),
  projects: varchar("projects", { length: 200 }),
  isBlocked: boolean("is_blocked"),
  locked_at: datetime("locked_at"),
});
export type DCAccount = Account<typeof DCTable>;
