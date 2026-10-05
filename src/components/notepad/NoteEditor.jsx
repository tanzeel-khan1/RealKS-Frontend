import React from 'react';
import { Trash2, X } from 'lucide-react';
import { api } from '@/api/apiClient';

const COLOR_MAP = {
  yellow: 'bg-yellow-400', blue: 'bg-blue-400', green: 'bg-green-400',
  pink: 'bg-pink-400', purple: 'bg-purple-400', white: 'bg-gray-400',
};

const COVER_COLORS = [
  'from-orange-200 to-pink-200',
  'from-blue-200 to-cyan-200',
  'from-green-200 to-teal-200',
  'from-purple-200 to-pink-200',
  'from-yellow-200 to-orange-200',
  'from-slate-200 to-gray-300',
];

export default function NoteEditor({
  note, editTitle, editContent, saving,
  onTitleChange, onContentChange, onBlurSave,
  onColorChange, onDelete,
  hideCreator = false,
}) {

  const gradientClass = COVER_COLORS[note.title?.charCodeAt(0) % COVER_COLORS.length] || COVER_COLORS[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Cover */}

      {/* Header toolbar */}
      <div className="flex items-center justify-between px-10 py-2.5 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {Object.entries(COLOR_MAP).map(([c, dot]) => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              className={`w-4 h-4 rounded-full ${dot} transition-transform ${note.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'opacity-50 hover:opacity-100'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        {/* Creator */}
        {note.created_by_name && !hideCreator && (
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
              {note.created_by_name[0]?.toUpperCase()}
            </span>
            Created by <span className="font-medium text-foreground">{note.created_by_name}</span>
          </p>
        )}

        {/* Title */}
        <input
          value={editTitle}
          onChange={e => onTitleChange(e.target.value)}
          onBlur={onBlurSave}
          placeholder="Untitled"
          className="w-full text-3xl font-bold bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/30 mb-6 leading-tight"
        />

        {/* Content */}
        <textarea
          value={editContent}
          onChange={e => onContentChange(e.target.value)}
          onBlur={onBlurSave}
          placeholder="Start writing... Use # for headings, - for bullet points"
          className="w-full min-h-[200px] bg-transparent border-0 outline-none resize-none text-sm leading-7 text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          style={{ fontFamily: 'inherit' }}
        />

      </div>
    </div>
  );
}