/**
 * Generates a standard multi-page PDF document for DocuSync initial demonstration.
 */

interface TextLine {
  text: string;
  size?: number;
  leading?: number;
  font?: string;
  isBold?: boolean;
}

export function generateSamplePdfBuffer(): Buffer {
  // Page 1 lines
  const p1Lines: TextLine[] = [
    { text: "PROPOSAL KERJASAMA: SISTEM REVIEW DOKUMEN REAL-TIME", size: 16, leading: 24 },
    { text: "DocuSync Collaborative Engine - Versi 2.4.0", size: 11, leading: 20 },
    { text: "---------------------------------------------------------------------------------------------------------", size: 9, leading: 18 },
    { text: "1. RINGKASAN EKSEKUTIF", size: 13, leading: 22 },
    { text: "Kebutuhan akan kolaborasi dokumen digital yang cepat dan akurat kini menjadi prioritas.", size: 10, leading: 16 },
    { text: "Aplikasi DocuSync hadir untuk menghadirkan pengalaman review PDF interaktif layaknya", size: 10, leading: 16 },
    { text: "Google Docs: pengguna dapat menaruh komentar tepat di koordinat baris atau halaman,", size: 10, leading: 16 },
    { text: "menjawab balasan secara berjenjang, dan memantau status penyelesaian (resolved).", size: 10, leading: 22 },
    { text: "2. FITUR UTAMA SISTEM", size: 13, leading: 22 },
    { text: "- Real-Time Sync: Sinkronisasi instan antar seluruh pengguna menggunakan WebSocket.", size: 10, leading: 16 },
    { text: "- Pin Point & Line Annotation: Pasang pin komentar di sembarang area atau sorot baris teks.", size: 10, leading: 16 },
    { text: "- Basis Data Permanen: Histori komentar, balasan, dan status tersimpan di database.", size: 10, leading: 16 },
    { text: "- Presence Collaboration: Lihat siapa saja yang sedang aktif melihat dokumen dan kursor.", size: 10, leading: 16 },
    { text: "- Multi-File Support: Kemudahan mengunggah file PDF mandiri kapan saja.", size: 10, leading: 22 },
    { text: "3. PANDUAN PENGUJIAN CEPAT", size: 13, leading: 22 },
    { text: "Langkah 1: Aktifkan mode komentar dengan mengklik tombol balon komentar di toolbar.", size: 10, leading: 16 },
    { text: "Langkah 2: Klik di area mana saja pada halaman ini untuk menempatkan pin komentar baru.", size: 10, leading: 16 },
    { text: "Langkah 3: Buka tab browser baru berdampingan untuk menyaksikan pembaruan instan!", size: 10, leading: 16 },
  ];

  // Page 2 lines
  const p2Lines: TextLine[] = [
    { text: "SPESIFIKASI ARSITEKTUR REAL-TIME WEBSOCKET", size: 16, leading: 24 },
    { text: "Modul Komunikasi Bi-Directional & Keandalan Jaringan", size: 11, leading: 20 },
    { text: "---------------------------------------------------------------------------------------------------------", size: 9, leading: 18 },
    { text: "1. PROTOKOL WEBSOCKET TERINTEGRASI", size: 13, leading: 22 },
    { text: "DocuSync menghubungkan client dan server melalui WebSocket channel yang persisten.", size: 10, leading: 16 },
    { text: "Setiap mutasi (tambah komentar, reply thread, toggle status resolve) diproses oleh server", size: 10, leading: 16 },
    { text: "sebagai single source of truth, lalu disiarkan (broadcast) secara instan ke kolaborator.", size: 10, leading: 22 },
    { text: "2. PENYIMPANAN BASIS DATA RELASIONAL", size: 13, leading: 22 },
    { text: "Data tidak disimpan sementara di memori saja, melainkan dicatat permanen dalam SQLite:", size: 10, leading: 16 },
    { text: "- Tabel Dokumen: Metadata nama file, ukuran, jumlah halaman, dan waktu unggah.", size: 10, leading: 16 },
    { text: "- Tabel Komentar: Koordinat relatif (X%, Y%), nomor halaman, nomor baris, status.", size: 10, leading: 16 },
    { text: "- Tabel Balasan (Replies): Threading percakapan bertingkat dengan timestamp dan avatar.", size: 10, leading: 22 },
    { text: "3. PENANGANAN REKONEKSI DAN IDEMPOTENSI", size: 13, leading: 22 },
    { text: "Jika sambungan internet terputus sesaat, klien secara otomatis melakukan auto-reconnect", size: 10, leading: 16 },
    { text: "dan memvalidasi state terbaru sehingga tidak terjadi duplikasi komentar.", size: 10, leading: 16 },
  ];

  // Page 3 lines
  const p3Lines: TextLine[] = [
    { text: "PANDUAN DEPLOYMENT KE GITHUB & CLOUD PROVIDER", size: 16, leading: 24 },
    { text: "Langkah Publikasi Menuju Vercel, Heroku, Railway, atau Render", size: 11, leading: 20 },
    { text: "---------------------------------------------------------------------------------------------------------", size: 9, leading: 18 },
    { text: "1. MENYIMPAN KE REPOSITORI GITHUB", size: 13, leading: 22 },
    { text: "Inisialisasi git pada direktori proyek:", size: 10, leading: 16 },
    { text: "  $ git init", size: 10, leading: 14 },
    { text: "  $ git add .", size: 10, leading: 14 },
    { text: "  $ git commit -m 'feat: initial collaborative PDF annotation app'", size: 10, leading: 14 },
    { text: "  $ git branch -M main", size: 10, leading: 14 },
    { text: "  $ git remote add origin https://github.com/username/docusync-app.git", size: 10, leading: 14 },
    { text: "  $ git push -u origin main", size: 10, leading: 22 },
    { text: "2. DEPLOYMENT KE HEROKU / RAILWAY / RENDER", size: 13, leading: 22 },
    { text: "Karena aplikasi membutuhkan koneksi WebSocket yang persisten, gunakan hosting Node.js:", size: 10, leading: 16 },
    { text: "- Hubungkan repositori GitHub ke Heroku atau Render Dashboard.", size: 10, leading: 16 },
    { text: "- Script build: npm run build, Script start: npm run start.", size: 10, leading: 16 },
    { text: "- Port akan secara otomatis terikat melalui variable process.env.PORT.", size: 10, leading: 22 },
    { text: "3. STATUS VALIDASI & KESIAPAN", size: 13, leading: 22 },
    { text: "Seluruh fungsi komentar per halaman dan baris telah siap digunakan dalam pengujian live.", size: 10, leading: 16 },
  ];

  function buildStreamContent(lines: TextLine[]): string {
    let stream = "BT\n/F1 12 Tf\n";
    let curY = 770;
    for (const l of lines) {
      const sz = l.size || 10;
      const leading = l.leading || 16;
      curY -= leading;
      // escape parentheses and backslashes for PDF string literal
      const safeText = l.text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
      stream += `/F1 ${sz} Tf\n50 ${curY} Td\n(${safeText}) Tj\n-50 -${curY} Td\n`;
    }
    stream += "ET\n";
    return stream;
  }

  const s1 = buildStreamContent(p1Lines);
  const s2 = buildStreamContent(p2Lines);
  const s3 = buildStreamContent(p3Lines);

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R] /Count 3 >>\nendobj\n";
  const obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 6 0 R /Resources << /Font << /F1 9 0 R >> >> >>\nendobj\n";
  const obj4 = "4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 7 0 R /Resources << /Font << /F1 9 0 R >> >> >>\nendobj\n";
  const obj5 = "5 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 8 0 R /Resources << /Font << /F1 9 0 R >> >> >>\nendobj\n";
  const obj6 = `6 0 obj\n<< /Length ${Buffer.byteLength(s1)} >>\nstream\n${s1}endstream\nendobj\n`;
  const obj7 = `7 0 obj\n<< /Length ${Buffer.byteLength(s2)} >>\nstream\n${s2}endstream\nendobj\n`;
  const obj8 = `8 0 obj\n<< /Length ${Buffer.byteLength(s3)} >>\nstream\n${s3}endstream\nendobj\n`;
  const obj9 = "9 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  const header = "%PDF-1.4\n";
  const offsets: number[] = [0];
  let currentOffset = header.length;

  const objs = [obj1, obj2, obj3, obj4, obj5, obj6, obj7, obj8, obj9];
  for (const obj of objs) {
    offsets.push(currentOffset);
    currentOffset += Buffer.byteLength(obj);
  }

  const startxref = currentOffset;
  let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) {
    xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  const trailer = `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  const fullPdf = header + objs.join("") + xref + trailer;
  return Buffer.from(fullPdf, "latin1");
}
