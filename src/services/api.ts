import { Category, Post, Thread, User, Attachment, LinkPreview } from '../types/forum.js';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('comuniland_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
    localStorage.setItem('comuniland_token', data.token);
    return data;
  },

  async register(payload: {
    username: string;
    email: string;
    password: string;
    bio?: string;
    avatar_url?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrar usuario');
    localStorage.setItem('comuniland_token', data.token);
    return data;
  },

  async getMe(): Promise<{ user: User } | null> {
    const token = localStorage.getItem('comuniland_token');
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        localStorage.removeItem('comuniland_token');
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateProfile(payload: { bio?: string; avatar_url?: string }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar perfil');
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al cambiar contraseña');
    return data;
  },

  logout(): void {
    localStorage.removeItem('comuniland_token');
  },

  // Categories & Threads
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    return data.categories || [];
  },

  async getThreads(params?: { category?: string | number; search?: string; sort?: string }): Promise<Thread[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', String(params.category));
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);

    const res = await fetch(`${API_BASE}/threads?${query.toString()}`);
    const data = await res.json();
    return data.threads || [];
  },

  async getThread(id: number): Promise<{ thread: Thread; posts: Post[] }> {
    const res = await fetch(`${API_BASE}/threads/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al cargar el hilo');
    return data;
  },

  async createThread(payload: {
    category_id: number;
    title: string;
    content: string;
    attachments?: Partial<Attachment>[];
    link_previews?: Partial<LinkPreview>[];
  }): Promise<{ message: string; threadId: number }> {
    const res = await fetch(`${API_BASE}/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear hilo');
    return data;
  },

  async deleteThread(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/threads/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al eliminar hilo');
    }
  },

  // Posts
  async addPost(
    threadId: number,
    payload: { content: string; parent_id?: number | null; attachments?: Partial<Attachment>[] }
  ): Promise<{ message: string; post: Post }> {
    const res = await fetch(`${API_BASE}/threads/${threadId}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al publicar comentario');
    return data;
  },

  async deletePost(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al eliminar comentario');
    }
  },

  // Upload
  async uploadFile(file: File): Promise<{ file_name: string; file_type: string; file_size: number; file_url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/upload/file`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al subir archivo');
    return data.file;
  },

  // Link preview
  async previewLink(url: string): Promise<LinkPreview> {
    const res = await fetch(`${API_BASE}/links/preview?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al obtener vista previa');
    return data;
  },
};
