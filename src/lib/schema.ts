// Tabellene i databasen, skrevet i TypeScript med Drizzle.
// Hver `pgTable` er én tabell, og hver linje inni er én kolonne.
// Drizzle bruker dette til å gi oss autofullføring og typesjekk når vi leser og skriver data.
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Brukere. Liam er admin, alle andre er vanlige brukere.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  // PIN lagres ALDRI i klartekst, bare som en hash (lages i Fase 2).
  pinHash: text("pin_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("user"), // "admin" eller "user"
  theme: text("theme").notNull().default("neon"),
  mode: text("mode").notNull().default("dark"),
  active: boolean("active").notNull().default(true),
  // Feil PIN på rad, og når en eventuell sperre slutter.
  failedPins: integer("failed_pins").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  // Sist brukeren åpnet «Mine bestillinger». Brukes til å vise et tall når noe nytt har skjedd.
  ordersSeenAt: timestamp("orders_seen_at", { withTimezone: true }),
  // true når brukeren har byttet til sin egen PIN. Da slutter forsiden å foreslå det.
  ownPin: boolean("own_pin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Innloggede økter. Cookien i nettleseren inneholder bare `token`, og her slår vi opp hvem det er.
export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// Produktene Liam legger ut. Kroner lagres som heltall, ikke desimaltall.
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  priceNok: integer("price_nok").notNull(),
  // Filamentkost: vises bare for admin.
  costNok: integer("cost_nok"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Bestillinger. Hver bestilling peker på én bruker og ett produkt.
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  note: text("note"),
  // Prisen kopieres inn når man bestiller, så gamle bestillinger ikke endres om prisen endres.
  unitPriceNok: integer("unit_price_nok").notNull(),
  unitCostNok: integer("unit_cost_nok"), // filamentkostnaden per stk da det ble bestilt
  status: text("status").notNull().default("ny"), // "ny" → "laget" → "levert", eller "avbrutt"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  madeAt: timestamp("made_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  // Svar fra Liam: null = ikke svart, "godkjent" eller "endringer" (godkjent med endringer).
  approval: text("approval"),
  adminReply: text("admin_reply"), // beskjed til den som bestilte
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  // Sist Liam endret noe brukeren bør se (status, svar, levering).
  changedByAdminAt: timestamp("changed_by_admin_at", { withTimezone: true }),
  deliveryPlan: text("delivery_plan"), // f.eks. «Leveres på skolen på mandag»
  paidAt: timestamp("paid_at", { withTimezone: true }), // når Liam fikk betalt (Vipps). null = ikke betalt
});

// Telefoner som har sagt ja til varsler (brukes i Fase 6).
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
});

// Små innstillinger, for eksempel hvilken versjon databasen er på.
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
