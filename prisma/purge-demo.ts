import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { purgeDemo } from "./demo";

for (const f of [".env.local", ".env.development.local"]) {
  try { process.loadEnvFile(f); } catch { /* optional */ }
}
neonConfig.webSocketConstructor = ws;
const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });
purgeDemo(db).then(() => console.log("demo data removed")).catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
