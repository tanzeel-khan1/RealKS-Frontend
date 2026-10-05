import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import NoCompanyBanner from '@/components/ui/NoCompanyBanner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MoreVertical, Trash2, Upload, FileText, FolderOpen, Download,
  FolderPlus, ChevronDown, ChevronRight, Pencil, Mail, Eye,
  FilePlus, X, FileEdit, Building2, DollarSign, Scale, Users, Briefcase,
  TrendingUp, Settings2, CreditCard, ShieldCheck, ShoppingCart, ClipboardCheck, MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';

const CATEGORIES = [
  { id: 'all',        label: 'All',          icon: FolderOpen },
  { id: 'legal',      label: 'Legal',        icon: Scale },
  { id: 'finance',    label: 'Finance',      icon: DollarSign },
  { id: 'tax',        label: 'Tax',          icon: Building2 },
  { id: 'hr',         label: 'HR',           icon: Users },
  { id: 'contracts',  label: 'Contracts',    icon: FileText },
  { id: 'investor',   label: 'Investor',     icon: TrendingUp },
  { id: 'operations', label: 'Operations',   icon: Settings2 },
  { id: 'banking',    label: 'Banking',      icon: CreditCard },
  { id: 'compliance', label: 'Compliance',   icon: ShieldCheck },
  { id: 'vendor',     label: 'Vendor',       icon: ShoppingCart },
  { id: 'audit',      label: 'Audit',        icon: ClipboardCheck },
  { id: 'other',      label: 'Other',        icon: MoreHorizontal },
];

const CATEGORY_COLORS = {
  legal: 'bg-blue-500/10 text-blue-600',
  finance: 'bg-green-500/10 text-green-600',
  tax: 'bg-orange-500/10 text-orange-600',
  hr: 'bg-purple-500/10 text-purple-600',
  contracts: 'bg-cyan-500/10 text-cyan-600',
  investor: 'bg-indigo-500/10 text-indigo-600',
  operations: 'bg-yellow-500/10 text-yellow-600',
  banking: 'bg-emerald-500/10 text-emerald-600',
  compliance: 'bg-red-500/10 text-red-600',
  vendor: 'bg-pink-500/10 text-pink-600',
  audit: 'bg-teal-500/10 text-teal-600',
  other: 'bg-muted text-muted-foreground',
};

const getFilePreviewType = (document) => {
  const mimeType = document?.file_type || '';
  const extension = document?.file_url?.split('?')[0].split('.').pop()?.toLowerCase();

  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
  if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return null;
};

function getFileIcon(fileType) {
  if (!fileType) return FileText;
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('image')) return FileText;
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) return FileText;
  return FileText;
}

