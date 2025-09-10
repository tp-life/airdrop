import { int, mysqlTable, tinyint, varchar } from "drizzle-orm/mysql-core";
import { baseColumns } from "./base_models";
import { InferSelectModel } from "drizzle-orm";

export const MagicTable = mysqlTable(`magicnewton`, {
  ...baseColumns(),
  email: varchar("email", { length: 100 }),
  password: varchar("email_password", { length: 100 }),
  agent: tinyint("agent"),
  agentAddress: varchar("agent_address", { length: 256 }),
  amt: int("amt"),
  bindWallet: tinyint("bind_wallet"),
  pk: varchar("pk", { length: 256 }),
});

export type MagicAccount = InferSelectModel<typeof MagicTable>;
