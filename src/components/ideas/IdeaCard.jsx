import React from 'react';
import { MessageSquare, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const STATUS_COLORS = {
  new: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  on_hold: 'bg-orange-100 text-orange-700 border-orange-200',
  done: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const PRIORITY_DOT = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-400',
  high: 'bg-red-500',
};

export default function IdeaCard({ idea, commentCount, onClick }) {
  return (
    <div
      onClick={() => onClick(idea)}
      className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:shadow-md hover:shadow-primary/5 transition-all space-y-3"
    >
      <p className="text-sm font-semibold leading-snug">{idea.title}</p>
      <p className="text-xs text-muted-foreground font-mono">IDEA-{idea.id?.slice(-4).toUpperCase()}</p>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[idea.priority] || 'bg-gray-400'}`} />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="w-3 h-3" />
          <span>{idea.created_by_name || idea.created_by || 'Unknown'}</span>
        </div>
      </div>

      {idea.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {idea.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <MessageSquare className="w-3 h-3" />
        <span>{commentCount || 0}</span>
      </div>
    </div>
  );
}