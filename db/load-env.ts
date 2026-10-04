import { existsSync } from "node:fs";

import { config } from "dotenv";

/**
 * Veritabanı komutlarının (drizzle-kit, seed, tek seferlik betikler) hangi
 * veritabanına bağlanacağını belirler.
 *
 * Varsayılan: GELİŞTİRME (Neon "dev" dalı, `.env.development.local`).
 * Canlıya yalnızca DB_TARGET=production ile bağlanılır (`npm run db:migrate:prod`).
 * Geliştirme dosyası yoksa canlıya düşmek yerine durur.
 */
const target = process.env.DB_TARGET === "production" ? "production" : "development";
const file = target === "production" ? ".env.local" : ".env.development.local";

if (!existsSync(file)) {
  console.error(
    `[db] ${file} bulunamadı. Canlı veritabanına yanlışlıkla bağlanmamak için duruyorum.` +
      (target === "development" ? " Neon'daki dev dalının adreslerini bu dosyaya yazın." : ""),
  );
  process.exit(1);
}

config({ path: file });
process.env.DB_TARGET = target;
console.log(`[db] hedef: ${target === "production" ? "CANLI veritabanı" : "geliştirme (dev dalı)"}`);
