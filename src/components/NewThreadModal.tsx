import React, { useState } from 'react';
import { Category, Attachment, LinkPreview } from '../types/forum.js';
import { api } from '../services/api.js';
import { renderMarkdown, formatFileSize } from '../utils/markdown.js';
import { X, Upload, Paperclip, Link as LinkIcon, Eye, Edit3, AlertCircle } from 'lucide-react';

interface NewThreadModalProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onThreadCreated: (newThreadId: number) => void;
}

export const NewThreadModal: React.FC<NewThreadModalProps> = ({
  categories,
  isOpen,
  onClose,
  onThreadCreated,
}) => {
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [attachments, setAttachments] = useState<Partial<Attachment>[]>([]);
  const [linkPreviews, setLinkPreviews] = useState<Partial<LinkPreview>[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [isFetchingLink, setIsFetchingLink] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage('');
    try {
      const fileData = await api.uploadFile(file);
      setAttachments((prev) => [...prev, fileData]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al subir archivo');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddLinkPreview = async () => {
    if (!linkInput.trim()) return;
    setIsFetchingLink(true);
    setErrorMessage('');
    try {
      const meta = await api.previewLink(linkInput.trim());
      setLinkPreviews((prev) => [...prev, meta]);
      setLinkInput('');
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo obtener información del enlace');
    } finally {
      setIsFetchingLink(false);
    }
  };

  const handleRemoveLink = (idx: number) => {
    setLinkPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMessage('Por favor completa todos los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await api.createThread({
        category_id: categoryId,
        title: title.trim(),
        content: content.trim(),
        attachments,
        link_previews: linkPreviews,
      });

      onThreadCreated(res.threadId);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al crear el hilo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">Crear Nuevo Hilo de Discusión</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} — {cat.description}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              Título del Hilo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe un título claro y conciso..."
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all font-medium"
            />
          </div>

          {/* Content Editor with Write / Preview Tabs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Contenido (Markdown enriquecido)
              </label>
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-md text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                    activeTab === 'write' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Escribir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                    activeTab === 'preview' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Vista previa</span>
                </button>
              </div>
            </div>

            {activeTab === 'write' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe tu mensaje. Puedes usar **negrita**, `código`, listas o pegar enlaces que se detectarán automáticamente..."
                rows={7}
                required
                className="w-full p-3.5 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all font-mono text-xs leading-relaxed"
              />
            ) : (
              <div
                className="w-full min-h-[175px] max-h-[260px] overflow-y-auto p-4 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-sm prose prose-stone max-w-none"
                dangerouslySetInnerHTML={{
                  __html: content ? renderMarkdown(content) : '<p class="text-stone-400 italic">Nada para previsualizar todavía.</p>',
                }}
              />
            )}
          </div>

          {/* Attachments Section */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Subir Archivos Adjuntos</span>
              </span>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                <span>{isUploading ? 'Subiendo...' : 'Seleccionar archivo'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-stone-400">
              Formatos soportados: Imágenes (JPG, PNG, WEBP), Documentos (PDF), Código fuente (.ts, .js, .py, .sql) y Archivos (.zip). Máximo 20 MB.
            </p>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-800"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-medium truncate max-w-[150px]">{att.file_name}</span>
                    <span className="text-[11px] text-stone-400 tabular-nums">
                      ({formatFileSize(att.file_size || 0)})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-stone-400 hover:text-red-500 ml-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link Previews */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Detectar Vista Previa de Enlace</span>
            </span>

            <div className="flex gap-2">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://ejemplo.com/recurso..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
              />
              <button
                type="button"
                onClick={handleAddLinkPreview}
                disabled={isFetchingLink || !linkInput.trim()}
                className="px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                {isFetchingLink ? 'Extrayendo...' : 'Previsualizar'}
              </button>
            </div>

            {linkPreviews.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {linkPreviews.map((lp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-stone-50 border border-stone-200 rounded-md text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-stone-900 truncate">{lp.title || lp.domain}</div>
                      <div className="text-[11px] text-stone-500 truncate">{lp.original_url}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Publicando...' : 'Publicar Hilo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
