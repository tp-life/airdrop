import {
  mysqlTable,
  serial,
  varchar,
  int,
  boolean,
  datetime,
} from "drizzle-orm/mysql-core";
import { InferSelectModel } from "drizzle-orm";

export const TwitterTable = mysqlTable(`twitter_tokens`, {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 100 }),
  username: varchar("username", { length: 100 }),
  projects: varchar("projects", { length: 200 }),
  isBlocked: boolean("is_blocked"),
  locked_at: datetime("locked_at"),
  // ip: varchar("ip", { length: 200 }),
});
export type TwitterAccount = InferSelectModel<typeof TwitterTable>;
