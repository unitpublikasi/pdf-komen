export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 45) return 'Baru saja';
    if (diffSec < 90) return '1 menit lalu';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export const PRESET_USERS = [
  {
    id: 'user-unit-publikasi',
    name: 'Unit Publikasi (Anda)',
    color: '#2563eb', // Blue
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=UnitPublikasi',
  },
  {
    id: 'user-siti-rahma',
    name: 'Siti Rahma (Reviewer)',
    color: '#059669', // Emerald
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti',
  },
  {
    id: 'user-ahmad-fauzi',
    name: 'Ahmad Fauzi (Lead Eng)',
    color: '#7c3aed', // Purple
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
  },
  {
    id: 'user-budi-santoso',
    name: 'Budi Santoso (QA)',
    color: '#ea580c', // Orange
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi',
  },
  {
    id: 'user-dian-lestari',
    name: 'Dian Lestari (Editor)',
    color: '#db2777', // Pink
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dian',
  },
];
