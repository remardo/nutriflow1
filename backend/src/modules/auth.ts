import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const authRouter = Router();

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET || 'dev-nutriflow-secret';
  return secret;
};

const TOKEN_EXPIRES_IN = '8h';

interface LoginBody {
  email?: string;
  password?: string;
}

/**
 * POST /api/auth/login
 * body: { email, password }
 * - находит пользователя по email
 * - сравнивает пароль через bcrypt
 * - при успехе возвращает { token }
 */
authRouter.post(
  '/auth/login',
  async (req: Request<unknown, unknown, LoginBody>, res: Response) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = (await prisma.user.findUnique({
      where: { email },
    })) as ({
      id: string;
      email: string;
      name: string | null;
      createdAt: Date;
      updatedAt: Date;
      hashedPassword: string;
      role: string;
      tenantId: string | null;
    } | null);

    if (!user || !user.hashedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        tenantId: user.tenantId ?? null,
      },
      getJwtSecret(),
      {
        expiresIn: TOKEN_EXPIRES_IN,
      }
    );

    return res.json({ token });
  }
);

/**
 * GET /api/auth/me
 * - читает JWT из Authorization: Bearer
 * - возвращает { id, email, name }
 */
authRouter.get(
  '/auth/me',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  }
);

export default authRouter;