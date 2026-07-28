import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcrypt";
import {
  usersTable,
  companiesTable,
  guardsTable,
  clientsTable,
  sitesTable,
  shiftsTable,
  incidentsTable,
  dailyReportsTable,
  equipmentTable,
  vehiclesTable
} from "@workspace/db";

const { Client } = pg;

async function seedSaaS() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  console.log("Cleaning existing data...");
  await client.query(`
    TRUNCATE TABLE users, companies, guards, clients, sites, shifts, incidents, daily_reports, equipment, vehicles CASCADE;
  `);

  console.log("Seeding Multi-Tenant SaaS Demo Data...");
  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Super Admin
  const [superAdmin] = await db.insert(usersTable).values({
    name: "Ayan (Super Admin)",
    email: "superadmin@securerp.com",
    passwordHash,
    role: "super_admin",
    companyId: null,
  }).returning();
  console.log("✅ Created Super Admin");

  // 2. Create Companies
  const companies = await db.insert(companiesTable).values([
    { name: "Alpha Security Solutions", email: "contact@alphasec.com", phone: "123-456-7890", address: "123 Alpha St" },
    { name: "Bravo Patrols Inc", email: "contact@bravopatrols.com", phone: "987-654-3210", address: "456 Bravo Ave" },
    { name: "Charlie Elite Guards", email: "contact@charlieelite.com", phone: "555-123-4567", address: "789 Charlie Blvd" }
  ]).returning();
  console.log("✅ Created 3 Companies");

  for (const company of companies) {
    console.log(`\n--- Seeding Company: ${company.name} ---`);
    
    // Admin
    await db.insert(usersTable).values({
      name: `${company.name} Admin`,
      email: `admin@${company.name.split(" ")[0].toLowerCase()}.com`,
      passwordHash,
      role: "company_admin",
      companyId: company.id,
    });
    
    // HR & Ops & Finance & Field Supervisor
    await db.insert(usersTable).values([
      { name: `HR Manager (${company.name})`, email: `hr@${company.name.split(" ")[0].toLowerCase()}.com`, passwordHash, role: "hr_manager", companyId: company.id },
      { name: `Ops Manager (${company.name})`, email: `ops@${company.name.split(" ")[0].toLowerCase()}.com`, passwordHash, role: "operations_manager", companyId: company.id },
      { name: `Finance Manager (${company.name})`, email: `finance@${company.name.split(" ")[0].toLowerCase()}.com`, passwordHash, role: "finance_manager", companyId: company.id },
      { name: `Field Supervisor (${company.name})`, email: `supervisor@${company.name.split(" ")[0].toLowerCase()}.com`, passwordHash, role: "field_supervisor", companyId: company.id },
    ]);

    // Clients & Sites
    const clients = await db.insert(clientsTable).values([
      { companyId: company.id, name: `Client A (${company.name})`, email: `clientA@${company.id}.com` },
      { companyId: company.id, name: `Client B (${company.name})`, email: `clientB@${company.id}.com` }
    ]).returning();

    const sites = [];
    for (const c of clients) {
      // Create Client User Login
      await db.insert(usersTable).values({
        name: c.name,
        email: c.email,
        passwordHash,
        role: "client",
        companyId: company.id,
      });

      const siteRes = await db.insert(sitesTable).values([
        { companyId: company.id, clientId: c.id, name: `${c.name} HQ`, address: "123 Main St", requiredGuards: 2 },
        { companyId: company.id, clientId: c.id, name: `${c.name} Warehouse`, address: "456 Storage Rd", requiredGuards: 4 },
      ]).returning();
      sites.push(...siteRes);
    }

    // Guards
    const guardUsers = await db.insert(usersTable).values(
      Array.from({ length: 5 }).map((_, i) => ({
        name: `Guard ${i + 1} (${company.name})`,
        email: `guard${i + 1}@${company.name.split(" ")[0].toLowerCase()}.com`,
        passwordHash,
        role: "guard",
        companyId: company.id,
      }))
    ).returning();

    const guards = await db.insert(guardsTable).values(
      guardUsers.map((u, i) => ({
        companyId: company.id,
        userId: u.id,
        employeeId: `EMP-${company.id}-${i+1000}`,
        siteId: sites[i % sites.length].id,
      }))
    ).returning();

    // Equipment
    await db.insert(equipmentTable).values([
      { companyId: company.id, name: "Motorola Radio", type: "radio", assignedTo: guards[0].id },
      { companyId: company.id, name: "Flashlight PRO", type: "torch", assignedTo: guards[1].id },
    ]);

    // Vehicles
    await db.insert(vehiclesTable).values([
      { companyId: company.id, registration: `XYZ-${company.id}12`, make: "Ford", model: "Explorer" },
    ]);

    // Incidents
    await db.insert(incidentsTable).values([
      { companyId: company.id, siteId: sites[0].id, guardId: guards[0].id, type: "suspicious", severity: "low", description: "Suspicious vehicle spotted near back entrance." },
    ]);
  }

  console.log("\n🎉 Seeding Complete! Enjoy your Multi-Tenant SaaS.");
  await client.end();
}

seedSaaS().catch(console.error);
