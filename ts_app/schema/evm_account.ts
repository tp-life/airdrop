import {
  bigint,
  datetime,
  decimal,
  int,
  mysqlTable,
  serial,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";
import { baseColumns } from "./base_models";
import { InferSelectModel } from "drizzle-orm";

export const EVMAccountTable = mysqlTable(`evm_accounts`, {
  id: serial("id").primaryKey(),
  lockedAt: datetime("locked_at"),
  address: varchar("address", { length: 256 }),
  private_key: varchar("private_key", { length: 256 }),
  balance: decimal("balance"),
  tx_count: int("tx_count"),
});

export type EVMAccount = InferSelectModel<typeof EVMAccountTable>;
