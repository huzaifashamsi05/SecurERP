import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, payrollTable, invoicesTable, expensesTable, guardsTable, usersTable, clientsTable } from "@workspace/db";

const router: IRouter = Router();

function isoOrNull(d: Date | null | undefined) { return d ? d.toISOString() : null; }
function guardName(guards: any[], users: any[], guardId: number) {
  const g = guards.find(x => x.id === guardId);
  const u = g ? users.find(x => x.id === g.userId) : null;
  return u?.name ?? null;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────
router.get("/payroll/summary", async (req, res): Promise<void> => {
  const cid = (req as any).user!.role !== 'super_admin' ? (req as any).user!.companyId! : null;
  const cnd = (tbl: any, conds: any[] = []) => cid ? and(eq(tbl.companyId, cid), ...conds) : (conds.length ? and(...conds) : undefined);
  const [totalRow] = await db.select({ total: sql<string>`COALESCE(SUM(net_salary), 0)` }).from(payrollTable).where(cnd(payrollTable));
  const [paidRow] = await db.select({ total: sql<string>`COALESCE(SUM(net_salary), 0)` }).from(payrollTable).where(cnd(payrollTable, [eq(payrollTable.status, "paid")]));
  const [pendingRow] = await db.select({ total: sql<string>`COALESCE(SUM(net_salary), 0)` }).from(payrollTable).where(cnd(payrollTable, [eq(payrollTable.status, "pending")]));
  const [guardCount] = await db.select({ cnt: sql<number>`COUNT(DISTINCT guard_id)` }).from(payrollTable).where(cnd(payrollTable));
  res.json({ totalPayroll: parseFloat(totalRow.total), paid: parseFloat(paidRow.total), pending: parseFloat(pendingRow.total), totalGuards: Number(guardCount.cnt) });
});

router.get("/payroll", async (req, res): Promise<void> => {
  const { guardId, period, status } = req.query as Record<string, string>;
  let q = db.select().from(payrollTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(payrollTable.companyId, (req as any).user!.companyId!));
  if (guardId) conditions.push(eq(payrollTable.guardId, parseInt(guardId, 10)));
  if (period) conditions.push(eq(payrollTable.period, period));
  if (status) conditions.push(eq(payrollTable.status, status));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const records = await q;
  let guardsQuery = db.select({ id: guardsTable.id, userId: guardsTable.userId }).from(guardsTable);
  if ((req as any).user!.role !== 'super_admin') guardsQuery = guardsQuery.where(eq(guardsTable.companyId, (req as any).user!.companyId!));
  const guards = await guardsQuery;
  const users = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  res.json(records.map(r => ({ id: r.id, guardId: r.guardId, guardName: guardName(guards, users, r.guardId), period: r.period, basicSalary: parseFloat(r.basicSalary), allowances: parseFloat(r.allowances), deductions: parseFloat(r.deductions), netSalary: parseFloat(r.netSalary), status: r.status, paidAt: isoOrNull(r.paidAt), createdAt: r.createdAt.toISOString() })));
});

router.post("/payroll", async (req, res): Promise<void> => {
  const { guardId, period, basicSalary, allowances, deductions, status } = req.body;
  if (!guardId || !period || basicSalary == null) { res.status(400).json({ error: "guardId, period, basicSalary required" }); return; }
  const net = basicSalary + (allowances ?? 0) - (deductions ?? 0);
  const [rec] = await db.insert(payrollTable).values({ companyId: (req as any).user!.companyId!, guardId, period, basicSalary: String(basicSalary), allowances: String(allowances ?? 0), deductions: String(deductions ?? 0), netSalary: String(net), status: status ?? "pending" }).returning();
  res.status(201).json({ id: rec.id, guardId: rec.guardId, guardName: null, period: rec.period, basicSalary: parseFloat(rec.basicSalary), allowances: parseFloat(rec.allowances), deductions: parseFloat(rec.deductions), netSalary: parseFloat(rec.netSalary), status: rec.status, paidAt: null, createdAt: rec.createdAt.toISOString() });
});

router.get("/payroll/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(payrollTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(payrollTable.companyId, (req as any).user!.companyId!));
  const [rec] = await db.select().from(payrollTable).where(and(...conditions));
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
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(payrollTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(payrollTable.companyId, (req as any).user!.companyId!));
  const [rec] = await db.update(payrollTable).set(updates).where(and(...conditions)).returning();
  if (!rec) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: rec.id, guardId: rec.guardId, guardName: null, period: rec.period, basicSalary: parseFloat(rec.basicSalary), allowances: parseFloat(rec.allowances), deductions: parseFloat(rec.deductions), netSalary: parseFloat(rec.netSalary), status: rec.status, paidAt: isoOrNull(rec.paidAt), createdAt: rec.createdAt.toISOString() });
});

// ─── Invoices ─────────────────────────────────────────────────────────────────
router.get("/invoices", async (req, res): Promise<void> => {
  const { clientId, status } = req.query as Record<string, string>;
  let q = db.select().from(invoicesTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(invoicesTable.companyId, (req as any).user!.companyId!));
  if (clientId) conditions.push(eq(invoicesTable.clientId, parseInt(clientId, 10)));
  if (status) conditions.push(eq(invoicesTable.status, status));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const invoices = await q;
  let clientsQuery = db.select({ id: clientsTable.id, name: clientsTable.name }).from(clientsTable);
  if ((req as any).user!.role !== 'super_admin') clientsQuery = clientsQuery.where(eq(clientsTable.companyId, (req as any).user!.companyId!));
  const clients = await clientsQuery;
  const clientMap: Record<number, string> = {};
  clients.forEach(c => { clientMap[c.id] = c.name; });
  res.json(invoices.map(i => ({ id: i.id, clientId: i.clientId, clientName: clientMap[i.clientId] ?? null, invoiceNumber: i.invoiceNumber, period: i.period ?? null, amount: parseFloat(i.amount), tax: parseFloat(i.tax), totalAmount: parseFloat(i.totalAmount), status: i.status, dueDate: i.dueDate, paidAt: isoOrNull(i.paidAt), notes: i.notes ?? null, createdAt: i.createdAt.toISOString() })));
});

