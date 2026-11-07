# 3DKing

Bestillingsapp for 3D-printede ting. Testversjon og hobbyprosjekt for å lære koding.
Prisene dekker bare filament og strøm, appen skal ikke gå med overskudd.

## Kjøre lokalt

```bash
npm install
npm run dev
```

Åpne http://localhost:3000.

## Publisering

Repoet er koblet til Vercel. Hver `git push` til `main` publiseres automatisk.

## Database

- På Vercel brukes Neon Postgres via `DATABASE_URL` (settes automatisk når Neon kobles til prosjektet under Storage).
- Lokalt brukes PGlite i mappen `.pglite`, så `npm run dev` virker uten oppsett. Slett mappen for å starte med tom database.
- Tabellene står i `src/lib/schema.ts` og opprettes automatisk første gang appen kobler til (`src/lib/migrate.ts`).
- Sjekk at alt virker på `/status`.
