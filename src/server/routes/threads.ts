import { Router, Response } from 'express';
import { get, query, run } from '../db.js';
import { AuthenticatedRequest, requireAuth, optionalAuth } from '../auth.js';
import { Category, Thread, User, Attachment, LinkPreview, Post } from '../../types/forum.js';
import { fetchLinkMetadata } from './links.js';

const router = Router();

// GET all categories with thread counts
router.get('/categories', (_req, res: Response) => {
  const categories = query<Category>(`
    SELECT c.*, COUNT(t.id) as thread_count
    FROM categories c
    LEFT JOIN threads t ON c.id = t.category_id
    GROUP BY c.id
    ORDER BY c.id ASC
  `);
  res.json({ categories });
});

// Helper to extract URLs from markdown or plain text
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"')]+)/g;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches)).slice(0, 3); // Max 3 previewed links per thread
}

// GET threads list with filtering, searching, and sorting
router.get('/threads', (req, res: Response) => {
  const { category, search, sort = 'recent' } = req.query;

  let sql = `
    SELECT 
      t.id, t.category_id, t.user_id, t.title, t.content, t.views_count, t.pinned,
      t.created_at, t.updated_at,
      u.username, u.email, u.avatar_url, u.bio, u.role as user_role, u.created_at as user_created_at,
      c.name as category_name, c.slug as category_slug, c.description as category_description,
      c.color as category_color, c.icon as category_icon,
      (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) as reply_count,
      (SELECT MAX(p.created_at) FROM posts p WHERE p.thread_id = t.id) as latest_reply_at,
      (SELECT COUNT(*) FROM attachments a WHERE a.thread_id = t.id) as attachment_count
    FROM threads t
    JOIN users u ON t.user_id = u.id
    JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (category && category !== 'all') {
    if (isNaN(Number(category))) {
      sql += ` AND c.slug = ?`;
      params.push(category);
    } else {
      sql += ` AND c.id = ?`;
      params.push(Number(category));
    }
  }

  if (search && typeof search === 'string' && search.trim().length > 0) {
    sql += ` AND (t.title LIKE ? OR t.content LIKE ?)`;
    const searchParam = `%${search.trim()}%`;
    params.push(searchParam, searchParam);
  }

  // Order priority: pinned first, then sort
  if (sort === 'active') {
    sql += ` ORDER BY t.pinned DESC, COALESCE((SELECT MAX(p.created_at) FROM posts p WHERE p.thread_id = t.id), t.created_at) DESC`;
  } else if (sort === 'popular') {
    sql += ` ORDER BY t.pinned DESC, reply_count DESC, t.views_count DESC`;
  } else {
    // recent
    sql += ` ORDER BY t.pinned DESC, t.created_at DESC`;
  }

  const rows = query<any>(sql, params);

  const threads: Thread[] = rows.map((r) => ({
    id: r.id,
    category_id: r.category_id,
    user_id: r.user_id,
    title: r.title,
    content: r.content,
    views_count: r.views_count,
    pinned: Boolean(r.pinned),
    created_at: r.created_at,
    updated_at: r.updated_at,
    reply_count: r.reply_count || 0,
    latest_reply_at: r.latest_reply_at || undefined,
    user: {
      id: r.user_id,
      username: r.username,
      email: r.email,
      avatar_url: r.avatar_url,
      bio: r.bio,
      role: r.user_role,
      created_at: r.user_created_at,
    },
    category: {
      id: r.category_id,
      name: r.category_name,
      slug: r.category_slug,
      description: r.category_description,
      color: r.category_color,
      icon: r.category_icon,
    },
  }));

  res.json({ threads });
});

// GET single thread with full details, nested comments, attachments, and link previews
router.get('/threads/:id', (req, res: Response) => {
  const threadId = Number(req.params.id);
  if (!threadId) {
    res.status(400).json({ error: 'ID de hilo inválido' });
    return;
  }

  // Increment views count
  run('UPDATE threads SET views_count = views_count + 1 WHERE id = ?', [threadId]);

  const tRow = get<any>(
    `SELECT 
      t.id, t.category_id, t.user_id, t.title, t.content, t.views_count, t.pinned,
      t.created_at, t.updated_at,
      u.username, u.email, u.avatar_url, u.bio, u.role as user_role, u.created_at as user_created_at,
      c.name as category_name, c.slug as category_slug, c.description as category_description,
      c.color as category_color, c.icon as category_icon,
      (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) as reply_count
    FROM threads t
    JOIN users u ON t.user_id = u.id
    JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?`,
    [threadId]
  );

  if (!tRow) {
    res.status(404).json({ error: 'Hilo de discusión no encontrado' });
    return;
  }

  // Fetch thread attachments
  const attachments = query<Attachment>(
    'SELECT id, thread_id, post_id, file_name, file_type, file_size, file_url, created_at FROM attachments WHERE thread_id = ? AND post_id IS NULL',
    [threadId]
  );

  // Fetch thread link previews
  const linkPreviews = query<LinkPreview>(
    'SELECT id, thread_id, post_id, original_url, title, description, domain, favicon_url, image_url FROM link_previews WHERE thread_id = ? AND post_id IS NULL',
    [threadId]
  );

  // Fetch posts (comments)
  const postRows = query<any>(
    `SELECT 
      p.id, p.thread_id, p.user_id, p.parent_id, p.content, p.created_at,
      u.username, u.email, u.avatar_url, u.bio, u.role as user_role, u.created_at as user_created_at
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.thread_id = ?
    ORDER BY p.created_at ASC`,
    [threadId]
  );

  // Fetch all attachments for posts
  const postAttachments = query<Attachment>(
    'SELECT id, thread_id, post_id, file_name, file_type, file_size, file_url, created_at FROM attachments WHERE thread_id = ? AND post_id IS NOT NULL',
    [threadId]
  );

  // Map post attachments by post_id
  const postAttachmentMap = new Map<number, Attachment[]>();
  for (const a of postAttachments) {
    if (a.post_id) {
      if (!postAttachmentMap.has(a.post_id)) {
        postAttachmentMap.set(a.post_id, []);
      }
      postAttachmentMap.get(a.post_id)!.push(a);
    }
  }

  // Construct flat post objects with user
  const postMap = new Map<number, Post>();
  const rootPosts: Post[] = [];

  for (const pr of postRows) {
    const post: Post = {
      id: pr.id,
      thread_id: pr.thread_id,
      user_id: pr.user_id,
      parent_id: pr.parent_id || null,
      content: pr.content,
      created_at: pr.created_at,
      user: {
        id: pr.user_id,
        username: pr.username,
        email: pr.email,
        avatar_url: pr.avatar_url,
        bio: pr.bio,
        role: pr.user_role,
        created_at: pr.user_created_at,
      },
      attachments: postAttachmentMap.get(pr.id) || [],
      replies: [],
    };
    postMap.set(post.id, post);
  }

  // Build nested reply hierarchy (anidado)
  for (const post of postMap.values()) {
    if (post.parent_id && postMap.has(post.parent_id)) {
      postMap.get(post.parent_id)!.replies!.push(post);
    } else {
      rootPosts.push(post);
    }
  }

  const thread: Thread = {
    id: tRow.id,
    category_id: tRow.category_id,
    user_id: tRow.user_id,
    title: tRow.title,
    content: tRow.content,
    views_count: tRow.views_count,
    pinned: Boolean(tRow.pinned),
    created_at: tRow.created_at,
    updated_at: tRow.updated_at,
    reply_count: tRow.reply_count || 0,
    user: {
      id: tRow.user_id,
      username: tRow.username,
      email: tRow.email,
      avatar_url: tRow.avatar_url,
      bio: tRow.bio,
      role: tRow.user_role,
      created_at: tRow.user_created_at,
    },
    category: {
      id: tRow.category_id,
      name: tRow.category_name,
      slug: tRow.category_slug,
      description: tRow.category_description,
      color: tRow.category_color,
      icon: tRow.category_icon,
    },
    attachments,
    link_previews: linkPreviews,
  };

  res.json({ thread, posts: rootPosts });
});

// POST create new thread
router.post('/threads', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { category_id, title, content, attachments = [], link_previews = [] } = req.body;
  const userId = req.user!.id;

  if (!category_id || !title || !content) {
    res.status(400).json({ error: 'Categoría, título y contenido son campos obligatorios.' });
    return;
  }

  if (title.trim().length < 5) {
    res.status(400).json({ error: 'El título debe tener al menos 5 caracteres.' });
    return;
  }

  if (content.trim().length < 10) {
    res.status(400).json({ error: 'El contenido debe tener al menos 10 caracteres.' });
    return;
  }

  // Insert thread
  const result = run(
    `INSERT INTO threads (category_id, user_id, title, content, views_count, pinned)
     VALUES (?, ?, ?, ?, 0, 0)`,
    [Number(category_id), userId, title.trim(), content.trim()]
  );

  const threadId = result.lastInsertRowid;

  // Save attachments
  if (Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      if (att.file_name && att.file_url) {
        run(
          `INSERT INTO attachments (thread_id, file_name, file_type, file_size, file_url)
           VALUES (?, ?, ?, ?, ?)`,
          [threadId, att.file_name, att.file_type || 'file', att.file_size || 0, att.file_url]
        );
      }
    }
  }

  // Detect and save link previews
  const processedUrls = new Set<string>();
  if (Array.isArray(link_previews) && link_previews.length > 0) {
    for (const lp of link_previews) {
      if (lp.original_url && !processedUrls.has(lp.original_url)) {
        processedUrls.add(lp.original_url);
        run(
          `INSERT INTO link_previews (thread_id, original_url, title, description, domain, favicon_url, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            threadId,
            lp.original_url,
            lp.title || lp.domain || lp.original_url,
            lp.description || '',
            lp.domain || 'enlace web',
            lp.favicon_url || '',
            lp.image_url || null,
          ]
        );
      }
    }
  }

  // Also auto-extract any remaining unparsed links from content
  const detectedUrls = extractUrls(content);
  for (const url of detectedUrls) {
    if (!processedUrls.has(url)) {
      processedUrls.add(url);
      try {
        const meta = await fetchLinkMetadata(url);
        run(
          `INSERT INTO link_previews (thread_id, original_url, title, description, domain, favicon_url, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [threadId, meta.original_url, meta.title, meta.description, meta.domain, meta.favicon_url || '', meta.image_url || null]
        );
      } catch {
        // Safe skip
      }
    }
  }

  res.status(201).json({
    message: 'Hilo creado exitosamente',
    threadId,
  });
});

// DELETE thread (author or admin)
router.delete('/threads/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const threadId = Number(req.params.id);
  const thread = get<Thread>('SELECT * FROM threads WHERE id = ?', [threadId]);

  if (!thread) {
    res.status(404).json({ error: 'Hilo no encontrado' });
    return;
  }

  if (thread.user_id !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'No tienes permisos para eliminar este hilo.' });
    return;
  }

  run('DELETE FROM threads WHERE id = ?', [threadId]);
  res.json({ message: 'Hilo eliminado exitosamente' });
});

export default router;
