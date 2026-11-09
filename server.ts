import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import multer from 'multer';
import {
  seedInitialDataIfNeeded,
  getDocuments,
  getDocumentById,
  getCommentsWithReplies,
  createComment,
  createReply,
  updateCommentStatus,
  updateCommentContent,
  deleteComment,
  deleteReply,
  deleteDocument,
  createDocument,
} from './server/db.ts';

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Initialize Database & Sample Data
seedInitialDataIfNeeded();

// Express middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer storage for uploaded PDFs
const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 35 * 1024 * 1024 }, // 35 MB
  fileFilter: (_req, file, cb) => {
    const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');
    const isPdfMime =
      !file.mimetype ||
      file.mimetype.toLowerCase().includes('pdf') ||
      file.mimetype === 'application/octet-stream';

    if (isPdfExt || isPdfMime) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file berformat PDF (.pdf) yang diperbolehkan'));
    }
  },
});

// Helper to reliably count PDF pages without hanging
async function countPdfPages(filePath: string): Promise<number> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    // Fast regex heuristic
    const fileContent = fileBuffer.toString('binary');
    const matches = fileContent.match(/\/Type\s*\/Page[^s]/g);
    const regexCount = matches && matches.length > 0 ? matches.length : 1;

    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const doc = await Promise.race([
        pdfjs.getDocument({ data: new Uint8Array(fileBuffer) }).promise,
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
      ]);
      if (doc && doc.numPages) {
        return doc.numPages;
      }
    } catch {
      // Fallback to regex count
    }

    return regexCount;
  } catch (e) {
    console.warn('Page count error, fallback to 1:', e);
    return 1;
  }
}

