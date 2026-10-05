import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarDays, CheckCircle2, DollarSign, Mail, MapPin, Pencil, Phone, Plus, Search, Sparkles, Trash2, UserRound } from 'lucide-react';
import { api } from '@/api/apiClient';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CLIENT_STATUSES = ['New', 'Contacted', 'Viewing', 'Negotiating', 'Closed', 'Lost'];
const STATUS_STYLES = {
  New: 'bg-slate-100 text-slate-700',
  Contacted: 'bg-blue-100 text-blue-700',
  Viewing: 'bg-violet-100 text-violet-700',
  Negotiating: 'bg-amber-100 text-amber-700',
  Closed: 'bg-emerald-100 text-emerald-700',
  Lost: 'bg-red-100 text-red-700',
};
const emptyForm = { name: '', email: '', phone: '', budget: '', address: '', status: 'New', closed_date: '' };
const clientId = (client) => client.id || client._id;

export default function Clients() {
  const { activeCompany } = useOutletContext();
  const companyId = activeCompany?.id || activeCompany?._id;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: () => api.entities.Client.filter({ company_id: companyId }, '-created_date'),
    enabled: !!companyId,
    initialData: [],
  });

  const visibleClients = clients.filter((client) => {
    const query = search.trim().toLowerCase();
    const matchesFilter = filter === 'All' || (client.status || 'New') === filter;
    const matchesSearch = !query || [client.name, client.email, client.phone, client.address]
      .some((value) => value?.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: clients.length,
    active: clients.filter((client) => !['Closed', 'Lost'].includes(client.status || 'New')).length,
    closed: clients.filter((client) => client.status === 'Closed').length,
    pipeline: clients.reduce((total, client) => total + Number(client.budget || 0), 0),
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? api.entities.Client.update(clientId(editing), data)
      : api.entities.Client.create({ ...data, company_id: companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', companyId] });
      toast.success(editing ? 'Client updated' : 'Client created');
      closeDialog();
    },
    onError: (error) => toast.error(error.message || 'Unable to save client'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', companyId] });
      setDeleteTarget(null);
      toast.success('Client deleted');
    },
    onError: (error) => toast.error(error.message || 'Unable to delete client'),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      budget: client.budget ?? '',
      address: client.address || '',
      status: client.status || 'New',
      closed_date: client.closed_date ? client.closed_date.slice(0, 10) : '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Client name is required');
      return;
    }
    saveMutation.mutate({ ...form, budget: form.budget === '' ? 0 : Number(form.budget) });
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-xl sm:px-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300"><Sparkles className="h-3.5 w-3.5" /> Client pipeline</div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Clients</h1><p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">Keep every relationship moving from first contact to closing.</p></div><Button onClick={openAdd} className="w-full gap-2 bg-amber-300 text-slate-950 hover:bg-amber-200 sm:w-auto"><Plus className="h-4 w-4" /> Add client</Button></div>
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[24px] border-white/5" />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[{ label: 'Total clients', value: stats.total, icon: UserRound }, { label: 'Active pipeline', value: stats.active, icon: CheckCircle2 }, { label: 'Closed deals', value: stats.closed, icon: Sparkles }, { label: 'Pipeline budget', value: stats.pipeline.toLocaleString(), icon: DollarSign }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><Icon className="h-4 w-4" /></div><p className="text-xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, phone, or address" className="border-0 bg-muted/50 pl-9 shadow-none focus-visible:ring-1" /></div><div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">{['All', ...CLIENT_STATUSES].map((status) => <Button key={status} size="sm" variant={filter === status ? 'default' : 'ghost'} onClick={() => setFilter(status)} className="whitespace-nowrap">{status}</Button>)}</div></section>

      {isLoading ? <div className="py-16 text-center text-muted-foreground">Loading clients...</div> : visibleClients.length === 0 ? <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground"><UserRound className="mx-auto mb-3 h-10 w-10 opacity-20" /><p>No clients found.</p><Button onClick={openAdd} variant="outline" className="mt-4 gap-2"><Plus className="h-4 w-4" /> Add your first client</Button></div> : <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleClients.map((client) => { const status = client.status || 'New'; const initials = client.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CL'; return <article key={clientId(client)} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-amber-300">{initials}</div><div className="min-w-0"><h2 className="truncate font-semibold">{client.name}</h2><p className="mt-0.5 text-xs text-muted-foreground">Client record</p></div></div><Badge className={`shrink-0 border-0 ${STATUS_STYLES[status]}`}>{status}</Badge></div><div className="mt-5 space-y-2.5 text-sm text-muted-foreground">{client.email && <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{client.email}</p>}{client.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{client.phone}</p>}{client.address && <p className="flex items-center gap-2 truncate"><MapPin className="h-3.5 w-3.5 shrink-0" />{client.address}</p>}</div><div className="mt-5 flex items-end justify-between border-t border-border pt-4"><div><p className="text-xs text-muted-foreground">Budget</p><p className="mt-1 text-lg font-semibold text-foreground">{Number(client.budget || 0).toLocaleString()}</p>{client.closed_date && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" />Closed {new Date(client.closed_date).toLocaleDateString()}</p>}</div><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(client)} title="Edit client"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget(client)} title="Delete client"><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div></article>; })}</div>}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          <div className="shrink-0 border-b border-slate-800 bg-slate-950 px-5 py-5 text-white sm:px-7"><DialogHeader><div className="flex items-start gap-3 pr-8"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-slate-950"><UserRound className="h-5 w-5" /></div><div><DialogTitle className="text-xl text-white">{editing ? 'Edit client' : 'Add a client'}</DialogTitle><p className="mt-1 text-sm text-slate-300">Capture the details your next deal depends on.</p></div></div></DialogHeader></div>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col"><div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-slate-50/70 px-5 py-6 sm:px-7">
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white">01</span><div><h3 className="text-sm font-semibold">Contact details</h3><p className="text-xs text-muted-foreground">The person behind the opportunity.</p></div></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="client-name" className="text-xs font-semibold">Full name <span className="text-amber-600">*</span></Label><Input className="h-11 bg-background" id="client-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Client full name" /></div><div className="space-y-1.5"><Label htmlFor="client-email" className="text-xs font-semibold">Email</Label><Input className="h-11 bg-background" id="client-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@example.com" /></div><div className="space-y-1.5"><Label htmlFor="client-phone" className="text-xs font-semibold">Phone number</Label><Input className="h-11 bg-background" id="client-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" /></div><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="client-address" className="text-xs font-semibold">Address</Label><Input className="h-11 bg-background" id="client-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Client address" /></div></div></section>
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white">02</span><div><h3 className="text-sm font-semibold">Deal profile</h3><p className="text-xs text-muted-foreground">Track the opportunity at a glance.</p></div></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="space-y-1.5"><Label htmlFor="client-budget" className="text-xs font-semibold">Budget</Label><Input className="h-11 bg-background" id="client-budget" type="number" min="0" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" /></div><div className="space-y-1.5"><Label className="text-xs font-semibold">Status</Label><Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}><SelectTrigger className="h-11 bg-background"><SelectValue /></SelectTrigger><SelectContent>{CLIENT_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label htmlFor="client-closed-date" className="text-xs font-semibold">Closed date</Label><Input className="h-11 bg-background" id="client-closed-date" type="date" value={form.closed_date} onChange={(e) => setForm({ ...form, closed_date: e.target.value })} /></div></div></section>
          </div><DialogFooter className="shrink-0 border-t border-border bg-card px-5 py-4 sm:px-7"><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit" disabled={saveMutation.isPending} className="bg-slate-950 text-white hover:bg-slate-800">{saveMutation.isPending ? 'Saving...' : editing ? 'Update client' : 'Create client'}</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.name || 'this client'}
        itemType="client"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(clientId(deleteTarget))}
      />
    </div>
  );
}