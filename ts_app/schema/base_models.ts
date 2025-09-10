import { InferSelectModel, Table } from "drizzle-orm";
import {
  serial,
  timestamp,
  int,
  datetime,
  varchar,
  MySqlColumnBuilderBase,
  mysqlTable,
  tinyint,
  MySqlTable,
} from "drizzle-orm/mysql-core";

export const baseColumns = () => ({
  id: serial("id").primaryKey(),
  port: int("port").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  locked_at: datetime("locked_at"),
});

export const baseColumnsV2 = () => ({
  ...baseColumns(),
  addr: varchar("addr", { length: 256 }),
  pk: varchar("pk", { length: 256 }),
  referral_code: varchar("referral_code", { length: 256 }),
  referral_locked: datetime("referral_locked"),
  from_referral_code: varchar("from_referral_code", { length: 256 }),
  referral_total: int("referral_total"),
});

export type Account<T extends Table> = InferSelectModel<T>;

export const commonTable = () => ({
  ...baseColumnsV2(),
  x_token: varchar("x_token", { length: 255 }),
  dc_token: varchar("dc_token", { length: 255 }),
  email: varchar("email", { length: 256 }),
  email_pass: varchar("email_pass", { length: 256 }),
  completed: tinyint("completed"),
  points: int("points"),
  daliy_at: datetime("daliy_at"),
});

export const tableFactor = <T extends Record<string, MySqlColumnBuilderBase>>(
  tableName: string,
  col: T = {} as T,
) => {
  return mysqlTable(tableName, {
    ...commonTable(),
    ...col,
  });
};

// 定义所有表通用的字段类型（跟 commonTable 保持一致）
export interface CommonFields {
  id: number;
  email?: string | null;
  email_pass?: string | null;
  x_token?: string | null;
  dc_token?: string | null;
}

// 泛型约束：表的行数据必须至少包含 CommonFields
export type WithCommonFields<T extends MySqlTable> = Account<T> & CommonFields;
