import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, Trash2, Upload, FileText, FolderOpen, Shield, Download, FolderPlus, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CATEGORIES = ['legal', 'finance', 'contracts', 'hr', 'investments', 'tax', 'personal'];

export default function PersonalDocuments({ currentUser }) {
  const queryClient = useQueryClient();
  const [docDialog, setDocDialog] = useState(false);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'personal', section_id: '' });
  const [sectionForm, setSectionForm] = useState({ name: '', description: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Personal sections — no company_id, use created_by
  const { data: sections = [] } = useQuery({
    queryKey: ['personal-doc-sections', currentUser?.email],
    queryFn: () => api.entities.DocSection.filter({ company_id: 'personal' }, 'created_date'),
    initialData: [],
    enabled: !!currentUser,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['personal-documents', currentUser?.email],
    queryFn: () => api.entities.Document.filter({ is_personal: true }, '-created_date'),
    initialData: [],
    enabled: !!currentUser,
  });

  const createSectionMutation = useMutation({
    mutationFn: (data) => api.entities.DocSection.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personal-doc-sections'] }); closeSectionDialog(); },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.DocSection.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personal-doc-sections'] }); closeSectionDialog(); },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id) => api.entities.DocSection.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-doc-sections'] }),
  });

  const createDocMutation = useMutation({
    mutationFn: (data) => api.entities.Document.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personal-documents'] }); closeDocDialog(); },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id) => api.entities.Document.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-documents'] }),
  });

  const closeSectionDialog = () => { setSectionDialog(false); setEditSection(null); setSectionForm({ name: '', description: '' }); };
  const closeDocDialog = () => { setDocDialog(false); setForm({ title: '', category: 'personal', section_id: '' }); setFile(null); };
  const openNewSection = () => { setEditSection(null); setSectionForm({ name: '', description: '' }); setSectionDialog(true); };
  const openEditSection = (s) => { setEditSection(s); setSectionForm({ name: s.name, description: s.description || '' }); setSectionDialog(true); };
  const openDocDialog = (sectionId = '') => { setForm({ title: '', category: 'personal', section_id: sectionId }); setDocDialog(true); };
  const toggleSection = (id) => setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSaveSection = () => {
    if (!sectionForm.name.trim()) return;
    if (editSection) updateSectionMutation.mutate({ id: editSection.id, data: sectionForm });
    else createSectionMutation.mutate({ ...sectionForm, company_id: 'personal' });
  };

  const handleUpload = async () => {
    setUploading(true);
    let file_url = '';
    if (file) {
      const result = await api.integrations.Core.UploadFile({ file });
      file_url = result.file_url;
    }
    createDocMutation.mutate({
      ...form,
      company_id: null,
      is_personal: true,
      file_url,
      file_type: file?.type || '',
      file_size: file?.size || 0,
    });
    setUploading(false);
  };

  const unsectionedDocs = documents.filter(d => !d.section_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personal Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Your private document vault</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openNewSection} className="gap-2">
            <FolderPlus className="w-4 h-4" /> New Section
          </Button>
          <Button onClick={() => openDocDialog()} className="gap-2">
            <Upload className="w-4 h-4" /> Upload Document
          </Button>
        </div>
      </div>

      {sections.length === 0 && documents.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No documents yet. Create a section or upload a document.</p>
        </div>
      )}

      <div className="space-y-4">
        {sections.map(section => {
          const sectionDocs = documents.filter(d => d.section_id === section.id);
          const isCollapsed = collapsedSections[section.id];
          return (
            <motion.div key={section.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-muted/40 border-b border-border">
                <button onClick={() => toggleSection(section.id)} className="flex items-center gap-2 flex-1 text-left">
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">{section.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">({sectionDocs.length})</span>
                </button>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openDocDialog(section.id)} className="gap-1 text-xs h-7 px-2">
                    <Plus className="w-3.5 h-3.5" /> Add Doc
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditSection(section)}><Pencil className="w-4 h-4 mr-2" />Edit Section</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteSectionMutation.mutate(section.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {!isCollapsed && (
                <div className="p-4">
                  {sectionDocs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-xs">No documents in this section.</p>
                      <Button size="sm" variant="outline" className="mt-2 gap-1 text-xs" onClick={() => openDocDialog(section.id)}>
                        <Upload className="w-3.5 h-3.5" /> Upload
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <AnimatePresence>
                        {sectionDocs.map((doc, i) => (
                          <DocCard key={doc.id} doc={doc} i={i} onDelete={() => deleteDocMutation.mutate(doc.id)} />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        {unsectionedDocs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Other Documents</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {unsectionedDocs.map((doc, i) => (
                  <DocCard key={doc.id} doc={doc} i={i} onDelete={() => deleteDocMutation.mutate(doc.id)} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Section Dialog */}
      <Dialog open={sectionDialog} onOpenChange={closeSectionDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editSection ? 'Edit Section' : 'New Section'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Section Name *</Label><Input value={sectionForm.name} onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="e.g. Tax Documents" /></div>
            <div><Label>Description</Label><Input value={sectionForm.description} onChange={e => setSectionForm({ ...sectionForm, description: e.target.value })} placeholder="Optional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeSectionDialog}>Cancel</Button>
            <Button onClick={handleSaveSection} disabled={!sectionForm.name.trim()}>{editSection ? 'Save' : 'Create'} Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={docDialog} onOpenChange={closeDocDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Document name" /></div>
            {sections.length > 0 && (
              <div><Label>Section</Label>
                <Select value={form.section_id || 'none'} onValueChange={v => setForm({ ...form, section_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="No section" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No section</SelectItem>
                    {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>File</Label>
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
              />
              <p className="text-xs text-muted-foreground mt-1">PDF uploads are temporarily unavailable.</p>
            </div>
          </div>
          <DialogFooter><Button onClick={handleUpload} disabled={uploading || !form.title}>{uploading ? 'Uploading...' : 'Upload'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocCard({ doc, i, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
      className="bg-background border border-border rounded-xl p-4 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{doc.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(doc.created_date), 'MMM d, yyyy')}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {doc.file_url && <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(doc.file_url, '_blank')}><Download className="w-4 h-4 mr-2" />Download</DropdownMenuItem>}
            <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Badge variant="secondary" className="capitalize text-xs">{doc.category}</Badge>
        {doc.is_personal && <Badge className="bg-chart-4/10 text-chart-4 text-xs gap-1"><Shield className="w-3 h-3" />Personal</Badge>}
      </div>
    </motion.div>
  );
}