
import { mysqlTable, serial, float, varchar, text, json, int, datetime, boolean } from "drizzle-orm/mysql-core";
import {  InferSelectModel } from 'drizzle-orm';
import { baseColumns } from "./base_models";

export const ZealyTable = mysqlTable(`zealy`, {
    ...baseColumns(),
    email: varchar('email', { length: 100 }),
    password: varchar('email_pass', { length: 100 }),
    userID: varchar('user_id', {length: 100}),
    cookies:text('cookies')
});

export type ZealyAccount = InferSelectModel<typeof ZealyTable>