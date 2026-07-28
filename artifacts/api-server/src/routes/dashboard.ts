import { Router, type IRouter } from "express";
import { count, eq, gte, sql, and } from "drizzle-orm";
import {
  db, guardsTable, sitesTable, shiftsTable, incidentsTable,
  leaveRequestsTable, applicantsTable, payrollTable, invoicesTable,
  activityLogTable, attendanceTable,
} from "@workspace/db";

import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const cid = (req as any).user!.role !== 'super_admin' ? (req as any).user!.companyId! : null;
  const cnd = (tbl: any, conds: any[] = []) => cid ? and(eq(tbl.companyId, cid), ...conds) : (conds.length ? and(...conds) : undefined);

  const [totalGuards] = await db.select({ count: count() }).from(guardsTable).where(cnd(guardsTable));
  const [activeGuards] = await db.select({ count: count() }).from(guardsTable).where(cnd(guardsTable, [eq(guardsTable.status, "active")]));
  const [totalSites] = await db.select({ count: count() }).from(sitesTable).where(cnd(sitesTable, [eq(sitesTable.status, "active")]));
  const [activeShifts] = await db.select({ count: count() }).from(shiftsTable).where(cnd(shiftsTable, [eq(shiftsTable.status, "active")]));
  const [todayIncidents] = await db.select({ count: count() }).from(incidentsTable).where(cnd(incidentsTable, [eq(incidentsTable.status, "open")]));
  const [pendingLeave] = await db.select({ count: count() }).from(leaveRequestsTable).where(cnd(leaveRequestsTable, [eq(leaveRequestsTable.status, "pending")]));
  const [openRecruitment] = await db.select({ count: count() }).from(applicantsTable).where(cnd(applicantsTable, [eq(applicantsTable.status, "applied")]));

  const [revenueRow] = await db.select({ total: sql<string>`COALESCE(SUM(total_amount), 0)` }).from(invoicesTable).where(cnd(invoicesTable, [eq(invoicesTable.status, "paid")]));
  const [expensesRow] = await db.select({ total: sql<string>`COALESCE(SUM(net_salary), 0)` }).from(payrollTable).where(cnd(payrollTable, [eq(payrollTable.status, "paid")]));

  res.json({
    totalGuards: totalGuards.count,
    activeGuards: activeGuards.count,
    totalSites: totalSites.count,
    activeShifts: activeShifts.count,
    todayIncidents: todayIncidents.count,
    pendingLeave: pendingLeave.count,
    openRecruitment: openRecruitment.count,
    monthlyRevenue: parseFloat(revenueRow.total ?? "0"),
    monthlyExpenses: parseFloat(expensesRow.total ?? "0"),
  });
});

router.get("/dashboard/activity", requireAuth, async (req, res): Promise<void> => {
  const cid = (req as any).user!.role !== 'super_admin' ? (req as any).user!.companyId! : null;
  const logs = await db.select().from(activityLogTable).where(cid ? eq(activityLogTable.companyId, cid) : undefined).orderBy(sql`created_at DESC`).limit(20);
  res.json(logs.map(l => ({
    id: l.id,
    type: l.type,
    description: l.description,
    timestamp: l.createdAt.toISOString(),
    entityId: l.entityId ?? null,
    entityType: l.entityType ?? null,
    actorName: l.actorName ?? null,
  })));
});

router.get("/dashboard/attendance-overview", requireAuth, async (req, res): Promise<void> => {
  // Return last 7 days of attendance counts
  const cid = (req as any).user!.role !== 'super_admin' ? (req as any).user!.companyId! : null;
  const rows = await db.select({
    date: attendanceTable.date,
    status: attendanceTable.status,
    cnt: count(),
  })
    .from(attendanceTable)
    .where(cid ? eq(attendanceTable.companyId, cid) : undefined)
    .groupBy(attendanceTable.date, attendanceTable.status)
    .orderBy(attendanceTable.date);

  const byDate: Record<string, { date: string; present: number; absent: number; late: number }> = {};
  for (const row of rows) {
    if (!byDate[row.date]) byDate[row.date] = { date: row.date, present: 0, absent: 0, late: 0 };
    if (row.status === "present") byDate[row.date].present = row.cnt;
    else if (row.status === "absent") byDate[row.date].absent = row.cnt;
    else if (row.status === "late") byDate[row.date].late = row.cnt;
  }
  res.json(Object.values(byDate).slice(-7));
});

router.get("/dashboard/incident-stats", requireAuth, async (req, res): Promise<void> => {
  const cid = (req as any).user!.role !== 'super_admin' ? (req as any).user!.companyId! : null;
  const rows = await db.select({ type: incidentsTable.type, cnt: count() })
    .from(incidentsTable)
    .where(cid ? eq(incidentsTable.companyId, cid) : undefined)
    .groupBy(incidentsTable.type);
  res.json(rows.map(r => ({ type: r.type, count: r.cnt })));
});

export default router;
