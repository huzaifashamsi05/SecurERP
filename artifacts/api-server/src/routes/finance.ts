import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, payrollTable, invoicesTable, expensesTable, guardsTable, usersTable, clientsTable } from "@workspace/db";

const router: IRouter = Router();

function isoOrNull(d: Date | null | undefined) { return d ? d.toISOString() : null; }
function guardName(guards: any[], users: any[], guardId: number) {
  const g = guards.find(x => x.id === guardId);
  const u = g ? users.find(x => x.id === g.userId) : null;
  return u?.name ?? null;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────
router.get("/payroll/summary", async (_req, res): Promise<void> => {
  const [totalRow] = await db.select({ total: sql<string>`COALESCE(SUM(net_salary), 0)` }).from(payrollTable);
  const [paidRow] = await db.select({ total: sql<string>`COALESCE(SUM(net_salary), 0)` }).from(payrollTable).where(eq(payrollTable.status, "paid"));
  const [pendingRow] = await db.select({ total: sql<string>`COALESCE(SUM(net_salary), 0)` }).from(payrollTable).where(eq(payrollTable.status, "pending"));
  const [guardCount] = await db.select({ cnt: sql<number>`COUNT(DISTINCT guard_id)` }).from(payrollTable);
  res.json({ totalPayroll: parseFloat(totalRow.total), paid: parseFloat(paidRow.total), pending: parseFloat(pendingRow.total), totalGuards: Number(guardCount.cnt) });
});

router.get("/payroll", async (req, res): Promise<void> => {
  const { guardId, period, status } = req.query as Record<string, string>;
  let q = db.select().from(payrollTable).$dynamic();
  if (guardId) q = q.where(eq(payrollTable.guardId, parseInt(guardId, 10)));
  if (period) q = q.where(eq(payrollTable.period, period));
  if (status) q = q.where(eq(payrollTable.status, status));
  const records = await q;
  const guards = await db.select({ id: guardsTable.id, userId: guardsTable.userId }).from(guardsTable);
  const users = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  res.json(records.map(r => ({ id: r.id, guardId: r.guardId, guardName: guardName(guards, users, r.guardId), period: r.period, basicSalary: parseFloat(r.basicSalary), allowances: parseFloat(r.allowances), deductions: parseFloat(r.deductions), netSalary: parseFloat(r.netSalary), status: r.status, paidAt: isoOrNull(r.paidAt), createdAt: r.createdAt.toISOString() })));
});

router.post("/payroll", async (req, res): Promise<void> => {
  const { guardId, period, basicSalary, allowances, deductions, status } = req.body;
  if (!guardId || !period || basicSalary == null) { res.status(400).json({ error: "guardId, period, basicSalary required" }); return; }
  const net = basicSalary + (allowances ?? 0) - (deductions ?? 0);
  const [rec] = await db.insert(payrollTable).values({ guardId, period, basicSalary: String(basicSalary), allowances: String(allowances ?? 0), deductions: String(deductions ?? 0), netSalary: String(net), status: status ?? "pending" }).returning();
  res.status(201).json({ id: rec.id, guardId: rec.guardId, guardName: null, period: rec.period, basicSalary: parseFloat(rec.basicSalary), allowances: parseFloat(rec.allowances), deductions: parseFloat(rec.deductions), netSalary: parseFloat(rec.netSalary), status: rec.status, paidAt: null, createdAt: rec.createdAt.toISOString() });
});

router.get("/payroll/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [rec] = await db.select().from(payrollTable).where(eq(payrollTable.id, id));
  if (!rec) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: rec.id, guardId: rec.guardId, guardName: null, period: rec.period, basicSalary: parseFloat(rec.basicSalary), allowances: parseFloat(rec.allowances), deductions: parseFloat(rec.deductions), netSalary: parseFloat(rec.netSalary), status: rec.status, paidAt: isoOrNull(rec.paidAt), createdAt: rec.createdAt.toISOString() });
});

