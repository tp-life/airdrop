import {
  boolean,
  datetime,
  decimal,
  int,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";
import { baseColumns } from "./base_models";
import { InferSelectModel } from "drizzle-orm";

export const D3Table = mysqlTable(`d3`, {
  ...baseColumns(),
  addr: varchar("addr", { length: 256 }),
  pk: varchar("pk", { length: 256 }),
  email: varchar("email", { length: 256 }),
  emailPass: varchar("email_pass", { length: 256 }),
  referralCode: varchar("referral_code", { length: 256 }),
  referralLocked: datetime("referral_locked"),
  fromReferralCode: varchar("from_referral_code", { length: 256 }),
  referralTotal: int("referral_total"),
  domain: varchar("domain", { length: 256 }),
  isRegistered: boolean("is_registered"),
  amt: decimal("amt", { precision: 10, scale: 6 }),
});

export type D3Account = InferSelectModel<typeof D3Table>;
