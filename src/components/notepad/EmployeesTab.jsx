import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Plus, Trash2, Upload, Eye, Search, ChevronUp, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-yellow-100 text-yellow-700',
  terminated: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = {
  name: '', email: '', role: '', salary: '', hire_date: '', date_of_birth: '',
  offer_letter_url: '', nic_image_url: '', status: 'active',
};

const ROWS_OPTIONS = [10, 25, 50, 100];

export default function EmployeesTab({ companyId }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadingOffer, setUploadingOffer] = useState(false);
  const [uploadingNic, setUploadingNic] = useState(false);
  const [viewImg, setViewImg] = useState(null);

  // Table state
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', companyId],
    queryFn: () => companyId ? api.entities.Employee.filter({ company_id: companyId }, '-created_date') : [],
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Employee.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); closeDialog(); toast.success('Employee Created  Successfully'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Employee.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); closeDialog(); toast.success('Employee update Successfully'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Employee.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employee Deleted Successfully'); },
  });

  const openNew = () => { setEditEmp(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (emp) => {
    setEditEmp(emp);
    setForm({
      name: emp.name || '', email: emp.email || '', role: emp.role || '',
      salary: emp.salary || '', hire_date: emp.hire_date || '', date_of_birth: emp.date_of_birth || '',
      offer_letter_url: emp.offer_letter_url || '', nic_image_url: emp.nic_image_url || '',
      status: emp.status || 'active',
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditEmp(null); };

  const uploadFile = async (file, field, setLoading) => {
    setLoading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, [field]: file_url }));
    setLoading(false);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const data = { ...form, salary: form.salary ? Number(form.salary) : undefined, company_id: companyId };
    if (editEmp) updateMutation.mutate({ id: editEmp.id, data });
    else createMutation.mutate(data);
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  // Filter + sort + paginate
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(e =>
      e.name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.role?.toLowerCase().includes(q) ||
      e.status?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortKey] ?? '';
      let bv = b[sortKey] ?? '';
      if (sortKey === 'salary') { av = Number(av); bv = Number(bv); }
      else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const startRow = sorted.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, sorted.length);

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const cols = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Position' },
    { key: 'email', label: 'Email' },
    { key: 'hire_date', label: 'Hire Date' },
    { key: 'salary', label: 'Salary' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select value={String(rowsPerPage)} onValueChange={v => { setRowsPerPage(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-20 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{ROWS_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Search..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Button size="sm" onClick={openNew} className="gap-1.5 h-8 text-sm whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {cols.map(col => (
                <TableHead key={col.key} onClick={() => handleSort(col.key)}
                  className="cursor-pointer select-none whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {col.label} <SortIcon col={col.key} />
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-16">Docs</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">{search ? 'No results found' : 'There are no employees at the moment'}</p>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map(emp => (
                <TableRow key={emp.id} className="cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => openEdit(emp)}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{emp.role || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{emp.email || '—'}</TableCell>
                  <TableCell className="text-sm">{emp.hire_date || '—'}</TableCell>
                  <TableCell className="text-sm">
                    {emp.salary ? `$${Number(emp.salary).toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] px-2 py-0.5 capitalize ${STATUS_COLORS[emp.status] || STATUS_COLORS.active}`}>
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {emp.offer_letter_url && (
                        <button onClick={e => { e.stopPropagation(); setViewImg(emp.offer_letter_url); }}
                          className="text-[10px] text-primary hover:underline">OL</button>
                      )}
                      {emp.nic_image_url && (
                        <button onClick={e => { e.stopPropagation(); setViewImg(emp.nic_image_url); }}
                          className="text-[10px] text-primary hover:underline">NIC</button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={e => { e.stopPropagation(); deleteMutation.mutate(emp.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer / Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {sorted.length === 0 ? 'No entries' : `Showing ${startRow} to ${endRow} of ${sorted.length} entries`}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEmp ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Name *</Label><Input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Role / Designation</Label><Input placeholder="e.g. Software Engineer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Monthly Salary</Label><Input type="number" placeholder="e.g. 50000" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Hire Date</Label><Input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Offer Letter Document</Label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 border border-input rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{uploadingOffer ? 'Uploading...' : form.offer_letter_url ? 'Change file' : 'Upload document'}</span>
                  </div>
                  <input type="file" accept="application/pdf,.doc,.docx" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'offer_letter_url', setUploadingOffer)} />
                </label>
                {form.offer_letter_url && <button onClick={() => setViewImg(form.offer_letter_url)} className="text-primary hover:opacity-70"><Eye className="w-4 h-4" /></button>}
              </div>
              {form.offer_letter_url && <p className="text-[10px] text-green-600">✓ Uploaded</p>}
            </div>

            <div className="space-y-1.5">
              <Label>NIC / ID Document</Label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 border border-input rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{uploadingNic ? 'Uploading...' : form.nic_image_url ? 'Change file' : 'Upload document'}</span>
                  </div>
                  <input type="file" accept="application/pdf,.doc,.docx" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'nic_image_url', setUploadingNic)} />
                </label>
                {form.nic_image_url && <button onClick={() => setViewImg(form.nic_image_url)} className="text-primary hover:opacity-70"><Eye className="w-4 h-4" /></button>}
              </div>
              {form.nic_image_url && <p className="text-[10px] text-green-600">✓ Uploaded</p>}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>{editEmp ? 'Save Changes' : 'Add Employee'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      <Dialog open={!!viewImg} onOpenChange={() => setViewImg(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Document Preview</DialogTitle></DialogHeader>
          {viewImg && (/(\.jpe?g|\.png|\.gif|\.bmp)$/i.test(viewImg) ? (
        <img src={viewImg} alt="document" className="w-full rounded-lg object-contain max-h-[70vh]" />
      ) : (
        <div className="rounded-lg bg-muted/50 p-6 text-center">
          <p className="mb-4 text-sm text-muted-foreground">Document preview is not available.</p>
          <a href={viewImg} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Open file
          </a>
        </div>
      ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}