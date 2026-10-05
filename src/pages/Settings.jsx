import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Save, Building2, User, Palette, Mail, Shield, Calendar, Plus, Trash2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Settings() {
  const { activeCompany } = useOutletContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
  });

  // Personal notes - only created_by current user
  const { data: personalNotes = [] } = useQuery({
    queryKey: ['personal-notes', currentUser?.email],
    queryFn: () => api.entities.Note.filter({ is_personal: true, created_by: currentUser.email }, '-created_date'),
    enabled: !!currentUser?.email,
  });

  const [noteDialog, setNoteDialog] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [editingNote, setEditingNote] = useState(null);

  const createNoteMutation = useMutation({
    mutationFn: (data) => api.entities.Note.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personal-notes'] }); setNoteDialog(false); setNoteForm({ title: '', content: '' }); setEditingNote(null); },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Note.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personal-notes'] }); setNoteDialog(false); setNoteForm({ title: '', content: '' }); setEditingNote(null); },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => api.entities.Note.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-notes'] }),
  });

  const openNewNote = () => { setEditingNote(null); setNoteForm({ title: '', content: '' }); setNoteDialog(true); };
  const openEditNote = (n) => { setEditingNote(n); setNoteForm({ title: n.title, content: n.content || '' }); setNoteDialog(true); };
  const saveNote = () => {
    if (!noteForm.title.trim()) return;
    if (editingNote) {
      updateNoteMutation.mutate({ id: editingNote.id, data: noteForm });
    } else {
      createNoteMutation.mutate({ ...noteForm, is_personal: true, company_id: null });
    }
  };
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [form, setForm] = useState({ name: '', industry: '', country: '', currency: 'USD', description: '' });

  useEffect(() => {
    if (activeCompany) {
      setForm({ name: activeCompany.name || '', industry: activeCompany.industry || '', country: activeCompany.country || '', currency: activeCompany.currency || 'USD', description: activeCompany.description || '' });
    }
  }, [activeCompany]);

  const updateMutation = useMutation({
    mutationFn: (data) => api.entities.Company.update(activeCompany.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); toast.success('Settings saved'); },
  });

  const toggleDarkMode = (enabled) => {
    setDarkMode(enabled);
    document.documentElement.classList.toggle('dark', enabled);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your workspace and preferences</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company"><Building2 className="w-4 h-4 mr-1.5" />Company</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-1.5" />Appearance</TabsTrigger>
          <TabsTrigger value="account"><User className="w-4 h-4 mr-1.5" />Account</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6 space-y-4 mt-4">
            <h3 className="font-semibold">Company Details</h3>
            <div><Label>Company Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Industry</Label><Input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
            </div>
            <div><Label>Currency</Label>
              <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'PKR'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <Button onClick={() => updateMutation.mutate(form)} disabled={!activeCompany} className="gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </motion.div>

          {/* Logout from Company */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5 mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Leave Company Workspace</p>
              <p className="text-xs text-muted-foreground mt-0.5">Go to your personal home page.</p>
            </div>
            <Button variant="destructive" onClick={() => navigate('/personal')} className="gap-2">
              <LogOut className="w-4 h-4" /> Go to Personal Home
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="appearance">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6 space-y-4 mt-4">
            <h3 className="font-semibold">Appearance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Toggle dark theme</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="account">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6 space-y-4 mt-4">
            <h3 className="font-semibold">Logged In Account</h3>

            {currentUser ? (
              <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-3">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                    {currentUser.full_name?.charAt(0)?.toUpperCase() || currentUser.email?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-base">{currentUser.full_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.role || 'user'} account</p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{currentUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-medium capitalize">{currentUser.role || 'user'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Member since:</span>
                    <span className="font-medium">{new Date(currentUser.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading account info...</p>
            )}
          </motion.div>

        </TabsContent>
      </Tabs>

      {/* Note Dialog */}
      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingNote ? 'Edit Personal Note' : 'New Personal Note'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title..." value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} />
            <Textarea placeholder="Note content..." value={noteForm.content} onChange={e => setNoteForm({ ...noteForm, content: e.target.value })} className="min-h-[120px] resize-none" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(false)}>Cancel</Button>
            <Button onClick={saveNote} disabled={!noteForm.title.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}