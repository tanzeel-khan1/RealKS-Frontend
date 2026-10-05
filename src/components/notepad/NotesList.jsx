import React from 'react';
import { Trash2, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const COLOR_MAP = {
  yellow:  { border: 'border-l-yellow-400',  dot: 'bg-yellow-400', bg: 'bg-yellow-50' },
  blue:    { border: 'border-l-blue-400',    dot: 'bg-blue-400',   bg: 'bg-blue-50' },
  green:   { border: 'border-l-green-400',   dot: 'bg-green-400',  bg: 'bg-green-50' },
  pink:    { border: 'border-l-pink-400',    dot: 'bg-pink-400',   bg: 'bg-pink-50' },
  purple:  { border: 'border-l-purple-400',  dot: 'bg-purple-400', bg: 'bg-purple-50' },
  white:   { border: 'border-l-gray-300',    dot: 'bg-gray-400',   bg: 'bg-card' },
};

export default function NotesList({ notes, onEdit, onDelete }) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No notes yet. Add one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl">
      <AnimatePresence>
        {notes.map((note, i) => {
          const colors = COLOR_MAP[note.color] || COLOR_MAP.yellow;
          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: i * 0.03 }}
              className={`border border-border border-l-4 ${colors.border} ${colors.bg} rounded-xl p-4 cursor-pointer group hover:shadow-md transition-all`}
              onClick={() => onEdit(note)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                    <h3 className="text-sm font-semibold">{note.title}</h3>
                  </div>
                  {note.content && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed ml-4">
                      {note.content}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(note.created_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(note.id); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}