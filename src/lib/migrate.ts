// Oppretter tabellene første gang appen kobler til en tom database.
// SQL-en her må stemme med schema.ts.
//
// Slik endrer du databasen senere:
// 1. Endre schema.ts.
// 2. Legg SQL-en for endringen i UPGRADES med neste nummer.
// 3. Øk SCHEMA_VERSION til det nummeret.
// SCHEMA_SQL under er versjon 1 og endres aldri. En tom database får først den, så alle UPGRADES.

export const SCHEMA_VERSION = 7;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  username text NOT NULL UNIQUE,
  pin_hash text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  theme text NOT NULL DEFAULT 'neon',
  mode text NOT NULL DEFAULT 'dark',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text,
  price_nok integer NOT NULL,
  cost_nok integer,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  product_id integer NOT NULL REFERENCES products(id),
  quantity integer NOT NULL DEFAULT 1,
  note text,
  unit_price_nok integer NOT NULL,
  status text NOT NULL DEFAULT 'ny',
  created_at timestamptz NOT NULL DEFAULT now(),
  made_at timestamptz,
  delivered_at timestamptz
);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL
);
`;

// Endringer etter versjon 1. Nøkkel = versjonen endringen tar databasen til.
export const UPGRADES: Record<number, string> = {
  // Fase 2: innlogging. Økter (hvem er logget inn) og teller for feil PIN.
  2: `
    CREATE TABLE IF NOT EXISTS sessions (
      token text PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_pins integer NOT NULL DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until timestamptz;
  `,
  // Svar fra admin på en bestilling: godkjent (eventuelt med endringer) og en beskjed.
  3: `
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS approval text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_reply text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS replied_at timestamptz;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_plan text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS changed_by_admin_at timestamptz;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS orders_seen_at timestamptz;
  `,
  // Fase 7: filamentkostnaden kopieres inn i bestillingen (som prisen), så månedsoversikten
  // ikke endrer seg om Liam endrer kostnaden på produktet senere. Gamle bestillinger fylles ut nå.
  4: `
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS unit_cost_nok integer;
    UPDATE orders SET unit_cost_nok = products.cost_nok
      FROM products WHERE products.id = orders.product_id AND orders.unit_cost_nok IS NULL;
  `,
  // Betalt-markering på bestillinger, og om brukeren har byttet til sin egen PIN.
  // Admin-kontoen laget sin egen PIN i oppsettet, så den regnes som byttet.
  5: `
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS own_pin boolean NOT NULL DEFAULT false;
    UPDATE users SET own_pin = true WHERE role = 'admin';
  `,
  // Kunden kan svare på «godkjent med endringer»: godta endringen eller si nei takk.
  6: `
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_response text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_note text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_responded_at timestamptz;
  `,
  // Ordrenummer: 4 sifre + årstallet. Gamle bestillinger får et nummer regnet ut fra id-en
  // (id * 7919 gir forskjellige sifre for hver id under 10 000, så de kolliderer ikke).
  7: `
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number text;
    UPDATE orders SET order_number = lpad(((id * 7919) % 10000)::text, 4, '0') || to_char(created_at AT TIME ZONE 'Europe/Oslo', 'YY')
      WHERE order_number IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_idx ON orders (order_number);
  `,
};
