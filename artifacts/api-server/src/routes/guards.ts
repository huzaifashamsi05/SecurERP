import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
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
  if (status) q = q.where(eq(guardsTable.status, status));
  if (siteId) q = q.where(eq(guardsTable.siteId, parseInt(siteId, 10)));
  const guards = await q;
  const users = await db.select().from(usersTable);
  const sites = await db.select().from(sitesTable);
  res.json(await Promise.all(guards.map(g => enrichGuard(g, users, sites))));
});

router.post("/guards", async (req, res): Promise<void> => {
  const { name, email, employeeId, phone, licenseNumber, status, siteId, skills, joinDate } = req.body;
  if (!name || !email || !employeeId) { res.status(400).json({ error: "name, email, employeeId required" }); return; }

  // Create user first
  const [user] = await db.insert(usersTable).values({
    name, email, role: "guard", phone: phone ?? null, status: "active", passwordHash: "password",
  }).returning();

  const [guard] = await db.insert(guardsTable).values({
    userId: user.id, employeeId, licenseNumber: licenseNumber ?? null,
    status: status ?? "active", siteId: siteId ?? null, skills: skills ?? [],
    joinDate: joinDate ?? null,
  }).returning();

  const sites = await db.select().from(sitesTable);
  res.status(201).json(await enrichGuard(guard, [user], sites));
});

router.get("/guards/stats", async (_req, res): Promise<void> => {
  const [total] = await db.select({ count: count() }).from(guardsTable);
  const [active] = await db.select({ count: count() }).from(guardsTable).where(eq(guardsTable.status, "active"));
  const [inactive] = await db.select({ count: count() }).from(guardsTable).where(eq(guardsTable.status, "inactive"));
  const [onLeave] = await db.select({ count: count() }).from(guardsTable).where(eq(guardsTable.status, "on_leave"));
  const [onDuty] = await db.select({ count: count() }).from(guardsTable).where(eq(guardsTable.status, "on_duty"));
  res.json({ total: total.count, active: active.count, inactive: inactive.count, onLeave: onLeave.count, onDuty: onDuty.count });
});

router.get("/guards/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [guard] = await db.select().from(guardsTable).where(eq(guardsTable.id, id));
  if (!guard) { res.status(404).json({ error: "Not found" }); return; }
  const users = await db.select().from(usersTable);
  const sites = await db.select().from(sitesTable);
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
  const [guard] = await db.update(guardsTable).set(updates).where(eq(guardsTable.id, id)).returning();
  if (!guard) { res.status(404).json({ error: "Not found" }); return; }
  if (phone !== undefined || name !== undefined) {
    const userUpdates: Record<string, any> = {};
    if (phone !== undefined) userUpdates.phone = phone;
    if (name !== undefined) userUpdates.name = name;
    await db.update(usersTable).set(userUpdates).where(eq(usersTable.id, guard.userId));
  }
  const users = await db.select().from(usersTable);
  const sites = await db.select().from(sitesTable);
  res.json(await enrichGuard(guard, users, sites));
});

router.delete("/guards/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(guardsTable).where(eq(guardsTable.id, id));
  res.json({ success: true });
});

export default router;
