import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentItem, CommentItem, Collaborator, UserProfile } from './types';
import { wsService } from './services/websocket';
import { Header } from './components/Header';
import { PdfViewer } from './components/PdfViewer';
import { CommentSidebar } from './components/CommentSidebar';
import { UploadModal } from './components/UploadModal';
import { DeployModal } from './components/DeployModal';
import { UserProfileModal } from './components/UserProfileModal';
import { PRESET_USERS } from './utils/helpers';
import { Loader2, MessageSquare, Bell, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Documents State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [currentDocument, setCurrentDocument] = useState<DocumentItem | null>(null);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);

  // Comments State
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  // Viewer State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isCommentMode, setIsCommentMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Real-time Collaborators & WebSocket State
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  // User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('docusync_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return PRESET_USERS[0];
  });

  // Modals
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showDeployModal, setShowDeployModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Live Notification Toast
  const [liveToast, setLiveToast] = useState<{
    message: string;
    author: string;
    type: 'comment' | 'reply' | 'resolve';
  } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showNotification = (author: string, message: string, type: 'comment' | 'reply' | 'resolve') => {
    setLiveToast({ author, message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setLiveToast(null);
    }, 4500);
  };

  // Save current user to localStorage
  useEffect(() => {
    localStorage.setItem('docusync_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Load all documents on mount
  const loadDocuments = useCallback(async () => {
    try {
      setLoadingDocs(true);
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.success && data.documents) {
        setDocuments(data.documents);
        if (data.documents.length > 0 && !currentDocument) {
          setCurrentDocument(data.documents[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load documents:', e);
    } finally {
      setLoadingDocs(false);
    }
  }, [currentDocument]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Load document comments when currentDocument changes
  useEffect(() => {
    if (!currentDocument) return;

    let isMounted = true;
    const fetchDocDetails = async () => {
      try {
        const res = await fetch(`/api/documents/${currentDocument.id}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setComments(data.comments || []);
          setTotalPages(data.document.page_count || 1);
          setCurrentPage(1);
        }
      } catch (e) {
        console.error('Failed to fetch document details:', e);
      }
    };

    fetchDocDetails();

    return () => {
      isMounted = false;
    };
  }, [currentDocument]);

  // Connect WebSocket & Register Event Handlers
  useEffect(() => {
    wsService.connect();

    const unsubConnection = wsService.on('connection_change', (data) => {
      setIsWsConnected(data.connected);
    });

    const unsubSnapshot = wsService.on('room_snapshot', (data) => {
      if (data.collaborators) {
        setCollaborators(data.collaborators);
      }
    });

    const unsubUserJoined = wsService.on('user_joined', (data) => {
      setCollaborators((prev) => {
        const exists = prev.some((c) => c.userId === data.user.userId);
        if (exists) return prev;
        return [...prev, data.user];
      });
      showNotification(data.user.userName, 'bergabung ke sesi kolaborasi', 'comment');
    });

    const unsubUserLeft = wsService.on('user_left', (data) => {
      setCollaborators((prev) => prev.filter((c) => c.userId !== data.userId));
    });

    const unsubPresence = wsService.on('presence_updated', (data) => {
      setCollaborators((prev) =>
        prev.map((c) =>
          c.userId === data.userId
            ? {
                ...c,
                currentPage: data.currentPage ?? c.currentPage,
                cursorX: data.cursorX ?? c.cursorX,
                cursorY: data.cursorY ?? c.cursorY,
              }
            : c
        )
      );
    });

    // Handle Comment Created Real-Time
    const unsubCommentCreated = wsService.on('comment_created', (data) => {
      const newComment: CommentItem = data.comment;
      setComments((prev) => {
        // Prevent duplicate
        if (prev.some((c) => c.id === newComment.id)) return prev;
        return [...prev, newComment];
      });

      if (newComment.author_name !== currentUser.name) {
        showNotification(
          newComment.author_name,
          `menambahkan komentar di Hal ${newComment.page_number}: "${newComment.content.substring(0, 45)}..."`,
          'comment'
        );
      }
    });

    // Handle Reply Created Real-Time
    const unsubReplyCreated = wsService.on('reply_created', (data) => {
      const { commentId, reply } = data;
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            const replies = c.replies || [];
            if (replies.some((r) => r.id === reply.id)) return c;
            return { ...c, replies: [...replies, reply] };
          }
          return c;
        })
      );

      if (reply.author_name !== currentUser.name) {
        showNotification(
          reply.author_name,
          `membalas komentar: "${reply.content.substring(0, 45)}..."`,
          'reply'
        );
      }
    });

    // Handle Comment Resolved / Re-opened Real-Time
    const unsubCommentResolved = wsService.on('comment_resolved', (data) => {
      const { commentId, status } = data;
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status } : c))
      );
    });

    // Handle Comment Updated Real-Time
    const unsubCommentUpdated = wsService.on('comment_updated', (data) => {
      const { commentId, content } = data;
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content } : c))
      );
    });

    // Handle Comment Deleted Real-Time
    const unsubCommentDeleted = wsService.on('comment_deleted', (data) => {
      const { commentId } = data;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (activeCommentId === commentId) setActiveCommentId(null);
    });

    // Handle Reply Deleted Real-Time
    const unsubReplyDeleted = wsService.on('reply_deleted', (data) => {
      const { commentId, replyId } = data;
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              replies: (c.replies || []).filter((r) => r.id !== replyId),
            };
          }
          return c;
        })
      );
    });

    // Handle Document Created Global Broadcast
    const unsubDocCreated = wsService.on('document_created', (data) => {
      setDocuments((prev) => {
        if (prev.some((d) => d.id === data.document.id)) return prev;
        return [data.document, ...prev];
      });
    });

    // Handle Document Deleted Global Broadcast
    const unsubDocDeleted = wsService.on('document_deleted', (data) => {
      setDocuments((prev) => prev.filter((d) => d.id !== data.documentId));
      if (currentDocument?.id === data.documentId) {
        setDocuments((latest) => {
          const remaining = latest.filter((d) => d.id !== data.documentId);
          if (remaining.length > 0) {
            setCurrentDocument(remaining[0]);
          }
          return remaining;
        });
      }
    });

    return () => {
      unsubConnection();
      unsubSnapshot();
      unsubUserJoined();
      unsubUserLeft();
      unsubPresence();
      unsubCommentCreated();
      unsubReplyCreated();
      unsubCommentResolved();
      unsubCommentUpdated();
      unsubCommentDeleted();
      unsubReplyDeleted();
      unsubDocCreated();
      unsubDocDeleted();
    };
  }, [currentUser, currentDocument, activeCommentId]);

  // Join Document Room when active document or user changes
  useEffect(() => {
    if (currentDocument && currentUser) {
      wsService.joinDocument(currentDocument.id, currentUser);
    }
  }, [currentDocument, currentUser]);

  // Keyboard shortcut for comment mode: 'M' or 'm'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'm' || e.key === 'M') &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        setIsCommentMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleSelectDocument = (docId: string) => {
    const target = documents.find((d) => d.id === docId);
    if (target) {
      setCurrentDocument(target);
      setActiveCommentId(null);
    }
  };

  const handleAddComment = (commentData: {
    page_number: number;
    line_number: number | null;
    x_percent: number;
    y_percent: number;
    selected_text: string | null;
    content: string;
  }) => {
    if (!currentDocument) return;

    wsService.createComment({
      document_id: currentDocument.id,
      page_number: commentData.page_number,
      line_number: commentData.line_number,
      x_percent: commentData.x_percent,
      y_percent: commentData.y_percent,
      width_percent: 0,
      height_percent: 0,
      selected_text: commentData.selected_text,
      content: commentData.content,
      author_name: currentUser.name,
      author_color: currentUser.color,
      author_avatar: currentUser.avatar,
    });
  };

  const handleAddReply = (commentId: string, content: string) => {
    if (!currentDocument) return;

    wsService.createReply(currentDocument.id, {
      comment_id: commentId,
      content,
      author_name: currentUser.name,
      author_color: currentUser.color,
      author_avatar: currentUser.avatar,
    });
  };

  const handleResolveComment = (commentId: string, status: 'open' | 'resolved') => {
    if (!currentDocument) return;
    wsService.resolveComment(currentDocument.id, commentId, status);
  };

  const handleDeleteComment = (commentId: string) => {
    if (!currentDocument) return;
    wsService.deleteComment(currentDocument.id, commentId);
  };

  const handleDeleteReply = (commentId: string, replyId: string) => {
    if (!currentDocument) return;
    wsService.deleteReply(currentDocument.id, commentId, replyId);
  };

  const handleEditComment = (commentId: string, newContent: string) => {
    if (!currentDocument) return;
    wsService.editComment(currentDocument.id, commentId, newContent);
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Gagal menghapus dokumen');
      }
    } catch (e) {
      console.error('Error deleting document:', e);
    }
  };

  const handleSendPresence = useCallback(
    (pageNum: number, cursorX?: number, cursorY?: number) => {
      wsService.sendPresence(pageNum, cursorX, cursorY);
    },
    []
  );

  if (loadingDocs && documents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <h2 className="text-base font-bold text-gray-800">Menghubungkan ke DocuSync...</h2>
        <p className="text-xs text-gray-400 mt-1">Menginisialisasi basis data dan modul WebSocket</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900 font-sans">
      {/* Top Main Navigation */}
      <Header
        currentDocument={currentDocument}
        documents={documents}
        collaborators={collaborators}
        isWsConnected={isWsConnected}
        currentUser={currentUser}
        isCommentMode={isCommentMode}
        setIsCommentMode={setIsCommentMode}
        scale={scale}
        setScale={setScale}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        onSelectDocument={handleSelectDocument}
        onOpenUpload={() => setShowUploadModal(true)}
        onOpenDeploy={() => setShowDeployModal(true)}
        onOpenUserProfile={() => setShowProfileModal(true)}
        onDeleteDocument={handleDeleteDocument}
      />

      {/* Main Collaborative Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {currentDocument ? (
          <PdfViewer
            documentId={currentDocument.id}
            comments={comments}
            activeCommentId={activeCommentId}
            onSelectComment={(id) => {
              setActiveCommentId(id);
              setIsSidebarOpen(true);
            }}
            isCommentMode={isCommentMode}
            setIsCommentMode={setIsCommentMode}
            scale={scale}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onTotalPagesLoaded={(total) => setTotalPages(total)}
            currentUser={currentUser}
            collaborators={collaborators}
            onAddComment={handleAddComment}
            onSendPresence={handleSendPresence}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-800">Belum ada dokumen yang dipilih</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              Silakan unggah dokumen PDF baru untuk mulai menambahkan komentar dan berkolaborasi secara real-time.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Upload File PDF Sekarang
            </button>
          </div>
        )}

        {/* Right Sidebar: Google Docs Comment Stream */}
        {currentDocument && (
          <CommentSidebar
            comments={comments}
            activeCommentId={activeCommentId}
            onSelectComment={setActiveCommentId}
            currentUser={currentUser}
            documentId={currentDocument.id}
            onAddReply={handleAddReply}
            onResolveComment={handleResolveComment}
            onDeleteComment={handleDeleteComment}
            onDeleteReply={handleDeleteReply}
            onEditComment={handleEditComment}
            onTriggerNewCommentMode={() => setIsCommentMode(true)}
            isOpen={isSidebarOpen}
            onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}
      </div>

      {/* Real-Time Live Notification Toast */}
      {liveToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-gray-900/95 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700/80 flex items-start gap-3 max-w-sm animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div className="text-xs min-w-0">
            <div className="font-semibold text-blue-300 truncate">
              {liveToast.author}
            </div>
            <p className="text-gray-300 mt-0.5 text-[11px] leading-relaxed">
              {liveToast.message}
            </p>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="text-gray-400 hover:text-white p-0.5 ml-auto text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={(newDoc) => {
          setDocuments((prev) => [newDoc, ...prev]);
          setCurrentDocument(newDoc);
          setActiveCommentId(null);
        }}
      />

      <DeployModal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
      />

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
        }}
      />
    </div>
  );
}