router.post("/invoices", async (req, res): Promise<void> => {
  const { clientId, invoiceNumber, period, amount, tax, dueDate, notes, status } = req.body;
  if (!clientId || !invoiceNumber || amount == null || !dueDate) { res.status(400).json({ error: "clientId, invoiceNumber, amount, dueDate required" }); return; }
  const taxAmt = tax ?? 0;
  const total = amount + taxAmt;
  const [inv] = await db.insert(invoicesTable).values({ companyId: (req as any).user!.companyId!, clientId, invoiceNumber, period: period ?? null, amount: String(amount), tax: String(taxAmt), totalAmount: String(total), status: status ?? "draft", dueDate, notes: notes ?? null }).returning();
  res.status(201).json({ id: inv.id, clientId: inv.clientId, clientName: null, invoiceNumber: inv.invoiceNumber, period: inv.period ?? null, amount: parseFloat(inv.amount), tax: parseFloat(inv.tax), totalAmount: parseFloat(inv.totalAmount), status: inv.status, dueDate: inv.dueDate, paidAt: null, notes: inv.notes ?? null, createdAt: inv.createdAt.toISOString() });
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(invoicesTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(invoicesTable.companyId, (req as any).user!.companyId!));
  const [inv] = await db.select().from(invoicesTable).where(and(...conditions));
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
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(invoicesTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(invoicesTable.companyId, (req as any).user!.companyId!));
  const [inv] = await db.update(invoicesTable).set(updates).where(and(...conditions)).returning();
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: inv.id, clientId: inv.clientId, clientName: null, invoiceNumber: inv.invoiceNumber, period: inv.period ?? null, amount: parseFloat(inv.amount), tax: parseFloat(inv.tax), totalAmount: parseFloat(inv.totalAmount), status: inv.status, dueDate: inv.dueDate, paidAt: isoOrNull(inv.paidAt), notes: inv.notes ?? null, createdAt: inv.createdAt.toISOString() });
});

// ─── Expenses ─────────────────────────────────────────────────────────────────
router.get("/expenses", async (req, res): Promise<void> => {
  const { category, status, submittedBy } = req.query as Record<string, string>;
  let q = db.select().from(expensesTable).$dynamic();
  const conditions = [];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(expensesTable.companyId, (req as any).user!.companyId!));
  if (category) conditions.push(eq(expensesTable.category, category));
  if (status) conditions.push(eq(expensesTable.status, status));
  if (submittedBy) conditions.push(eq(expensesTable.submittedBy, parseInt(submittedBy, 10)));
  if (conditions.length > 0) q = q.where(and(...conditions));
  const expenses = await q;
  let usersQuery = db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  if ((req as any).user!.role !== 'super_admin') usersQuery = usersQuery.where(eq(usersTable.companyId, (req as any).user!.companyId!));
  const users = await usersQuery;
  const uMap: Record<number, string> = {};
  users.forEach(u => { uMap[u.id] = u.name; });
  res.json(expenses.map(e => ({ id: e.id, category: e.category, amount: parseFloat(e.amount), date: e.date, description: e.description ?? null, status: e.status, submittedBy: e.submittedBy ?? null, submittedByName: e.submittedBy ? uMap[e.submittedBy] ?? null : null, approvedBy: e.approvedBy ?? null, receiptUrl: e.receiptUrl ?? null, createdAt: e.createdAt.toISOString() })));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const { category, amount, date, description, submittedBy, receiptUrl, status } = req.body;
  if (!category || amount == null || !date) { res.status(400).json({ error: "category, amount, date required" }); return; }
  const [exp] = await db.insert(expensesTable).values({ companyId: (req as any).user!.companyId!, category, amount: String(amount), date, description: description ?? null, submittedBy: submittedBy ?? null, receiptUrl: receiptUrl ?? null, status: status ?? "pending" }).returning();
  res.status(201).json({ id: exp.id, category: exp.category, amount: parseFloat(exp.amount), date: exp.date, description: exp.description ?? null, status: exp.status, submittedBy: exp.submittedBy ?? null, submittedByName: null, approvedBy: null, receiptUrl: exp.receiptUrl ?? null, createdAt: exp.createdAt.toISOString() });
});

router.get("/expenses/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions = [eq(expensesTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(expensesTable.companyId, (req as any).user!.companyId!));
  const [exp] = await db.select().from(expensesTable).where(and(...conditions));
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
  updates.companyId = (req as any).user!.companyId!;
  const conditions = [eq(expensesTable.id, id)];
  if ((req as any).user!.role !== 'super_admin') conditions.push(eq(expensesTable.companyId, (req as any).user!.companyId!));
  const [exp] = await db.update(expensesTable).set(updates).where(and(...conditions)).returning();
  if (!exp) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: exp.id, category: exp.category, amount: parseFloat(exp.amount), date: exp.date, description: exp.description ?? null, status: exp.status, submittedBy: exp.submittedBy ?? null, submittedByName: null, approvedBy: exp.approvedBy ?? null, receiptUrl: exp.receiptUrl ?? null, createdAt: exp.createdAt.toISOString() });
});

export default router;
