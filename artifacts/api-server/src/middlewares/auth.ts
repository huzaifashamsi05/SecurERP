import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
  companyId: number | null;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

/**
 * Middleware that requires a valid JWT token in the Authorization header.
 * Sets req.user with the decoded token payload.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.headers.cookie) {
    const tokenCookie = req.headers.cookie.split(';').find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
      token = tokenCookie.split('=')[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Provide a token.' });
    return;
  }

  try {
    const payload = verifyToken(token);

    // Verify user still exists in database
    const [user] = await db
      .select({ id: usersTable.id, status: usersTable.status })
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId));

    if (!user || user.status !== 'active') {
      res.status(401).json({ error: 'User not found or inactive.' });
      return;
    }

    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
