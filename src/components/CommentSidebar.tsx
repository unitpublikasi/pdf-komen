import React, { useState, useRef, useEffect } from 'react';
import { CommentItem, ReplyItem, UserProfile } from '../types';
import { formatRelativeTime } from '../utils/helpers';
import {
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  MoreVertical,
  Trash2,
  Edit2,
  CornerDownRight,
  Send,
  Search,
  Filter,
  X,
  MessageSquarePlus,
  Check,
} from 'lucide-react';

interface CommentSidebarProps {
  comments: CommentItem[];
  activeCommentId: string | null;
  onSelectComment: (id: string) => void;
  currentUser: UserProfile;
  documentId: string;
  onAddReply: (commentId: string, content: string) => void;
  onResolveComment: (commentId: string, status: 'open' | 'resolved') => void;
  onDeleteComment: (commentId: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
  onEditComment: (commentId: string, newContent: string) => void;
  onTriggerNewCommentMode: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const CommentSidebar: React.FC<CommentSidebarProps> = ({
  comments,
  activeCommentId,
  onSelectComment,
  currentUser,
  documentId,
  onAddReply,
  onResolveComment,
  onDeleteComment,
  onDeleteReply,
  onEditComment,
  onTriggerNewCommentMode,
  isOpen,
  onToggleOpen,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto scroll sidebar to active card when activeCommentId changes
  useEffect(() => {
    if (activeCommentId && cardRefs.current.has(activeCommentId)) {
      const el = cardRefs.current.get(activeCommentId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeCommentId]);

  // Filtered comments
  const filteredComments = comments.filter((c) => {
    // Status filter
    if (filterStatus === 'open' && c.status !== 'open') return false;
    if (filterStatus === 'resolved' && c.status !== 'resolved') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inContent = c.content.toLowerCase().includes(q);
      const inAuthor = c.author_name.toLowerCase().includes(q);
      const inText = c.selected_text ? c.selected_text.toLowerCase().includes(q) : false;
      const inReplies = c.replies?.some(
        (r) => r.content.toLowerCase().includes(q) || r.author_name.toLowerCase().includes(q)
      );
      return inContent || inAuthor || inText || inReplies;
    }

    return true;
  });

  const openCount = comments.filter((c) => c.status === 'open').length;
  const resolvedCount = comments.filter((c) => c.status === 'resolved').length;

  const handleSendReply = (commentId: string) => {
    const text = replyTexts[commentId]?.trim();
    if (!text) return;
    onAddReply(commentId, text);
    setReplyTexts((prev) => ({ ...prev, [commentId]: '' }));
  };

  const handleStartEdit = (comment: CommentItem) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setActiveMenuId(null);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return;
    onEditComment(commentId, editContent.trim());
    setEditingCommentId(null);
    setEditContent('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed right-4 bottom-6 z-30 bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold transition transform hover:scale-105"
        title="Buka Panel Komentar"
      >
        <MessageSquare className="w-5 h-5" />
        <span>Komentar ({comments.length})</span>
      </button>
    );
  }

  return (
    <aside className="w-80 md:w-96 bg-white border-l border-gray-200 flex flex-col h-[calc(100vh-89px)] sticky top-[89px] z-20 shrink-0 shadow-lg md:shadow-none select-text">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-gray-200 bg-gray-50/70">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              Komentar & Review
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {comments.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onTriggerNewCommentMode}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
              title="Tambah Komentar Baru"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleOpen}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition"
              title="Tutup Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-200/80 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 py-1 rounded-md transition text-center ${
              filterStatus === 'all'
                ? 'bg-white text-gray-900 shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua ({comments.length})
          </button>
          <button
            onClick={() => setFilterStatus('open')}
            className={`flex-1 py-1 rounded-md transition text-center ${
              filterStatus === 'open'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Aktif ({openCount})
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`flex-1 py-1 rounded-md transition text-center ${
              filterStatus === 'resolved'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Selesai ({resolvedCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mt-2">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari komentar, teks, atau nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Comment List Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredComments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-xs font-semibold text-gray-600">
              {searchQuery
                ? 'Tidak ada komentar yang cocok'
                : filterStatus === 'resolved'
                ? 'Belum ada komentar yang diselesaikan'
                : 'Belum ada komentar'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
              Klik tombol 'Tambah Komentar' lalu klik bagian mana saja pada dokumen PDF untuk menaruh catatan.
            </p>
          </div>
        ) : (
          filteredComments.map((comment, index) => {
            const isActive = comment.id === activeCommentId;
            const isResolved = comment.status === 'resolved';
            const isEditing = editingCommentId === comment.id;

            return (
              <div
                key={comment.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(comment.id, el);
                  else cardRefs.current.delete(comment.id);
                }}
                onClick={() => onSelectComment(comment.id)}
                className={`rounded-xl border transition p-3.5 cursor-pointer relative ${
                  isActive
                    ? 'border-blue-400 bg-blue-50/40 ring-2 ring-blue-100 shadow-sm'
                    : isResolved
                    ? 'border-gray-200 bg-gray-50/80 opacity-80 hover:opacity-100'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs'
                }`}
              >
                {/* Header: Author + Page Tag + Options */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden"
                      style={{ backgroundColor: comment.author_color || '#3b82f6' }}
                    >
                      {comment.author_avatar ? (
                        <img
                          src={comment.author_avatar}
                          alt={comment.author_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        comment.author_name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                        <span className="truncate max-w-[130px]">{comment.author_name}</span>
                        {isResolved && (
                          <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                            Selesai
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        <span>{formatRelativeTime(comment.created_at)}</span>
                        <span>•</span>
                        <span className="font-medium text-blue-600">
                          Hal {comment.page_number}
                          {comment.line_number ? ` (Baris ~${comment.line_number})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Resolve Button */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolveComment(comment.id, isResolved ? 'open' : 'resolved');
                      }}
                      className={`p-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                        isResolved
                          ? 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={isResolved ? 'Buka kembali thread' : 'Tandai sebagai selesai'}
                    >
                      {isResolved ? (
                        <RotateCcw className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>

                    {/* Three-dot dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === comment.id ? null : comment.id);
                        }}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {activeMenuId === comment.id && (
                        <div
                          className="absolute right-0 top-6 w-32 bg-white rounded-lg shadow-xl border border-gray-200 p-1 z-30 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleStartEdit(comment)}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-gray-700 flex items-center gap-1.5"
                          >
                            <Edit2 className="w-3 h-3 text-blue-500" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              if (confirm('Hapus komentar ini beserta semua balasannya?')) {
                                onDeleteComment(comment.id);
                              }
                            }}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-red-50 text-red-600 flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selected Quote if any */}
                {comment.selected_text && (
                  <div className="text-[11px] italic text-gray-600 bg-amber-50/80 border-l-2 border-amber-400 px-2 py-1 mb-2 rounded-r">
                    "{comment.selected_text}"
                  </div>
                )}

                {/* Comment Content / Edit mode */}
                {isEditing ? (
                  <div className="space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full text-xs p-2 border border-blue-400 rounded-lg focus:outline-none text-gray-800"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 rounded"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleSaveEdit(comment.id)}
                        className="px-2.5 py-1 text-[11px] bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                )}

                {/* Replies Thread */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-2.5">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="flex items-start gap-2 text-xs bg-gray-50/90 p-2 rounded-lg group/reply"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden"
                          style={{ backgroundColor: reply.author_color || '#10b981' }}
                        >
                          {reply.author_avatar ? (
                            <img
                              src={reply.author_avatar}
                              alt={reply.author_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            reply.author_name.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900 text-[11px]">
                              {reply.author_name}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-400">
                                {formatRelativeTime(reply.created_at)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Hapus balasan ini?')) {
                                    onDeleteReply(comment.id, reply.id);
                                  }
                                }}
                                className="opacity-0 group-hover/reply:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition"
                                title="Hapus Balasan"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-700 text-[11px] mt-0.5 whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Reply Composer (visible when active card or user focuses) */}
                <div
                  className="mt-3 pt-2 border-t border-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <CornerDownRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Balas komentar ini..."
                      value={replyTexts[comment.id] || ''}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendReply(comment.id);
                        }
                      }}
                      className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 placeholder-gray-400"
                    />
                    <button
                      onClick={() => handleSendReply(comment.id)}
                      disabled={!replyTexts[comment.id]?.trim()}
                      className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition shrink-0"
                      title="Kirim Balasan"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
