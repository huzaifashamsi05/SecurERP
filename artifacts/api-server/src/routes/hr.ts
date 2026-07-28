import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, leaveRequestsTable, trainingSessionsTable, applicantsTable, guardsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

function guardName(guards: any[], users: any[], guardId: number) {
  const g = guards.find(x => x.id === guardId);
  const u = g ? users.find(x => x.id === g.userId) : null;
  return u?.name ?? null;
}

// ─── Leave ────────────────────────────────────────────────────────────────────
router.get("/leave", async (req, res): Promise<void> => {
  const { guardId, status, type } = req.query as Record<string, string>;
  let q = db.select().from(leaveRequestsTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(leaveRequestsTable.companyId, (req as any).user!.companyId!));
  if (guardId) conditions.push(eq(leaveRequestsTable.guardId, parseInt(guardId, 10)));
  if (status) conditions.push(eq(leaveRequestsTable.status, status));
  if (type) conditions.push(eq(leaveRequestsTable.type, type));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const leaves = await q;
  let guardsQuery = db.select({ id: guardsTable.id, userId: guardsTable.userId }).from(guardsTable);
  if ((req as any).user!.role !== 'super_admin') guardsQuery = guardsQuery.where(eq(guardsTable.companyId, (req as any).user!.companyId!));
  const guards = await guardsQuery;
  let usersQuery = db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  if ((req as any).user!.role !== 'super_admin') usersQuery = usersQuery.where(eq(usersTable.companyId, (req as any).user!.companyId!));
  const users = await usersQuery;
  res.json(leaves.map(l => ({ id: l.id, guardId: l.guardId, guardName: guardName(guards, users, l.guardId), type: l.type, startDate: l.startDate, endDate: l.endDate, reason: l.reason ?? null, status: l.status, reviewedBy: l.reviewedBy ?? null, reviewNotes: l.reviewNotes ?? null, createdAt: l.createdAt.toISOString() })));
});

router.post("/leave", async (req, res): Promise<void> => {
  const { guardId, type, startDate, endDate, reason } = req.body;
  if (!guardId || !type || !startDate || !endDate) { res.status(400).json({ error: "guardId, type, startDate, endDate required" }); return; }
  const [leave] = await db.insert(leaveRequestsTable).values({ companyId: (req as any).user!.companyId!, guardId, type, startDate, endDate, reason: reason ?? null, status: "pending" }).returning();
  res.status(201).json({ id: leave.id, guardId: leave.guardId, guardName: null, type: leave.type, startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason ?? null, status: leave.status, reviewedBy: null, reviewNotes: null, createdAt: leave.createdAt.toISOString() });
});

router.get("/leave/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(leaveRequestsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(leaveRequestsTable.companyId, (req as any).user!.companyId!));
  const [leave] = await db.select().from(leaveRequestsTable).where(and(...conditions));
  if (!leave) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: leave.id, guardId: leave.guardId, guardName: null, type: leave.type, startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason ?? null, status: leave.status, reviewedBy: leave.reviewedBy ?? null, reviewNotes: leave.reviewNotes ?? null, createdAt: leave.createdAt.toISOString() });
});

router.patch("/leave/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, reviewNotes, reviewedBy } = req.body;
  const updates: Record<string, any> = {};
  if (status !== undefined) updates.status = status;
  if (reviewNotes !== undefined) updates.reviewNotes = reviewNotes;
  if (reviewedBy !== undefined) updates.reviewedBy = reviewedBy;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(leaveRequestsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(leaveRequestsTable.companyId, (req as any).user!.companyId!));
  const [leave] = await db.update(leaveRequestsTable).set(updates).where(and(...conditions)).returning();
  if (!leave) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: leave.id, guardId: leave.guardId, guardName: null, type: leave.type, startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason ?? null, status: leave.status, reviewedBy: leave.reviewedBy ?? null, reviewNotes: leave.reviewNotes ?? null, createdAt: leave.createdAt.toISOString() });
});

// ─── Training ─────────────────────────────────────────────────────────────────
router.get("/training", async (req, res): Promise<void> => {
  const { status, type } = req.query as Record<string, string>;
  let q = db.select().from(trainingSessionsTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(trainingSessionsTable.companyId, (req as any).user!.companyId!));
  if (status) conditions.push(eq(trainingSessionsTable.status, status));
  if (type) conditions.push(eq(trainingSessionsTable.type, type));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const sessions = await q;
  res.json(sessions.map(s => ({ id: s.id, title: s.title, type: s.type, instructor: s.instructor ?? null, startDate: s.startDate, endDate: s.endDate ?? null, location: s.location ?? null, status: s.status, enrolledCount: s.enrolledCount, maxCapacity: s.maxCapacity ?? null, description: s.description ?? null, createdAt: s.createdAt.toISOString() })));
});

router.post("/training", async (req, res): Promise<void> => {
  const { title, type, instructor, startDate, endDate, location, status, maxCapacity, description } = req.body;
  if (!title || !type || !startDate) { res.status(400).json({ error: "title, type, startDate required" }); return; }
  const [session] = await db.insert(trainingSessionsTable).values({ companyId: (req as any).user!.companyId!, title, type, instructor: instructor ?? null, startDate, endDate: endDate ?? null, location: location ?? null, status: status ?? "scheduled", maxCapacity: maxCapacity ?? null, description: description ?? null }).returning();
  res.status(201).json({ id: session.id, title: session.title, type: session.type, instructor: session.instructor ?? null, startDate: session.startDate, endDate: session.endDate ?? null, location: session.location ?? null, status: session.status, enrolledCount: session.enrolledCount, maxCapacity: session.maxCapacity ?? null, description: session.description ?? null, createdAt: session.createdAt.toISOString() });
});

