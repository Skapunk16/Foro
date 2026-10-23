import React from 'react';
import { Category } from '../types/forum.js';
import { Search, Code2, Database, BookOpen, Rocket, MessageSquare, Flame, Clock, Sparkles } from 'lucide-react';

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2,
  Database,
  BookOpen,
  Rocket,
  MessageSquare,
};

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar hilos o palabras clave..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Sorting Segmented Control */}
      <div className="bg-stone-100 p-1 rounded-lg flex items-center gap-1 text-xs font-medium">
        <button
          onClick={() => onSortChange('recent')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            sortBy === 'recent'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Recientes</span>
        </button>
        <button
          onClick={() => onSortChange('active')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            sortBy === 'active'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Actividad</span>
        </button>
        <button
          onClick={() => onSortChange('popular')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            sortBy === 'popular'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Populares</span>
        </button>
      </div>

      {/* Categories Navigation */}
      <div className="space-y-1">
        <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-stone-400">
          Categorías
        </div>

        <button
          onClick={() => onSelectCategory('all')}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer text-left ${
            selectedCategory === 'all'
              ? 'bg-stone-900 text-white font-medium'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-stone-400" />
            <span>Todos los temas</span>
          </div>
          <span
            className={`text-xs tabular-nums ${
              selectedCategory === 'all' ? 'text-stone-300' : 'text-stone-400'
            }`}
          >
            {categories.reduce((acc, c) => acc + (c.thread_count || 0), 0)}
          </span>
        </button>

        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || MessageSquare;
          const isSelected = selectedCategory === cat.slug;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer text-left ${
                isSelected
                  ? 'bg-stone-900 text-white font-medium'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`} />
                <span className="truncate">{cat.name}</span>
              </div>
              <span
                className={`text-xs tabular-nums shrink-0 ml-2 ${
                  isSelected ? 'text-stone-300' : 'text-stone-400'
                }`}
              >
                {cat.thread_count || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Portable Architecture Callout */}
      <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-2">
        <div className="font-semibold text-stone-900 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-stone-700" />
          <span>Motor SQLite Portable</span>
        </div>
        <p className="leading-relaxed">
          Base de datos autocontenida en <code className="px-1 py-0.5 bg-stone-200 rounded font-mono text-[11px] text-stone-800">/data/forum.sqlite</code>. Sin configuración de servidor externo ni dependencias C++.
        </p>
      </div>
    </aside>
  );
};
