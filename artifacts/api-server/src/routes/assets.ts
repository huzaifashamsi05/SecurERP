import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
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
  if (status) q = q.where(eq(equipmentTable.status, status));
  if (assignedTo) q = q.where(eq(equipmentTable.assignedTo, parseInt(assignedTo, 10)));
  const items = await q;
  const guards = await db.select({ id: guardsTable.id, userId: guardsTable.userId }).from(guardsTable);
  const users = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  res.json(items.map(i => ({ id: i.id, name: i.name, type: i.type, serialNumber: i.serialNumber ?? null, status: i.status, assignedTo: i.assignedTo ?? null, assignedToName: guardName(guards, users, i.assignedTo), purchaseDate: i.purchaseDate ?? null, condition: i.condition, createdAt: i.createdAt.toISOString() })));
});

router.post("/equipment", async (req, res): Promise<void> => {
  const { name, type, serialNumber, status, assignedTo, purchaseDate, condition } = req.body;
  if (!name || !type) { res.status(400).json({ error: "name and type required" }); return; }
  const [item] = await db.insert(equipmentTable).values({ name, type, serialNumber: serialNumber ?? null, status: status ?? "available", assignedTo: assignedTo ?? null, purchaseDate: purchaseDate ?? null, condition: condition ?? "good" }).returning();
  res.status(201).json({ id: item.id, name: item.name, type: item.type, serialNumber: item.serialNumber ?? null, status: item.status, assignedTo: item.assignedTo ?? null, assignedToName: null, purchaseDate: item.purchaseDate ?? null, condition: item.condition, createdAt: item.createdAt.toISOString() });
});

router.get("/equipment/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [item] = await db.select().from(equipmentTable).where(eq(equipmentTable.id, id));
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
  const [item] = await db.update(equipmentTable).set(updates).where(eq(equipmentTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: item.id, name: item.name, type: item.type, serialNumber: item.serialNumber ?? null, status: item.status, assignedTo: item.assignedTo ?? null, assignedToName: null, purchaseDate: item.purchaseDate ?? null, condition: item.condition, createdAt: item.createdAt.toISOString() });
});

router.delete("/equipment/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(equipmentTable).where(eq(equipmentTable.id, id));
  res.json({ success: true });
});

// ─── Vehicles ─────────────────────────────────────────────────────────────────
router.get("/vehicles", async (req, res): Promise<void> => {
  const { status } = req.query as Record<string, string>;
  let q = db.select().from(vehiclesTable).$dynamic();
  if (status) q = q.where(eq(vehiclesTable.status, status));
  const vehicles = await q;
  const guards = await db.select({ id: guardsTable.id, userId: guardsTable.userId }).from(guardsTable);
  const users = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  res.json(vehicles.map(v => ({ id: v.id, registration: v.registration, make: v.make, model: v.model, year: v.year ?? null, status: v.status, assignedTo: v.assignedTo ?? null, assignedToName: guardName(guards, users, v.assignedTo), mileage: v.mileage ?? null, lastService: v.lastService ?? null, createdAt: v.createdAt.toISOString() })));
});

router.post("/vehicles", async (req, res): Promise<void> => {
  const { registration, make, model, year, status, assignedTo, mileage } = req.body;
  if (!registration || !make || !model) { res.status(400).json({ error: "registration, make, model required" }); return; }
  const [v] = await db.insert(vehiclesTable).values({ registration, make, model, year: year ?? null, status: status ?? "available", assignedTo: assignedTo ?? null, mileage: mileage ?? null }).returning();
  res.status(201).json({ id: v.id, registration: v.registration, make: v.make, model: v.model, year: v.year ?? null, status: v.status, assignedTo: v.assignedTo ?? null, assignedToName: null, mileage: v.mileage ?? null, lastService: null, createdAt: v.createdAt.toISOString() });
});

router.get("/vehicles/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [v] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, id));
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
  const [v] = await db.update(vehiclesTable).set(updates).where(eq(vehiclesTable.id, id)).returning();
  if (!v) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: v.id, registration: v.registration, make: v.make, model: v.model, year: v.year ?? null, status: v.status, assignedTo: v.assignedTo ?? null, assignedToName: null, mileage: v.mileage ?? null, lastService: v.lastService ?? null, createdAt: v.createdAt.toISOString() });
});

export default router;
