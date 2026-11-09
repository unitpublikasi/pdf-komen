import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { generateSamplePdfBuffer } from './sample-pdf.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const DB_PATH = path.resolve(DATA_DIR, 'docusync.db');
export const db = new DatabaseSync(DB_PATH);

// Initialize database tables
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    page_count INTEGER DEFAULT 1,
    file_path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    line_number INTEGER DEFAULT NULL,
    x_percent REAL NOT NULL,
    y_percent REAL NOT NULL,
    width_percent REAL DEFAULT 0,
    height_percent REAL DEFAULT 0,
    selected_text TEXT DEFAULT '',
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_color TEXT NOT NULL,
    author_avatar TEXT DEFAULT '',
    status TEXT DEFAULT 'open',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS replies (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_color TEXT NOT NULL,
    author_avatar TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    author_name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_comments_doc ON comments(document_id);
  CREATE INDEX IF NOT EXISTS idx_comments_page ON comments(page_number);
  CREATE INDEX IF NOT EXISTS idx_replies_comment ON replies(comment_id);
`);

export interface DocumentRow {
  id: string;
  name: string;
  original_name: string;
  file_size: number;
  page_count: number;
  file_path: string;
  created_at: string;
  updated_at: string;
}

export interface CommentRow {
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
  replies?: ReplyRow[];
}

export interface ReplyRow {
  id: string;
  comment_id: string;
  content: string;
  author_name: string;
  author_color: string;
  author_avatar: string | null;
  created_at: string;
}

export interface ActivityRow {
  id: string;
  document_id: string;
  action_type: string;
  description: string;
  author_name: string;
  created_at: string;
}

// Ensure default sample document is seeded
export function seedInitialDataIfNeeded() {
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM documents');
  const result = checkStmt.get() as { count: number | bigint };
  const count = Number(result?.count || 0);

  if (count === 0) {
    const sampleId = 'doc-sample-panduan';
    const sampleFileName = 'Panduan_Kolaborasi_DocuSync.pdf';
    const sampleFilePath = path.resolve(UPLOADS_DIR, sampleFileName);

    const pdfBuffer = generateSamplePdfBuffer();
    fs.writeFileSync(sampleFilePath, pdfBuffer);

    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO documents (id, name, original_name, file_size, page_count, file_path, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sampleId,
      'Panduan Kolaborasi DocuSync.pdf',
      sampleFileName,
      pdfBuffer.length,
      3,
      sampleFilePath,
      now,
      now
    );

    // Seed 2 sample comments to demonstrate Google Docs style thread
    const comment1Id = 'cmt-welcome-1';
    db.prepare(`
      INSERT INTO comments (
        id, document_id, page_number, line_number, x_percent, y_percent,
        width_percent, height_percent, selected_text, content,
        author_name, author_color, author_avatar, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      comment1Id,
      sampleId,
      1,
      4,
      15.5,
      28.0,
      45.0,
      3.5,
      'Google Docs: pengguna dapat menaruh komentar tepat di koordinat baris atau halaman',
      'Ini adalah contoh komentar pada baris teks tertentu seperti di Google Docs. Anda bisa membalas thread ini atau menandainya sebagai selesai!',
      'Siti Rahma (Reviewer)',
      '#3b82f6',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti',
      'open',
      new Date(Date.now() - 3600000).toISOString(),
      now
    );

    // Seed reply to comment 1
    db.prepare(`
      INSERT INTO replies (id, comment_id, content, author_name, author_color, author_avatar, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'rep-welcome-1',
      comment1Id,
      'Siap Bu Siti, fitur real-time WebSocket juga sudah aktif untuk semua kolaborator.',
      'Ahmad Fauzi (Lead Eng)',
      '#10b981',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
      new Date(Date.now() - 1800000).toISOString()
    );

    // Seed resolved comment on page 2
    const comment2Id = 'cmt-welcome-2';
    db.prepare(`
      INSERT INTO comments (
        id, document_id, page_number, line_number, x_percent, y_percent,
        width_percent, height_percent, selected_text, content,
        author_name, author_color, author_avatar, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      comment2Id,
      sampleId,
      2,
      6,
      22.0,
      32.5,
      0,
      0,
      null,
      'Format data WebSocket sudah divalidasi dan lolos pengujian beban jaringan.',
      'Budi Santoso (QA)',
      '#8b5cf6',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi',
      'resolved',
      new Date(Date.now() - 7200000).toISOString(),
      now
    );

    db.prepare(`
      INSERT INTO replies (id, comment_id, content, author_name, author_color, author_avatar, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'rep-welcome-2',
      comment2Id,
      'Sudah dicek bersama tim DevOps, siap lanjut ke tahap deploy.',
      'Ahmad Fauzi (Lead Eng)',
      '#10b981',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
      new Date(Date.now() - 3000000).toISOString()
    );

    console.log('Database seeded with sample document and comments.');
  }
}

// Queries
export function getDocuments(): DocumentRow[] {
  return db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all() as unknown as DocumentRow[];
}

export function getDocumentById(id: string): DocumentRow | undefined {
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as unknown as DocumentRow | undefined;
}

export function getCommentsWithReplies(documentId: string): CommentRow[] {
  const comments = db.prepare(`
    SELECT * FROM comments WHERE document_id = ? ORDER BY page_number ASC, y_percent ASC, created_at ASC
  `).all(documentId) as unknown as CommentRow[];

  const commentIds = comments.map(c => c.id);
  if (commentIds.length === 0) return comments;

  const placeholders = commentIds.map(() => '?').join(',');
  const replies = db.prepare(`
    SELECT * FROM replies WHERE comment_id IN (${placeholders}) ORDER BY created_at ASC
  `).all(...commentIds) as unknown as ReplyRow[];

  const repliesByCommentId: Record<string, ReplyRow[]> = {};
  for (const r of replies) {
    if (!repliesByCommentId[r.comment_id]) repliesByCommentId[r.comment_id] = [];
    repliesByCommentId[r.comment_id].push(r);
  }

  for (const c of comments) {
    c.replies = repliesByCommentId[c.id] || [];
  }

  return comments;
}

export function createComment(data: {
  id: string;
  document_id: string;
  page_number: number;
  line_number?: number | null;
  x_percent: number;
  y_percent: number;
  width_percent?: number;
  height_percent?: number;
  selected_text?: string | null;
  content: string;
  author_name: string;
  author_color: string;
  author_avatar?: string | null;
}): CommentRow {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO comments (
      id, document_id, page_number, line_number, x_percent, y_percent,
      width_percent, height_percent, selected_text, content,
      author_name, author_color, author_avatar, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
  `).run(
    data.id,
    data.document_id,
    data.page_number,
    data.line_number ?? null,
    data.x_percent,
    data.y_percent,
    data.width_percent ?? 0,
    data.height_percent ?? 0,
    data.selected_text ?? null,
    data.content,
    data.author_name,
    data.author_color,
    data.author_avatar ?? '',
    now,
    now
  );

  return {
    ...data,
    line_number: data.line_number ?? null,
    width_percent: data.width_percent ?? 0,
    height_percent: data.height_percent ?? 0,
    selected_text: data.selected_text ?? null,
    author_avatar: data.author_avatar ?? '',
    status: 'open',
    created_at: now,
    updated_at: now,
    replies: []
  };
}

export function createReply(data: {
  id: string;
  comment_id: string;
  content: string;
  author_name: string;
  author_color: string;
  author_avatar?: string | null;
}): ReplyRow {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO replies (id, comment_id, content, author_name, author_color, author_avatar, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id,
    data.comment_id,
    data.content,
    data.author_name,
    data.author_color,
    data.author_avatar ?? '',
    now
  );

  // Also update updated_at of the parent comment
  db.prepare('UPDATE comments SET updated_at = ? WHERE id = ?').run(now, data.comment_id);

  return {
    ...data,
    author_avatar: data.author_avatar ?? '',
    created_at: now
  };
}

export function updateCommentStatus(commentId: string, status: 'open' | 'resolved'): boolean {
  const now = new Date().toISOString();
  const res = db.prepare('UPDATE comments SET status = ?, updated_at = ? WHERE id = ?').run(status, now, commentId);
  return Number(res.changes) > 0;
}

export function updateCommentContent(commentId: string, content: string): boolean {
  const now = new Date().toISOString();
  const res = db.prepare('UPDATE comments SET content = ?, updated_at = ? WHERE id = ?').run(content, now, commentId);
  return Number(res.changes) > 0;
}

export function deleteComment(commentId: string): boolean {
  // Cascades to replies
  const res = db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
  return Number(res.changes) > 0;
}

export function deleteReply(replyId: string): boolean {
  const res = db.prepare('DELETE FROM replies WHERE id = ?').run(replyId);
  return Number(res.changes) > 0;
}

export function deleteDocument(documentId: string): boolean {
  const doc = getDocumentById(documentId);
  if (doc && fs.existsSync(doc.file_path)) {
    try {
      fs.unlinkSync(doc.file_path);
    } catch (e) {
      console.warn('Failed to delete file from disk:', e);
    }
  }
  const res = db.prepare('DELETE FROM documents WHERE id = ?').run(documentId);
  return Number(res.changes) > 0;
}

export function createDocument(data: {
  id: string;
  name: string;
  original_name: string;
  file_size: number;
  page_count: number;
  file_path: string;
}): DocumentRow {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO documents (id, name, original_name, file_size, page_count, file_path, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id,
    data.name,
    data.original_name,
    data.file_size,
    data.page_count,
    data.file_path,
    now,
    now
  );

  return {
    ...data,
    created_at: now,
    updated_at: now
  };
}
