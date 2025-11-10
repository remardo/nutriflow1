import type { AuthUser } from '../middleware/auth';

declare namespace Express {
  interface Request {
    requestId?: string;
    user?: AuthUser;
  }
}