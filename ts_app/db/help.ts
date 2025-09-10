import { and, eq, SQL, sql } from "drizzle-orm";
import { MySqlTable } from "drizzle-orm/mysql-core";
import { conn } from "./db";
import { drizzle } from "drizzle-orm/mysql2";

export async function getResource<T>(
  resource: MySqlTable,
  project: string,
  limit = 1,
  where: SQL = null,
  lockIsInt = false,
): Promise<T> {
  let q = sql`projects not like ${"%" + project + "%"}  AND is_blocked = 0`;
  let cond = [];
  let locked = sql`NOW()`;
  if (where) {
    cond.push(where);
  }
  if (lockIsInt) {
    cond.push(sql`(locked_at < UNIX_TIMESTAMP() - 300 OR locked_at is null)`);
    locked = sql`UNIX_TIMESTAMP()`;
  } else {
    cond.push(
      sql`(locked_at is null OR locked_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)) `,
    );
  }
  q = and(q, ...cond);

  const db = drizzle(conn(), { logger: true });
  const result = await db
    .select()
    .from(resource)
    .where(q)
    .orderBy(sql`RAND()`)
    .limit(limit);

  if (!result.length) {
    return null;
  }
  const account = result[0];
  await db
    .update(resource)
    .set({
      locked_at: locked,
    })
    .where(eq(sql`id`, account.id));
  return result[0] as T;
}

export async function blockedResource(
  resource: MySqlTable,
  where: SQL,
  isBlocked = 1,
) {
  const db = drizzle(conn(), { logger: true });
  return await db.update(resource).set({ isBlocked: isBlocked }).where(where);
}

export async function useResource(
  resource: MySqlTable,
  where: SQL,
  project: string,
) {
  const db = drizzle(conn(), { logger: true });
  return await db
    .update(resource)
    .set({ projects: sql`CONCAT(projects, ',', ${project})` })
    .where(where);
}
