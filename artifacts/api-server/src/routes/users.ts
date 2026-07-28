import { Router, type IRouter } from "express";
import bcrypt from 'bcrypt';
import { eq, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const { role, status } = req.query as Record<string, string>;
  let query = db.select().from(usersTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(usersTable.companyId, (req as any).user!.companyId!));
  if (role) conditions.push(eq(usersTable.role, role));
  if (status) conditions.push(eq(usersTable.status, status));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const users = await query;
  res.json(users.map(u => ({
    id: u.id, name: u.name, email: u.email, role: u.role, status: u.status,
    phone: u.phone ?? null, avatar: u.avatar ?? null, createdAt: u.createdAt.toISOString(),
  })));
});

router.post("/users", async (req, res): Promise<void> => {
  const { name, email, role, phone, status } = req.body;
  if (!name || !email) { res.status(400).json({ error: "name and email required" }); return; }
  const password = req.body.password;
  if (!password || password.length < 8) {
    res.status(400).json({ error: "password is required (min 8 characters)" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    companyId: (req as any).user!.companyId!, name, email, role: role ?? "guard", phone: phone ?? null, status: status ?? "active", passwordHash,
  }).returning();
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, phone: user.phone ?? null, avatar: user.avatar ?? null, createdAt: user.createdAt.toISOString() });
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(usersTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(usersTable.companyId, (req as any).user!.companyId!));
  const [user] = await db.select().from(usersTable).where(and(...conditions));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, phone: user.phone ?? null, avatar: user.avatar ?? null, createdAt: user.createdAt.toISOString() });
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, email, role, phone, status, avatar } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (phone !== undefined) updates.phone = phone;
  if (status !== undefined) updates.status = status;
  if (avatar !== undefined) updates.avatar = avatar;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(usersTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(usersTable.companyId, (req as any).user!.companyId!));
  const [user] = await db.update(usersTable).set(updates).where(and(...conditions)).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, phone: user.phone ?? null, avatar: user.avatar ?? null, createdAt: user.createdAt.toISOString() });
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(usersTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(usersTable.companyId, (req as any).user!.companyId!));
  await db.delete(usersTable).where(and(...conditions));
  res.json({ success: true });
});

export default router;
