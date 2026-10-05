import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Search, Plus, Eye, EyeOff, Copy, Pencil, Trash2, KeyRound, Globe, AlertTriangle, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import { toast } from 'sonner';

const CATEGORIES = ['work', 'social', 'finance', 'email', 'shopping', 'other'];

const CATEGORY_COLORS = {
  work: 'bg-blue-100 text-blue-700',
  social: 'bg-pink-100 text-pink-700',
  finance: 'bg-green-100 text-green-700',
  email: 'bg-yellow-100 text-yellow-700',
  shopping: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-600',
};

function getStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

function StrengthBar({ password }) {
  const s = getStrength(password);
  const color = s <= 1 ? 'bg-red-500' : s <= 3 ? 'bg-yellow-500' : 'bg-green-500';
  const label = s <= 1 ? 'Weak' : s <= 3 ? 'Fair' : 'Strong';
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= s ? color : 'bg-muted'}`} />
        ))}
      </div>
      <p className={`text-xs ${s <= 1 ? 'text-red-500' : s <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>{label}</p>
    </div>
  );
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getSiteIcon(url, name) {
  if (url) {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {}
  }
  return null;
}

export default function Passwords() {
  const { activeCompany } = useOutletContext();
  const companyId = activeCompany?.id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showPwdInForm, setShowPwdInForm] = useState(false);
  const [form, setForm] = useState({ site_name: '', site_url: '', username: '', password: '', notes: '', category: 'work' });

  const { data: passwords = [], isLoading } = useQuery({
    queryKey: ['passwords', companyId],
    queryFn: () => companyId ? api.entities.Password.filter({ company_id: companyId }, '-created_date') : [],
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Password.create({ ...data, company_id: companyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['passwords'] }); toast.success('Password saved'); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Password.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['passwords'] }); toast.success('Password updated'); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Password.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['passwords'] }); toast.success('Password deleted'); setDeleteTarget(null); },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setShowPwdInForm(false);
    setForm({ site_name: '', site_url: '', username: '', password: '', notes: '', category: 'work' });
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ site_name: p.site_name, site_url: p.site_url || '', username: p.username, password: p.password, notes: p.notes || '', category: p.category || 'work' });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.site_name || !form.username || !form.password) {
      toast.error('Please fill all required fields');
      return;
    }
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const toggleVisible = (id) => setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = useMemo(() => passwords.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.site_name?.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q) || p.site_url?.toLowerCase().includes(q);
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    return matchSearch && matchCat;
  }), [passwords, search, activeCategory]);

  const weakCount = passwords.filter(p => getStrength(p.password) <= 1).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <KeyRound className="w-6 h-6" /> Password Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{passwords.length} saved passwords</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Password
        </Button>
      </div>

      {/* Alert for weak passwords */}
      {weakCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm text-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{weakCount}</strong> weak password{weakCount > 1 ? 's' : ''} found. Consider updating them.</span>
        </div>
      )}

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search passwords..." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={activeCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory('all')}>All</Button>
          {CATEGORIES.map(c => (
            <Button key={c} variant={activeCategory === c ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(c)} className="capitalize">{c}</Button>
          ))}
        </div>
      </div>

      {/* Password List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <KeyRound className="w-10 h-10 opacity-20" />
            <p className="text-sm">No passwords found</p>
            <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-2"><Plus className="w-4 h-4" />Add your first password</Button>
          </div>
        ) : (
          filtered.map((p, i) => {
            const isVisible = visiblePasswords[p.id];
            const strength = getStrength(p.password);
            const icon = getSiteIcon(p.site_url, p.site_name);
            return (
              <div key={p.id} className={`flex items-center gap-4 px-5 py-4 ${i !== filtered.length - 1 ? 'border-b border-border' : ''} hover:bg-muted/30 transition-colors group`}>
                {/* Site icon / avatar */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {icon ? (
                    <img src={icon} alt="" className="w-5 h-5" onError={e => { e.target.style.display='none'; }} />
                  ) : (
                    <Globe className="w-5 h-5 text-primary/60" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{p.site_name}</p>
                    <Badge className={`text-xs capitalize ${CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other}`}>{p.category}</Badge>
                    {strength <= 1 && <Badge className="text-xs bg-red-100 text-red-600"><AlertTriangle className="w-2.5 h-2.5 mr-1" />Weak</Badge>}
                    {strength >= 4 && <Badge className="text-xs bg-green-100 text-green-600"><CheckCircle2 className="w-2.5 h-2.5 mr-1" />Strong</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.username}</p>
                  {p.site_url && <p className="text-xs text-muted-foreground opacity-60 truncate">{p.site_url}</p>}
                </div>

                {/* Password field */}
                <div className="hidden sm:flex items-center gap-2 min-w-0">
                  <span className="text-sm font-mono text-muted-foreground select-none" style={{ letterSpacing: isVisible ? 'normal' : '2px' }}>
                    {isVisible ? p.password : '••••••••'}
                  </span>
                  <button onClick={() => toggleVisible(p.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => copyToClipboard(p.username, 'Username')} className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Copy username">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => copyToClipboard(p.password, 'Password')} className="p-2 rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors" title="Copy password">
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(p)} className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" /> {editing ? 'Edit Password' : 'Add Password'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Site / App Name *</Label>
                <Input value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} placeholder="e.g. Google, GitHub" />
              </div>
              <div className="col-span-2">
                <Label>Website URL</Label>
                <Input value={form.site_url} onChange={e => setForm({ ...form, site_url: e.target.value })} placeholder="https://google.com" />
              </div>
              <div className="col-span-2">
                <Label>Username / Email *</Label>
                <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="you@example.com" />
              </div>
              <div className="col-span-2">
                <Label>Password *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPwdInForm ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Enter password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwdInForm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPwdInForm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button type="button" variant="outline" size="icon" title="Generate password"
                    onClick={() => setForm({ ...form, password: generatePassword() })}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                {form.password && <div className="mt-2"><StrengthBar password={form.password} /></div>}
              </div>
              <div className="col-span-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" rows={2} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update' : 'Save'} Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.site_name}
        itemType="Password"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}