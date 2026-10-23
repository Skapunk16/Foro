import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { get } from './db.js';
import { User } from '../types/forum.js';

const JWT_SECRET = process.env.JWT_SECRET || 'comuniland-super-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado: Token de autenticación requerido.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    const row = get<any>(
      'SELECT id, username, email, avatar_url, bio, role, must_change_password, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!row) {
      res.status(401).json({ error: 'Usuario no encontrado.' });
      return;
    }

    req.user = {
      id: row.id,
      username: row.username,
      email: row.email,
      avatar_url: row.avatar_url,
      bio: row.bio,
      role: row.role,
      must_change_password: Boolean(row.must_change_password),
      created_at: row.created_at,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
      const row = get<any>(
        'SELECT id, username, email, avatar_url, bio, role, must_change_password, created_at FROM users WHERE id = ?',
        [decoded.id]
      );
      if (row) {
        req.user = {
          id: row.id,
          username: row.username,
          email: row.email,
          avatar_url: row.avatar_url,
          bio: row.bio,
          role: row.role,
          must_change_password: Boolean(row.must_change_password),
          created_at: row.created_at,
        };
      }
    } catch {
      // Ignore invalid token in optional auth
    }
  }
  next();
}
