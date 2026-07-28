import { Router, type IRouter } from "express";
import { eq, count, and } from "drizzle-orm";
import {
  db, shiftsTable, attendanceTable, patrolsTable, checkpointsTable,
  incidentsTable, dailyReportsTable, guardsTable, sitesTable, usersTable,
} from "@workspace/db";

const router: IRouter = Router();

function isoOrNull(d: Date | null | undefined) { return d ? d.toISOString() : null; }
function nameOf(arr: { id: number; name?: string; [k: string]: any }[], id: number | null | undefined) {
  if (id == null) return null;
  return arr.find(x => x.id === id)?.name ?? null;
}

// ─── Shifts ──────────────────────────────────────────────────────────────────
router.get("/shifts", async (req, res): Promise<void> => {
  const { guardId, siteId, status } = req.query as Record<string, string>;
  let q = db.select().from(shiftsTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(shiftsTable.companyId, (req as any).user!.companyId!));
  if (guardId) conditions.push(eq(shiftsTable.guardId, parseInt(guardId, 10)));
  if (siteId) conditions.push(eq(shiftsTable.siteId, parseInt(siteId, 10)));
  if (status) conditions.push(eq(shiftsTable.status, status));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const shifts = await q;
  let guardsQuery = db.select({ id: guardsTable.id, userId: guardsTable.userId }).from(guardsTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') guardsQuery = guardsQuery.where(eq(guardsTable.companyId, (req as any).user!.companyId!));
  const guards = await guardsQuery;
  let usersQuery = db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') usersQuery = usersQuery.where(eq(usersTable.companyId, (req as any).user!.companyId!));
  const users = await usersQuery;
  let sitesQuery = db.select({ id: sitesTable.id, name: sitesTable.name }).from(sitesTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') sitesQuery = sitesQuery.where(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const sites = await sitesQuery;
  res.json(shifts.map(s => {
    const g = guards.find(x => x.id === s.guardId);
    const u = g ? users.find(x => x.id === g.userId) : null;
    return { id: s.id, guardId: s.guardId, guardName: u?.name ?? null, siteId: s.siteId, siteName: nameOf(sites, s.siteId), startTime: s.startTime.toISOString(), endTime: s.endTime.toISOString(), status: s.status, notes: s.notes ?? null, createdAt: s.createdAt.toISOString() };
  }));
});

router.post("/shifts", async (req, res): Promise<void> => {
  const { guardId, siteId, startTime, endTime, status, notes } = req.body;
  if (!guardId || !siteId || !startTime || !endTime) { res.status(400).json({ error: "guardId, siteId, startTime, endTime required" }); return; }
  const [shift] = await db.insert(shiftsTable).values({ companyId: (req as any).user!.companyId!, guardId, siteId, startTime: new Date(startTime), endTime: new Date(endTime), status: status ?? "scheduled", notes: notes ?? null }).returning();
  res.status(201).json({ id: shift.id, guardId: shift.guardId, guardName: null, siteId: shift.siteId, siteName: null, startTime: shift.startTime.toISOString(), endTime: shift.endTime.toISOString(), status: shift.status, notes: shift.notes ?? null, createdAt: shift.createdAt.toISOString() });
});

router.get("/shifts/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(shiftsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(shiftsTable.companyId, (req as any).user!.companyId!));
  const [shift] = await db.select().from(shiftsTable).where(and(...conditions));
  if (!shift) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: shift.id, guardId: shift.guardId, guardName: null, siteId: shift.siteId, siteName: null, startTime: shift.startTime.toISOString(), endTime: shift.endTime.toISOString(), status: shift.status, notes: shift.notes ?? null, createdAt: shift.createdAt.toISOString() });
});

router.patch("/shifts/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { guardId, siteId, startTime, endTime, status, notes } = req.body;
  const updates: Record<string, any> = {};
  if (guardId !== undefined) updates.guardId = guardId;
  if (siteId !== undefined) updates.siteId = siteId;
  if (startTime !== undefined) updates.startTime = new Date(startTime);
  if (endTime !== undefined) updates.endTime = new Date(endTime);
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(shiftsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(shiftsTable.companyId, (req as any).user!.companyId!));
  const [shift] = await db.update(shiftsTable).set(updates).where(and(...conditions)).returning();
  if (!shift) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: shift.id, guardId: shift.guardId, guardName: null, siteId: shift.siteId, siteName: null, startTime: shift.startTime.toISOString(), endTime: shift.endTime.toISOString(), status: shift.status, notes: shift.notes ?? null, createdAt: shift.createdAt.toISOString() });
});

