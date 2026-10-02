import { boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "admin",
  "head_teacher",
  "assistant",
  "pending",
]);

// `id` eşleşir Neon Auth kullanıcı kimliğine; Neon Auth'un ürettiği kimlik
// her zaman UUID formatında olmayabildiği için text olarak tutulur.
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull().default("pending"),
  isActive: boolean("is_active").notNull().default(true),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
