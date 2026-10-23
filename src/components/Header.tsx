import React from 'react';
import { User } from '../types/forum.js';
import { Plus, User as UserIcon, LogOut, BookOpen, Layers } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenNewThread: () => void;
  onOpenDocs: () => void;
  onSelectCategory: (slug: string) => void;
  onGoHome: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenNewThread,
  onOpenDocs,
  onSelectCategory,
  onGoHome,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={onGoHome}
          className="text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity flex items-center gap-2 text-left"
        >
          <span className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-mono font-bold text-base shadow-sm">
            C
          </span>
          <span>Comuniland</span>
        </button>

        {/* Zone 2: 4 Nav links single-line */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
          <button
            onClick={onGoHome}
            className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Discusiones
          </button>
          <button
            onClick={() => onSelectCategory('desarrollo')}
            className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Desarrollo
          </button>
          <button
            onClick={() => onSelectCategory('arquitectura')}
            className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Arquitectura
          </button>
          <button
            onClick={onOpenDocs}
            className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-stone-700"
          >
            <BookOpen className="w-4 h-4 text-stone-500" />
            <span>Guía & Código</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary action & Auth */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenNewThread}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Hilo</span>
              </button>

              <button
                onClick={onOpenProfile}
                title={`Perfil de ${currentUser.username}`}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer border border-transparent hover:border-stone-200"
              >
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.username}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-stone-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs">
                    {currentUser.username[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-semibold text-stone-800 max-w-[100px] truncate">
                  {currentUser.username}
                </span>
              </button>

              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Iniciar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
