import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db, companiesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Only Super Admins can access company endpoints
router.use(requireAuth);
// GET /companies
router.get("/companies", async (req, res): Promise<void> => {
  if (req.user?.role !== "super_admin") {
    res.status(403).json({ error: "Only super_admin can manage companies" });
    return;
  }
  const companies = await db.select().from(companiesTable);
  const users = await db.select({ id: usersTable.id, email: usersTable.email, companyId: usersTable.companyId, role: usersTable.role }).from(usersTable).where(eq(usersTable.role, "company_admin"));
  
  res.json(companies.map(c => {
    const admin = users.find(u => u.companyId === c.id);
    return {
      ...c,
      adminEmail: admin?.email ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }));
});

// POST /companies
router.post("/companies", async (req, res): Promise<void> => {
  if (req.user?.role !== "super_admin") {
    res.status(403).json({ error: "Only super_admin can manage companies" });
    return;
  }
  const { name, email, phone, address, status, adminPassword } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  try {
    // We use a transaction because we need to create the company AND the company admin user
    const result = await db.transaction(async (tx) => {
      const [company] = await tx.insert(companiesTable).values({
        name,
        email,
        phone: phone ?? null,
        address: address ?? null,
        status: status ?? "active",
      }).returning();

      // Create the primary Company Admin
      const passwordHash = await bcrypt.hash(adminPassword || "password123", 12);
      const [admin] = await tx.insert(usersTable).values({
        name: `${name} Admin`,
        email: email, // use company email for admin
        passwordHash,
        role: "company_admin",
        companyId: company.id,
      }).returning();

      return { company, admin };
    });

    res.status(201).json({
      ...result.company,
      adminEmail: result.admin.email,
      createdAt: result.company.createdAt.toISOString()
    });
  } catch (err: any) {
    if (err.code === "23505") { // unique constraint violation
      res.status(409).json({ error: "Company or Admin email already exists" });
      return;
    }
    console.error("Error creating company:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
