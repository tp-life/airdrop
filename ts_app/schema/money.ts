import { boolean, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { Account, baseColumnsV2 } from "./base_models";

export const MoneyTable = mysqlTable(`money`, {
  ...baseColumnsV2(),
  email: varchar("email", { length: 255 }),
  email_password: varchar("email_password", { length: 255 }),
  register: boolean("register"),
});

export type MoneyAccount = Account<typeof MoneyTable>;
