import React from 'react';
import { Trash2, BookOpen, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const COLOR_MAP = {
  yellow:  { bg: 'bg-yellow-50 border-yellow-200',  dot: 'bg-yellow-400' },
  blue:    { bg: 'bg-blue-50 border-blue-200',      dot: 'bg-blue-400' },
  green:   { bg: 'bg-green-50 border-green-200',    dot: 'bg-green-400' },
  pink:    { bg: 'bg-pink-50 border-pink-200',      dot: 'bg-pink-400' },
  purple:  { bg: 'bg-purple-50 border-purple-200',  dot: 'bg-purple-400' },
  white:   { bg: 'bg-card border-border',            dot: 'bg-muted-foreground' },
};

export default function NotesGrid({ notes, onEdit, onDelete, onAddNew }) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No notes yet. Add one!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence>
        {notes.map((note, i) => {
          const colors = COLOR_MAP[note.color] || COLOR_MAP.yellow;
          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
              className={`border rounded-xl p-4 cursor-pointer group relative hover:shadow-md transition-all ${colors.bg}`}
              onClick={() => onEdit(note)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                  <p className="text-sm font-semibold truncate">{note.title}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(note.id); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {note.content && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-4 leading-relaxed whitespace-pre-line">
                  {note.content}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-3">
                {new Date(note.created_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}