router.delete("/shifts/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(shiftsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(shiftsTable.companyId, (req as any).user!.companyId!));
  await db.delete(shiftsTable).where(and(...conditions));
  res.json({ success: true });
});

// ─── Attendance ───────────────────────────────────────────────────────────────
router.get("/attendance/summary", async (req, res): Promise<void> => {
  const cid = (req as any).user!.role !== 'super_admin' ? (req as any).user!.companyId! : null;
  const cnd = (tbl: any, conds: any[] = []) => cid ? and(eq(tbl.companyId, cid), ...conds) : (conds.length ? and(...conds) : undefined);
  const [present] = await db.select({ cnt: count() }).from(attendanceTable).where(cnd(attendanceTable, [eq(attendanceTable.status, "present")]));
  const [absent] = await db.select({ cnt: count() }).from(attendanceTable).where(cnd(attendanceTable, [eq(attendanceTable.status, "absent")]));
  const [late] = await db.select({ cnt: count() }).from(attendanceTable).where(cnd(attendanceTable, [eq(attendanceTable.status, "late")]));
  const total = (present.cnt ?? 0) + (absent.cnt ?? 0) + (late.cnt ?? 0);
  res.json({ present: present.cnt, absent: absent.cnt, late: late.cnt, total, presentPercent: total > 0 ? Math.round(present.cnt / total * 100) : 0 });
});

router.get("/attendance", async (req, res): Promise<void> => {
  const { guardId, date, status } = req.query as Record<string, string>;
  let q = db.select().from(attendanceTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(attendanceTable.companyId, (req as any).user!.companyId!));
  if (guardId) conditions.push(eq(attendanceTable.guardId, parseInt(guardId, 10)));
  if (date) conditions.push(eq(attendanceTable.date, date));
  if (status) conditions.push(eq(attendanceTable.status, status));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const recs = await q;
  let guardsQuery = db.select({ id: guardsTable.id, userId: guardsTable.userId }).from(guardsTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') guardsQuery = guardsQuery.where(eq(guardsTable.companyId, (req as any).user!.companyId!));
  const guards = await guardsQuery;
  let usersQuery = db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') usersQuery = usersQuery.where(eq(usersTable.companyId, (req as any).user!.companyId!));
  const users = await usersQuery;
  res.json(recs.map(r => {
    const g = guards.find(x => x.id === r.guardId);
    const u = g ? users.find(x => x.id === g.userId) : null;
    return { id: r.id, guardId: r.guardId, guardName: u?.name ?? null, shiftId: r.shiftId ?? null, date: r.date, checkIn: isoOrNull(r.checkIn), checkOut: isoOrNull(r.checkOut), status: r.status, notes: r.notes ?? null, createdAt: r.createdAt.toISOString() };
  }));
});

router.post("/attendance", async (req, res): Promise<void> => {
  const { guardId, shiftId, date, checkIn, checkOut, status, notes } = req.body;
  if (!guardId || !date || !status) { res.status(400).json({ error: "guardId, date, status required" }); return; }
  const [rec] = await db.insert(attendanceTable).values({ companyId: (req as any).user!.companyId!, guardId, shiftId: shiftId ?? null, date, checkIn: checkIn ? new Date(checkIn) : null, checkOut: checkOut ? new Date(checkOut) : null, status, notes: notes ?? null }).returning();
  res.status(201).json({ id: rec.id, guardId: rec.guardId, guardName: null, shiftId: rec.shiftId ?? null, date: rec.date, checkIn: isoOrNull(rec.checkIn), checkOut: isoOrNull(rec.checkOut), status: rec.status, notes: rec.notes ?? null, createdAt: rec.createdAt.toISOString() });
});

router.get("/attendance/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(attendanceTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(attendanceTable.companyId, (req as any).user!.companyId!));
  const [rec] = await db.select().from(attendanceTable).where(and(...conditions));
  if (!rec) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: rec.id, guardId: rec.guardId, guardName: null, shiftId: rec.shiftId ?? null, date: rec.date, checkIn: isoOrNull(rec.checkIn), checkOut: isoOrNull(rec.checkOut), status: rec.status, notes: rec.notes ?? null, createdAt: rec.createdAt.toISOString() });
});

router.patch("/attendance/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { checkIn, checkOut, status, notes } = req.body;
  const updates: Record<string, any> = {};
  if (checkIn !== undefined) updates.checkIn = checkIn ? new Date(checkIn) : null;
  if (checkOut !== undefined) updates.checkOut = checkOut ? new Date(checkOut) : null;
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(attendanceTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(attendanceTable.companyId, (req as any).user!.companyId!));
  const [rec] = await db.update(attendanceTable).set(updates).where(and(...conditions)).returning();
  if (!rec) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: rec.id, guardId: rec.guardId, guardName: null, shiftId: rec.shiftId ?? null, date: rec.date, checkIn: isoOrNull(rec.checkIn), checkOut: isoOrNull(rec.checkOut), status: rec.status, notes: rec.notes ?? null, createdAt: rec.createdAt.toISOString() });
});

// ─── Patrols ─────────────────────────────────────────────────────────────────
router.get("/patrols", async (req, res): Promise<void> => {
  const { siteId, guardId, status } = req.query as Record<string, string>;
  let q = db.select().from(patrolsTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(patrolsTable.companyId, (req as any).user!.companyId!));
  if (siteId) conditions.push(eq(patrolsTable.siteId, parseInt(siteId, 10)));
  if (guardId) conditions.push(eq(patrolsTable.guardId, parseInt(guardId, 10)));
  if (status) conditions.push(eq(patrolsTable.status, status));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const patrols = await q;
  let guardsQuery = db.select({ id: guardsTable.id, userId: guardsTable.userId }).from(guardsTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') guardsQuery = guardsQuery.where(eq(guardsTable.companyId, (req as any).user!.companyId!));
  const guards = await guardsQuery;
  let usersQuery = db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') usersQuery = usersQuery.where(eq(usersTable.companyId, (req as any).user!.companyId!));
  const users = await usersQuery;
  let sitesQuery = db.select({ id: sitesTable.id, name: sitesTable.name }).from(sitesTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') sitesQuery = sitesQuery.where(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const sites = await sitesQuery;
  res.json(patrols.map(p => {
    const g = guards.find(x => x.id === p.guardId);
    const u = g ? users.find(x => x.id === g.userId) : null;
    return { id: p.id, siteId: p.siteId, siteName: nameOf(sites, p.siteId), guardId: p.guardId, guardName: u?.name ?? null, startTime: isoOrNull(p.startTime), endTime: isoOrNull(p.endTime), status: p.status, checkpointCount: p.checkpointCount, completedCheckpoints: p.completedCheckpoints, notes: p.notes ?? null, createdAt: p.createdAt.toISOString() };
  }));
});

router.post("/patrols", async (req, res): Promise<void> => {
  const { siteId, guardId, startTime, status, notes } = req.body;
  if (!siteId || !guardId) { res.status(400).json({ error: "siteId, guardId required" }); return; }
  const [patrol] = await db.insert(patrolsTable).values({ companyId: (req as any).user!.companyId!, siteId, guardId, startTime: startTime ? new Date(startTime) : null, status: status ?? "scheduled", notes: notes ?? null }).returning();
  res.status(201).json({ id: patrol.id, siteId: patrol.siteId, siteName: null, guardId: patrol.guardId, guardName: null, startTime: isoOrNull(patrol.startTime), endTime: null, status: patrol.status, checkpointCount: patrol.checkpointCount, completedCheckpoints: patrol.completedCheckpoints, notes: patrol.notes ?? null, createdAt: patrol.createdAt.toISOString() });
});

router.get("/patrols/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(patrolsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(patrolsTable.companyId, (req as any).user!.companyId!));
  const [p] = await db.select().from(patrolsTable).where(and(...conditions));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: p.id, siteId: p.siteId, siteName: null, guardId: p.guardId, guardName: null, startTime: isoOrNull(p.startTime), endTime: isoOrNull(p.endTime), status: p.status, checkpointCount: p.checkpointCount, completedCheckpoints: p.completedCheckpoints, notes: p.notes ?? null, createdAt: p.createdAt.toISOString() });
});

