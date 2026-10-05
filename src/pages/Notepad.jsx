import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Search, Plus, BookOpen, Trash2, PenLine, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NoteEditor from '@/components/notepad/NoteEditor';
import CanvasEditor from '@/components/notepad/CanvasEditor';
import DeleteConfirmModal from '@/components/notepad/DeleteConfirmModal';
import { format, isToday, isYesterday } from 'date-fns';
import NoCompanyBanner from '@/components/ui/NoCompanyBanner';

const COLOR_DOT = {
  yellow: 'bg-yellow-400', blue: 'bg-blue-400', green: 'bg-green-400',
  pink: 'bg-pink-400', purple: 'bg-purple-400', white: 'bg-gray-300',
};

function formatNoteDate(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'hh:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd/MM/yyyy');
}

function NoteRow({ note, isActive, onClick }) {
  const isCanvas = note.content?.startsWith('{"elements"');
  const preview = isCanvas ? '🎨 Canvas' : (note.content?.replace(/[#\-\*]/g, '').trim().slice(0, 50) || 'No content');
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-border transition-colors hover:bg-muted/50 ${isActive ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${COLOR_DOT[note.color] || 'bg-yellow-400'}`} />
          <p className="text-sm font-semibold text-foreground truncate">{note.title || 'Untitled'}</p>
        </div>
        <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">{formatNoteDate(note.updated_date || note.created_date)}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5 truncate ml-4">{preview}</p>
    </button>
  );
}

export default function Notepad() {
  const { activeCompany, companies } = useOutletContext();
  const companyId = activeCompany?.id;
  const queryClient = useQueryClient();

  if (!companyId) return <NoCompanyBanner hasNoCompanies={!companies?.length} />;

  const [selectedNote, setSelectedNote] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [noteType, setNoteType] = useState('text'); // 'text' | 'canvas'

  useEffect(() => { api.auth.me().then(setCurrentUser); }, []);

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', companyId],
    queryFn: () => companyId ? api.entities.Note.filter({ company_id: companyId }, '-updated_date') : [],
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Note.create(data),
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      openNote(newNote);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Note.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notes'] }); setSaving(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Note.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (selectedNote?.id === deleteTarget?.id) {
        setSelectedNote(null); setEditTitle(''); setEditContent('');
      }
      setDeleteTarget(null);
    },
  });

  const openNote = (note) => {
    if (selectedNote && noteType === 'text' && (editTitle !== selectedNote.title || editContent !== (selectedNote.content || ''))) {
      updateMutation.mutate({ id: selectedNote.id, data: { title: editTitle, content: editContent } });
    }
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || '');
    // Detect if canvas note (content is JSON with elements)
    const isCanvas = note.content?.startsWith('{"elements"');
    setNoteType(isCanvas ? 'canvas' : 'text');
  };

  const createNew = (type = 'text') => {
    createMutation.mutate({
      title: 'Untitled',
      content: type === 'canvas' ? '{"elements":[],"appState":{"viewBackgroundColor":"#ffffff"}}' : '',
      color: 'yellow',
      is_personal: false,
      company_id: companyId,
      created_by_name: currentUser?.full_name || currentUser?.email || '',
    });
    setNoteType(type);
  };

  const handleCanvasSave = (data) => {
    if (!selectedNote) return;
    updateMutation.mutate({ id: selectedNote.id, data: { content: data } });
    setSelectedNote(prev => ({ ...prev, content: data }));
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
    setSelectedNote(prev => ({ ...prev, color: c }));
  };


  const filtered = notes.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6 bg-background overflow-hidden">

      {/* LEFT: Notes list — iPhone style */}
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-card">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Notes</span>
            <span className="text-xs text-muted-foreground">({notes.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => createNew('text')}
              title="New Text Note"
              className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => createNew('canvas')}
              title="New Canvas Note"
              className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="pl-8 h-8 text-xs bg-muted border-0"
            />
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground px-4 text-center">
              <BookOpen className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs">{search ? 'No notes found' : 'No notes yet. Create your first note!'}</p>
            </div>
          ) : (
            filtered.map(note => (
              <NoteRow
                key={note.id}
                note={note}
                isActive={selectedNote?.id === note.id}
                onClick={() => openNote(note)}
              />
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Editor — always visible */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedNote ? (
          noteType === 'canvas' ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Canvas top bar with title + delete */}
              <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card flex-shrink-0">
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={() => updateMutation.mutate({ id: selectedNote.id, data: { title: editTitle } })}
                  className="flex-1 text-sm font-semibold bg-transparent border-0 outline-none text-foreground"
                  placeholder="Note title..."
                />
                <button
                  onClick={() => setDeleteTarget(selectedNote)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CanvasEditor note={selectedNote} onSave={handleCanvasSave} />
              </div>
            </div>
          ) : (
            <>
              {/* Text note top bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0">
                <div className="flex items-center gap-2">
                  {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBlurSave}
                    className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setDeleteTarget(selectedNote)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
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
              />
            </>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <BookOpen className="w-14 h-14 opacity-15" />
            <p className="text-base font-medium">Select a note</p>
            <p className="text-sm text-muted-foreground">Choose a note from the list or create a new one</p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => createNew('text')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <FileText className="w-4 h-4" /> Text Note
              </button>
              <button
                onClick={() => createNew('canvas')}
                className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors border border-border"
              >
                <PenLine className="w-4 h-4" /> Canvas Note
              </button>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={!!deleteTarget}
        title={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}