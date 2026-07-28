import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { sitesTable } from "./clients";
import { companiesTable } from "./companies";

export const guardsTable = pgTable("guards", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  employeeId: text("employee_id").notNull().unique(),
  licenseNumber: text("license_number"),
  status: text("status").notNull().default("active"), // active | inactive | on_leave | on_duty
  siteId: integer("site_id").references(() => sitesTable.id),
  skills: text("skills").array(),
  photo: text("photo"),
  joinDate: text("join_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGuardSchema = createInsertSchema(guardsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGuard = z.infer<typeof insertGuardSchema>;
export type Guard = typeof guardsTable.$inferSelect;
