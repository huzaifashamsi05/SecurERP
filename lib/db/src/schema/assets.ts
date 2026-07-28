import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { guardsTable } from "./guards";
import { companiesTable } from "./companies";

export const equipmentTable = pgTable("equipment", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // radio | torch | handcuffs | vest | camera | baton | other
  serialNumber: text("serial_number"),
  status: text("status").notNull().default("available"), // available | assigned | maintenance | retired
  assignedTo: integer("assigned_to").references(() => guardsTable.id),
  purchaseDate: text("purchase_date"),
  condition: text("condition").notNull().default("good"), // excellent | good | fair | poor
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const vehiclesTable = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  registration: text("registration").notNull().unique(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  status: text("status").notNull().default("available"), // available | assigned | maintenance | retired
  assignedTo: integer("assigned_to").references(() => guardsTable.id),
  mileage: integer("mileage"),
  lastService: text("last_service"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEquipmentSchema = createInsertSchema(equipmentTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = typeof equipmentTable.$inferSelect;

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;
