import React, { useState } from 'react';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import NoCompanyBanner from '@/components/ui/NoCompanyBanner';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, Pencil, Trash2, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const CATEGORIES = ['marketing', 'salaries', 'software', 'operations', 'equipment', 'taxes', 'travel', 'legal', 'misc'];

export default function Expenses() {
  const { activeCompany, companies } = useOutletContext();
  const companyId = activeCompany?.id;

  if (!companyId) return <NoCompanyBanner hasNoCompanies={!companies?.length} />;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', amount: 0, category: 'misc', date: new Date().toISOString().split('T')[0], notes: '', status: 'pending' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', companyId],
    queryFn: () => companyId ? api.entities.Expense.filter({ company_id: companyId }, '-created_date') : api.entities.Expense.list('-created_date'),
    initialData: [],
  });

  const logActivity = (action, details) =>
    api.entities.Activity.create({ company_id: companyId, action, entity_type: 'expense', details });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Expense.create({ ...data, company_id: companyId }),
    onSuccess: (exp) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      logActivity(`New expense added: ${exp.title}`, `Amount: $${exp.amount}`);
      toast.success(`Expense "${exp.title}" added — $${exp.amount}`);
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Expense.update(id, data),
    onSuccess: (exp) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      logActivity(`Expense updated: ${exp.title}`, `Status: ${exp.status}`);
      toast.success(`Expense updated successfully`);
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      logActivity('Expense deleted', '');
      toast.success('Expense deleted');
    },
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm({ title: '', amount: 0, category: 'misc', date: new Date().toISOString().split('T')[0], notes: '', status: 'pending' }); };

  const openEdit = (exp) => {
    setEditing(exp);
    setForm({ title: exp.title, amount: exp.amount, category: exp.category, date: exp.date || '', notes: exp.notes || '', status: exp.status });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.category === filter);
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const statusIcon = { pending: Clock, approved: CheckCircle, rejected: XCircle };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Total: ${total.toLocaleString()}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={!companyId} className="gap-2"><Plus className="w-4 h-4" /> Add Expense</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
        {CATEGORIES.map(c => (
          <Button key={c} variant={filter === c ? 'default' : 'outline'} size="sm" onClick={() => setFilter(c)} className="capitalize">{c}</Button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Expense</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Category</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((exp, i) => {
                    const SIcon = statusIcon[exp.status] || Clock;
                    return (
                      <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium">{exp.title}</p>
                          {exp.notes && <p className="text-xs text-muted-foreground truncate max-w-xs">{exp.notes}</p>}
                        </td>
                        <td className="px-5 py-3.5"><Badge variant="secondary" className="capitalize text-xs">{exp.category}</Badge></td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{exp.date ? format(new Date(exp.date), 'MMM d, yyyy') : '—'}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold">${(exp.amount || 0).toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <SIcon className={`w-3.5 h-3.5 ${exp.status === 'approved' ? 'text-primary' : exp.status === 'rejected' ? 'text-destructive' : 'text-muted-foreground'}`} />
                            <span className="text-xs capitalize">{exp.status}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(exp)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: exp.id, data: { status: 'approved' } })}><CheckCircle className="w-4 h-4 mr-2" />Approve</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(exp)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">No expenses found.</div>
            )}
          </>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.title}
        itemType="Expense"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
      />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Expense title" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Amount ($)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes" rows={3} /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="gap-2">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Update' : 'Add'} Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}