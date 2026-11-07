// Kobler appen til databasen. Forenklet utgave av db.ts i Spotter.
//
// - På Vercel finnes DATABASE_URL (satt av Neon), og vi bruker ekte Postgres.
// - Lokalt (npm run dev) finnes den ikke, og vi bruker PGlite: en Postgres som kjører
//   rett på PC-en og lagrer i mappen .pglite. Da trengs ingen oppsett for å kode.
import "server-only";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { SCHEMA_SQL, SCHEMA_VERSION, UPGRADES } from "./migrate";

export type DB = PostgresJsDatabase<typeof schema>;

// En enkel måte å kjøre rå SQL på, uansett hvilken database vi bruker.
type Conn = { db: DB; exec: (sql: string) => Promise<void>; query: (sql: string) => Promise<unknown[]> };

async function connect(): Promise<Conn> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const client = postgres(url, { max: 3, prepare: false, onnotice: () => {} });
    return {
      db: drizzlePostgres(client, { schema }),
      exec: async (sql) => {
        await client.unsafe(sql);
      },
      query: async (sql) => client.unsafe(sql),
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const client = new PGlite(process.env.PGLITE_DIR ?? ".pglite");
  return {
    db: drizzlePglite(client, { schema }) as unknown as DB,
    exec: async (sql) => {
      await client.exec(sql);
    },
    query: async (sql) => (await client.query(sql)).rows,
  };
}

/** Hvilken versjon databasen er på. 0 = tom database. */
async function readVersion(conn: Conn): Promise<number> {
  await conn.exec(`CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value text NOT NULL)`);
  const rows = (await conn.query(`SELECT value FROM settings WHERE key = 'schema_version'`)) as { value: string }[];
  return Number(rows[0]?.value ?? 0);
}

/** Lager tabellene første gang, og kjører nye endringer (UPGRADES) senere. */
async function migrate(conn: Conn): Promise<void> {
  const version = await readVersion(conn);
  if (version >= SCHEMA_VERSION) return;
  if (version === 0) {
    await conn.exec(SCHEMA_SQL);
  } else {
    for (let v = version + 1; v <= SCHEMA_VERSION; v++) {
      if (UPGRADES[v]) await conn.exec(UPGRADES[v]);
    }
  }
  await conn.exec(
    `INSERT INTO settings (key, value) VALUES ('schema_version', '${SCHEMA_VERSION}')
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
  );
}

// Vi kobler til bare én gang og gjenbruker koblingen (lagres på globalThis).
const g = globalThis as unknown as { __db?: Promise<DB> };

export function getDb(): Promise<DB> {
  if (!g.__db) {
    g.__db = (async () => {
      const conn = await connect();
      await migrate(conn);
      return conn.db;
    })().catch((e) => {
      g.__db = undefined; // prøv på nytt neste gang hvis det feilet
      throw e;
    });
  }
  return g.__db;
}

/** "neon" på Vercel, "lokal" på PC-en. Brukes på statussiden. */
export function dbKind(): "neon" | "lokal" {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL ? "neon" : "lokal";
}
