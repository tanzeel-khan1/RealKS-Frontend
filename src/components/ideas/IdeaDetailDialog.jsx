import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, User, CheckCircle2, Circle, Plus, Tag, Flag, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUSES = ['new', 'in_progress', 'on_hold', 'done', 'cancelled'];
const STATUS_LABEL = { new: 'New', in_progress: 'In Progress', on_hold: 'On Hold', done: 'Done', cancelled: 'Cancelled' };
const STATUS_DOT = { new: 'bg-yellow-400', in_progress: 'bg-blue-500', on_hold: 'bg-orange-400', done: 'bg-green-500', cancelled: 'bg-gray-400' };
const PRIORITY_COLOR = { low: 'text-gray-500', medium: 'text-yellow-600', high: 'text-red-500' };
const PRIORITY_ICON = { low: '▼', medium: '▶', high: '▲' };

export default function IdeaDetailDialog({ idea, currentUser, onClose, onStatusChange }) {
  const [comment, setComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['idea-comments', idea?.id],
    queryFn: () => api.entities.IdeaComment.filter({ idea_id: idea.id }, 'created_date'),
    enabled: !!idea,
  });

  const addComment = useMutation({
    mutationFn: (data) => api.entities.IdeaComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea-comments', idea.id] });
      queryClient.invalidateQueries({ queryKey: ['idea-comments-count'] });
      setComment('');
    },
  });

  const updateIdea = useMutation({
    mutationFn: (data) => api.entities.Idea.update(idea.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      onStatusChange?.();
    },
  });

  if (!idea) return null;

  const handleComment = () => {
    if (!comment.trim()) return;
    addComment.mutate({
      idea_id: idea.id,
      company_id: idea.company_id,
      content: comment.trim(),
      author_name: currentUser?.full_name || currentUser?.email || 'Anonymous',
      author_email: currentUser?.email || '',
    });
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks(prev => [...prev, { id: Date.now(), text: newSubtask.trim(), done: false }]);
    setNewSubtask('');
  };

  const toggleSubtask = (id) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s));
  };

  const currentStatus = idea.status || 'new';
  const isDone = currentStatus === 'done';

  return (
    <Sheet open={!!idea} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col gap-0 [&>button]:hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <span className="text-xs text-muted-foreground font-mono">IDEA-{idea.id?.slice(-4).toUpperCase()}</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">

            {/* Title + Status icon */}
            <div className="flex items-start gap-3">
              <button
                onClick={() => updateIdea.mutate({ status: isDone ? 'new' : 'done' })}
                className="mt-1 shrink-0"
              >
                {isDone
                  ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                  : <Circle className="w-6 h-6 text-muted-foreground" />}
              </button>
              <h1 className="text-2xl font-bold leading-tight flex-1">{idea.title}</h1>
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              {/* Assignee */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Assignee</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {(idea.created_by_name || idea.created_by || 'U')[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm">{idea.created_by_name || idea.created_by || 'Unknown'}</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                <Select value={currentStatus} onValueChange={(val) => updateIdea.mutate({ status: val })}>
                  <SelectTrigger className="h-8 w-36 text-xs border-0 bg-muted/50 hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[currentStatus]}`} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s} value={s} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
                          {STATUS_LABEL[s]}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Flag className="w-3 h-3" /> Priority</p>
                <Select value={idea.priority || 'medium'} onValueChange={(val) => updateIdea.mutate({ priority: val })}>
                  <SelectTrigger className="h-8 w-28 text-xs border-0 bg-muted/50 hover:bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['low', 'medium', 'high'].map(p => (
                      <SelectItem key={p} value={p} className="text-xs capitalize">
                        <span className={PRIORITY_COLOR[p]}>{PRIORITY_ICON[p]} {p}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              {idea.tags?.length > 0 && (
                <div className="col-span-full">
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {idea.tags.map(tag => (
                      <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-base font-semibold mb-2">Task description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {idea.description || 'Provide an overview of the task and related details.'}
              </p>
            </div>

            {/* Sub-tasks */}
            <div>
              <h3 className="text-base font-semibold mb-3">Sub-tasks</h3>
              <div className="space-y-2">
                {subtasks.map(s => (
                  <div key={s.id} className="flex items-center gap-3">
                    <button onClick={() => toggleSubtask(s.id)}>
                      {s.done
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <Circle className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <span className={`text-sm ${s.done ? 'line-through text-muted-foreground' : ''}`}>{s.text}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-2">
                  <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input
                    className="text-sm bg-transparent border-none outline-none flex-1 placeholder:text-muted-foreground"
                    placeholder="Add sub-task..."
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addSubtask(); }}
                  />
                </div>
              </div>
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Comments ({comments.length})
              </h3>

              {/* Add comment */}
              <div className="flex gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {(currentUser?.full_name || currentUser?.email || 'U')[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="text-sm resize-none h-10 min-h-0 flex-1"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                  />
                  <Button size="icon" className="shrink-0 h-10 w-10" onClick={handleComment} disabled={!comment.trim() || addComment.isPending}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Comment list */}
              <div className="space-y-4">
                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground pl-10">No comments yet</p>
                )}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">{(c.author_name || 'A')[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold">{c.author_name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(c.created_date), { addSuffix: true }).replace('in ', '').replace('about ', '')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}