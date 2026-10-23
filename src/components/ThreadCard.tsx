import React from 'react';
import { Thread } from '../types/forum.js';
import { formatRelativeTime } from '../utils/markdown.js';
import { MessageSquare, Paperclip, Pin, Eye, ExternalLink } from 'lucide-react';

interface ThreadCardProps {
  thread: Thread;
  onSelect: (threadId: number) => void;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({ thread, onSelect }) => {
  return (
    <article
      onClick={() => onSelect(thread.id)}
      className="p-5 bg-white border border-stone-200 hover:border-stone-300 rounded-xl transition-all cursor-pointer group hover:shadow-xs"
    >
      {/* Category & Status quiet kicker */}
      <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
        {thread.pinned && (
          <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
            <Pin className="w-3 h-3 fill-amber-700" />
            <span>Fijado</span>
            <span aria-hidden="true">·</span>
          </span>
        )}
        <span className="font-medium text-stone-700">{thread.category.name}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={thread.created_at} className="tabular-nums">
          {formatRelativeTime(thread.created_at)}
        </time>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-stone-900 group-hover:text-stone-700 transition-colors mb-2 leading-snug">
        {thread.title}
      </h3>

      {/* Snippet */}
      <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed mb-4">
        {thread.content.replace(/[#*`_\[\]()]/g, '')}
      </p>

      {/* Footer Metadata: unboxed clean text */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs text-stone-500">
        {/* Author info */}
        <div className="flex items-center gap-2">
          {thread.user.avatar_url ? (
            <img
              src={thread.user.avatar_url}
              alt={thread.user.username}
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full object-cover border border-stone-200"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[10px]">
              {thread.user.username[0].toUpperCase()}
            </div>
          )}
          <span className="font-medium text-stone-700">{thread.user.username}</span>
        </div>

        {/* Counts & Indicators */}
        <div className="flex items-center gap-4 tabular-nums">
          {thread.attachments && thread.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-stone-500" title={`${thread.attachments.length} archivo(s) adjunto(s)`}>
              <Paperclip className="w-3.5 h-3.5" />
              <span>{thread.attachments.length}</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-stone-500" title={`${thread.views_count} lecturas`}>
            <Eye className="w-3.5 h-3.5" />
            <span>{thread.views_count}</span>
          </span>

          <span className="inline-flex items-center gap-1 font-medium text-stone-700" title={`${thread.reply_count} comentarios`}>
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{thread.reply_count}</span>
          </span>
        </div>
      </div>
    </article>
  );
};
