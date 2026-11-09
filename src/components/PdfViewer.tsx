import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { CommentItem, Collaborator, UserProfile } from '../types';
import {
  MessageSquare,
  CheckCircle,
  X,
  Send,
  Sparkles,
  Tag,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  documentId: string;
  comments: CommentItem[];
  activeCommentId: string | null;
  onSelectComment: (id: string) => void;
  isCommentMode: boolean;
  setIsCommentMode: (val: boolean) => void;
  scale: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onTotalPagesLoaded: (count: number) => void;
  currentUser: UserProfile;
  collaborators: Collaborator[];
  onAddComment: (data: {
    page_number: number;
    line_number: number | null;
    x_percent: number;
    y_percent: number;
    selected_text: string | null;
    content: string;
  }) => void;
  onSendPresence: (page: number, cursorX?: number, cursorY?: number) => void;
}

interface NewPinDraft {
  pageNumber: number;
  xPercent: number;
  yPercent: number;
  lineNumber: number | null;
  selectedText: string | null;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  documentId,
  comments,
  activeCommentId,
  onSelectComment,
  isCommentMode,
  setIsCommentMode,
  scale,
  currentPage,
  setCurrentPage,
  onTotalPagesLoaded,
  currentUser,
  collaborators,
  onAddComment,
  onSendPresence,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Comment Draft Popover State
  const [draftPin, setDraftPin] = useState<NewPinDraft | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);

  // Page refs for canvas rendering & intersection observer
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ url: `/api/documents/${documentId}/file` });
        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          onTotalPagesLoaded(doc.numPages);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('Failed to load PDF:', err);
          setError(`Gagal memuat PDF: ${msg}`);
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [documentId, onTotalPagesLoaded]);

  // Render individual page to canvas
  const renderPage = useCallback(
    async (pageIndex: number) => {
      if (!pdfDoc) return;
      const canvas = canvasRefs.current.get(pageIndex);
      if (!canvas) return;

      try {
        const page = await pdfDoc.getPage(pageIndex);
        const viewport = page.getViewport({ scale });

        // High DPI canvas support
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.warn(`Error rendering page ${pageIndex}:`, err);
      }
    },
    [pdfDoc, scale]
  );

  // Re-render all pages when pdfDoc or scale changes
  useEffect(() => {
    if (!pdfDoc) return;
    for (let i = 1; i <= numPages; i++) {
      renderPage(i);
    }
  }, [pdfDoc, numPages, scale, renderPage]);

  // Scroll to active comment if selected from sidebar
  useEffect(() => {
    if (!activeCommentId) return;
    const targetComment = comments.find((c) => c.id === activeCommentId);
    if (!targetComment) return;

    // Scroll container to that page and y position
    const pageEl = pageContainerRefs.current.get(targetComment.page_number);
    if (pageEl) {
      const topOffset = pageEl.offsetTop + (targetComment.y_percent / 100) * pageEl.clientHeight;
      containerRef.current?.scrollTo({
        top: Math.max(0, topOffset - 180),
        behavior: 'smooth',
      });
      setCurrentPage(targetComment.page_number);
    }
  }, [activeCommentId, comments, setCurrentPage]);

  // Handle click on page to place a comment pin
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageNum: number) => {
    if (!isCommentMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = Math.round((x / rect.width) * 1000) / 10;
    const yPercent = Math.round((y / rect.height) * 1000) / 10;

    // Approximate line number (standard doc has ~35-45 lines per page)
    const estimatedLine = Math.max(1, Math.min(50, Math.round((yPercent / 100) * 42) + 1));

    // Check if user highlighted any text
    const selection = window.getSelection()?.toString().trim() || null;

    setDraftPin({
      pageNumber: pageNum,
      xPercent,
      yPercent,
      lineNumber: estimatedLine,
      selectedText: selection,
    });
    setCommentText('');
  };

  // Submit comment
  const handleSubmitComment = () => {
    if (!draftPin || !commentText.trim()) return;

    onAddComment({
      page_number: draftPin.pageNumber,
      line_number: draftPin.lineNumber,
      x_percent: draftPin.xPercent,
      y_percent: draftPin.yPercent,
      selected_text: draftPin.selectedText,
      content: commentText.trim(),
    });

    setDraftPin(null);
    setCommentText('');
    setIsCommentMode(false);
  };

  // Broadcast cursor movement to other room members
  const handlePageMouseMove = (e: React.MouseEvent<HTMLDivElement>, pageNum: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onSendPresence(pageNum, x, y);
  };

  // Track current page scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop + 150;

    for (let i = 1; i <= numPages; i++) {
      const el = pageContainerRefs.current.get(i);
      if (el) {
        const top = el.offsetTop;
        const bottom = top + el.clientHeight;
        if (scrollTop >= top && scrollTop <= bottom) {
          if (currentPage !== i) {
            setCurrentPage(i);
            onSendPresence(i);
          }
          break;
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gray-100 text-gray-500">
        <Loader2 className="w-9 h-9 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-gray-700">Merender Dokumen PDF...</p>
        <p className="text-xs text-gray-400 mt-1">Menyiapkan halaman dan koordinat komentar real-time</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gray-100 text-gray-700">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl max-w-md text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="font-semibold text-red-800 text-sm">Gagal Menampilkan PDF</h3>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`flex-1 overflow-y-auto bg-gray-200/90 py-8 px-4 flex flex-col items-center select-none relative ${
        isCommentMode ? 'cursor-crosshair' : ''
      }`}
    >
      {/* Floating Mode Banner if active */}
      {isCommentMode && (
        <div className="fixed top-24 z-30 bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold animate-bounce">
          <MessageSquare className="w-4 h-4" />
          <span>Klik di mana saja pada halaman untuk menaruh pin komentar</span>
          <button
            onClick={() => {
              setIsCommentMode(false);
              setDraftPin(null);
            }}
            className="ml-2 hover:bg-amber-600 rounded-full p-0.5"
            title="Batalkan Mode Komentar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pages Container */}
      <div className="flex flex-col gap-8 items-center max-w-full">
        {Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNum) => {
          const pageComments = comments.filter((c) => c.page_number === pageNum);
          const pageCollaborators = collaborators.filter(
            (collab) => collab.userId !== currentUser.id && collab.currentPage === pageNum
          );

          return (
            <div
              key={pageNum}
              ref={(el) => {
                if (el) pageContainerRefs.current.set(pageNum, el);
                else pageContainerRefs.current.delete(pageNum);
              }}
              onClick={(e) => handlePageClick(e, pageNum)}
              onMouseMove={(e) => handlePageMouseMove(e, pageNum)}
              className="relative bg-white shadow-xl rounded-sm transition-shadow hover:shadow-2xl overflow-visible border border-gray-300"
            >
              {/* Page Number Watermark Indicator */}
              <div className="absolute -top-6 left-0 text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
                <span>Halaman {pageNum}</span>
                {pageComments.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full text-[10px]">
                    {pageComments.length} Komentar
                  </span>
                )}
              </div>

              {/* PDF Canvas */}
              <canvas
                ref={(el) => {
                  if (el) {
                    canvasRefs.current.set(pageNum, el);
                    renderPage(pageNum);
                  } else {
                    canvasRefs.current.delete(pageNum);
                  }
                }}
                className="block"
              />

              {/* Annotation & Comment Pins Layer */}
              <div className="absolute inset-0 pointer-events-none">
                {pageComments.map((comment, commentIdx) => {
                  const isActive = comment.id === activeCommentId;
                  const isResolved = comment.status === 'resolved';

                  return (
                    <div
                      key={comment.id}
                      style={{
                        left: `${comment.x_percent}%`,
                        top: `${comment.y_percent}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20 group"
                      onMouseEnter={() => setHoveredCommentId(comment.id)}
                      onMouseLeave={() => setHoveredCommentId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectComment(comment.id);
                      }}
                    >
                      {/* Comment Pin Badge (Google Docs style) */}
                      <button
                        className={`relative flex items-center justify-center transition transform active:scale-90 ${
                          isActive
                            ? 'scale-115 ring-4 ring-blue-400 shadow-lg'
                            : 'hover:scale-110 shadow-md'
                        } ${
                          isResolved
                            ? 'w-6 h-6 rounded-full bg-emerald-600 text-white'
                            : 'w-7 h-7 rounded-full text-white'
                        }`}
                        style={{
                          backgroundColor: isResolved ? '#10b981' : comment.author_color || '#3b82f6',
                        }}
                        title={`Komentar oleh ${comment.author_name} (Klik untuk melihat)`}
                      >
                        {isResolved ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-[11px] font-bold">
                            {commentIdx + 1}
                          </span>
                        )}

                        {/* Pulse effect if actively selected */}
                        {isActive && (
                          <span
                            className="absolute -inset-1 rounded-full animate-ping opacity-75"
                            style={{
                              backgroundColor: comment.author_color || '#3b82f6',
                            }}
                          />
                        )}
                      </button>

                      {/* Tooltip Hover Preview */}
                      {(hoveredCommentId === comment.id && !isActive) && (
                        <div className="absolute left-8 top-0 w-64 bg-gray-900/95 backdrop-blur-sm text-white text-xs p-2.5 rounded-lg shadow-xl z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                          <div className="flex items-center justify-between pb-1 mb-1 border-b border-gray-700">
                            <span className="font-semibold text-blue-300 truncate">
                              {comment.author_name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {isResolved ? 'Selesai' : 'Aktif'}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-gray-200">{comment.content}</p>
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="text-[10px] text-amber-300 mt-1 font-medium">
                              💬 {comment.replies.length} balasan
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Live Real-time Collaborators Remote Cursors */}
                {pageCollaborators.map((collab) => {
                  if (typeof collab.cursorX !== 'number' || typeof collab.cursorY !== 'number') {
                    return null;
                  }
                  return (
                    <div
                      key={collab.userId}
                      style={{
                        left: `${collab.cursorX}%`,
                        top: `${collab.cursorY}%`,
                        transition: 'left 0.1s ease-out, top 0.1s ease-out',
                      }}
                      className="absolute pointer-events-none z-30 -translate-x-1 -translate-y-1"
                    >
                      {/* SVG Cursor Pointer */}
                      <svg
                        className="w-5 h-5 drop-shadow"
                        viewBox="0 0 24 24"
                        fill={collab.userColor || '#3b82f6'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      >
                        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
                      </svg>
                      {/* Collaborator Name Tag */}
                      <div
                        className="ml-3 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap shadow-sm"
                        style={{ backgroundColor: collab.userColor || '#3b82f6' }}
                      >
                        {collab.userName}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Popover Composer for New Comment Pin */}
              {draftPin && draftPin.pageNumber === pageNum && (
                <div
                  style={{
                    left: `${Math.min(75, Math.max(15, draftPin.xPercent))}%`,
                    top: `${draftPin.yPercent}%`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute z-40 bg-white rounded-xl shadow-2xl border border-gray-200 p-3.5 w-80 -translate-x-1/2 mt-3 animate-in fade-in zoom-in-95 duration-150 select-text"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: currentUser.color }}
                      >
                        {currentUser.name.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-gray-800">
                        {currentUser.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      Hal {draftPin.pageNumber} • Baris ~{draftPin.lineNumber}
                    </span>
                  </div>

                  {draftPin.selectedText && (
                    <div className="text-[11px] italic text-gray-600 bg-amber-50 border-l-2 border-amber-400 p-2 mb-2 rounded-r">
                      "{draftPin.selectedText}"
                    </div>
                  )}

                  <textarea
                    autoFocus
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleSubmitComment();
                      }
                    }}
                    placeholder="Tulis komentar atau catatan baris ini... (Ctrl+Enter untuk kirim)"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-800"
                  />

                  <div className="flex items-center justify-between mt-2 pt-1">
                    <span className="text-[10px] text-gray-400">
                      Sinkron instan ke semua user
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setDraftPin(null);
                          setIsCommentMode(false);
                        }}
                        className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSubmitComment}
                        disabled={!commentText.trim()}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        Kirim
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
