import React, { useState } from 'react';
import { User } from '../types/forum.js';
import { api } from '../services/api.js';
import { X, Check, User as UserIcon, Calendar, Shield, Save } from 'lucide-react';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await api.updateProfile({ bio, avatar_url: avatarUrl });
      onUpdate(res.user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const avatarChoices = [
    { label: 'Admin', url: '/src/assets/images/avatar_admin_lead_1792778636917.jpg' },
    { label: 'Ingeniera', url: '/src/assets/images/avatar_tech_dev_1792778636794.jpg' },
    { label: 'Maker', url: '/src/assets/images/avatar_creative_maker_1792778637229.jpg' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">Perfil de Usuario</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Top user lockup */}
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.username}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border-2 border-stone-200"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-lg">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-stone-900">{user.username}</h3>
              <p className="text-xs text-stone-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-stone-500" />
                  <span className="capitalize">{user.role}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-stone-500" />
                  <span>Registrado en {new Date(user.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Change Avatar */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Cambiar Avatar
            </label>
            <div className="flex items-center gap-3">
              {avatarChoices.map((choice) => (
                <button
                  key={choice.url}
                  type="button"
                  onClick={() => setAvatarUrl(choice.url)}
                  className={`p-0.5 rounded-full border-2 transition-all cursor-pointer ${
                    avatarUrl === choice.url
                      ? 'border-stone-900 scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={choice.url}
                    alt={choice.label}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Bio input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              Biografía / Acerca de mí
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntale a la comunidad sobre tu experiencia, proyectos o tecnologías preferidas..."
              rows={3}
              className="w-full p-3 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all leading-relaxed"
            />
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Perfil guardado exitosamente.</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
