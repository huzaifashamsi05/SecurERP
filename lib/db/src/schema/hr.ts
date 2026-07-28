import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { guardsTable } from "./guards";
import { usersTable } from "./users";
import { companiesTable } from "./companies";

export const leaveRequestsTable = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  guardId: integer("guard_id").notNull().references(() => guardsTable.id),
  type: text("type").notNull(), // annual | sick | emergency | unpaid
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(),     // YYYY-MM-DD
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  reviewedBy: integer("reviewed_by").references(() => usersTable.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const trainingSessionsTable = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // onboarding | safety | first_aid | technical | compliance
  instructor: text("instructor"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  location: text("location"),
  status: text("status").notNull().default("scheduled"), // scheduled | in_progress | completed | cancelled
  enrolledCount: integer("enrolled_count").notNull().default(0),
  maxCapacity: integer("max_capacity"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const applicantsTable = pgTable("applicants", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id).notNull(),
  position: text("position").notNull(),
  applicantName: text("applicant_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  status: text("status").notNull().default("applied"), // applied | screening | interview | offered | hired | rejected
  appliedDate: text("applied_date").notNull(),
  interviewDate: text("interview_date"),
  notes: text("notes"),
  resumeUrl: text("resume_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest = typeof leaveRequestsTable.$inferSelect;

export const insertTrainingSessionSchema = createInsertSchema(trainingSessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type TrainingSession = typeof trainingSessionsTable.$inferSelect;

export const insertApplicantSchema = createInsertSchema(applicantsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApplicant = z.infer<typeof insertApplicantSchema>;
export type Applicant = typeof applicantsTable.$inferSelect;
