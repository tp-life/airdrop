import {
  mysqlTable,
  serial,
  varchar,
  int,
  boolean,
} from "drizzle-orm/mysql-core";
import { InferSelectModel } from "drizzle-orm";

export const EmailTable = mysqlTable(`emails`, {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 100 }),
  password: varchar("password", { length: 100 }),
  projects: varchar("projects", { length: 200 }),
  isBlocked: boolean("is_blocked"),
  locked_at: int("locked_at"),
});
export type EmailAccount = InferSelectModel<typeof EmailTable>;
