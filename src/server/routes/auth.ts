import { Router, Response } from 'express';
import { get, query, run } from '../db.js';
import { AuthenticatedRequest, comparePassword, generateToken, hashPassword, requireAuth } from '../auth.js';
import { User } from '../../types/forum.js';

const router = Router();

router.post('/register', (req, res: Response) => {
  const { username, email, password, bio, avatar_url } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'Nombre de usuario, email y contraseña son obligatorios.' });
    return;
  }

  if (username.length < 3 || username.length > 30) {
    res.status(400).json({ error: 'El nombre de usuario debe tener entre 3 y 30 caracteres.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    return;
  }

  // Check existing username or email
  const existingUser = get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
  if (existingUser) {
    res.status(409).json({ error: 'El nombre de usuario o correo electrónico ya está registrado.' });
    return;
  }

  const passwordHash = hashPassword(password);
  const defaultAvatar = avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`;

  const result = run(
    `INSERT INTO users (username, email, password_hash, avatar_url, bio, role, must_change_password)
     VALUES (?, ?, ?, ?, ?, 'member', 0)`,
    [username.trim(), email.trim().toLowerCase(), passwordHash, defaultAvatar, bio || '']
  );

  const newUser = get<any>(
    'SELECT id, username, email, avatar_url, bio, role, must_change_password, created_at FROM users WHERE id = ?',
    [result.lastInsertRowid]
  );

  if (!newUser) {
    res.status(500).json({ error: 'Error al crear el usuario en la base de datos.' });
    return;
  }

  const safeUser: User = {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    avatar_url: newUser.avatar_url,
    bio: newUser.bio,
    role: newUser.role,
    must_change_password: false,
    created_at: newUser.created_at,
  };

  const token = generateToken(safeUser);
  res.status(201).json({
    message: 'Usuario registrado exitosamente',
    user: safeUser,
    token,
  });
});

router.post('/login', (req, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400).json({ error: 'Credenciales incompletas: proporciona usuario/email y contraseña.' });
    return;
  }

  const user = get<{
    id: number;
    username: string;
    email: string;
    password_hash: string;
    avatar_url?: string;
    bio?: string;
    role: 'admin' | 'moderator' | 'member';
    must_change_password: number;
    created_at: string;
  }>(
    'SELECT id, username, email, password_hash, avatar_url, bio, role, must_change_password, created_at FROM users WHERE username = ? OR email = ?',
    [identifier.trim(), identifier.trim().toLowerCase()]
  );

  if (!user || !comparePassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Credenciales inválidas. Verifica tu usuario y contraseña.' });
    return;
  }

  const safeUser: User = {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar_url: user.avatar_url,
    bio: user.bio,
    role: user.role,
    must_change_password: Boolean(user.must_change_password),
    created_at: user.created_at,
  };

  const token = generateToken(safeUser);
  res.json({
    message: 'Sesión iniciada con éxito',
    user: safeUser,
    token,
  });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

router.post('/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { current_password, new_password } = req.body;
  const userId = req.user!.id;

  if (!new_password || new_password.trim().length < 6) {
    res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    return;
  }

  if (new_password.trim() === 'admin') {
    res.status(400).json({ error: 'La nueva contraseña no puede seguir siendo "admin". Elige una más segura.' });
    return;
  }

  const user = get<any>('SELECT password_hash, must_change_password FROM users WHERE id = ?', [userId]);
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  if (current_password && !comparePassword(current_password, user.password_hash)) {
    res.status(400).json({ error: 'La contraseña actual ingresada es incorrecta.' });
    return;
  }

  const newHash = hashPassword(new_password.trim());
  run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [newHash, userId]);

  const updatedUser = get<any>(
    'SELECT id, username, email, avatar_url, bio, role, must_change_password, created_at FROM users WHERE id = ?',
    [userId]
  );

  res.json({
    message: 'Contraseña actualizada exitosamente.',
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar_url: updatedUser.avatar_url,
      bio: updatedUser.bio,
      role: updatedUser.role,
      must_change_password: false,
      created_at: updatedUser.created_at,
    },
  });
});

router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { bio, avatar_url } = req.body;
  const userId = req.user!.id;

  run('UPDATE users SET bio = ?, avatar_url = ? WHERE id = ?', [
    bio ?? req.user!.bio ?? '',
    avatar_url ?? req.user!.avatar_url ?? '',
    userId,
  ]);

  const updatedUser = get<any>(
    'SELECT id, username, email, avatar_url, bio, role, must_change_password, created_at FROM users WHERE id = ?',
    [userId]
  );

  res.json({
    message: 'Perfil actualizado exitosamente',
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar_url: updatedUser.avatar_url,
      bio: updatedUser.bio,
      role: updatedUser.role,
      must_change_password: Boolean(updatedUser.must_change_password),
      created_at: updatedUser.created_at,
    },
  });
});

router.get('/users/:id', (req, res: Response) => {
  const userId = Number(req.params.id);
  const user = get<any>(
    'SELECT id, username, email, avatar_url, bio, role, must_change_password, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const threadCountRes = get<{ count: number }>(
    'SELECT COUNT(*) as count FROM threads WHERE user_id = ?',
    [userId]
  );
  const replyCountRes = get<{ count: number }>(
    'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
    [userId]
  );

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      bio: user.bio,
      role: user.role,
      must_change_password: Boolean(user.must_change_password),
      created_at: user.created_at,
    },
    stats: {
      threads_created: threadCountRes?.count || 0,
      replies_count: replyCountRes?.count || 0,
    },
  });
});

export default router;