router.patch("/patrols/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { endTime, status, notes, completedCheckpoints } = req.body;
  const updates: Record<string, any> = {};
  if (endTime !== undefined) updates.endTime = endTime ? new Date(endTime) : null;
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (completedCheckpoints !== undefined) updates.completedCheckpoints = completedCheckpoints;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(patrolsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(patrolsTable.companyId, (req as any).user!.companyId!));
  const [p] = await db.update(patrolsTable).set(updates).where(and(...conditions)).returning();
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: p.id, siteId: p.siteId, siteName: null, guardId: p.guardId, guardName: null, startTime: isoOrNull(p.startTime), endTime: isoOrNull(p.endTime), status: p.status, checkpointCount: p.checkpointCount, completedCheckpoints: p.completedCheckpoints, notes: p.notes ?? null, createdAt: p.createdAt.toISOString() });
});

// ─── Checkpoints ─────────────────────────────────────────────────────────────
router.get("/checkpoints", async (req, res): Promise<void> => {
  const { siteId } = req.query as Record<string, string>;
  let q = db.select().from(checkpointsTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(checkpointsTable.companyId, (req as any).user!.companyId!));
  if (siteId) conditions.push(eq(checkpointsTable.siteId, parseInt(siteId, 10)));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const cps = await q;
  let sitesQuery = db.select({ id: sitesTable.id, name: sitesTable.name }).from(sitesTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') sitesQuery = sitesQuery.where(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const sites = await sitesQuery;
  res.json(cps.map(c => ({ id: c.id, siteId: c.siteId, siteName: nameOf(sites, c.siteId), name: c.name, description: c.description ?? null, latitude: c.latitude ? parseFloat(c.latitude) : null, longitude: c.longitude ? parseFloat(c.longitude) : null, qrCode: c.qrCode ?? null, status: c.status, createdAt: c.createdAt.toISOString() })));
});

router.post("/checkpoints", async (req, res): Promise<void> => {
  const { siteId, name, description, latitude, longitude, status } = req.body;
  if (!siteId || !name) { res.status(400).json({ error: "siteId, name required" }); return; }
  const [cp] = await db.insert(checkpointsTable).values({ companyId: (req as any).user!.companyId!, siteId, name, description: description ?? null, latitude: latitude ? String(latitude) : null, longitude: longitude ? String(longitude) : null, status: status ?? "active" }).returning();
  res.status(201).json({ id: cp.id, siteId: cp.siteId, siteName: null, name: cp.name, description: cp.description ?? null, latitude: null, longitude: null, qrCode: cp.qrCode ?? null, status: cp.status, createdAt: cp.createdAt.toISOString() });
});

router.get("/checkpoints/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(checkpointsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(checkpointsTable.companyId, (req as any).user!.companyId!));
  const [cp] = await db.select().from(checkpointsTable).where(and(...conditions));
  if (!cp) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: cp.id, siteId: cp.siteId, siteName: null, name: cp.name, description: cp.description ?? null, latitude: cp.latitude ? parseFloat(cp.latitude) : null, longitude: cp.longitude ? parseFloat(cp.longitude) : null, qrCode: cp.qrCode ?? null, status: cp.status, createdAt: cp.createdAt.toISOString() });
});

router.patch("/checkpoints/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, description, latitude, longitude, status } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (latitude !== undefined) updates.latitude = String(latitude);
  if (longitude !== undefined) updates.longitude = String(longitude);
  if (status !== undefined) updates.status = status;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(checkpointsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(checkpointsTable.companyId, (req as any).user!.companyId!));
  const [cp] = await db.update(checkpointsTable).set(updates).where(and(...conditions)).returning();
  if (!cp) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: cp.id, siteId: cp.siteId, siteName: null, name: cp.name, description: cp.description ?? null, latitude: cp.latitude ? parseFloat(cp.latitude) : null, longitude: cp.longitude ? parseFloat(cp.longitude) : null, qrCode: cp.qrCode ?? null, status: cp.status, createdAt: cp.createdAt.toISOString() });
});

router.delete("/checkpoints/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(checkpointsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(checkpointsTable.companyId, (req as any).user!.companyId!));
  await db.delete(checkpointsTable).where(and(...conditions));
  res.json({ success: true });
});

