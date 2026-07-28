import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, equipmentTable, vehiclesTable, guardsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

function guardName(guards: any[], users: any[], guardId: number | null | undefined) {
  if (guardId == null) return null;
  const g = guards.find(x => x.id === guardId);
  const u = g ? users.find(x => x.id === g.userId) : null;
  return u?.name ?? null;
}

// ─── Equipment ────────────────────────────────────────────────────────────────
router.get("/equipment", async (req, res): Promise<void> => {
  const { status, assignedTo } = req.query as Record<string, string>;
  let q = db.select().from(equipmentTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(equipmentTable.companyId, (req as any).user!.companyId!));
  if (status) conditions.push(eq(equipmentTable.status, status));
  if (assignedTo) conditions.push(eq(equipmentTable.assignedTo, parseInt(assignedTo, 10)));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const items = await q;
  const guards = await db.select({ id: guardsTable.id, userId: guardsTable.userId }).from(guardsTable);
  const users = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  res.json(items.map(i => ({ id: i.id, name: i.name, type: i.type, serialNumber: i.serialNumber ?? null, status: i.status, assignedTo: i.assignedTo ?? null, assignedToName: guardName(guards, users, i.assignedTo), purchaseDate: i.purchaseDate ?? null, condition: i.condition, createdAt: i.createdAt.toISOString() })));
});

router.post("/equipment", async (req, res): Promise<void> => {
  const { name, type, serialNumber, status, assignedTo, purchaseDate, condition } = req.body;
  if (!name || !type) { res.status(400).json({ error: "name and type required" }); return; }
  const [item] = await db.insert(equipmentTable).values({ companyId: (req as any).user!.companyId!, name, type, serialNumber: serialNumber ?? null, status: status ?? "available", assignedTo: assignedTo ?? null, purchaseDate: purchaseDate ?? null, condition: condition ?? "good" }).returning();
  res.status(201).json({ id: item.id, name: item.name, type: item.type, serialNumber: item.serialNumber ?? null, status: item.status, assignedTo: item.assignedTo ?? null, assignedToName: null, purchaseDate: item.purchaseDate ?? null, condition: item.condition, createdAt: item.createdAt.toISOString() });
});

router.get("/equipment/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(equipmentTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(equipmentTable.companyId, (req as any).user!.companyId!));
  const [item] = await db.select().from(equipmentTable).where(and(...conditions));
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: item.id, name: item.name, type: item.type, serialNumber: item.serialNumber ?? null, status: item.status, assignedTo: item.assignedTo ?? null, assignedToName: null, purchaseDate: item.purchaseDate ?? null, condition: item.condition, createdAt: item.createdAt.toISOString() });
});

router.patch("/equipment/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, type, serialNumber, status, assignedTo, condition } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;
  if (serialNumber !== undefined) updates.serialNumber = serialNumber;
  if (status !== undefined) updates.status = status;
  if (assignedTo !== undefined) updates.assignedTo = assignedTo;
  if (condition !== undefined) updates.condition = condition;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(equipmentTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(equipmentTable.companyId, (req as any).user!.companyId!));
  const [item] = await db.update(equipmentTable).set(updates).where(and(...conditions)).returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: item.id, name: item.name, type: item.type, serialNumber: item.serialNumber ?? null, status: item.status, assignedTo: item.assignedTo ?? null, assignedToName: null, purchaseDate: item.purchaseDate ?? null, condition: item.condition, createdAt: item.createdAt.toISOString() });
});

router.delete("/equipment/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(equipmentTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(equipmentTable.companyId, (req as any).user!.companyId!));
  await db.delete(equipmentTable).where(and(...conditions));
  res.json({ success: true });
});

// ─── Vehicles ─────────────────────────────────────────────────────────────────
router.get("/vehicles", async (req, res): Promise<void> => {
  const { status } = req.query as Record<string, string>;
  let q = db.select().from(vehiclesTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(vehiclesTable.companyId, (req as any).user!.companyId!));
  if (status) conditions.push(eq(vehiclesTable.status, status));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const vehicles = await q;
  const guards = await db.select({ id: guardsTable.id, userId: guardsTable.userId }).from(guardsTable);
  const users = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  res.json(vehicles.map(v => ({ id: v.id, registration: v.registration, make: v.make, model: v.model, year: v.year ?? null, status: v.status, assignedTo: v.assignedTo ?? null, assignedToName: guardName(guards, users, v.assignedTo), mileage: v.mileage ?? null, lastService: v.lastService ?? null, createdAt: v.createdAt.toISOString() })));
});

router.post("/vehicles", async (req, res): Promise<void> => {
  const { registration, make, model, year, status, assignedTo, mileage } = req.body;
  if (!registration || !make || !model) { res.status(400).json({ error: "registration, make, model required" }); return; }
  const [v] = await db.insert(vehiclesTable).values({ companyId: (req as any).user!.companyId!, registration, make, model, year: year ?? null, status: status ?? "available", assignedTo: assignedTo ?? null, mileage: mileage ?? null }).returning();
  res.status(201).json({ id: v.id, registration: v.registration, make: v.make, model: v.model, year: v.year ?? null, status: v.status, assignedTo: v.assignedTo ?? null, assignedToName: null, mileage: v.mileage ?? null, lastService: null, createdAt: v.createdAt.toISOString() });
});

router.get("/vehicles/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(vehiclesTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(vehiclesTable.companyId, (req as any).user!.companyId!));
  const [v] = await db.select().from(vehiclesTable).where(and(...conditions));
  if (!v) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: v.id, registration: v.registration, make: v.make, model: v.model, year: v.year ?? null, status: v.status, assignedTo: v.assignedTo ?? null, assignedToName: null, mileage: v.mileage ?? null, lastService: v.lastService ?? null, createdAt: v.createdAt.toISOString() });
});

router.patch("/vehicles/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { registration, make, model, status, assignedTo, mileage, lastService } = req.body;
  const updates: Record<string, any> = {};
  if (registration !== undefined) updates.registration = registration;
  if (make !== undefined) updates.make = make;
  if (model !== undefined) updates.model = model;
  if (status !== undefined) updates.status = status;
  if (assignedTo !== undefined) updates.assignedTo = assignedTo;
  if (mileage !== undefined) updates.mileage = mileage;
  if (lastService !== undefined) updates.lastService = lastService;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(vehiclesTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(vehiclesTable.companyId, (req as any).user!.companyId!));
  const [v] = await db.update(vehiclesTable).set(updates).where(and(...conditions)).returning();
  if (!v) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: v.id, registration: v.registration, make: v.make, model: v.model, year: v.year ?? null, status: v.status, assignedTo: v.assignedTo ?? null, assignedToName: null, mileage: v.mileage ?? null, lastService: v.lastService ?? null, createdAt: v.createdAt.toISOString() });
});

export default router;
