import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { guardsTable } from "./guards";
import { sitesTable } from "./clients";
import { companiesTable } from "./companies";

export const shiftsTable = pgTable("shifts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  guardId: integer("guard_id").notNull().references(() => guardsTable.id),
  siteId: integer("site_id").notNull().references(() => sitesTable.id),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled | active | completed | cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const attendanceTable = pgTable("attendance", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  guardId: integer("guard_id").notNull().references(() => guardsTable.id),
  shiftId: integer("shift_id").references(() => shiftsTable.id),
  date: text("date").notNull(), // YYYY-MM-DD
  checkIn: timestamp("check_in", { withTimezone: true }),
  checkOut: timestamp("check_out", { withTimezone: true }),
  status: text("status").notNull().default("present"), // present | absent | late | half_day
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const checkpointsTable = pgTable("checkpoints", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  siteId: integer("site_id").notNull().references(() => sitesTable.id),
  name: text("name").notNull(),
  description: text("description"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  qrCode: text("qr_code"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const patrolsTable = pgTable("patrols", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  siteId: integer("site_id").notNull().references(() => sitesTable.id),
  guardId: integer("guard_id").notNull().references(() => guardsTable.id),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  status: text("status").notNull().default("scheduled"), // scheduled | in_progress | completed | cancelled
  checkpointCount: integer("checkpoint_count").notNull().default(0),
  completedCheckpoints: integer("completed_checkpoints").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const incidentsTable = pgTable("incidents", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  siteId: integer("site_id").notNull().references(() => sitesTable.id),
  guardId: integer("guard_id").notNull().references(() => guardsTable.id),
  type: text("type").notNull(), // theft | trespass | fire | medical | vandalism | suspicious | other
  severity: text("severity").notNull().default("medium"), // low | medium | high | critical
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // open | investigating | resolved | closed
  reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const dailyReportsTable = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  guardId: integer("guard_id").notNull().references(() => guardsTable.id),
  siteId: integer("site_id").notNull().references(() => sitesTable.id),
  date: text("date").notNull(), // YYYY-MM-DD
  summary: text("summary").notNull(),
  activities: text("activities"),
  status: text("status").notNull().default("submitted"), // draft | submitted | reviewed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertShiftSchema = createInsertSchema(shiftsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shiftsTable.$inferSelect;

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;

export const insertCheckpointSchema = createInsertSchema(checkpointsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCheckpoint = z.infer<typeof insertCheckpointSchema>;
export type Checkpoint = typeof checkpointsTable.$inferSelect;

export const insertPatrolSchema = createInsertSchema(patrolsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPatrol = z.infer<typeof insertPatrolSchema>;
export type Patrol = typeof patrolsTable.$inferSelect;

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidentsTable.$inferSelect;

export const insertDailyReportSchema = createInsertSchema(dailyReportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDailyReport = z.infer<typeof insertDailyReportSchema>;
export type DailyReport = typeof dailyReportsTable.$inferSelect;
