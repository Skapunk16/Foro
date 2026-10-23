import { Category, Post, Thread, User, Attachment, LinkPreview } from '../types/forum.js';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('comuniland_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || `Error en el servidor (${res.status})`);
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Respuesta no válida del servidor: ${text.slice(0, 100)}`);
    }
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Error en la petición (${res.status})`);
  }
  return data as T;
}

export const api = {
  // Auth
  async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await parseResponse<{ user: User; token: string }>(res);
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
    const data = await parseResponse<{ user: User; token: string }>(res);
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
      return await parseResponse<{ user: User }>(res);
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
    return await parseResponse<{ user: User }>(res);
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
    return await parseResponse<{ message: string; user: User }>(res);
  },

  logout(): void {
    localStorage.removeItem('comuniland_token');
  },

  // Categories & Threads
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await parseResponse<{ categories: Category[] }>(res);
      return data.categories || [];
    } catch (err) {
      console.warn('Error loading categories:', err);
      return [];
    }
  },

  async getThreads(params?: { category?: string | number; search?: string; sort?: string }): Promise<Thread[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', String(params.category));
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);

    const res = await fetch(`${API_BASE}/threads?${query.toString()}`);
    const data = await parseResponse<{ threads: Thread[] }>(res);
    return data.threads || [];
  },

  async getThread(id: number): Promise<{ thread: Thread; posts: Post[] }> {
    const res = await fetch(`${API_BASE}/threads/${id}`);
    return await parseResponse<{ thread: Thread; posts: Post[] }>(res);
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
    return await parseResponse<{ message: string; threadId: number }>(res);
  },

  async deleteThread(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/threads/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    await parseResponse<{ message: string }>(res);
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
    return await parseResponse<{ message: string; post: Post }>(res);
  },

  async deletePost(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    await parseResponse<{ message: string }>(res);
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
    const data = await parseResponse<{ message: string; file: any }>(res);
    return data.file;
  },

  // Link preview
  async previewLink(url: string): Promise<LinkPreview> {
    const res = await fetch(`${API_BASE}/links/preview?url=${encodeURIComponent(url)}`);
    return await parseResponse<LinkPreview>(res);
  },
};
