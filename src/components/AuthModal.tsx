import React, { useState } from 'react';
import { api } from '../services/api.js';
import { User } from '../types/forum.js';
import { X, Lock, Mail, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regAvatar, setRegAvatar] = useState('/src/assets/images/avatar_tech_dev_1792778636794.jpg');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.login(identifier, password);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        bio: regBio,
        avatar_url: regAvatar,
      });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userLogin: string, pass: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.login(userLogin, pass);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en inicio rápido');
    } finally {
      setIsLoading(false);
    }
  };

  const avatarChoices = [
    { label: 'Ingeniera Dev', url: '/src/assets/images/avatar_tech_dev_1792778636794.jpg' },
    { label: 'Admin Community', url: '/src/assets/images/avatar_admin_lead_1792778636917.jpg' },
    { label: 'Diseñador Maker', url: '/src/assets/images/avatar_creative_maker_1792778637229.jpg' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-stone-200">
        {/* Header Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center cursor-pointer transition-colors ${
              mode === 'login'
                ? 'bg-white text-stone-900 border-b-2 border-stone-900'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center cursor-pointer transition-colors ${
              mode === 'register'
                ? 'bg-white text-stone-900 border-b-2 border-stone-900'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Crear Cuenta
          </button>
          <button
            onClick={onClose}
            className="px-4 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Initial Admin Notice */}
          <div className="mb-5 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-900">Acceso Inicial Administrador</span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('admin');
                  setPassword('admin');
                }}
                className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 rounded text-[11px] font-semibold text-amber-800 transition-colors cursor-pointer"
              >
                Autocompletar admin / admin
              </button>
            </div>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Usuario: <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-amber-200">admin</code> · Contraseña: <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-amber-200">admin</code>. En tu primer inicio de sesión se te solicitará cambiarla obligatoriamente.
            </p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Usuario o Correo Electrónico
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin o tu@email.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isLoading ? 'Iniciando sesión...' : 'Entrar a Comuniland'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="ej. miguel_tech"
                    required
                    minLength={3}
                    maxLength={30}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contraseña (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Breve Biografía (opcional)
                </label>
                <input
                  type="text"
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  placeholder="ej. Desarrollador frontend, apasionado por Tailwind y Node.js"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Selecciona un Avatar
                </label>
                <div className="flex items-center gap-3">
                  {avatarChoices.map((choice) => (
                    <button
                      key={choice.url}
                      type="button"
                      onClick={() => setRegAvatar(choice.url)}
                      className={`relative rounded-full p-0.5 border-2 transition-all cursor-pointer ${
                        regAvatar === choice.url ? 'border-stone-900 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isLoading ? 'Creando cuenta...' : 'Registrar Cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
