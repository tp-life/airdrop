import {
  boolean,
  datetime,
  decimal,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";
import { Account, baseColumnsV2 } from "./base_models";

export const SapienTable = mysqlTable(`sapien`, {
  ...baseColumnsV2(),
  points: decimal("points"),
  under_points: decimal("under_points"),
  daily_at: datetime("daily_at"),
  x_token: varchar("x_token", { length: 255 }),
  dc_token: varchar("dc_token", { length: 255 }),
  is_bind_social: boolean("is_bind_social"),
  email: varchar("email", { length: 256 }),
  email_password: varchar("email_password", { length: 256 }),
});

export type SapienAccount = Account<typeof SapienTable>;
