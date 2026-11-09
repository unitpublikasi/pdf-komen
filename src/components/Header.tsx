import React, { useState } from 'react';
import {
  FileText,
  MessageSquarePlus,
  Upload,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCode,
  Github,
  ChevronLeft,
  ChevronRight,
  User,
  Trash2,
} from 'lucide-react';
import { DocumentItem, Collaborator, UserProfile } from '../types';

interface HeaderProps {
  currentDocument: DocumentItem | null;
  documents: DocumentItem[];
  collaborators: Collaborator[];
  isWsConnected: boolean;
  currentUser: UserProfile;
  isCommentMode: boolean;
  setIsCommentMode: (val: boolean) => void;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  onSelectDocument: (docId: string) => void;
  onOpenUpload: () => void;
  onOpenDeploy: () => void;
  onOpenUserProfile: () => void;
  onDeleteDocument: (docId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDocument,
  documents,
  collaborators,
  isWsConnected,
  currentUser,
  isCommentMode,
  setIsCommentMode,
  scale,
  setScale,
  currentPage,
  totalPages,
  setCurrentPage,
  onSelectDocument,
  onOpenUpload,
  onOpenDeploy,
  onOpenUserProfile,
  onDeleteDocument,
}) => {
  const [showDocMenu, setShowDocMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(2.5, Math.max(0.5, Math.round((prev + delta) * 10) / 10)));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 select-none shadow-xs">
      {/* Top Main Row */}
      <div className="flex items-center justify-between px-4 py-2.5 gap-3">
        {/* Left Section: Branding & Document Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-200">
              <FileText className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-gray-900 tracking-tight text-base flex items-center gap-1.5">
                DocuSync
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-700">
                  Live
                </span>
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden sm:block" />

          {/* Document Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDocMenu(!showDocMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-left transition max-w-[260px] sm:max-w-[340px]"
              title="Ganti Dokumen"
            >
              <div className="truncate">
                <div className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                  {currentDocument?.name || 'Pilih Dokumen'}
                </div>
                <div className="text-[11px] text-gray-500 truncate flex items-center gap-2">
                  <span>{currentDocument?.page_count || 1} Halaman</span>
                  <span>•</span>
                  <span>PDF Terbuka</span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
            </button>

            {showDocMenu && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDocMenu(false)}
              >
                <div
                  className="absolute left-16 top-14 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Dokumen Tersedia</span>
                    <span className="text-[11px] font-normal text-gray-500">
                      {documents.length} file
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          onSelectDocument(doc.id);
                          setShowDocMenu(false);
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                          doc.id === currentDocument?.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText
                            className={`w-4 h-4 shrink-0 ${
                              doc.id === currentDocument?.id ? 'text-blue-600' : 'text-gray-400'
                            }`}
                          />
                          <span className="truncate">{doc.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {doc.page_count} hal
                          </span>
                          {documents.length > 1 && doc.id !== 'doc-sample-panduan' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Hapus dokumen "${doc.name}" beserta seluruh komentarnya?`)) {
                                  onDeleteDocument(doc.id);
                                }
                              }}
                              className="p-1 hover:text-red-600 rounded text-gray-300 transition"
                              title="Hapus Dokumen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 mt-1 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowDocMenu(false);
                        onOpenUpload();
                      }}
                      className="w-full py-2 px-3 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload File PDF Baru
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real-time WebSocket Status Pill */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              isWsConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={
              isWsConnected
                ? 'WebSocket Aktif: Sinkronisasi instan dua arah berjalan'
                : 'Menyambungkan kembali ke server WebSocket...'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isWsConnected ? 'Live Sync' : 'Reconnecting...'}</span>
          </div>
        </div>

        {/* Right Section: Collaborators, Mode Komentar, Actions, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Collaborators Stack */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
            <Users className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
            <div className="flex items-center -space-x-1.5 overflow-hidden">
              {/* Current user */}
              <div
                className="w-6 h-6 rounded-full border-2 border-white ring-1 ring-blue-500 overflow-hidden cursor-pointer relative"
                title={`${currentUser.name} (Anda)`}
                onClick={onOpenUserProfile}
              >
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              </div>

              {/* Other active room collaborators */}
              {collaborators
                .filter((c) => c.userId !== currentUser.id)
                .slice(0, 4)
                .map((collab) => (
                  <div
                    key={collab.userId}
                    className="w-6 h-6 rounded-full border-2 border-white overflow-hidden cursor-default relative"
                    style={{ borderColor: collab.userColor || '#10b981' }}
                    title={`${collab.userName} (Melihat Hal ${collab.currentPage || 1})`}
                  >
                    <img
                      src={
                        collab.userAvatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${collab.userName}`
                      }
                      alt={collab.userName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}

              {collaborators.filter((c) => c.userId !== currentUser.id).length > 4 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white text-[10px] font-bold text-gray-600 flex items-center justify-center">
                  +{collaborators.filter((c) => c.userId !== currentUser.id).length - 4}
                </div>
              )}
            </div>
            <span className="text-[11px] font-medium text-gray-600 hidden sm:inline ml-1">
              {collaborators.length} Aktif
            </span>
          </div>

          {/* Comment Mode Toggle (Google Docs style) */}
          <button
            onClick={() => setIsCommentMode(!isCommentMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              isCommentMode
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
            title="Klik untuk mengaktifkan pin komentar pada halaman PDF"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isCommentMode ? 'Mode Pasang Pin Aktif' : 'Tambah Komentar'}
            </span>
            <span className="hidden md:inline-block text-[10px] opacity-75 font-mono px-1 rounded bg-black/10">
              Klik Dokumen
            </span>
          </button>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-xs font-medium transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload PDF</span>
          </button>

          {/* Export / Laporan Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium flex items-center gap-1.5 transition"
              title="Ekspor Laporan Review"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ekspor</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showExportMenu && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportMenu(false)}
              >
                <div
                  className="absolute right-20 top-14 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-1.5 z-50 text-left text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-gray-400 uppercase">
                    Unduh Laporan Review
                  </div>
                  <a
                    href={`/api/documents/${currentDocument?.id}/export?format=markdown`}
                    download
                    onClick={() => setShowExportMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition"
                  >
                    <FileCode className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">Laporan Markdown (.md)</div>
                      <div className="text-[10px] text-gray-400">Rangkuman komentar per halaman</div>
                    </div>
                  </a>
                  <a
                    href={`/api/documents/${currentDocument?.id}/export?format=json`}
                    download
                    onClick={() => setShowExportMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Ekspor JSON Lengkap</div>
                      <div className="text-[10px] text-gray-400">Untuk integrasi database eksternal</div>
                    </div>
                  </a>
                  <a
                    href={`/api/documents/${currentDocument?.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShowExportMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition"
                  >
                    <Download className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-medium">Unduh PDF Asli</div>
                      <div className="text-[10px] text-gray-400">Buka file dokumen asli</div>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Deploy & GitHub Guide Button */}
          <button
            onClick={onOpenDeploy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition"
            title="Panduan Deploy GitHub, Vercel & Heroku"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Deploy Cloud</span>
          </button>

          {/* Profile Switcher Trigger */}
          <button
            onClick={onOpenUserProfile}
            className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            title="Ganti Akun & Persona Pengguna"
          >
            <div className="w-6 h-6 rounded-md overflow-hidden bg-gray-100">
              <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </button>
        </div>
      </div>

      {/* Sub-Header: Secondary Toolbar for Page Navigation & Zoom */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50/80 border-t border-gray-100 text-xs text-gray-600">
        {/* Page Selector */}
        <div className="flex items-center gap-1.5">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 font-medium text-gray-700">
            <span>Hal</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }}
              className="w-10 px-1 py-0.5 text-center bg-white border border-gray-300 rounded text-xs font-semibold"
            />
            <span>/ {totalPages}</span>
          </div>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Halaman Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tip / Mode Indicator Banner */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-500">
          {isCommentMode ? (
            <span className="text-amber-700 font-semibold flex items-center gap-1 animate-pulse">
              🎯 Mode Pin Aktif: Klik posisi baris pada PDF untuk menaruh komentar
            </span>
          ) : (
            <span>💡 Tip: Buka di 2 tab browser untuk melihat pembaruan instan WebSocket</span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleZoom(-0.15)}
            className="p-1 rounded hover:bg-gray-200 transition"
            title="Perkecil (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetZoom}
            className="px-2 py-0.5 rounded hover:bg-gray-200 font-mono text-[11px] font-semibold transition"
            title="Reset Zoom ke 100%"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={() => handleZoom(0.15)}
            className="p-1 rounded hover:bg-gray-200 transition"
            title="Perbesar (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale(1.15)}
            className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition ml-1"
            title="Sesuaikan Lebar"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
