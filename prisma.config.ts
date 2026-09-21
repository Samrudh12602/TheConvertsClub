import { defineConfig } from "prisma/config";

// Local dev reads .env.local (pulled from Vercel). On Vercel the variables are already in the environment.
try {
  process.loadEnvFile(".env.local");
} catch {
  /* no .env.local: CI/Vercel */
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Migrations use the direct (unpooled) connection; the app uses the pooled DATABASE_URL at runtime.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "" },
});