// ─── Incidents ────────────────────────────────────────────────────────────────
router.get("/incidents/summary", async (req, res): Promise<void> => {
  const cid = (req as any).user!.role !== 'super_admin' ? (req as any).user!.companyId! : null;
  const cnd = (tbl: any, conds: any[] = []) => cid ? and(eq(tbl.companyId, cid), ...conds) : (conds.length ? and(...conds) : undefined);
  const [total] = await db.select({ cnt: count() }).from(incidentsTable).where(cnd(incidentsTable));
  const [critical] = await db.select({ cnt: count() }).from(incidentsTable).where(cnd(incidentsTable, [eq(incidentsTable.severity, "critical")]));
  const [high] = await db.select({ cnt: count() }).from(incidentsTable).where(cnd(incidentsTable, [eq(incidentsTable.severity, "high")]));
  const [medium] = await db.select({ cnt: count() }).from(incidentsTable).where(cnd(incidentsTable, [eq(incidentsTable.severity, "medium")]));
  const [low] = await db.select({ cnt: count() }).from(incidentsTable).where(cnd(incidentsTable, [eq(incidentsTable.severity, "low")]));
  const [open] = await db.select({ cnt: count() }).from(incidentsTable).where(cnd(incidentsTable, [eq(incidentsTable.status, "open")]));
  const [resolved] = await db.select({ cnt: count() }).from(incidentsTable).where(cnd(incidentsTable, [eq(incidentsTable.status, "resolved")]));
  res.json({ total: total.cnt, critical: critical.cnt, high: high.cnt, medium: medium.cnt, low: low.cnt, open: open.cnt, resolved: resolved.cnt });
});

router.get("/incidents", async (req, res): Promise<void> => {
  const { siteId, guardId, severity, status } = req.query as Record<string, string>;
  let q = db.select().from(incidentsTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(incidentsTable.companyId, (req as any).user!.companyId!));
  if (siteId) conditions.push(eq(incidentsTable.siteId, parseInt(siteId, 10)));
  if (guardId) conditions.push(eq(incidentsTable.guardId, parseInt(guardId, 10)));
  if (severity) conditions.push(eq(incidentsTable.severity, severity));
  if (status) conditions.push(eq(incidentsTable.status, status));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const incidents = await q;
  let guardsQuery = db.select({ id: guardsTable.id, userId: guardsTable.userId }).from(guardsTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') guardsQuery = guardsQuery.where(eq(guardsTable.companyId, (req as any).user!.companyId!));
  const guards = await guardsQuery;
  let usersQuery = db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') usersQuery = usersQuery.where(eq(usersTable.companyId, (req as any).user!.companyId!));
  const users = await usersQuery;
  let sitesQuery = db.select({ id: sitesTable.id, name: sitesTable.name }).from(sitesTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') sitesQuery = sitesQuery.where(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const sites = await sitesQuery;
  res.json(incidents.map(i => {
    const g = guards.find(x => x.id === i.guardId);
    const u = g ? users.find(x => x.id === g.userId) : null;
    return { id: i.id, siteId: i.siteId, siteName: nameOf(sites, i.siteId), guardId: i.guardId, guardName: u?.name ?? null, type: i.type, severity: i.severity, description: i.description, status: i.status, reportedAt: i.reportedAt.toISOString(), resolvedAt: isoOrNull(i.resolvedAt), createdAt: i.createdAt.toISOString() };
  }));
});

router.post("/incidents", async (req, res): Promise<void> => {
  const { siteId, guardId, type, severity, description, reportedAt, status } = req.body;
  if (!siteId || !guardId || !type || !description) { res.status(400).json({ error: "siteId, guardId, type, description required" }); return; }
  const [inc] = await db.insert(incidentsTable).values({ companyId: (req as any).user!.companyId!, siteId, guardId, type, severity: severity ?? "medium", description, reportedAt: reportedAt ? new Date(reportedAt) : new Date(), status: status ?? "open" }).returning();
  res.status(201).json({ id: inc.id, siteId: inc.siteId, siteName: null, guardId: inc.guardId, guardName: null, type: inc.type, severity: inc.severity, description: inc.description, status: inc.status, reportedAt: inc.reportedAt.toISOString(), resolvedAt: null, createdAt: inc.createdAt.toISOString() });
});

router.get("/incidents/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(incidentsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(incidentsTable.companyId, (req as any).user!.companyId!));
  const [inc] = await db.select().from(incidentsTable).where(and(...conditions));
  if (!inc) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: inc.id, siteId: inc.siteId, siteName: null, guardId: inc.guardId, guardName: null, type: inc.type, severity: inc.severity, description: inc.description, status: inc.status, reportedAt: inc.reportedAt.toISOString(), resolvedAt: isoOrNull(inc.resolvedAt), createdAt: inc.createdAt.toISOString() });
});

