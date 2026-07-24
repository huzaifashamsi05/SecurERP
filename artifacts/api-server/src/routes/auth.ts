import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    // Auto-create demo session with first user
    const [first] = await db.select().from(usersTable).limit(1);
    if (!first) {
      res.status(401).json({ error: "No users in database" });
      return;
    }
    res.json({
      user: {
        id: first.id, name: first.name, email: first.email, role: first.role,
        status: first.status, phone: first.phone ?? null, avatar: first.avatar ?? null,
        createdAt: first.createdAt.toISOString(),
      },
    });
    return;
  }

  res.json({
    user: {
      id: user.id, name: user.name, email: user.email, role: user.role,
      status: user.status, phone: user.phone ?? null, avatar: user.avatar ?? null,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.get("/auth/me", async (_req, res): Promise<void> => {
  // Demo mode: return first admin user
  const [user] = await db.select().from(usersTable).where(eq(usersTable.role, "company_admin")).limit(1);
  if (!user) {
    const [any] = await db.select().from(usersTable).limit(1);
    if (!any) {
      res.status(401).json({ error: "No users found" });
      return;
    }
    res.json({
      id: any.id, name: any.name, email: any.email, role: any.role,
      status: any.status, phone: any.phone ?? null, avatar: any.avatar ?? null,
      createdAt: any.createdAt.toISOString(),
    });
    return;
  }
  res.json({
    id: user.id, name: user.name, email: user.email, role: user.role,
    status: user.status, phone: user.phone ?? null, avatar: user.avatar ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ success: true });
});

export default router;
