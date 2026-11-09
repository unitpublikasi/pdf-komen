import React, { useState } from 'react';
import { Github, Cloud, Server, Copy, Check, X, Terminal, ExternalLink, Database, ShieldCheck } from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'github' | 'heroku' | 'railway' | 'vercel'>('github');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Panduan Publikasi: GitHub & Cloud Hosting</h3>
              <p className="text-[11px] text-gray-500">Deploy aplikasi DocuSync ke Heroku, Railway, Render, atau Vercel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-gray-200 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('github')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'github'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Github className="w-4 h-4" />
            1. Simpan ke GitHub
          </button>
          <button
            onClick={() => setActiveTab('heroku')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'heroku'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Server className="w-4 h-4" />
            2. Deploy ke Heroku
          </button>
          <button
            onClick={() => setActiveTab('railway')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'railway'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            3. Deploy ke Railway / Render
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'vercel'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Server className="w-4 h-4" />
            4. Vercel Notes
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800">
                <p className="font-semibold mb-1">Langkah 1: Hubungkan ke Repositori GitHub Anda</p>
                <p className="text-[11px] text-blue-700">
                  Buat repositori baru di GitHub (misal: <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">docusync-pdf-review</code>), lalu jalankan perintah terminal berikut:
                </p>
              </div>

              <div className="space-y-2">
                <div className="bg-gray-900 rounded-xl p-3.5 text-gray-100 font-mono text-[11px] relative group">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `git init\ngit add .\ngit commit -m "feat: real-time collaborative PDF annotation"\ngit branch -M main\ngit remote add origin https://github.com/<USERNAME>/docusync-pdf-review.git\ngit push -u origin main`,
                        1
                      )
                    }
                    className="absolute right-2.5 top-2.5 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded flex items-center gap-1 text-[10px] transition"
                  >
                    {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 1 ? 'Tersalin' : 'Salin Semua'}</span>
                  </button>
                  <pre className="overflow-x-auto whitespace-pre leading-relaxed">
{`# 1. Inisialisasi Git
git init
git add .
git commit -m "feat: real-time collaborative PDF annotation"

# 2. Tambahkan Remote GitHub
git branch -M main
git remote add origin https://github.com/<USERNAME>/docusync-pdf-review.git

# 3. Push ke GitHub
git push -u origin main`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'heroku' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900">
                <p className="font-semibold mb-1">Deploy ke Heroku (Full WebSocket & Node Support)</p>
                <p className="text-[11px] text-purple-700">
                  Heroku mendukung koneksi WebSocket secara bawaan. Aplikasi ini telah memiliki script <code className="font-mono bg-purple-100 px-1 py-0.5 rounded">npm run start</code> yang siap dijalankan dyno Heroku.
                </p>
              </div>

              <div className="space-y-3">
                <div className="font-semibold text-gray-800">Langkah-langkah di Heroku CLI:</div>
                <div className="bg-gray-900 rounded-xl p-3.5 text-gray-100 font-mono text-[11px] relative">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `# Login ke Heroku\nheroku login\n\n# Buat aplikasi Heroku baru\nheroku create docusync-app\n\n# Push kode dari branch main\ngit push heroku main\n\n# Buka aplikasi di browser\nheroku open`,
                        2
                      )
                    }
                    className="absolute right-2.5 top-2.5 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded flex items-center gap-1 text-[10px] transition"
                  >
                    {copiedIndex === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 2 ? 'Tersalin' : 'Salin'}</span>
                  </button>
                  <pre className="overflow-x-auto whitespace-pre leading-relaxed">
{`# 1. Login ke Heroku CLI
heroku login

# 2. Buat App Heroku Baru
heroku create docusync-app

# 3. Deploy langsung via Git
git push heroku main

# 4. Buka URL publik Heroku
heroku open`}
                  </pre>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-[11px]">
                  💡 <strong>Catatan Basis Data:</strong> SQLite secara bawaan menyimpan data di disk lokal. Untuk persistensi file permanen di Heroku (karena filesystem Heroku bersifat ephemeral saat restart dyno), Anda dapat menghubungkan add-on <strong>Heroku Postgres</strong> atau cloud storage (AWS S3/Cloud Storage) untuk file PDF.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'railway' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                <p className="font-semibold mb-1">Deploy ke Railway atau Render (Sangat Direkomendasikan)</p>
                <p className="text-[11px] text-emerald-700">
                  Railway & Render menyediakan volume disk persisten secara gratis, sehingga file PDF dan SQLite DB tersimpan aman selamanya dengan WebSocket real-time tanpa setup rumit!
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2">
                  <div className="font-semibold text-gray-800">Petunjuk Deploy Render / Railway:</div>
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-700 text-[11px]">
                    <li>Masuk ke <a href="https://railway.app" target="_blank" rel="noreferrer" className="text-blue-600 underline">railway.app</a> atau <a href="https://render.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">render.com</a>.</li>
                    <li>Klik <strong>"New Project"</strong> → Pilih <strong>"Deploy from GitHub repo"</strong>.</li>
                    <li>Pilih repositori <strong>docusync-pdf-review</strong>.</li>
                    <li>Konfigurasi otomatis terdeteksi:
                      <ul className="list-disc list-inside ml-4 mt-1 text-gray-600">
                        <li>Build Command: <code className="font-mono bg-gray-200 px-1 rounded">npm run build</code></li>
                        <li>Start Command: <code className="font-mono bg-gray-200 px-1 rounded">npm run start</code></li>
                        <li>Port: <code className="font-mono bg-gray-200 px-1 rounded">3000</code></li>
                      </ul>
                    </li>
                    <li>Selesai! Aplikasi langsung dapat diakses publik dengan SSL/HTTPS dan WebSocket aktif.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <p className="font-semibold mb-1">Deploy ke Vercel: Panduan Arsitektur</p>
                <p className="text-[11px] text-amber-700">
                  Vercel dirancang untuk Serverless/Edge. Karena WebSocket membutuhkan koneksi persisten (stateful socket), skema terbaik untuk Vercel adalah:
                </p>
              </div>

              <div className="space-y-2 text-gray-700 text-[11px]">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <strong>Opsi A (Recommended):</strong> Deploy frontend React ke Vercel, dan arahkan WebSocket backend ke Railway/Heroku/Render.
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <strong>Opsi B (All-in-One Cloud):</strong> Gunakan Railway, Render, atau Heroku untuk menjalankan frontend + backend WebSocket sekaligus dalam 1 URL publik.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Semua script package.json sudah terkonfigurasi untuk production</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
