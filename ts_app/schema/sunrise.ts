import {
  boolean,
  datetime,
  decimal,
  mysqlTable,
  serial,
  varchar,
} from "drizzle-orm/mysql-core";
import { InferSelectModel } from "drizzle-orm";

export const SunriseTable = mysqlTable(`sunrise`, {
  id: serial("id").primaryKey(),
  addr: varchar("Address", { length: 256 }),
  pk: varchar("Private", { length: 256 }),
  mnemonic: varchar("Mnemonic", { length: 256 }),
  kyc_address: varchar("kyc_address", { length: 256 }),
  kyc_private: varchar("kyc_private", { length: 256 }),
  coins: decimal("coins"),
  is_registered: boolean("is_registered"),
  lockedAt: datetime("locked_at"),
});

export type SunriseAccount = InferSelectModel<typeof SunriseTable>;
