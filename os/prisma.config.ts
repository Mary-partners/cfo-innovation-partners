// Used by the Prisma CLI (`prisma migrate`, `prisma studio`, `prisma db seed`)
// only. The running application never imports this file — it builds its own
// PrismaClient with a driver adapter in src/lib/db.ts. See /docs/setup.md.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a *direct* (non-pooled) connection. Supabase exposes
    // this on port 5432, distinct from the pooled DATABASE_URL (port 6543)
    // the app uses at runtime.
    url: process.env["DIRECT_URL"],
  },
});