export default function Documents() {
  const { activeCompany, currentUser, companies } = useOutletContext();
  const companyId = activeCompany?.id;
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState('all');
  const [collapsedSections, setCollapsedSections] = useState({});

  // ── Dialogs ─────────────────────────────────────────────────────────────────
  const [docDialog, setDocDialog] = useState(false);
  const [docMode, setDocMode] = useState('upload'); // 'upload' | 'write'
  const [editDoc, setEditDoc] = useState(null);

  const [sectionDialog, setSectionDialog] = useState(false);
  const [editSection, setEditSection] = useState(null);

  const [emailDialog, setEmailDialog] = useState(null); // doc object
  const [viewDialog, setViewDialog] = useState(null);   // doc object

  // ── Forms ───────────────────────────────────────────────────────────────────
  const emptyDocForm = { title: '', content: '', category: 'legal', section_id: '' };
  const [form, setForm] = useState(emptyDocForm);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [sectionForm, setSectionForm] = useState({ name: '', description: '' });
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: sections = [] } = useQuery({
    queryKey: ['doc-sections', companyId],
    queryFn: () => companyId ? api.entities.DocSection.filter({ company_id: companyId }, 'created_date') : [],
    initialData: [],
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', companyId],
    queryFn: () => companyId ? api.entities.Document.filter({ company_id: companyId }, '-created_date') : [],
    initialData: [],
  });

  // ── Filtered data ────────────────────────────────────────────────────────────
  const filteredDocs = useMemo(() =>
    activeCategory === 'all' ? documents : documents.filter(d => d.category === activeCategory),
    [documents, activeCategory]
  );

  const filteredSections = useMemo(() =>
    activeCategory === 'all' ? sections : sections.filter(s => s.category === activeCategory),
    [sections, activeCategory]
  );

  const categoryCounts = useMemo(() => {
    const counts = {};
    documents.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1; });
    return counts;
  }, [documents]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createSection = useMutation({
    mutationFn: (d) => api.entities.DocSection.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doc-sections'] }); closeSectionDialog(); toast.success('Section created'); },
  });

  const updateSection = useMutation({
    mutationFn: ({ id, data }) => api.entities.DocSection.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doc-sections'] }); closeSectionDialog(); toast.success('Section updated'); },
  });

  const deleteSection = useMutation({
    mutationFn: (id) => api.entities.DocSection.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doc-sections'] }); queryClient.invalidateQueries({ queryKey: ['documents'] }); toast.success('Section deleted'); },
  });

  const createDoc = useMutation({
    mutationFn: (d) => api.entities.Document.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['documents'] }); closeDocDialog(); toast.success('Document saved'); },
  });

  const updateDoc = useMutation({
    mutationFn: ({ id, data }) => api.entities.Document.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['documents'] }); closeDocDialog(); toast.success('Document updated'); },
  });

  const deleteDoc = useMutation({
    mutationFn: (id) => api.entities.Document.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document deleted'); },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const closeDocDialog = () => { setDocDialog(false); setEditDoc(null); setForm(emptyDocForm); setFile(null); };
  const closeSectionDialog = () => { setSectionDialog(false); setEditSection(null); setSectionForm({ name: '', description: '' }); };

  const openUpload = (sectionId = '') => {
    setDocMode('upload');
    setEditDoc(null);
    setForm({ ...emptyDocForm, section_id: sectionId, category: activeCategory === 'all' ? 'legal' : activeCategory });
    setDocDialog(true);
  };

  const openWrite = (sectionId = '') => {
    setDocMode('write');
    setEditDoc(null);
    setForm({ ...emptyDocForm, section_id: sectionId, category: activeCategory === 'all' ? 'legal' : activeCategory });
    setDocDialog(true);
  };

  const openEditDoc = (doc) => {
    setEditDoc(doc);
    setDocMode(doc.file_url ? 'upload' : 'write');
    setForm({ title: doc.title, content: doc.content || '', category: doc.category, section_id: doc.section_id || '' });
    setDocDialog(true);
  };

  const openNewSection = () => {
    setEditSection(null);
    setSectionForm({ name: '', description: '' });
    setSectionDialog(true);
  };

  const openEditSection = (s) => {
    setEditSection(s);
    setSectionForm({ name: s.name, description: s.description || '' });
    setSectionDialog(true);
  };

  const openEmailDialog = (doc) => {
    setEmailDialog(doc);
    setEmailForm({ to: currentUser?.email || '', subject: `Document: ${doc.title}`, body: `Please find the document "${doc.title}" attached/linked below.` });
  };

  const handleSaveSection = () => {
    if (!sectionForm.name.trim()) return;
    const cat = activeCategory === 'all' ? 'other' : activeCategory;
    if (editSection) updateSection.mutate({ id: editSection.id, data: sectionForm });
    else createSection.mutate({ ...sectionForm, company_id: companyId, category: cat });
  };

  const handleSaveDoc = async () => {
    setUploading(true);
    try {
      let file_url = editDoc?.file_url || '';
      let cloudinary_public_id = editDoc?.cloudinary_public_id || '';
      let file_type = editDoc?.file_type || '';
      let file_size = editDoc?.file_size || 0;

      if (file) {
        const result = await api.integrations.Core.UploadFile({ file });
        file_url = result.file_url;
        cloudinary_public_id = result.cloudinary_public_id || '';
        file_type = file.type;
        file_size = file.size;
      }

      const payload = {
        ...form,
        company_id: companyId,
        file_url,
        cloudinary_public_id,
        file_type,
        file_size,
      };

      if (editDoc) updateDoc.mutate({ id: editDoc.id, data: payload });
      else createDoc.mutate(payload);
    } catch (error) {
      toast.error(error.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.to) return;
    setSendingEmail(true);
    try {
      await api.integrations.Core.SendEmail({
        to: emailForm.to,
        subject: emailForm.subject,
        body: emailForm.body,
        file_url: emailDialog?.file_url
          ? (emailDialog.file_url.startsWith('http')
            ? emailDialog.file_url
            : `${window.location.origin}${emailDialog.file_url}`)
          : '',
        file_name: emailDialog?.title,
      });
      toast.success('Email sent successfully');
      setEmailDialog(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const toggleSection = (id) => setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));

  const unsectionedDocs = filteredDocs.filter(d => !d.section_id);
  const hasContent = filteredSections.length > 0 || filteredDocs.length > 0;

  if (!companyId) return <NoCompanyBanner hasNoCompanies={!companies?.length} />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{documents.length} document{documents.length !== 1 ? 's' : ''} across {sections.length} section{sections.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={openNewSection} className="gap-1.5 text-sm h-9">
            <FolderPlus className="w-4 h-4" /> New Section
          </Button>
          <Button variant="outline" onClick={() => openWrite()} className="gap-1.5 text-sm h-9">
            <FilePlus className="w-4 h-4" /> Write Doc
          </Button>
          <Button onClick={() => openUpload()} className="gap-1.5 text-sm h-9">
            <Upload className="w-4 h-4" /> Upload Doc
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1 min-w-max">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = cat.id === 'all' ? documents.length : (categoryCounts[cat.id] || 0);
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                  ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isActive ? 'bg-white/20' : 'bg-background'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {!hasContent && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <FolderOpen className="w-14 h-14 opacity-20 mb-3" />
          <p className="text-sm font-medium">No documents yet</p>
          <p className="text-xs mt-1">Create a section, write a document, or upload a file.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => openWrite()}>
              <FilePlus className="w-4 h-4 mr-1.5" /> Write Doc
            </Button>
            <Button size="sm" onClick={() => openUpload()}>
              <Upload className="w-4 h-4 mr-1.5" /> Upload
            </Button>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {filteredSections.map(section => {
          const sectionDocs = filteredDocs.filter(d => d.section_id === section.id);
          const isCollapsed = collapsedSections[section.id];
          return (
            <motion.div key={section.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
                <button onClick={() => toggleSection(section.id)} className="flex items-center gap-2 flex-1 text-left min-w-0">
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-semibold text-sm truncate">{section.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">({sectionDocs.length})</span>
                  {section.description && <span className="text-xs text-muted-foreground hidden md:inline truncate">— {section.description}</span>}
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openWrite(section.id)} className="gap-1 text-xs h-7 px-2 hidden sm:flex">
                    <FilePlus className="w-3 h-3" /> Write
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openUpload(section.id)} className="gap-1 text-xs h-7 px-2">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditSection(section)}><Pencil className="w-4 h-4 mr-2" />Edit Section</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteSection.mutate(section.id)}><Trash2 className="w-4 h-4 mr-2" />Delete Section</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-4">
                  {sectionDocs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-xs">Empty section</p>
                      <div className="flex justify-center gap-2 mt-2">
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => openWrite(section.id)}>
                          <FilePlus className="w-3 h-3" /> Write
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => openUpload(section.id)}>
                          <Upload className="w-3 h-3" /> Upload
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      <AnimatePresence>
                        {sectionDocs.map((doc, i) => (
                          <DocCard
                            key={doc.id} doc={doc} i={i}
                            onEdit={() => openEditDoc(doc)}
                            onDelete={() => deleteDoc.mutate(doc.id)}
                            onEmail={() => openEmailDialog(doc)}
                            onView={() => setViewDialog(doc)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Unsectioned docs */}
        {unsectionedDocs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {activeCategory === 'all' ? 'Unsectioned Documents' : `${CATEGORIES.find(c => c.id === activeCategory)?.label} — Unsectioned`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <AnimatePresence>
                {unsectionedDocs.map((doc, i) => (
                  <DocCard
                    key={doc.id} doc={doc} i={i}
                    onEdit={() => openEditDoc(doc)}
                    onDelete={() => deleteDoc.mutate(doc.id)}
                    onEmail={() => openEmailDialog(doc)}
                    onView={() => setViewDialog(doc)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* ── Section Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={sectionDialog} onOpenChange={closeSectionDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editSection ? 'Edit Section' : 'New Section'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Section Name *</Label>
              <Input value={sectionForm.name} onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="e.g. Legal Documents" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={sectionForm.description} onChange={e => setSectionForm({ ...sectionForm, description: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeSectionDialog}>Cancel</Button>
            <Button onClick={handleSaveSection} disabled={!sectionForm.name.trim() || createSection.isPending || updateSection.isPending}>
              {editSection ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Document Sidebar (Upload / Write / Edit) ────────────────────────────── */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[560px] transform bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-in-out ${docDialog ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div>
            <p className="text-lg font-semibold">
              {editDoc ? 'Edit Document' : docMode === 'write' ? 'Write Document' : 'Upload Document'}
            </p>
            {!editDoc && (
              <p className="text-xs text-muted-foreground mt-1">
                {docMode === 'upload' ? 'Upload a file document' : 'Write a text document'}
              </p>
            )}
          </div>
          <button onClick={closeDocDialog} className="rounded-full p-2 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-full overflow-y-auto py-5 px-4 space-y-4">
          {!editDoc && (
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setDocMode('upload')}
                className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${docMode === 'upload' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                <Upload className="w-3.5 h-3.5" /> Upload File
              </button>
              <button
                onClick={() => setDocMode('write')}
                className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${docMode === 'write' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                <FileEdit className="w-3.5 h-3.5" /> Write Content
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Document title" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Section</Label>
                <Select value={form.section_id || 'none'} onValueChange={v => setForm({ ...form, section_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No section</SelectItem>
                    {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {docMode === 'upload' ? (
              <div>
                <Label>File {editDoc?.file_url ? '(leave blank to keep existing)' : ''}</Label>
                <Input
                  type="file"
                  accept="image/*,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                  onChange={e => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile?.type === 'application/pdf' || selectedFile?.name.toLowerCase().endsWith('.pdf')) {
                      e.target.value = '';
                      setFile(null);
                      toast.info('PDF uploads are temporarily unavailable. Please try again later.');
                      return;
                    }
                    setFile(selectedFile || null);
                  }}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">PDF uploads are temporarily unavailable.</p>
                {editDoc?.file_url && !file && (
                  <p className="text-xs text-muted-foreground mt-1">Current file will be kept.</p>
                )}
              </div>
            ) : (
              <div>
                <Label>Content</Label>
                <Textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your document content here..."
                  className="min-h-[180px] font-mono text-sm resize-y"
                />
              </div>
            )}

          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={closeDocDialog}>Cancel</Button>
            <Button onClick={handleSaveDoc} disabled={uploading || !form.title.trim() || createDoc.isPending || updateDoc.isPending}>
              {uploading ? 'Saving...' : editDoc ? 'Save Changes' : docMode === 'write' ? 'Save Document' : 'Upload'}
            </Button>
          </div>
        </div>
      </div>
      <div className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${docDialog ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={closeDocDialog} />

      {/* ── Send Email Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!emailDialog} onOpenChange={() => setEmailDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="w-4 h-4" /> Send Document via Email</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>To *</Label>
              <Input value={emailForm.to} onChange={e => setEmailForm({ ...emailForm, to: e.target.value })} placeholder="recipient@example.com" type="email" />
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={emailForm.body} onChange={e => setEmailForm({ ...emailForm, body: e.target.value })} className="min-h-[80px]" />
            </div>
            {emailDialog?.file_url && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Document link will be included in email</span>
              </div>
            )}
            {!emailDialog?.file_url && emailDialog?.content && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileEdit className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Text document — content will be in message body</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog(null)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail || !emailForm.to}>
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Content Dialog ───────────────────────────────────────────────── */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> {viewDialog?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[55vh]">
            {viewDialog?.content ? (
              <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-lg leading-relaxed">{viewDialog.content}</pre>
            ) : viewDialog?.file_url ? (
              getFilePreviewType(viewDialog) === 'image' ? (
                <img src={viewDialog.file_url} alt={viewDialog.title} className="max-h-[55vh] max-w-full mx-auto rounded-lg object-contain" />
              ) : getFilePreviewType(viewDialog) === 'pdf' ? (
                <iframe src={viewDialog.file_url} title={viewDialog.title} className="w-full h-[55vh] rounded-lg border" />
              ) : getFilePreviewType(viewDialog) === 'video' ? (
                <video src={viewDialog.file_url} controls className="w-full max-h-[55vh] rounded-lg" />
              ) : getFilePreviewType(viewDialog) === 'audio' ? (
                <audio src={viewDialog.file_url} controls className="w-full mt-8" />
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-3">This file format cannot be previewed here.</p>
                  <Button onClick={() => window.open(viewDialog.file_url, '_blank')} className="gap-2 cursor-pointer">
                    <Download className="w-4 h-4" /> Open / Download File
                  </Button>
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No content</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(null)}>Close</Button>
            {viewDialog?.file_url && (
              <Button onClick={() => window.open(viewDialog.file_url, '_blank')} className="gap-2 cursor-pointer">
                <Download className="w-4 h-4" /> Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── DocCard ──────────────────────────────────────────────────────────────────
function DocCard({ doc, i, onEdit, onDelete, onEmail, onView }) {
  const colorClass = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other;
  const catLabel = CATEGORIES.find(c => c.id === doc.category)?.label || doc.category;
  const hasFile = !!doc.file_url;
  const hasContent = !!doc.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: i * 0.03 }}
      className="bg-background border border-border rounded-xl p-4 hover:shadow-md transition-all group flex flex-col"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
            {hasContent ? <FileEdit className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{doc.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {doc.created_date ? format(new Date(doc.created_date), 'MMM d, yyyy') : ''}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {(hasContent || hasFile) && (
              <DropdownMenuItem className="cursor-pointer" onClick={onView}>
                <Eye className="w-4 h-4 mr-2" />View
              </DropdownMenuItem>
            )}
            {hasFile && (
              <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(doc.file_url, '_blank')}>
                <Download className="w-4 h-4 mr-2" />Download
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onEmail}>
              <Mail className="w-4 h-4 mr-2" />Send Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content preview */}
      {doc.content && (
        <p className="text-xs text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed">{doc.content}</p>
      )}

      {/* Badges */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
          {catLabel}
        </span>
        {hasFile && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            <Download className="w-2.5 h-2.5" />File
          </span>
        )}
      </div>
    </motion.div>
  );
}
