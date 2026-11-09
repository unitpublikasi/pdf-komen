import React, { useState } from 'react';
import { UserProfile } from '../types';
import { PRESET_USERS } from '../utils/helpers';
import { User, X, Check, RefreshCw, Palette } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (newUser: UserProfile) => void;
}

const COLOR_OPTIONS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#7c3aed', // Purple
  '#ea580c', // Orange
  '#db2777', // Pink
  '#0284c7', // Sky
  '#4f46e5', // Indigo
  '#dc2626', // Red
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [selectedColor, setSelectedColor] = useState(currentUser.color);
  const [avatarSeed, setAvatarSeed] = useState(
    currentUser.name.replace(/[^a-zA-Z0-9]/g, '') || 'User'
  );

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      avatarSeed
    )}`;

    onUpdateUser({
      ...currentUser,
      name: name.trim(),
      color: selectedColor,
      avatar: avatarUrl,
    });
    onClose();
  };

  const handleSelectPreset = (preset: (typeof PRESET_USERS)[0]) => {
    onUpdateUser({
      id: preset.id,
      name: preset.name,
      color: preset.color,
      avatar: preset.avatar,
    });
    setName(preset.name);
    setSelectedColor(preset.color);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: selectedColor }}
            >
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Profil Kolaborator</h3>
              <p className="text-[11px] text-gray-500">Sesuaikan nama dan warna pin komentar Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Quick Preset Selector */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Pilih Cepat Persona Pengguna:
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESET_USERS.map((preset) => {
                const isSelected = currentUser.id === preset.id || currentUser.name === preset.name;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 font-semibold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full overflow-hidden border border-gray-300"
                        style={{ borderColor: preset.color }}
                      >
                        <img
                          src={preset.avatar}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-gray-900 font-medium">{preset.name}</div>
                        <div className="text-[10px] text-gray-400">Warna Pin: {preset.color}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
              atau atur custom
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Custom Name */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Nama Tampilan</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap atau divisi..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>

            {/* Color Palette */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-gray-500" />
                Warna Pin Komentar
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition transform hover:scale-110 ${
                      selectedColor === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-105' : ''
                    }`}
                  >
                    {selectedColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-xs"
              >
                Terapkan Profil
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
