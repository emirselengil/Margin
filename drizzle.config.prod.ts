// Canlı veritabanına migration uygulamak için: npm run db:migrate:prod
// target-production, load-env'den ÖNCE yüklenmeli (import sırası önemli).
import "./db/target-production";

export { default } from "./drizzle.config";
