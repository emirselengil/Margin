import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "./schema";

export type TestDb = PgliteDatabase<typeof schema>;

/**
 * Her test için bellekte, izole bir Postgres (PGlite) örneği oluşturur ve
 * gerçek migration dosyalarını uygular. Gerçek Neon veritabanına dokunmaz.
 */
export async function createTestDb(): Promise<TestDb> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./db/migrations" });
  return db;
}
