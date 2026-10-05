import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Plus, BookOpen, Search, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NoteEditor from '@/components/notepad/NoteEditor';
import DeleteConfirmModal from '@/components/notepad/DeleteConfirmModal';

const COLOR_DOT = {
  yellow: 'bg-yellow-400', blue: 'bg-blue-400', green: 'bg-green-400',
  pink: 'bg-pink-400', purple: 'bg-purple-400', white: 'bg-gray-300',
};

const COVER_GRADIENTS = [
  'from-orange-100 to-pink-100', 'from-blue-100 to-cyan-100',
  'from-green-100 to-teal-100', 'from-purple-100 to-pink-100',
  'from-yellow-100 to-orange-100', 'from-slate-100 to-gray-200',
];

function NoteCard({ note, isActive, onClick }) {
  const gradientClass = COVER_GRADIENTS[note.title?.charCodeAt(0) % COVER_GRADIENTS.length] || COVER_GRADIENTS[0];
  const preview = note.content?.replace(/[#\-\*]/g, '').trim().slice(0, 80) || '';

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl border-2 ${isActive ? 'border-primary' : 'border-border hover:border-primary/40'} bg-card cursor-pointer overflow-hidden transition-all hover:shadow-md`}
    >
      <div className={`h-20 w-full bg-gradient-to-br ${gradientClass}`} />
      <div className={`h-0.5 w-full ${COLOR_DOT[note.color] || 'bg-yellow-400'}`} />
      <div className="p-3">
        <p className="text-sm font-semibold text-foreground leading-tight line-clamp-1">{note.title || 'Untitled'}</p>
        {preview && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{preview}</p>}
        <div className="flex items-center mt-2 gap-1">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(note.updated_date || note.created_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function NotesSection({ currentUser }) {
  const queryClient = useQueryClient();
  const [selectedNote, setSelectedNote] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: personalNotes = [] } = useQuery({
    queryKey: ['personal-notes', currentUser?.email],
    queryFn: () => api.entities.Note.filter({ is_personal: true, created_by: currentUser.email }, '-updated_date'),
    enabled: !!currentUser?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Note.create(data),
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ['personal-notes'] });
      setSelectedNote(newNote);
      setEditTitle(newNote.title);
      setEditContent(newNote.content || '');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Note.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personal-notes'] }); setSaving(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Note.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-notes'] });
      if (selectedNote?.id === deleteTarget?.id) { setSelectedNote(null); setEditTitle(''); setEditContent(''); }
      setDeleteTarget(null);
    },
  });

  const openNote = (note) => {
    if (selectedNote && (editTitle !== selectedNote.title || editContent !== (selectedNote.content || ''))) {
      updateMutation.mutate({ id: selectedNote.id, data: { title: editTitle, content: editContent } });
    }
    setSelectedNote(note); setEditTitle(note.title); setEditContent(note.content || '');
  };

  const createNew = () => {
    createMutation.mutate({ title: 'Untitled', content: '', color: 'yellow', is_personal: true, company_id: null });
  };

  const handleBlurSave = () => {
    if (!selectedNote) return;
    if (editTitle !== selectedNote.title || editContent !== (selectedNote.content || '')) {
      setSaving(true);
      updateMutation.mutate({ id: selectedNote.id, data: { title: editTitle, content: editContent } });
    }
  };

  const handleColorChange = (c) => {
    updateMutation.mutate({ id: selectedNote.id, data: { color: c } });
    setSelectedNote({ ...selectedNote, color: c });
  };

  const filtered = personalNotes.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Personal Notes</p>
          <h2 className="text-2xl font-semibold">My notepad</h2>
          <p className="text-sm text-slate-500 mt-1">
            Create and manage your personal notes in a clean, faster workflow.
          </p>
        </div>

        <button
          onClick={createNew}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> New note
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,1fr)_420px]">
        <div className="space-y-4">
          <div className="relative rounded-3xl border border-slate-200 p-3 shadow-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="pl-11 h-11 rounded-2xl text-sm"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200  p-10 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold ">No notes yt</h3>
              <p className="mt-2 text-sm text-slate-500">Start a new note to capture your ideas and tasks.</p>
              <button
                onClick={createNew}
                className="mt-5 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                + New note
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isActive={selectedNote?.id === note.id}
                  onClick={() => openNote(note)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="hidden rounded-3xl border border-slate-200 p-6 shadow-sm lg:block">
          <h3 className="text-lg font-semibold ">Editor preview</h3>
          <p className="mt-3 text-sm text-slate-500">
            Choose a note to open it in the editor. Notes save automatically when you move away.
          </p>
          <div className="mt-6 grid gap-3 text-sm">
            <div className="rounded-2xl  p-4">
              <p className="font-semibold">Tip</p>
              <p className="mt-1">Use headings with # and bullets with - for fast note formatting.</p>
            </div>
            <div className="rounded-2xl p-4">
              <p className="font-semibold">Hint</p>
              <p className="mt-1">Focus on writing and organizing notes without image attachments.</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed inset-y-0 right-0 z-50 w-full  border-l border-slate-200 shadow-2xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:border-l-0 lg:shadow-none lg:w-[42rem] ${selectedNote ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedNote ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200  px-4 py-4 lg:px-6">
              <div>
                <p className="text-sm font-semibold ">Editing note</p>
                <p className="text-xs text-slate-500">{selectedNote.title || 'Untitled'}</p>
              </div>
              <div className="flex items-center gap-2">
                {saving && <span className="text-xs text-slate-500">Saving...</span>}
                <button
                  onClick={handleBlurSave}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="overflow-auto p-4 lg:p-6">
              <NoteEditor
                note={selectedNote}
                editTitle={editTitle}
                editContent={editContent}
                saving={saving}
                onTitleChange={setEditTitle}
                onContentChange={setEditContent}
                onBlurSave={handleBlurSave}
                onColorChange={handleColorChange}
                onDelete={() => setDeleteTarget(selectedNote)}
                hideCreator={true}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-3xl border  p-8 text-center">
            Select a note to open it in the editor.
          </div>
        )}

        {selectedNote && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSelectedNote(null)} />}

        <DeleteConfirmModal
          open={!!deleteTarget}
          title={deleteTarget?.title}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      </div>
    </div>
  );
}