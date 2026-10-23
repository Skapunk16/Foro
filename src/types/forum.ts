export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  role: 'admin' | 'moderator' | 'member';
  must_change_password?: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  thread_count?: number;
}

export interface Attachment {
  id: number;
  thread_id?: number | null;
  post_id?: number | null;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

export interface LinkPreview {
  id?: number;
  thread_id?: number | null;
  post_id?: number | null;
  original_url: string;
  title: string;
  description: string;
  domain: string;
  favicon_url?: string;
  image_url?: string;
}

export interface Post {
  id: number;
  thread_id: number;
  user_id: number;
  parent_id?: number | null;
  content: string;
  created_at: string;
  user: User;
  attachments?: Attachment[];
  link_previews?: LinkPreview[];
  replies?: Post[];
}

export interface Thread {
  id: number;
  category_id: number;
  user_id: number;
  title: string;
  content: string;
  views_count: number;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  category: Category;
  user: User;
  attachments?: Attachment[];
  link_previews?: LinkPreview[];
  reply_count: number;
  latest_reply_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
