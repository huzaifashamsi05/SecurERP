import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const { unreadOnly } = req.query as Record<string, string>;
  let q = db.select().from(notificationsTable).$dynamic();
  if (unreadOnly === "true") q = q.where(eq(notificationsTable.read, false));
  const notifications = await q;
  res.json(notifications.map(n => ({
    id: n.id, userId: n.userId ?? null, type: n.type, title: n.title, message: n.message,
    read: n.read, entityId: n.entityId ?? null, entityType: n.entityType ?? null,
    createdAt: n.createdAt.toISOString(),
  })));
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [n] = await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, id)).returning();
  if (!n) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: n.id, userId: n.userId ?? null, type: n.type, title: n.title, message: n.message, read: n.read, entityId: n.entityId ?? null, entityType: n.entityType ?? null, createdAt: n.createdAt.toISOString() });
});

router.post("/notifications/mark-all-read", async (_req, res): Promise<void> => {
  await db.update(notificationsTable).set({ read: true });
  res.json({ success: true });
});

export default router;