router.patch("/incidents/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { type, severity, description, status, resolvedAt } = req.body;
  const updates: Record<string, any> = {};
  if (type !== undefined) updates.type = type;
  if (severity !== undefined) updates.severity = severity;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (resolvedAt !== undefined) updates.resolvedAt = resolvedAt ? new Date(resolvedAt) : null;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(incidentsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(incidentsTable.companyId, (req as any).user!.companyId!));
  const [inc] = await db.update(incidentsTable).set(updates).where(and(...conditions)).returning();
  if (!inc) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: inc.id, siteId: inc.siteId, siteName: null, guardId: inc.guardId, guardName: null, type: inc.type, severity: inc.severity, description: inc.description, status: inc.status, reportedAt: inc.reportedAt.toISOString(), resolvedAt: isoOrNull(inc.resolvedAt), createdAt: inc.createdAt.toISOString() });
});

// ─── Daily Reports ────────────────────────────────────────────────────────────
router.get("/daily-reports", async (req, res): Promise<void> => {
  const { guardId, siteId, date, status } = req.query as Record<string, string>;
  let q = db.select().from(dailyReportsTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(dailyReportsTable.companyId, (req as any).user!.companyId!));
  if (guardId) conditions.push(eq(dailyReportsTable.guardId, parseInt(guardId, 10)));
  if (siteId) conditions.push(eq(dailyReportsTable.siteId, parseInt(siteId, 10)));
  if (date) conditions.push(eq(dailyReportsTable.date, date));
  if (status) conditions.push(eq(dailyReportsTable.status, status));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const reports = await q;
  let guardsQuery = db.select({ id: guardsTable.id, userId: guardsTable.userId }).from(guardsTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') guardsQuery = guardsQuery.where(eq(guardsTable.companyId, (req as any).user!.companyId!));
  const guards = await guardsQuery;
  let usersQuery = db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') usersQuery = usersQuery.where(eq(usersTable.companyId, (req as any).user!.companyId!));
  const users = await usersQuery;
  let sitesQuery = db.select({ id: sitesTable.id, name: sitesTable.name }).from(sitesTable).$dynamic();
  if ((req as any).user!.role !== 'super_admin') sitesQuery = sitesQuery.where(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const sites = await sitesQuery;
  res.json(reports.map(r => {
    const g = guards.find(x => x.id === r.guardId);
    const u = g ? users.find(x => x.id === g.userId) : null;
    return { id: r.id, guardId: r.guardId, guardName: u?.name ?? null, siteId: r.siteId, siteName: nameOf(sites, r.siteId), date: r.date, summary: r.summary, activities: r.activities ?? "", status: r.status, createdAt: r.createdAt.toISOString() };
  }));
});

router.post("/daily-reports", async (req, res): Promise<void> => {
  const { guardId, siteId, date, summary, activities, status } = req.body;
  if (!guardId || !siteId || !date || !summary) { res.status(400).json({ error: "guardId, siteId, date, summary required" }); return; }
  const [report] = await db.insert(dailyReportsTable).values({ companyId: (req as any).user!.companyId!, guardId, siteId, date, summary, activities: activities ?? null, status: status ?? "submitted" }).returning();
  res.status(201).json({ id: report.id, guardId: report.guardId, guardName: null, siteId: report.siteId, siteName: null, date: report.date, summary: report.summary, activities: report.activities ?? "", status: report.status, createdAt: report.createdAt.toISOString() });
});

router.get("/daily-reports/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(dailyReportsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(dailyReportsTable.companyId, (req as any).user!.companyId!));
  const [report] = await db.select().from(dailyReportsTable).where(and(...conditions));
  if (!report) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: report.id, guardId: report.guardId, guardName: null, siteId: report.siteId, siteName: null, date: report.date, summary: report.summary, activities: report.activities ?? "", status: report.status, createdAt: report.createdAt.toISOString() });
});

router.patch("/daily-reports/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { summary, activities, status } = req.body;
  const updates: Record<string, any> = {};
  if (summary !== undefined) updates.summary = summary;
  if (activities !== undefined) updates.activities = activities;
  if (status !== undefined) updates.status = status;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(dailyReportsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(dailyReportsTable.companyId, (req as any).user!.companyId!));
  const [report] = await db.update(dailyReportsTable).set(updates).where(and(...conditions)).returning();
  if (!report) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: report.id, guardId: report.guardId, guardName: null, siteId: report.siteId, siteName: null, date: report.date, summary: report.summary, activities: report.activities ?? "", status: report.status, createdAt: report.createdAt.toISOString() });
});

export default router;