router.patch("/payroll/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { basicSalary, allowances, deductions, status, paidAt } = req.body;
  const updates: Record<string, any> = {};
  if (basicSalary !== undefined) updates.basicSalary = String(basicSalary);
  if (allowances !== undefined) updates.allowances = String(allowances);
  if (deductions !== undefined) updates.deductions = String(deductions);
  if (basicSalary !== undefined || allowances !== undefined || deductions !== undefined) {
    const cur = await db.select().from(payrollTable).where(eq(payrollTable.id, id));
    if (cur[0]) {
      const bs = basicSalary ?? parseFloat(cur[0].basicSalary);
      const al = allowances ?? parseFloat(cur[0].allowances);
      const de = deductions ?? parseFloat(cur[0].deductions);
      updates.netSalary = String(bs + al - de);
    }
  }
  if (status !== undefined) updates.status = status;
  if (paidAt !== undefined) updates.paidAt = paidAt ? new Date(paidAt) : null;
  const [rec] = await db.update(payrollTable).set(updates).where(eq(payrollTable.id, id)).returning();
  if (!rec) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: rec.id, guardId: rec.guardId, guardName: null, period: rec.period, basicSalary: parseFloat(rec.basicSalary), allowances: parseFloat(rec.allowances), deductions: parseFloat(rec.deductions), netSalary: parseFloat(rec.netSalary), status: rec.status, paidAt: isoOrNull(rec.paidAt), createdAt: rec.createdAt.toISOString() });
});

// ─── Invoices ─────────────────────────────────────────────────────────────────
router.get("/invoices", async (req, res): Promise<void> => {
  const { clientId, status } = req.query as Record<string, string>;
  let q = db.select().from(invoicesTable).$dynamic();
  if (clientId) q = q.where(eq(invoicesTable.clientId, parseInt(clientId, 10)));
  if (status) q = q.where(eq(invoicesTable.status, status));
  const invoices = await q;
  const clients = await db.select({ id: clientsTable.id, name: clientsTable.name }).from(clientsTable);
  const clientMap: Record<number, string> = {};
  clients.forEach(c => { clientMap[c.id] = c.name; });
  res.json(invoices.map(i => ({ id: i.id, clientId: i.clientId, clientName: clientMap[i.clientId] ?? null, invoiceNumber: i.invoiceNumber, period: i.period ?? null, amount: parseFloat(i.amount), tax: parseFloat(i.tax), totalAmount: parseFloat(i.totalAmount), status: i.status, dueDate: i.dueDate, paidAt: isoOrNull(i.paidAt), notes: i.notes ?? null, createdAt: i.createdAt.toISOString() })));
});

router.post("/invoices", async (req, res): Promise<void> => {
  const { clientId, invoiceNumber, period, amount, tax, dueDate, notes, status } = req.body;
  if (!clientId || !invoiceNumber || amount == null || !dueDate) { res.status(400).json({ error: "clientId, invoiceNumber, amount, dueDate required" }); return; }
  const taxAmt = tax ?? 0;
  const total = amount + taxAmt;
  const [inv] = await db.insert(invoicesTable).values({ clientId, invoiceNumber, period: period ?? null, amount: String(amount), tax: String(taxAmt), totalAmount: String(total), status: status ?? "draft", dueDate, notes: notes ?? null }).returning();
  res.status(201).json({ id: inv.id, clientId: inv.clientId, clientName: null, invoiceNumber: inv.invoiceNumber, period: inv.period ?? null, amount: parseFloat(inv.amount), tax: parseFloat(inv.tax), totalAmount: parseFloat(inv.totalAmount), status: inv.status, dueDate: inv.dueDate, paidAt: null, notes: inv.notes ?? null, createdAt: inv.createdAt.toISOString() });
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: inv.id, clientId: inv.clientId, clientName: null, invoiceNumber: inv.invoiceNumber, period: inv.period ?? null, amount: parseFloat(inv.amount), tax: parseFloat(inv.tax), totalAmount: parseFloat(inv.totalAmount), status: inv.status, dueDate: inv.dueDate, paidAt: isoOrNull(inv.paidAt), notes: inv.notes ?? null, createdAt: inv.createdAt.toISOString() });
});

