import React, { useState } from 'react';
import { api } from '../services/api.js';
import { User } from '../types/forum.js';
import { ShieldAlert, Lock, Check, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  user: User;
  onSuccess: (updatedUser: User) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  user,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.trim().length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword.trim().toLowerCase() === 'admin') {
      setErrorMsg('Por seguridad, la nueva contraseña no puede seguir siendo "admin".');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.changePassword(currentPassword.trim(), newPassword.trim());
      onSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500 text-stone-950 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 shrink-0 text-stone-950" />
          <div>
            <h2 className="text-base font-bold leading-tight">Cambio Obligatorio de Contraseña</h2>
            <p className="text-xs text-stone-900 font-medium">
              Primer inicio de sesión de la cuenta {user.username}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-600 leading-relaxed">
            Has accedido con la contraseña predeterminada <code className="bg-stone-200 px-1 py-0.5 rounded font-mono font-bold text-stone-900">admin</code>. Para proteger la plataforma, debes establecer una contraseña personal segura antes de continuar.
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Contraseña Actual
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="admin"
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nueva Contraseña (mínimo 6 caracteres)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Escribe tu nueva contraseña segura..."
                required
                minLength={6}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña..."
                required
                minLength={6}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !newPassword.trim() || !confirmPassword.trim()}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isLoading ? 'Actualizando...' : 'Guardar y Entrar al Foro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
