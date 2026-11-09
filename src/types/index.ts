export interface DocumentItem {
  id: string;
  name: string;
  original_name: string;
  file_size: number;
  page_count: number;
  file_path: string;
  created_at: string;
  updated_at: string;
}

export interface CommentItem {
  id: string;
  document_id: string;
  page_number: number;
  line_number: number | null;
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
  selected_text: string | null;
  content: string;
  author_name: string;
  author_color: string;
  author_avatar: string | null;
  status: 'open' | 'resolved';
  created_at: string;
  updated_at: string;
  replies?: ReplyItem[];
}

export interface ReplyItem {
  id: string;
  comment_id: string;
  content: string;
  author_name: string;
  author_color: string;
  author_avatar: string | null;
  created_at: string;
}

export interface Collaborator {
  userId: string;
  userName: string;
  userColor: string;
  userAvatar?: string;
  currentPage?: number;
  cursorX?: number;
  cursorY?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  color: string;
  avatar: string;
}
