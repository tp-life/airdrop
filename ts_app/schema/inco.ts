import {
  boolean,
  datetime,
  decimal,
  int,
  mysqlTable,
} from "drizzle-orm/mysql-core";
import { Account, baseColumnsV2 } from "./base_models";

export const IncoTable = mysqlTable(`inco`, {
  ...baseColumnsV2(),
  usdc: decimal("usdc"),
  task_flag: int("task_flag"),
  amount: decimal("amount"),
  cross_flag: boolean("cross_flag"),
  eth: decimal("eth"),
  wrap: decimal("wrap"),
  un_wrap: decimal("un_wrap"),
  next_time: datetime("next_time"),
});

export type IncoAccount = Account<typeof IncoTable>;
