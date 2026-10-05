import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Plus, Sparkles, Target, CalendarDays, User, Clock3, Pencil, Trash2 } from 'lucide-react';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';

export default function Hpc() {
  const outletContext = useOutletContext() || {};
  const { activeCompany } = outletContext;
  const companyId = activeCompany?.id || activeCompany?._id || api.auth.getActiveCompanyId();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: '',
    full_form: 'High Performance Center',
    short_name: '',
    description: '',
    focus_area: '',
    status: 'planned',
    priority: 'medium',
    owner: '',
    target_date: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadItems = async () => {
    if (!companyId) return;
    try {
      const data = await api.entities.Hpc.filter({ company_id: companyId });
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load HPCs', error);
    }
  };

  useEffect(() => {
    loadItems();
  }, [companyId]);

  const resetForm = () => {
    setForm({
      title: '',
      full_form: 'High Performance Center',
      short_name: '',
      description: '',
      focus_area: '',
      status: 'planned',
      priority: 'medium',
      owner: '',
      target_date: '',
      notes: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyId) return;
    setLoading(true);
    try {
      if (editingId) {
        await api.entities.Hpc.update(editingId, { ...form, company_id: companyId });
      } else {
        await api.entities.Hpc.create({ ...form, company_id: companyId });
      }
      resetForm();
      await loadItems();
    } catch (error) {
      console.error('Failed to save HPC', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id || item._id);
    setForm({
      title: item.title || '',
      full_form: item.full_form || 'High Performance Center',
      short_name: item.short_name || '',
      description: item.description || '',
      focus_area: item.focus_area || '',
      status: item.status || 'planned',
      priority: item.priority || 'medium',
      owner: item.owner || '',
      target_date: item.target_date ? new Date(item.target_date).toISOString().split('T')[0] : '',
      notes: item.notes || '',
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await api.entities.Hpc.delete(deleteTarget.id);
      if (editingId === deleteTarget.id) resetForm();
      await loadItems();
    } catch (error) {
      console.error('Failed to delete HPC', error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((item) => item.status === 'active').length;
    const planned = items.filter((item) => item.status === 'planned').length;
    return { total, active, planned };
  }, [items]);

  if (!companyId) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Select a company to manage HPC initiatives.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <h1 className="text-2xl font-semibold">HPC (High Performance Center)</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Track High Performance Center initiatives, owners, priorities and milestones for this company.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total HPCs</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-semibold">{stats.active}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Planned</p>
          <p className="text-2xl font-semibold">{stats.planned}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No HPC initiatives added yet.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{item.title}</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.full_form || 'High Performance Center'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description || 'No description provided.'}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{item.status}</span>
                    <button type="button" onClick={() => handleEdit(item)} className="rounded-lg border p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget({ id: item.id || item._id, title: item.title })} className="rounded-lg border p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> {item.focus_area || 'General focus'}</div>
                  <div className="flex items-center gap-2"><User className="h-4 w-4" /> {item.owner || 'Unassigned'}</div>
                  <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {item.target_date ? new Date(item.target_date).toLocaleDateString() : 'No target date'}</div>
                  <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> {item.priority || 'medium'} priority</div>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">{editingId ? 'Edit HPC Initiative' : 'Add HPC Initiative'}</h2>
            </div>
            {editingId ? (
              <button type="button" onClick={resetForm} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            ) : null}
          </div>
          <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Initiative title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Full form (default: High Performance Center)" value={form.full_form} onChange={(e) => setForm({ ...form, full_form: e.target.value })} />
          <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Short name" value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} />
          <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows="3" placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Focus area" value={form.focus_area} onChange={(e) => setForm({ ...form, focus_area: e.target.value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
            <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <input type="date" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
          <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows="3" placeholder="Additional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" type="submit" disabled={loading}>
            {loading ? 'Saving...' : editingId ? 'Update HPC Initiative' : 'Save HPC Initiative'}
          </button>
        </form>
      </div>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        itemName={deleteTarget?.title || 'this HPC initiative'}
        itemType="HPC initiative"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
