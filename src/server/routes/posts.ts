import { Router, Response } from 'express';
import { get, query, run } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';
import { Post, Attachment, User } from '../../types/forum.js';

const router = Router();

// POST new comment/reply to thread
router.post('/threads/:id/posts', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const threadId = Number(req.params.id);
  const { content, parent_id, attachments = [] } = req.body;
  const userId = req.user!.id;

  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: 'El contenido de la respuesta no puede estar vacío.' });
    return;
  }

  // Verify thread exists
  const thread = get('SELECT id FROM threads WHERE id = ?', [threadId]);
  if (!thread) {
    res.status(404).json({ error: 'Hilo de discusión no encontrado.' });
    return;
  }

  // If parent_id provided, verify parent exists within the same thread
  if (parent_id) {
    const parent = get('SELECT id FROM posts WHERE id = ? AND thread_id = ?', [parent_id, threadId]);
    if (!parent) {
      res.status(400).json({ error: 'El comentario al que intentas responder no existe.' });
      return;
    }
  }

  const result = run(
    `INSERT INTO posts (thread_id, user_id, parent_id, content)
     VALUES (?, ?, ?, ?)`,
    [threadId, userId, parent_id ? Number(parent_id) : null, content.trim()]
  );

  const postId = result.lastInsertRowid;

  // Insert attachments if any
  const savedAttachments: Attachment[] = [];
  if (Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      if (att.file_name && att.file_url) {
        const attRes = run(
          `INSERT INTO attachments (thread_id, post_id, file_name, file_type, file_size, file_url)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [threadId, postId, att.file_name, att.file_type || 'file', att.file_size || 0, att.file_url]
        );
        savedAttachments.push({
          id: attRes.lastInsertRowid,
          thread_id: threadId,
          post_id: postId,
          file_name: att.file_name,
          file_type: att.file_type,
          file_size: att.file_size,
          file_url: att.file_url,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  // Update thread updated_at
  run('UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [threadId]);

  const newPostRow = get<any>(
    `SELECT 
      p.id, p.thread_id, p.user_id, p.parent_id, p.content, p.created_at,
      u.username, u.email, u.avatar_url, u.bio, u.role as user_role, u.created_at as user_created_at
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?`,
    [postId]
  );

  const post: Post = {
    id: newPostRow.id,
    thread_id: newPostRow.thread_id,
    user_id: newPostRow.user_id,
    parent_id: newPostRow.parent_id || null,
    content: newPostRow.content,
    created_at: newPostRow.created_at,
    user: {
      id: newPostRow.user_id,
      username: newPostRow.username,
      email: newPostRow.email,
      avatar_url: newPostRow.avatar_url,
      bio: newPostRow.bio,
      role: newPostRow.user_role,
      created_at: newPostRow.user_created_at,
    },
    attachments: savedAttachments,
    replies: [],
  };

  res.status(201).json({
    message: 'Respuesta publicada exitosamente',
    post,
  });
});

// DELETE a comment (author or admin)
router.delete('/posts/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const postId = Number(req.params.id);
  const post = get<Post>('SELECT * FROM posts WHERE id = ?', [postId]);

  if (!post) {
    res.status(404).json({ error: 'Comentario no encontrado' });
    return;
  }

  if (post.user_id !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'No tienes permisos para eliminar este comentario.' });
    return;
  }

  run('DELETE FROM posts WHERE id = ?', [postId]);
  res.json({ message: 'Comentario eliminado correctamente.' });
});

export default router;
