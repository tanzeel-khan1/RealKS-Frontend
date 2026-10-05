import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const COLOR_MAP = {
  yellow:  { dot: 'bg-yellow-400' },
  blue:    { dot: 'bg-blue-400' },
  green:   { dot: 'bg-green-400' },
  pink:    { dot: 'bg-pink-400' },
  purple:  { dot: 'bg-purple-400' },
  white:   { dot: 'bg-muted-foreground' },
};
const COLORS = Object.keys(COLOR_MAP);

export default function NoteDialog({ open, onClose, form, setForm, editNote, onSave }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editNote ? 'Edit Note' : 'New Company Note'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Note title..."
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="font-semibold"
          />
          <Textarea
            placeholder="Yahan likho..."
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            className="min-h-[160px] resize-none"
          />
          <div>
            <p className="text-xs text-muted-foreground mb-2">Color</p>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${COLOR_MAP[c].dot} ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={!form.title.trim()}>
            {editNote ? 'Save Changes' : 'Create Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}