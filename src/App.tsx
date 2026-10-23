/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Category, Thread, User, Post } from './types/forum.js';
import { api } from './services/api.js';
import { Header } from './components/Header.js';
import { CategorySidebar } from './components/CategorySidebar.js';
import { ThreadCard } from './components/ThreadCard.js';
import { ThreadDetail } from './components/ThreadDetail.js';
import { NewThreadModal } from './components/NewThreadModal.js';
import { AuthModal } from './components/AuthModal.js';
import { UserProfileModal } from './components/UserProfileModal.js';
import { ArchitectureDocsModal } from './components/ArchitectureDocsModal.js';
import { ChangePasswordModal } from './components/ChangePasswordModal.js';
import { MessageSquare, Plus, BookOpen, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [activeThreadData, setActiveThreadData] = useState<{ thread: Thread; posts: Post[] } | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filters & Sorting
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Loading & Error states
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check current session
  useEffect(() => {
    api.getMe().then((res) => {
      if (res?.user) setCurrentUser(res.user);
    });
  }, []);

  // Fetch categories
  const loadCategories = useCallback(async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Fetch threads list
  const loadThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    setErrorMessage(null);
    try {
      const data = await api.getThreads({
        category: selectedCategory,
        search: searchQuery,
        sort: sortBy,
      });
      setThreads(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar las discusiones');
    } finally {
      setIsLoadingThreads(false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Load single thread detail when selected
  const loadThreadDetail = useCallback(async (id: number) => {
    setIsLoadingDetail(true);
    setErrorMessage(null);
    try {
      const data = await api.getThread(id);
      setActiveThreadData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar el hilo seleccionado');
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadDetail(selectedThreadId);
    } else {
      setActiveThreadData(null);
    }
  }, [selectedThreadId, loadThreadDetail]);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleThreadCreated = (newId: number) => {
    loadThreads();
    loadCategories();
    setSelectedThreadId(newId);
  };

  return (
    <div className="min-h-screen bg-stone-100/60 font-sans text-stone-900 flex flex-col selection:bg-stone-900 selection:text-white">
      {/* Top Bar Header adhering to Top Bar Contract */}
      <Header
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNewThread={() => {
          if (!currentUser) setIsAuthOpen(true);
          else setIsNewThreadOpen(true);
        }}
        onOpenDocs={() => setIsDocsOpen(true)}
        onSelectCategory={(slug) => {
          setSelectedThreadId(null);
          setSelectedCategory(slug);
        }}
        onGoHome={() => {
          setSelectedThreadId(null);
          setSelectedCategory('all');
          setSearchQuery('');
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successBanner && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => {
                setErrorMessage(null);
                if (selectedThreadId) loadThreadDetail(selectedThreadId);
                else loadThreads();
              }}
              className="font-medium underline hover:text-red-900 cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {selectedThreadId && activeThreadData ? (
          /* Single Thread Detail View */
          isLoadingDetail ? (
            <div className="py-20 text-center text-stone-500 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Cargando discusión...</span>
            </div>
          ) : (
            <ThreadDetail
              thread={activeThreadData.thread}
              posts={activeThreadData.posts}
              currentUser={currentUser}
              onBack={() => {
                setSelectedThreadId(null);
                loadThreads();
                loadCategories();
              }}
              onRefresh={() => {
                if (selectedThreadId) loadThreadDetail(selectedThreadId);
              }}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )
        ) : (
          /* Multi-column Forum Canvas */
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Sidebar Navigation */}
            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(slug) => setSelectedCategory(slug)}
              searchQuery={searchQuery}
              onSearchChange={(q) => setSearchQuery(q)}
              sortBy={sortBy}
              onSortChange={(s) => setSortBy(s)}
            />

            {/* Threads List Feed */}
            <div className="flex-1 w-full space-y-4">
              {/* Category banner / Overview strip */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px]">
                    {selectedCategory === 'all'
                      ? 'Todas las discusiones'
                      : categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums font-mono text-stone-500">
                    {threads.length} {threads.length === 1 ? 'hilo encontrado' : 'hilos encontrados'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDocsOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                    <span>Ver Arquitectura & Código</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!currentUser) setIsAuthOpen(true);
                      else setIsNewThreadOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Publicar Hilo</span>
                  </button>
                </div>
              </div>

              {/* Feed Content */}
              {isLoadingThreads ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-5 bg-white border border-stone-200 rounded-xl animate-pulse space-y-3"
                    >
                      <div className="h-4 bg-stone-100 rounded w-1/4" />
                      <div className="h-5 bg-stone-100 rounded w-3/4" />
                      <div className="h-4 bg-stone-100 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : threads.length === 0 ? (
                <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-800">
                    No se encontraron temas en esta categoría
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    {searchQuery
                      ? `No hay resultados para "${searchQuery}". Intenta con otros términos de búsqueda.`
                      : 'Aún no se han publicado discusiones en esta sección. ¡Sé el primero en iniciar la conversación!'}
                  </p>
                  <button
                    onClick={() => {
                      if (!currentUser) setIsAuthOpen(true);
                      else setIsNewThreadOpen(true);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Primera Discusión</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {threads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      onSelect={(id) => setSelectedThreadId(id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <NewThreadModal
        categories={categories}
        isOpen={isNewThreadOpen}
        onClose={() => setIsNewThreadOpen(false)}
        onThreadCreated={handleThreadCreated}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          loadThreads();
        }}
      />

      {currentUser && (
        <UserProfileModal
          user={currentUser}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onUpdate={(updated) => setCurrentUser(updated)}
        />
      )}

      {currentUser && currentUser.must_change_password && (
        <ChangePasswordModal
          isOpen={true}
          user={currentUser}
          onSuccess={(updatedUser) => {
            setCurrentUser({ ...updatedUser, must_change_password: false });
            setSuccessBanner('¡Contraseña de administrador actualizada con éxito! Tu cuenta ahora es segura.');
            setTimeout(() => setSuccessBanner(null), 5000);
          }}
        />
      )}

      <ArchitectureDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">Comuniland</span>
            <span aria-hidden="true">·</span>
            <span>Plataforma Ligera de Foro Comunitario</span>
          </div>
          <div className="flex items-center gap-4 text-stone-600">
            <button
              onClick={() => setIsDocsOpen(true)}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Documentación & Estructura
            </button>
            <span aria-hidden="true">·</span>
            <span>Persistencia SQLite Local</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
