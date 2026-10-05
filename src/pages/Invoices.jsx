import React, { useState } from 'react';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import NoCompanyBanner from '@/components/ui/NoCompanyBanner';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, Pencil, Trash2, Send, Eye, Archive, Mail, Loader2 } from 'lucide-react';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUSES = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'archived'];

const statusStyles = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-chart-2/10 text-chart-2',
  viewed: 'bg-chart-3/10 text-chart-3',
  paid: 'bg-primary/10 text-primary',
  overdue: 'bg-destructive/10 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};

export default function Invoices() {
  const { activeCompany, companies } = useOutletContext();
  const companyId = activeCompany?.id;

  if (!companyId) return <NoCompanyBanner hasNoCompanies={!companies?.length} />;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState({ title: '', amount: 0, tax_amount: 0, recipient_name: '', recipient_email: '', due_date: '', notes: '', status: 'draft' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [emailTo, setEmailTo] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const logActivity = (action, details) =>
    api.entities.Activity.create({ company_id: companyId, action, entity_type: 'invoice', details });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', companyId],
    queryFn: () => companyId ? api.entities.Invoice.filter({ company_id: companyId }, '-created_date') : api.entities.Invoice.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Invoice.create({
      ...data,
      company_id: companyId,
      total_amount: data.amount + data.tax_amount,
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    }),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      logActivity(`Invoice created: ${inv.title}`, `Amount: $${inv.total_amount || inv.amount}`);
      toast.success(`Invoice "${inv.title}" created`);
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Invoice.update(id, data),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      logActivity(`Invoice updated: ${inv.title}`, `Status: ${inv.status}`);
      toast.success(`Invoice updated`);
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted');
    },
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm({ title: '', amount: 0, tax_amount: 0, recipient_name: '', recipient_email: '', due_date: '', notes: '', status: 'draft' }); };

  const openEdit = (inv) => {
    setEditing(inv);
    setForm({ title: inv.title, amount: inv.amount, tax_amount: inv.tax_amount || 0, recipient_name: inv.recipient_name || '', recipient_email: inv.recipient_email || '', due_date: inv.due_date || '', notes: inv.notes || '', status: inv.status });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editing) updateMutation.mutate({ id: editing.id, data: { ...form, total_amount: form.amount + form.tax_amount } });
    else createMutation.mutate(form);
  };

  const filtered = tab === 'all' ? invoices : invoices.filter(i => i.status === tab);

  const openEmailDialog = (inv) => {
    setEmailTarget(inv);
    setEmailTo(inv.recipient_email || '');
    setEmailDialog(true);
  };

  const sendInvoiceEmail = async () => {
    if (!emailTo.trim()) return;
    setSendingEmail(true);
    const inv = emailTarget;
    try {
      await api.integrations.Core.SendEmail({
        to: emailTo.trim(),
        subject: `Invoice ${inv.invoice_number || ''} - ${inv.title}`,
        invoice: {
          recipient_name: inv.recipient_name || 'Sir/Madam',
          title: inv.title,
          invoice_number: inv.invoice_number || 'N/A',
          amount: inv.amount || 0,
          tax_amount: inv.tax_amount || 0,
          total_amount: inv.total_amount || inv.amount || 0,
          due_date: inv.due_date || '',
          status: inv.status || 'draft',
          notes: inv.notes || '',
        },
      });
      toast.success(`Email successfully sent to ${emailTo}!`);
      // Also mark invoice as 'sent' if it was draft
      if (inv.status === 'draft') {
        updateMutation.mutate({ id: inv.id, data: { status: 'sent' } });
      }
    } catch (err) {
      toast.error('The email could not be sent. Please try again.');
    }
    setSendingEmail(false);
    setEmailDialog(false);
    setEmailTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">{invoices.length} total invoices</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={!companyId} className="gap-2"><Plus className="w-4 h-4" /> Create Invoice</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {STATUSES.map(s => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {invoicesLoading ? <TableSkeleton rows={5} cols={5} /> : (<>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Invoice</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Recipient</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Amount</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Due Date</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((inv, i) => (
                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium">{inv.title}</p>
                    <p className="text-xs text-muted-foreground">{inv.invoice_number}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm">{inv.recipient_name || '—'}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold">${(inv.total_amount || inv.amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{inv.due_date ? format(new Date(inv.due_date), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-5 py-3.5">
                    <Badge className={`text-xs capitalize ${statusStyles[inv.status] || ''}`}>{inv.status}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(inv)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEmailDialog(inv)}><Mail className="w-4 h-4 mr-2" />Send via Email</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: 'sent' } })}><Send className="w-4 h-4 mr-2" />Mark Sent</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: 'paid' } })}><Eye className="w-4 h-4 mr-2" />Mark Paid</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: 'archived' } })}><Archive className="w-4 h-4 mr-2" />Archive</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(inv)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No invoices found.</div>}
        </>)}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.title}
        itemType="Invoice"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
      />

      {/* Send Email Dialog */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent className="max-w-xl overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          <div className="bg-slate-950 px-6 py-6 text-white sm:px-7">
            <DialogHeader>
              <div className="flex items-start gap-3 pr-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 text-slate-950"><Mail className="h-5 w-5" /></div>
                <div><DialogTitle className="text-xl text-white">Send invoice</DialogTitle><p className="mt-1 text-sm text-slate-300">Deliver a clean invoice summary to your client.</p></div>
              </div>
            </DialogHeader>
          </div>
          <div className="space-y-5 bg-muted/30 p-6 sm:p-7">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Invoice preview</p><p className="mt-2 text-lg font-semibold">{emailTarget?.title}</p><p className="mt-1 text-xs text-muted-foreground">{emailTarget?.invoice_number || 'Invoice'}</p></div><div className="text-right"><p className="text-2xl font-bold tracking-tight">${Number(emailTarget?.total_amount || emailTarget?.amount || 0).toLocaleString()}</p><Badge className="mt-2 capitalize">{emailTarget?.status || 'draft'}</Badge></div></div>
              <div className="grid grid-cols-2 gap-4 pt-4 text-sm"><div><p className="text-xs text-muted-foreground">Recipient</p><p className="mt-1 font-medium">{emailTarget?.recipient_name || 'Client'}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Due date</p><p className="mt-1 font-medium">{emailTarget?.due_date ? format(new Date(emailTarget.due_date), 'MMM d, yyyy') : 'Not set'}</p></div></div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="space-y-2"><Label htmlFor="invoice-email" className="text-xs font-semibold">Recipient email</Label><Input id="invoice-email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="recipient@example.com" type="email" className="h-11 bg-background" /><p className="text-xs text-muted-foreground">The recipient will receive the invoice details and due date.</p></div></div>
          </div>
          <DialogFooter className="border-t border-border bg-card px-6 py-4 sm:px-7"><Button variant="outline" onClick={() => setEmailDialog(false)}>Cancel</Button><Button onClick={sendInvoiceEmail} disabled={!emailTo.trim() || sendingEmail} className="gap-2 bg-slate-950 text-white hover:bg-slate-800"><Mail className="h-4 w-4" />{sendingEmail ? 'Sending...' : 'Send invoice'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Invoice title" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Recipient Name</Label><Input value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} /></div>
              <div><Label>Recipient Email</Label><Input value={form.recipient_email} onChange={e => setForm({ ...form, recipient_email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Amount ($)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div><Label>Tax ($)</Label><Input type="number" value={form.tax_amount} onChange={e => setForm({ ...form, tax_amount: Number(e.target.value) })} /></div>
              <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>{editing ? 'Update' : 'Create'} Invoice</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}