// REST API Endpoints
app.get('/api/documents', (_req, res) => {
  try {
    const docs = getDocuments();
    res.json({ success: true, documents: docs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

app.get('/api/documents/:id', (req, res) => {
  try {
    const doc = getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Dokumen tidak ditemukan' });
    }
    const comments = getCommentsWithReplies(doc.id);
    res.json({ success: true, document: doc, comments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

app.get('/api/documents/:id/file', (req, res) => {
  try {
    const doc = getDocumentById(req.params.id);
    if (!doc || !fs.existsSync(doc.file_path)) {
      return res.status(404).json({ success: false, error: 'File PDF fisik tidak ditemukan' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.original_name)}"`);
    fs.createReadStream(doc.file_path).pipe(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

// Multipart Form-Data Upload Endpoint with strict JSON error handling
app.post('/api/documents/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'Ukuran file melebihi batas maksimal 35MB',
          });
        }
        return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ success: false, error: err.message || 'Gagal memproses file upload' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Silakan pilih file PDF' });
      }

      const filePath = req.file.path;
      const pageCount = await countPdfPages(filePath);

      const docId = 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
      const displayName = req.body.name || req.file.originalname;

      const newDoc = createDocument({
        id: docId,
        name: displayName,
        original_name: req.file.originalname,
        file_size: req.file.size,
        page_count: pageCount,
        file_path: filePath,
      });

      broadcastGlobal({
        type: 'document_created',
        document: newDoc,
      });

      return res.json({ success: true, document: newDoc });
    } catch (processErr: unknown) {
      console.error('Error processing uploaded PDF:', processErr);
      const msg = processErr instanceof Error ? processErr.message : String(processErr);
      return res.status(500).json({ success: false, error: msg });
    }
  });
});

// Direct Base64 JSON Upload Endpoint (100% proxy & iframe safe)
app.post('/api/documents/upload-base64', async (req, res) => {
  try {
    const { name, originalName, base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ success: false, error: 'Data base64 file PDF tidak ditemukan' });
    }

    // Strip Data URL prefix if present (e.g. "data:application/pdf;base64,")
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const fileName = (originalName || name || 'document.pdf').replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const savedFileName = `${uniqueSuffix}-${fileName}`;
    const filePath = path.resolve(uploadsDir, savedFileName);

    fs.writeFileSync(filePath, buffer);

    const pageCount = await countPdfPages(filePath);
    const docId = 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    const displayName = name || originalName || 'Dokumen PDF';

    const newDoc = createDocument({
      id: docId,
      name: displayName,
      original_name: originalName || displayName,
      file_size: buffer.length,
      page_count: pageCount,
      file_path: filePath,
    });

    broadcastGlobal({
      type: 'document_created',
      document: newDoc,
    });

    return res.json({ success: true, document: newDoc });
  } catch (err: unknown) {
    console.error('Error processing base64 PDF:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: msg });
  }
});

app.delete('/api/documents/:id', (req, res) => {
  try {
    const success = deleteDocument(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Gagal menghapus dokumen' });
    }

    broadcastGlobal({
      type: 'document_deleted',
      documentId: req.params.id,
    });

    res.json({ success: true, message: 'Dokumen berhasil dihapus' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

// Export comments as Markdown or JSON summary
app.get('/api/documents/:id/export', (req, res) => {
  try {
    const doc = getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Dokumen tidak ditemukan' });
    }
    const comments = getCommentsWithReplies(doc.id);
    const format = req.query.format === 'json' ? 'json' : 'markdown';

    if (format === 'json') {
      res.setHeader('Content-Disposition', `attachment; filename="comments-${doc.name}.json"`);
      return res.json({ document: doc, comments });
    }

    // Generate Markdown report
    let md = `# Laporan Komentar & Review Dokumen: ${doc.name}\n\n`;
    md += `*Diekspor pada: ${new Date().toLocaleString('id-ID')}*\n`;
    md += `*Total Halaman: ${doc.page_count} | Total Komentar: ${comments.length}*\n\n`;
    md += `## Daftar Komentar Per Halaman\n\n`;

    if (comments.length === 0) {
      md += `*Belum ada komentar pada dokumen ini.*\n`;
    } else {
      comments.forEach((c, idx) => {
        md += `### ${idx + 1}. [Halaman ${c.page_number}${c.line_number ? `, Baris ~${c.line_number}` : ''}] Status: ${c.status === 'resolved' ? 'SELESAI (RESOLVED)' : 'BELUM SELESAI (OPEN)'}\n`;
        md += `**Penulis:** ${c.author_name} (${new Date(c.created_at).toLocaleString('id-ID')})\n\n`;
        if (c.selected_text) {
          md += `> **Teks Disorot:** "${c.selected_text}"\n\n`;
        }
        md += `**Komentar:** ${c.content}\n\n`;
        if (c.replies && c.replies.length > 0) {
          md += `**Balasan (${c.replies.length}):**\n`;
          c.replies.forEach((r) => {
            md += `- **${r.author_name}** (${new Date(r.created_at).toLocaleString('id-ID')}): ${r.content}\n`;
          });
          md += `\n`;
        }
        md += `---\n\n`;
      });
    }

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="review-${doc.name.replace(/\s+/g, '_')}.md"`);
    res.send(md);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

// ==========================================
// REAL-TIME WEBSOCKET SERVER IMPLEMENTATION
// ==========================================

interface UserSession {
  ws: WebSocket;
  userId: string;
  userName: string;
  userColor: string;
  userAvatar?: string;
  documentId?: string;
  currentPage?: number;
  cursorX?: number;
  cursorY?: number;
}

const activeSessions = new Map<WebSocket, UserSession>();
const documentRooms = new Map<string, Set<WebSocket>>();

const wss = new WebSocketServer({ server });

function broadcastGlobal(message: unknown) {
  const payload = JSON.stringify(message);
  for (const client of activeSessions.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function broadcastToRoom(documentId: string, message: unknown, excludeWs?: WebSocket) {
  const room = documentRooms.get(documentId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const client of room) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function getRoomCollaborators(documentId: string) {
  const room = documentRooms.get(documentId);
  if (!room) return [];
  const collaborators: Array<{
    userId: string;
    userName: string;
    userColor: string;
    userAvatar?: string;
    currentPage?: number;
    cursorX?: number;
    cursorY?: number;
  }> = [];

  for (const client of room) {
    const session = activeSessions.get(client);
    if (session) {
      collaborators.push({
        userId: session.userId,
        userName: session.userName,
        userColor: session.userColor,
        userAvatar: session.userAvatar,
        currentPage: session.currentPage,
        cursorX: session.cursorX,
        cursorY: session.cursorY,
      });
    }
  }
  return collaborators;
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type } = data;

      switch (type) {
        case 'join_document': {
          const { documentId, user } = data;
          if (!documentId || !user) return;

          // Register session
          const session: UserSession = {
            ws,
            userId: user.id || 'user-' + Math.random().toString(36).substring(2, 7),
            userName: user.name || 'Kolaborator',
            userColor: user.color || '#3b82f6',
            userAvatar: user.avatar,
            documentId,
            currentPage: 1,
          };
          activeSessions.set(ws, session);

          // Add to room
          if (!documentRooms.has(documentId)) {
            documentRooms.set(documentId, new Set());
          }
          documentRooms.get(documentId)!.add(ws);

          // Send current presence snapshot to joined user
          ws.send(
            JSON.stringify({
              type: 'room_snapshot',
              documentId,
              collaborators: getRoomCollaborators(documentId),
            })
          );

          // Broadcast user joined to other room members
          broadcastToRoom(
            documentId,
            {
              type: 'user_joined',
              user: {
                userId: session.userId,
                userName: session.userName,
                userColor: session.userColor,
                userAvatar: session.userAvatar,
                currentPage: session.currentPage,
              },
            },
            ws
          );
          break;
        }

        case 'presence_update': {
          const session = activeSessions.get(ws);
          if (!session || !session.documentId) return;

          session.currentPage = data.currentPage ?? session.currentPage;
          session.cursorX = data.cursorX ?? session.cursorX;
          session.cursorY = data.cursorY ?? session.cursorY;

          broadcastToRoom(
            session.documentId,
            {
              type: 'presence_updated',
              userId: session.userId,
              userName: session.userName,
              userColor: session.userColor,
              currentPage: session.currentPage,
              cursorX: session.cursorX,
              cursorY: session.cursorY,
            },
            ws
          );
          break;
        }

        case 'create_comment': {
          const { comment } = data;
          if (!comment || !comment.document_id) return;

          const savedComment = createComment({
            id: comment.id || 'cmt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            document_id: comment.document_id,
            page_number: comment.page_number,
            line_number: comment.line_number,
            x_percent: comment.x_percent,
            y_percent: comment.y_percent,
            width_percent: comment.width_percent,
            height_percent: comment.height_percent,
            selected_text: comment.selected_text,
            content: comment.content,
            author_name: comment.author_name,
            author_color: comment.author_color,
            author_avatar: comment.author_avatar,
          });

          // Broadcast to everyone in the room (including sender for confirmation)
          broadcastToRoom(comment.document_id, {
            type: 'comment_created',
            comment: savedComment,
          });
          break;
        }

        case 'create_reply': {
          const { documentId, reply } = data;
          if (!documentId || !reply || !reply.comment_id) return;

          const savedReply = createReply({
            id: reply.id || 'rep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            comment_id: reply.comment_id,
            content: reply.content,
            author_name: reply.author_name,
            author_color: reply.author_color,
            author_avatar: reply.author_avatar,
          });

          broadcastToRoom(documentId, {
            type: 'reply_created',
            commentId: reply.comment_id,
            reply: savedReply,
          });
          break;
        }

        case 'resolve_comment': {
          const { documentId, commentId, status } = data;
          if (!documentId || !commentId) return;

          updateCommentStatus(commentId, status);

          broadcastToRoom(documentId, {
            type: 'comment_resolved',
            commentId,
            status,
          });
          break;
        }

        case 'edit_comment': {
          const { documentId, commentId, content } = data;
          if (!documentId || !commentId) return;

          updateCommentContent(commentId, content);

          broadcastToRoom(documentId, {
            type: 'comment_updated',
            commentId,
            content,
          });
          break;
        }

        case 'delete_comment': {
          const { documentId, commentId } = data;
          if (!documentId || !commentId) return;

          deleteComment(commentId);

          broadcastToRoom(documentId, {
            type: 'comment_deleted',
            commentId,
          });
          break;
        }

        case 'delete_reply': {
          const { documentId, commentId, replyId } = data;
          if (!documentId || !replyId) return;

          deleteReply(replyId);

          broadcastToRoom(documentId, {
            type: 'reply_deleted',
            commentId,
            replyId,
          });
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        }
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    const session = activeSessions.get(ws);
    if (session) {
      const { documentId, userId } = session;
      activeSessions.delete(ws);

      if (documentId && documentRooms.has(documentId)) {
        const room = documentRooms.get(documentId)!;
        room.delete(ws);
        if (room.size === 0) {
          documentRooms.delete(documentId);
        } else {
          broadcastToRoom(documentId, {
            type: 'user_left',
            userId,
          });
        }
      }
    }
  });
});

// Configure Vite middleware or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`DocuSync server running on http://0.0.0.0:${PORT} (WebSocket ready)`);
  });
}

startServer();
