import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, clientsTable, sitesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/clients", async (req, res): Promise<void> => {
  const { status } = req.query as Record<string, string>;
  let q = db.select().from(clientsTable).$dynamic();
  if (status) q = q.where(eq(clientsTable.status, status));
  const clients = await q;
  const siteCounts = await db.select({ clientId: sitesTable.clientId, cnt: count() }).from(sitesTable).groupBy(sitesTable.clientId);
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
  const [client] = await db.insert(clientsTable).values({ name, email, phone, address, contactPerson, industry, status: status ?? "active" }).returning();
  res.status(201).json({ id: client.id, name: client.name, email: client.email, phone: client.phone ?? null, address: client.address ?? null, contactPerson: client.contactPerson ?? null, industry: client.industry ?? null, status: client.status, siteCount: 0, createdAt: client.createdAt.toISOString() });
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
  if (!client) { res.status(404).json({ error: "Not found" }); return; }
  const [siteCnt] = await db.select({ cnt: count() }).from(sitesTable).where(eq(sitesTable.clientId, id));
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
  const [client] = await db.update(clientsTable).set(updates).where(eq(clientsTable.id, id)).returning();
  if (!client) { res.status(404).json({ error: "Not found" }); return; }
  const [siteCnt] = await db.select({ cnt: count() }).from(sitesTable).where(eq(sitesTable.clientId, id));
  res.json({ id: client.id, name: client.name, email: client.email, phone: client.phone ?? null, address: client.address ?? null, contactPerson: client.contactPerson ?? null, industry: client.industry ?? null, status: client.status, siteCount: siteCnt.cnt, createdAt: client.createdAt.toISOString() });
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(clientsTable).where(eq(clientsTable.id, id));
  res.json({ success: true });
});

// ── Sites ────────────────────────────────────────────────────────────────────
router.get("/sites", async (req, res): Promise<void> => {
  const { clientId, status } = req.query as Record<string, string>;
  let q = db.select().from(sitesTable).$dynamic();
  if (clientId) q = q.where(eq(sitesTable.clientId, parseInt(clientId, 10)));
  if (status) q = q.where(eq(sitesTable.status, status));
  const sites = await q;
  const clients = await db.select({ id: clientsTable.id, name: clientsTable.name }).from(clientsTable);
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
    clientId, name, address,
    latitude: latitude ? String(latitude) : null,
    longitude: longitude ? String(longitude) : null,
    requiredGuards: requiredGuards ?? 1, status: status ?? "active",
  }).returning();
  res.status(201).json({ id: site.id, clientId: site.clientId, clientName: null, name: site.name, address: site.address, latitude: null, longitude: null, guardCount: 0, requiredGuards: site.requiredGuards, status: site.status, createdAt: site.createdAt.toISOString() });
});

router.get("/sites/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [site] = await db.select().from(sitesTable).where(eq(sitesTable.id, id));
  if (!site) { res.status(404).json({ error: "Not found" }); return; }
  const [client] = await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, site.clientId));
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
  const [site] = await db.update(sitesTable).set(updates).where(eq(sitesTable.id, id)).returning();
  if (!site) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: site.id, clientId: site.clientId, clientName: null, name: site.name, address: site.address, latitude: site.latitude ? parseFloat(site.latitude) : null, longitude: site.longitude ? parseFloat(site.longitude) : null, guardCount: 0, requiredGuards: site.requiredGuards, status: site.status, createdAt: site.createdAt.toISOString() });
});

router.delete("/sites/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(sitesTable).where(eq(sitesTable.id, id));
  res.json({ success: true });
});

export default router;
