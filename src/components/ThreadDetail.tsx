import React, { useState } from 'react';
import { Thread, Post, User, Attachment, LinkPreview } from '../types/forum.js';
import { renderMarkdown, formatFileSize, formatRelativeTime } from '../utils/markdown.js';
import { api } from '../services/api.js';
import {
  ArrowLeft,
  MessageSquare,
  Paperclip,
  Trash2,
  Reply,
  Send,
  ExternalLink,
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Pin,
  Eye,
  CornerDownRight,
  Upload,
  X,
} from 'lucide-react';

interface ThreadDetailProps {
  thread: Thread;
  posts: Post[];
  currentUser: User | null;
  onBack: () => void;
  onRefresh: () => void;
  onOpenAuth: () => void;
}

export const ThreadDetail: React.FC<ThreadDetailProps> = ({
  thread,
  posts,
  currentUser,
  onBack,
  onRefresh,
  onOpenAuth,
}) => {
  const [replyContent, setReplyContent] = useState('');
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [replyAttachments, setReplyAttachments] = useState<Partial<Attachment>[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');
    try {
      const uploaded = await api.uploadFile(file);
      setReplyAttachments((prev) => [...prev, uploaded]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al subir archivo');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setReplyAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.addPost(thread.id, {
        content: replyContent.trim(),
        parent_id: replyParentId,
        attachments: replyAttachments,
      });
      setReplyContent('');
      setReplyParentId(null);
      setReplyAttachments([]);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al publicar respuesta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!confirm('¿Estás seguro de eliminar este hilo de discusión?')) return;
    try {
      await api.deleteThread(thread.id);
      onBack();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el hilo');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;
    try {
      await api.deletePost(postId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar comentario');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-sky-600" />;
    if (fileType.includes('pdf')) return <FileText className="w-4 h-4 text-rose-600" />;
    if (fileType.includes('zip') || fileType.includes('tar') || fileType.includes('compressed'))
      return <FileArchive className="w-4 h-4 text-amber-600" />;
    return <FileCode className="w-4 h-4 text-emerald-600" />;
  };

  // Recursive render for nested replies
  const renderPostItem = (post: Post, level = 0) => {
    const isAuthor = currentUser?.id === post.user_id;
    const isAdmin = currentUser?.role === 'admin';

    return (
      <div key={post.id} className={`${level > 0 ? 'ml-6 sm:ml-10 mt-3 pt-3 border-l-2 border-stone-200 pl-4' : 'mt-4 pt-4 border-t border-stone-100'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {post.user.avatar_url ? (
              <img
                src={post.user.avatar_url}
                alt={post.user.username}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-stone-200"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs">
                {post.user.username[0].toUpperCase()}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-stone-900">{post.user.username}</span>
              {post.user.role === 'admin' && (
                <span className="text-[10px] uppercase font-bold text-stone-400">Admin</span>
              )}
              <span aria-hidden="true" className="text-stone-300">·</span>
              <time dateTime={post.created_at} className="text-stone-500 tabular-nums">
                {formatRelativeTime(post.created_at)}
              </time>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={() => {
                  setReplyParentId(post.id);
                  const replyArea = document.getElementById('reply-form-section');
                  replyArea?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer transition-colors"
                title="Responder a este comentario"
              >
                <Reply className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Responder</span>
              </button>
            )}

            {(isAuthor || isAdmin) && (
              <button
                onClick={() => handleDeletePost(post.id)}
                className="text-xs text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                title="Eliminar comentario"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className="mt-2 text-sm text-stone-700 leading-relaxed prose prose-stone max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-stone-900 prose-pre:text-stone-100"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />

        {/* Post Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.attachments.map((att) => (
              <a
                key={att.id}
                href={att.file_url}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-md text-xs text-stone-800 transition-colors"
              >
                {getFileIcon(att.file_type)}
                <span className="font-medium truncate max-w-[180px]">{att.file_name}</span>
                <span className="text-stone-400 tabular-nums">({formatFileSize(att.file_size)})</span>
              </a>
            ))}
          </div>
        )}

        {/* Nested replies */}
        {post.replies && post.replies.length > 0 && (
          <div className="space-y-1">
            {post.replies.map((r) => renderPostItem(r, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const isThreadAuthor = currentUser?.id === thread.user_id;
  const isThreadAdmin = currentUser?.role === 'admin';

  return (
    <div className="w-full space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a las discusiones</span>
        </button>

        {(isThreadAuthor || isThreadAdmin) && (
          <button
            onClick={handleDeleteThread}
            className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Hilo</span>
          </button>
        )}
      </div>

      {/* Main Thread Article */}
      <article className="p-6 sm:p-8 bg-white border border-stone-200 rounded-xl shadow-xs">
        {/* Category & Status */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-3">
          {thread.pinned && (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
              <Pin className="w-3 h-3 fill-amber-700" />
              <span>Hilo Fijado</span>
              <span aria-hidden="true">·</span>
            </span>
          )}
          <span className="font-semibold text-stone-900">{thread.category.name}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={thread.created_at} className="tabular-nums">
            {formatRelativeTime(thread.created_at)}
          </time>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Eye className="w-3.5 h-3.5" />
            <span>{thread.views_count} lecturas</span>
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight mb-4">
          {thread.title}
        </h1>

        {/* Author Bio Header */}
        <div className="flex items-center gap-3 p-3 mb-6 bg-stone-50 border border-stone-100 rounded-lg">
          {thread.user.avatar_url ? (
            <img
              src={thread.user.avatar_url}
              alt={thread.user.username}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-sm shrink-0">
              {thread.user.username[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-900">{thread.user.username}</span>
              {thread.user.role === 'admin' && (
                <span className="text-[10px] uppercase font-bold text-stone-500">Administrador</span>
              )}
            </div>
            {thread.user.bio && (
              <p className="text-xs text-stone-500 truncate">{thread.user.bio}</p>
            )}
          </div>
        </div>

        {/* Markdown Content */}
        <div
          className="text-sm sm:text-base text-stone-800 leading-relaxed prose prose-stone max-w-none prose-pre:bg-stone-900 prose-pre:text-stone-100 prose-pre:p-4 prose-pre:rounded-lg prose-code:font-mono prose-code:text-stone-800 prose-code:bg-stone-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(thread.content) }}
        />

        {/* Attached Files Section */}
        {thread.attachments && thread.attachments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-stone-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Archivos Adjuntos ({thread.attachments.length})</span>
            </h4>

            {/* Images Showcase if image attachments exist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {thread.attachments
                .filter((att) => att.file_type.startsWith('image/'))
                .map((att) => (
                  <div key={att.id} className="relative group border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                    <img
                      src={att.file_url}
                      alt={att.file_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-44 object-cover group-hover:scale-102 transition-transform duration-200"
                    />
                    <div className="p-2 bg-white/95 text-xs text-stone-700 flex items-center justify-between border-t border-stone-100">
                      <span className="font-medium truncate">{att.file_name}</span>
                      <a
                        href={att.file_url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="text-stone-500 hover:text-stone-900 font-semibold text-[11px] underline ml-2 shrink-0"
                      >
                        Descargar
                      </a>
                    </div>
                  </div>
                ))}
            </div>

            {/* Documents, Code & Archives */}
            <div className="flex flex-wrap gap-2">
              {thread.attachments
                .filter((att) => !att.file_type.startsWith('image/'))
                .map((att) => (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex items-center gap-2.5 px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-800 transition-colors shadow-2xs"
                  >
                    {getFileIcon(att.file_type)}
                    <div>
                      <div className="font-medium truncate max-w-[220px]">{att.file_name}</div>
                      <div className="text-[11px] text-stone-400 tabular-nums">
                        {formatFileSize(att.file_size)}
                      </div>
                    </div>
                  </a>
                ))}
            </div>
          </div>
        )}

        {/* Link Previews */}
        {thread.link_previews && thread.link_previews.length > 0 && (
          <div className="mt-8 pt-6 border-t border-stone-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Enlaces y Recursos Compartidos</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {thread.link_previews.map((lp, idx) => (
                <a
                  key={idx}
                  href={lp.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors group"
                >
                  {lp.favicon_url ? (
                    <img
                      src={lp.favicon_url}
                      alt=""
                      className="w-5 h-5 shrink-0 rounded-xs mt-0.5"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <ExternalLink className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-stone-900 group-hover:text-stone-700 transition-colors truncate">
                      {lp.title || lp.domain}
                    </div>
                    {lp.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {lp.description}
                      </p>
                    )}
                    <span className="text-[11px] text-stone-400 mt-1 block font-mono">
                      {lp.domain}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Discussion & Comments Section */}
      <section className="p-6 sm:p-8 bg-white border border-stone-200 rounded-xl shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-stone-800" />
            <h3 className="text-base font-bold text-stone-900">
              Respuestas ({posts.reduce((acc, p) => acc + 1 + (p.replies?.length || 0), 0)})
            </h3>
          </div>
          <span className="text-xs text-stone-400">Orden cronológico con respuestas anidadas</span>
        </div>

        {/* Existing Comments List */}
        {posts.length === 0 ? (
          <div className="py-8 text-center text-stone-500 text-sm">
            Aún no hay respuestas en este tema. ¡Sé el primero en compartir tu opinión!
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {posts.map((post) => renderPostItem(post))}
          </div>
        )}

        {/* Reply Form */}
        <div id="reply-form-section" className="pt-6 border-t border-stone-200">
          {currentUser ? (
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  {replyParentId ? (
                    <>
                      <CornerDownRight className="w-4 h-4 text-stone-500" />
                      <span>Respondiendo a comentario anidado</span>
                      <button
                        type="button"
                        onClick={() => setReplyParentId(null)}
                        className="text-stone-400 hover:text-stone-700 ml-2 text-xs font-normal underline"
                      >
                        (Cancelar respuesta anidada)
                      </button>
                    </>
                  ) : (
                    <span>Escribir una respuesta al hilo</span>
                  )}
                </span>
                <span className="text-xs text-stone-400">Soporta formato Markdown</span>
              </div>

              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Escribe tu comentario o respuesta técnica aquí..."
                rows={4}
                required
                className="w-full p-3.5 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all font-sans"
              />

              {/* Uploaded attachments preview for reply */}
              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-stone-50 border border-stone-200 rounded-lg">
                  {replyAttachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-stone-200 rounded text-xs text-stone-700"
                    >
                      <Paperclip className="w-3 h-3 text-stone-400" />
                      <span className="truncate max-w-[150px] font-medium">{att.file_name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(i)}
                        className="text-stone-400 hover:text-red-500 ml-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-stone-500" />
                    <span>{isUploading ? 'Subiendo...' : 'Adjuntar archivo'}</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !replyContent.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Publicando...' : 'Publicar Respuesta'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl text-center space-y-3">
              <p className="text-sm text-stone-700">
                Debes iniciar sesión con tu cuenta para unirte a la conversación y responder.
              </p>
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                Iniciar Sesión o Registrarse
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
