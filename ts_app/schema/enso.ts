import {
  mysqlTable,
  varchar,
  text,
  int,
  decimal,
  datetime,
  tinyint,
} from "drizzle-orm/mysql-core";
import { InferSelectModel } from "drizzle-orm";
import { baseColumns } from "./base_models";

export const EnsoTable = mysqlTable(`osne`, {
  ...baseColumns(),
  addr: varchar("addr", { length: 100 }),
  pk: varchar("pk", { length: 100 }),
  email: varchar("email", { length: 100 }),
  password: varchar("email_pass", { length: 100 }),
  zealyUserID: varchar("zealy_user_id", { length: 100 }),
  isRegisterZealy: tinyint("is_register_zealy"),
  isBindZealy: tinyint("is_bind_zealy"),
  runDex: tinyint("run_dex"),
  zealyCookies: text("zealy_cookies"),
  points: decimal("points"),
  rank: int("rank"),
  daliy_at: datetime("daliy_at"),
});

export type EnsoAccount = InferSelectModel<typeof EnsoTable>;
