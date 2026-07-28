import { Router, type IRouter } from "express";
import bcrypt from 'bcrypt';
import { eq, count, and } from "drizzle-orm";
import { db, guardsTable, usersTable, sitesTable } from "@workspace/db";

const router: IRouter = Router();

async function enrichGuard(g: any, users: any[], sites: any[]) {
  const user = users.find(u => u.id === g.userId);
  const site = sites.find(s => s.id === g.siteId);
  return {
    id: g.id, userId: g.userId, employeeId: g.employeeId,
    name: user?.name ?? null, email: user?.email ?? null, phone: user?.phone ?? null,
    licenseNumber: g.licenseNumber ?? null, status: g.status,
    siteId: g.siteId ?? null, siteName: site?.name ?? null,
    skills: g.skills ?? [], photo: g.photo ?? null, joinDate: g.joinDate ?? null,
    createdAt: g.createdAt.toISOString(),
  };
}

router.get("/guards", async (req, res): Promise<void> => {
  const { status, siteId } = req.query as Record<string, string>;
  let q = db.select().from(guardsTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(guardsTable.companyId, (req as any).user!.companyId!));
  if (status) conditions.push(eq(guardsTable.status, status));
  if (siteId) conditions.push(eq(guardsTable.siteId, parseInt(siteId, 10)));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const guards = await q;
  let usersQuery = db.select().from(usersTable);
  if ((req as any).user!.role !== 'super_admin') usersQuery = usersQuery.where(eq(usersTable.companyId, (req as any).user!.companyId!));
  const users = await usersQuery;
  let sitesQuery = db.select().from(sitesTable);
  if ((req as any).user!.role !== 'super_admin') sitesQuery = sitesQuery.where(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const sites = await sitesQuery;
  res.json(await Promise.all(guards.map(g => enrichGuard(g, users, sites))));
});

router.post("/guards", async (req, res): Promise<void> => {
  const { name, email, employeeId, phone, licenseNumber, status, siteId, skills, joinDate } = req.body;
  if (!name || !email || !employeeId) { res.status(400).json({ error: "name, email, employeeId required" }); return; }

  // Create user first
  const password = req.body.password;
  if (!password || password.length < 8) {
    res.status(400).json({ error: "password is required (min 8 characters)" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    companyId: (req as any).user!.companyId!, name, email, role: "guard", phone: phone ?? null, status: "active", passwordHash,
  }).returning();

  const [guard] = await db.insert(guardsTable).values({
    companyId: (req as any).user!.companyId!, userId: user.id, employeeId, licenseNumber: licenseNumber ?? null,
    status: status ?? "active", siteId: siteId ?? null, skills: skills ?? [],
    joinDate: joinDate ?? null,
  }).returning();

  let sitesQuery = db.select().from(sitesTable);
  if ((req as any).user!.role !== 'super_admin') sitesQuery = sitesQuery.where(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const sites = await sitesQuery;
  res.status(201).json(await enrichGuard(guard, [user], sites));
});

router.get("/guards/stats", async (_req, res): Promise<void> => {
  const cid = (req as any).user!.role !== 'super_admin' ? (req as any).user!.companyId! : null;
  const cnd = (tbl: any, conds: any[] = []) => cid ? and(eq(tbl.companyId, cid), ...conds) : (conds.length ? and(...conds) : undefined);
  const [total] = await db.select({ count: count() }).from(guardsTable).where(cnd(guardsTable));
  const [active] = await db.select({ count: count() }).from(guardsTable).where(cnd(guardsTable, [eq(guardsTable.status, "active")]));
  const [inactive] = await db.select({ count: count() }).from(guardsTable).where(cnd(guardsTable, [eq(guardsTable.status, "inactive")]));
  const [onLeave] = await db.select({ count: count() }).from(guardsTable).where(cnd(guardsTable, [eq(guardsTable.status, "on_leave")]));
  const [onDuty] = await db.select({ count: count() }).from(guardsTable).where(cnd(guardsTable, [eq(guardsTable.status, "on_duty")]));
  res.json({ total: total.count, active: active.count, inactive: inactive.count, onLeave: onLeave.count, onDuty: onDuty.count });
});

router.get("/guards/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(guardsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(guardsTable.companyId, (req as any).user!.companyId!));
  const [guard] = await db.select().from(guardsTable).where(and(...conditions));
  if (!guard) { res.status(404).json({ error: "Not found" }); return; }
  let usersQuery = db.select().from(usersTable);
  if ((req as any).user!.role !== 'super_admin') usersQuery = usersQuery.where(eq(usersTable.companyId, (req as any).user!.companyId!));
  const users = await usersQuery;
  let sitesQuery = db.select().from(sitesTable);
  if ((req as any).user!.role !== 'super_admin') sitesQuery = sitesQuery.where(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const sites = await sitesQuery;
  res.json(await enrichGuard(guard, users, sites));
});

router.patch("/guards/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { phone, licenseNumber, status, siteId, skills, name } = req.body;
  const updates: Record<string, any> = {};
  if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber;
  if (status !== undefined) updates.status = status;
  if (siteId !== undefined) updates.siteId = siteId;
  if (skills !== undefined) updates.skills = skills;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(guardsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(guardsTable.companyId, (req as any).user!.companyId!));
  const [guard] = await db.update(guardsTable).set(updates).where(and(...conditions)).returning();
  if (!guard) { res.status(404).json({ error: "Not found" }); return; }
  if (phone !== undefined || name !== undefined) {
    const userUpdates: Record<string, any> = {};
    if (phone !== undefined) userUpdates.phone = phone;
    if (name !== undefined) userUpdates.name = name;
    await db.update(usersTable).set(userUpdates).where(eq(usersTable.id, guard.userId));
  }
  let usersQuery = db.select().from(usersTable);
  if ((req as any).user!.role !== 'super_admin') usersQuery = usersQuery.where(eq(usersTable.companyId, (req as any).user!.companyId!));
  const users = await usersQuery;
  let sitesQuery = db.select().from(sitesTable);
  if ((req as any).user!.role !== 'super_admin') sitesQuery = sitesQuery.where(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const sites = await sitesQuery;
  res.json(await enrichGuard(guard, users, sites));
});

router.delete("/guards/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(guardsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(guardsTable.companyId, (req as any).user!.companyId!));
  await db.delete(guardsTable).where(and(...conditions));
  res.json({ success: true });
});

export default router;