router.patch("/invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { amount, tax, status, dueDate, paidAt, notes } = req.body;
  const updates: Record<string, any> = {};
  if (amount !== undefined) updates.amount = String(amount);
  if (tax !== undefined) updates.tax = String(tax);
  if (status !== undefined) updates.status = status;
  if (dueDate !== undefined) updates.dueDate = dueDate;
  if (paidAt !== undefined) updates.paidAt = paidAt ? new Date(paidAt) : null;
  if (notes !== undefined) updates.notes = notes;
  const [inv] = await db.update(invoicesTable).set(updates).where(eq(invoicesTable.id, id)).returning();
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: inv.id, clientId: inv.clientId, clientName: null, invoiceNumber: inv.invoiceNumber, period: inv.period ?? null, amount: parseFloat(inv.amount), tax: parseFloat(inv.tax), totalAmount: parseFloat(inv.totalAmount), status: inv.status, dueDate: inv.dueDate, paidAt: isoOrNull(inv.paidAt), notes: inv.notes ?? null, createdAt: inv.createdAt.toISOString() });
});

// ─── Expenses ─────────────────────────────────────────────────────────────────
router.get("/expenses", async (req, res): Promise<void> => {
  const { category, status, submittedBy } = req.query as Record<string, string>;
  let q = db.select().from(expensesTable).$dynamic();
  if (category) q = q.where(eq(expensesTable.category, category));
  if (status) q = q.where(eq(expensesTable.status, status));
  if (submittedBy) q = q.where(eq(expensesTable.submittedBy, parseInt(submittedBy, 10)));
  const expenses = await q;
  const users = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  const uMap: Record<number, string> = {};
  users.forEach(u => { uMap[u.id] = u.name; });
  res.json(expenses.map(e => ({ id: e.id, category: e.category, amount: parseFloat(e.amount), date: e.date, description: e.description ?? null, status: e.status, submittedBy: e.submittedBy ?? null, submittedByName: e.submittedBy ? uMap[e.submittedBy] ?? null : null, approvedBy: e.approvedBy ?? null, receiptUrl: e.receiptUrl ?? null, createdAt: e.createdAt.toISOString() })));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const { category, amount, date, description, submittedBy, receiptUrl, status } = req.body;
  if (!category || amount == null || !date) { res.status(400).json({ error: "category, amount, date required" }); return; }
  const [exp] = await db.insert(expensesTable).values({ category, amount: String(amount), date, description: description ?? null, submittedBy: submittedBy ?? null, receiptUrl: receiptUrl ?? null, status: status ?? "pending" }).returning();
  res.status(201).json({ id: exp.id, category: exp.category, amount: parseFloat(exp.amount), date: exp.date, description: exp.description ?? null, status: exp.status, submittedBy: exp.submittedBy ?? null, submittedByName: null, approvedBy: null, receiptUrl: exp.receiptUrl ?? null, createdAt: exp.createdAt.toISOString() });
});

router.get("/expenses/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [exp] = await db.select().from(expensesTable).where(eq(expensesTable.id, id));
  if (!exp) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: exp.id, category: exp.category, amount: parseFloat(exp.amount), date: exp.date, description: exp.description ?? null, status: exp.status, submittedBy: exp.submittedBy ?? null, submittedByName: null, approvedBy: exp.approvedBy ?? null, receiptUrl: exp.receiptUrl ?? null, createdAt: exp.createdAt.toISOString() });
});

router.patch("/expenses/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { category, amount, description, status, approvedBy } = req.body;
  const updates: Record<string, any> = {};
  if (category !== undefined) updates.category = category;
  if (amount !== undefined) updates.amount = String(amount);
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (approvedBy !== undefined) updates.approvedBy = approvedBy;
  const [exp] = await db.update(expensesTable).set(updates).where(eq(expensesTable.id, id)).returning();
  if (!exp) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: exp.id, category: exp.category, amount: parseFloat(exp.amount), date: exp.date, description: exp.description ?? null, status: exp.status, submittedBy: exp.submittedBy ?? null, submittedByName: null, approvedBy: exp.approvedBy ?? null, receiptUrl: exp.receiptUrl ?? null, createdAt: exp.createdAt.toISOString() });
});

export default router;
