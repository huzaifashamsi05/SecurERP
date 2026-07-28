import { Router, type IRouter } from 'express';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db, usersTable, companiesTable } from '@workspace/db';
import { generateToken, requireAuth, verifyToken } from '../middlewares/auth';

const router: IRouter = Router();
const SALT_ROUNDS = 12;

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId ?? null,
    status: user.status,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

// POST /auth/register — Create a new user account
router.post('/auth/register', async (req, res): Promise<void> => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email, and password are required' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  // Check if email already exists
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email,
      passwordHash,
      role: role ?? 'guard',
      phone: phone ?? null,
      status: 'active',
    })
    .returning();

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId ?? null,
  });

  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`);
  res.status(201).json({ user: formatUser(user), token });
});

// POST /auth/login — Authenticate with email + password
router.post('/auth/login', async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json({ error: 'Account is not active' });
    return;
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId ?? null,
  });

  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`);
  res.json({ user: formatUser(user), token });
});

// POST /auth/verify — Verify email for smart login flow
router.post('/auth/verify', async (req, res): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      role: usersTable.role,
      companyId: usersTable.companyId,
    })
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user) {
    res.status(404).json({ error: 'Identity not found' });
    return;
  }

  let companyName = null;
  if (user.companyId) {
    const [company] = await db
      .select({ name: companiesTable.name })
      .from(companiesTable)
      .where(eq(companiesTable.id, user.companyId));
    
    if (company) {
      companyName = company.name;
    }
  }

  res.json({
    role: user.role,
    companyName: companyName,
  });
});

// GET /auth/me — Get current authenticated user
router.get('/auth/me', requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(formatUser(user));
});

// POST /auth/logout — Client-side token discard (stateless JWT)
router.post('/auth/logout', (_req, res): void => {
  res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  res.json({ success: true });
});

export default router;
