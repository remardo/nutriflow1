import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'NUTRITIONIST';
  tenantId?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET || 'dev-nutriflow-secret';
  return secret;
};

/**
 * Middleware аутентификации:
 * - достаёт JWT из Authorization: Bearer
 * - ожидает payload { sub, role, tenantId }
 * - при успехе пишет req.user
 * - при ошибке/отсутствии токена возвращает 401
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or malformed' });
    return;
  }

  const token = authHeader.substring('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      sub?: string;
      role?: AuthUser['role'];
      tenantId?: string | null;
    };

    if (!payload?.sub || !payload.role) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      tenantId: payload.tenantId ?? null,
    };

    next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('JWT verification failed', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Требует, чтобы роль пользователя входила в разрешённый список.
 * При несоответствии — 403.
 */
export const requireRole =
  (...roles: AuthUser['role'][]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };