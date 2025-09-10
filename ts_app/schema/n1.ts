import {
  bigint,
  datetime,
  decimal,
  int,
  mysqlTable,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";
import { baseColumns } from "./base_models";
import { InferSelectModel } from "drizzle-orm";

export const N1Table = mysqlTable(`n1`, {
  ...baseColumns(),
  addr: varchar("addr", { length: 256 }),
  pk: varchar("pk", { length: 256 }),
  amt: decimal("amt"),
  points: decimal("points"),
  rank: int("rank"),
  referralCode: varchar("referral_code", { length: 256 }),
  referral_locked: datetime("referral_locked"),
  fromReferralCode: varchar("from_referral_code", { length: 256 }),
  referralToal: int("referral_total"),
  daliyAt: datetime("daliy_at"),
  userID: int("user_id"),
  referralFlag: tinyint("referral_flag"),
  faucet: datetime("faucet"),
  xToken: varchar("x_token", { length: 256 }),
});

export type N1Account = InferSelectModel<typeof N1Table>;
