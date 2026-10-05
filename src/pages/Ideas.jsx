import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import NoCompanyBanner from '@/components/ui/NoCompanyBanner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Plus, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import IdeaCard from '@/components/ideas/IdeaCard';
import IdeaDetailDialog from '@/components/ideas/IdeaDetailDialog';

const COLUMNS = [
  { key: 'new', label: 'New', dot: 'bg-yellow-400' },
  { key: 'in_progress', label: 'In Progress', dot: 'bg-blue-500' },
  { key: 'on_hold', label: 'On Hold', dot: 'bg-orange-400' },
  { key: 'done', label: 'Done', dot: 'bg-green-500' },
  { key: 'cancelled', label: 'Cancelled', dot: 'bg-gray-400' },
];

export default function Ideas() {
  const { activeCompany, currentUser, companies } = useOutletContext();
  const companyId = activeCompany?.id;
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', tags: '', status: 'new' });

  const { data: ideas = [] } = useQuery({
    queryKey: ['ideas', companyId],
    queryFn: () => companyId ? api.entities.Idea.filter({ company_id: companyId }, '-created_date') : [],
    enabled: !!companyId,
    initialData: [],
  });

  const { data: allComments = [] } = useQuery({
    queryKey: ['idea-comments-count', companyId],
    queryFn: () => companyId ? api.entities.IdeaComment.filter({ company_id: companyId }) : [],
    enabled: !!companyId,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Idea.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      setCreateOpen(false);
      setForm({ title: '', description: '', priority: 'medium', tags: '', status: 'new' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.entities.Idea.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideas'] }),
  });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createMutation.mutate({
      company_id: companyId,
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      status: form.status || 'new',
      created_by_name: currentUser?.full_name || currentUser?.email || '',
    });
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    // Update status based on which column it was dropped into
    updateStatusMutation.mutate({ id: draggableId, status: destination.droppableId });
  };

  const getCount = (ideaId) => allComments.filter(c => c.idea_id === ideaId).length;

  if (!companyId) return <NoCompanyBanner hasNoCompanies={!companies?.length} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="w-6 h-6" /> Ideas & Tickets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Everyone in the company can create ideas and tickets.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Idea
        </Button>
      </div>

      {/* Kanban Board with Drag and Drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colIdeas = ideas.filter(i => i.status === col.key);
            return (
              <div key={col.key} className="shrink-0 w-64">
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{colIdeas.length}</span>
                </div>

                {/* Add new inline - top */}
                <button
                  onClick={() => { setForm(f => ({ ...f, status: col.key })); setCreateOpen(true); }}
                  className="w-full flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted/50 transition-colors border border-dashed border-border mb-2"
                >
                  <Plus className="w-3.5 h-3.5" /> New idea
                </button>

                {/* Droppable Column */}
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[60px] rounded-xl transition-colors p-1 -m-1 ${snapshot.isDraggingOver ? 'bg-muted/60' : ''}`}
                    >
                      {colIdeas.map((idea, index) => (
                        <Draggable key={idea.id} draggableId={idea.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.85 : 1,
                              }}
                            >
                              <IdeaCard
                                idea={idea}
                                commentCount={getCount(idea.id)}
                                onClick={setSelectedIdea}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Idea / Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title of the Idea" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Write in detail" className="resize-none h-24" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g. bug, feature" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <IdeaDetailDialog
        idea={selectedIdea}
        currentUser={currentUser}
        onClose={() => setSelectedIdea(null)}
        onStatusChange={() => queryClient.invalidateQueries({ queryKey: ['ideas'] })}
      />
    </div>
  );
}