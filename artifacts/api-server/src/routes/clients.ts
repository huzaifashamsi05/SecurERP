import { Router, type IRouter } from "express";
import { eq, count, and } from "drizzle-orm";
import { db, clientsTable, sitesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/clients", async (req, res): Promise<void> => {
  const { status } = req.query as Record<string, string>;
  let q = db.select().from(clientsTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(clientsTable.companyId, (req as any).user!.companyId!));
  if (status) conditions.push(eq(clientsTable.status, status));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const clients = await q;
  let siteCountsQuery = db.select({ clientId: sitesTable.clientId, cnt: count() }).from(sitesTable);
  if ((req as any).user!.role !== 'super_admin') siteCountsQuery = siteCountsQuery.where(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const siteCounts = await siteCountsQuery.groupBy(sitesTable.clientId);
  const countMap: Record<number, number> = {};
  siteCounts.forEach(r => { countMap[r.clientId] = r.cnt; });
  res.json(clients.map(c => ({
    id: c.id, name: c.name, email: c.email, phone: c.phone ?? null,
    address: c.address ?? null, contactPerson: c.contactPerson ?? null,
    industry: c.industry ?? null, status: c.status,
    siteCount: countMap[c.id] ?? 0, createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/clients", async (req, res): Promise<void> => {
  const { name, email, phone, address, contactPerson, industry, status } = req.body;
  if (!name || !email) { res.status(400).json({ error: "name and email required" }); return; }
  const [client] = await db.insert(clientsTable).values({ companyId: (req as any).user!.companyId!, name, email, phone, address, contactPerson, industry, status: status ?? "active" }).returning();
  res.status(201).json({ id: client.id, name: client.name, email: client.email, phone: client.phone ?? null, address: client.address ?? null, contactPerson: client.contactPerson ?? null, industry: client.industry ?? null, status: client.status, siteCount: 0, createdAt: client.createdAt.toISOString() });
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(clientsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(clientsTable.companyId, (req as any).user!.companyId!));
  const [client] = await db.select().from(clientsTable).where(and(...conditions));
  if (!client) { res.status(404).json({ error: "Not found" }); return; }
  const siteConditions = [eq(sitesTable.clientId, id)];
  if ((req as any).user!.role !== 'super_admin') siteConditions.push(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const [siteCnt] = await db.select({ cnt: count() }).from(sitesTable).where(and(...siteConditions));
  res.json({ id: client.id, name: client.name, email: client.email, phone: client.phone ?? null, address: client.address ?? null, contactPerson: client.contactPerson ?? null, industry: client.industry ?? null, status: client.status, siteCount: siteCnt.cnt, createdAt: client.createdAt.toISOString() });
});

router.patch("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, email, phone, address, contactPerson, industry, status } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (address !== undefined) updates.address = address;
  if (contactPerson !== undefined) updates.contactPerson = contactPerson;
  if (industry !== undefined) updates.industry = industry;
  if (status !== undefined) updates.status = status;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(clientsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(clientsTable.companyId, (req as any).user!.companyId!));
  const [client] = await db.update(clientsTable).set(updates).where(and(...conditions)).returning();
  if (!client) { res.status(404).json({ error: "Not found" }); return; }
  const siteConditions = [eq(sitesTable.clientId, id)];
  if ((req as any).user!.role !== 'super_admin') siteConditions.push(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const [siteCnt] = await db.select({ cnt: count() }).from(sitesTable).where(and(...siteConditions));
  res.json({ id: client.id, name: client.name, email: client.email, phone: client.phone ?? null, address: client.address ?? null, contactPerson: client.contactPerson ?? null, industry: client.industry ?? null, status: client.status, siteCount: siteCnt.cnt, createdAt: client.createdAt.toISOString() });
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(clientsTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(clientsTable.companyId, (req as any).user!.companyId!));
  await db.delete(clientsTable).where(and(...conditions));
  res.json({ success: true });
});

// ── Sites ────────────────────────────────────────────────────────────────────
router.get("/sites", async (req, res): Promise<void> => {
  const { clientId, status } = req.query as Record<string, string>;
  let q = db.select().from(sitesTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(sitesTable.companyId, (req as any).user!.companyId!));
  if (clientId) conditions.push(eq(sitesTable.clientId, parseInt(clientId, 10)));
  if (status) conditions.push(eq(sitesTable.status, status));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const sites = await q;
  let clientsQuery = db.select({ id: clientsTable.id, name: clientsTable.name }).from(clientsTable);
  if ((req as any).user!.role !== 'super_admin') clientsQuery = clientsQuery.where(eq(clientsTable.companyId, (req as any).user!.companyId!));
  const clients = await clientsQuery;
  const clientMap: Record<number, string> = {};
  clients.forEach(c => { clientMap[c.id] = c.name; });
  res.json(sites.map(s => ({
    id: s.id, clientId: s.clientId, clientName: clientMap[s.clientId] ?? null,
    name: s.name, address: s.address,
    latitude: s.latitude ? parseFloat(s.latitude) : null,
    longitude: s.longitude ? parseFloat(s.longitude) : null,
    guardCount: 0, requiredGuards: s.requiredGuards, status: s.status,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/sites", async (req, res): Promise<void> => {
  const { clientId, name, address, latitude, longitude, requiredGuards, status } = req.body;
  if (!clientId || !name || !address) { res.status(400).json({ error: "clientId, name, address required" }); return; }
  const [site] = await db.insert(sitesTable).values({
    companyId: (req as any).user!.companyId!, clientId, name, address,
    latitude: latitude ? String(latitude) : null,
    longitude: longitude ? String(longitude) : null,
    requiredGuards: requiredGuards ?? 1, status: status ?? "active",
  }).returning();
  res.status(201).json({ id: site.id, clientId: site.clientId, clientName: null, name: site.name, address: site.address, latitude: null, longitude: null, guardCount: 0, requiredGuards: site.requiredGuards, status: site.status, createdAt: site.createdAt.toISOString() });
});

router.get("/sites/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(sitesTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const [site] = await db.select().from(sitesTable).where(and(...conditions));
  if (!site) { res.status(404).json({ error: "Not found" }); return; }
  const clientConditions = [eq(clientsTable.id, site.clientId)];
  if ((req as any).user!.role !== 'super_admin') clientConditions.push(eq(clientsTable.companyId, (req as any).user!.companyId!));
  const [client] = await db.select({ name: clientsTable.name }).from(clientsTable).where(and(...clientConditions));
  res.json({ id: site.id, clientId: site.clientId, clientName: client?.name ?? null, name: site.name, address: site.address, latitude: site.latitude ? parseFloat(site.latitude) : null, longitude: site.longitude ? parseFloat(site.longitude) : null, guardCount: 0, requiredGuards: site.requiredGuards, status: site.status, createdAt: site.createdAt.toISOString() });
});

router.patch("/sites/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, address, latitude, longitude, requiredGuards, status } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (address !== undefined) updates.address = address;
  if (latitude !== undefined) updates.latitude = String(latitude);
  if (longitude !== undefined) updates.longitude = String(longitude);
  if (requiredGuards !== undefined) updates.requiredGuards = requiredGuards;
  if (status !== undefined) updates.status = status;
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(sitesTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(sitesTable.companyId, (req as any).user!.companyId!));
  const [site] = await db.update(sitesTable).set(updates).where(and(...conditions)).returning();
  if (!site) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: site.id, clientId: site.clientId, clientName: null, name: site.name, address: site.address, latitude: site.latitude ? parseFloat(site.latitude) : null, longitude: site.longitude ? parseFloat(site.longitude) : null, guardCount: 0, requiredGuards: site.requiredGuards, status: site.status, createdAt: site.createdAt.toISOString() });
});

router.delete("/sites/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(sitesTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(sitesTable.companyId, (req as any).user!.companyId!));
  await db.delete(sitesTable).where(and(...conditions));
  res.json({ success: true });
});

export default router;