router.get("/training/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(trainingSessionsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(trainingSessionsTable.companyId, (req as any).user!.companyId!));
  const [session] = await db.select().from(trainingSessionsTable).where(and(...conditions));
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: session.id, title: session.title, type: session.type, instructor: session.instructor ?? null, startDate: session.startDate, endDate: session.endDate ?? null, location: session.location ?? null, status: session.status, enrolledCount: session.enrolledCount, maxCapacity: session.maxCapacity ?? null, description: session.description ?? null, createdAt: session.createdAt.toISOString() });
});

router.patch("/training/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { title, type, instructor, startDate, endDate, location, status, maxCapacity, description } = req.body;
  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = title;
  if (type !== undefined) updates.type = type;
  if (instructor !== undefined) updates.instructor = instructor;
  if (startDate !== undefined) updates.startDate = startDate;
  if (endDate !== undefined) updates.endDate = endDate;
  if (location !== undefined) updates.location = location;
  if (status !== undefined) updates.status = status;
  if (maxCapacity !== undefined) updates.maxCapacity = maxCapacity;
  if (description !== undefined) updates.description = description;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(trainingSessionsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(trainingSessionsTable.companyId, (req as any).user!.companyId!));
  const [session] = await db.update(trainingSessionsTable).set(updates).where(and(...conditions)).returning();
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: session.id, title: session.title, type: session.type, instructor: session.instructor ?? null, startDate: session.startDate, endDate: session.endDate ?? null, location: session.location ?? null, status: session.status, enrolledCount: session.enrolledCount, maxCapacity: session.maxCapacity ?? null, description: session.description ?? null, createdAt: session.createdAt.toISOString() });
});

// ─── Recruitment ──────────────────────────────────────────────────────────────
router.get("/recruitment", async (req, res): Promise<void> => {
  const { status, position } = req.query as Record<string, string>;
  let q = db.select().from(applicantsTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(applicantsTable.companyId, (req as any).user!.companyId!));
  if (status) conditions.push(eq(applicantsTable.status, status));
  if (position) conditions.push(eq(applicantsTable.position, position));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const applicants = await q;
  res.json(applicants.map(a => ({ id: a.id, position: a.position, applicantName: a.applicantName, email: a.email, phone: a.phone ?? null, status: a.status, appliedDate: a.appliedDate, interviewDate: a.interviewDate ?? null, notes: a.notes ?? null, resumeUrl: a.resumeUrl ?? null, createdAt: a.createdAt.toISOString() })));
});

router.post("/recruitment", async (req, res): Promise<void> => {
  const { position, applicantName, email, phone, appliedDate, notes, status } = req.body;
  if (!position || !applicantName || !email) { res.status(400).json({ error: "position, applicantName, email required" }); return; }
  const [applicant] = await db.insert(applicantsTable).values({ companyId: (req as any).user!.companyId!, position, applicantName, email, phone: phone ?? null, appliedDate: appliedDate ?? new Date().toISOString().split("T")[0], notes: notes ?? null, status: status ?? "applied" }).returning();
  res.status(201).json({ id: applicant.id, position: applicant.position, applicantName: applicant.applicantName, email: applicant.email, phone: applicant.phone ?? null, status: applicant.status, appliedDate: applicant.appliedDate, interviewDate: null, notes: applicant.notes ?? null, resumeUrl: null, createdAt: applicant.createdAt.toISOString() });
});

router.get("/recruitment/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(applicantsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(applicantsTable.companyId, (req as any).user!.companyId!));
  const [applicant] = await db.select().from(applicantsTable).where(and(...conditions));
  if (!applicant) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: applicant.id, position: applicant.position, applicantName: applicant.applicantName, email: applicant.email, phone: applicant.phone ?? null, status: applicant.status, appliedDate: applicant.appliedDate, interviewDate: applicant.interviewDate ?? null, notes: applicant.notes ?? null, resumeUrl: applicant.resumeUrl ?? null, createdAt: applicant.createdAt.toISOString() });
});

router.patch("/recruitment/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, interviewDate, notes } = req.body;
  const updates: Record<string, any> = {};
  if (status !== undefined) updates.status = status;
  if (interviewDate !== undefined) updates.interviewDate = interviewDate;
  if (notes !== undefined) updates.notes = notes;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(applicantsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(applicantsTable.companyId, (req as any).user!.companyId!));
  const [applicant] = await db.update(applicantsTable).set(updates).where(and(...conditions)).returning();
  if (!applicant) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: applicant.id, position: applicant.position, applicantName: applicant.applicantName, email: applicant.email, phone: applicant.phone ?? null, status: applicant.status, appliedDate: applicant.appliedDate, interviewDate: applicant.interviewDate ?? null, notes: applicant.notes ?? null, resumeUrl: applicant.resumeUrl ?? null, createdAt: applicant.createdAt.toISOString() });
});

export default router;
