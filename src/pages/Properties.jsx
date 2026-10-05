import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bath, BedDouble, Building2, Check, DollarSign, MapPin, Pencil, Plus, Ruler, Search, Sparkles, Trash2, UploadCloud, X } from 'lucide-react';
import { api } from '@/api/apiClient';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const PROPERTY_TYPES = ['House', 'Apartment', 'Villa', 'Plot', 'Commercial', 'Office', 'Other'];
const LISTING_TYPES = ['Sale', 'Rent'];
const PROPERTY_STATUSES = ['Available', 'Reserved', 'Sold', 'Rented', 'Off Market'];
const EMPTY_FORM = {
  title: '', property_type: 'House', listing_type: 'Sale', status: 'Available',
  price: '', address: '', bedrooms: 0, bathrooms: 0, area: 0, description: '', photos: [],
};
const propertyId = (property) => property.id || property._id;
const photoUrl = (url) => url?.startsWith('http') ? url : `${API_BASE}${url}`;

const STATUS_STYLES = {
  Available: 'bg-emerald-100 text-emerald-700',
  Reserved: 'bg-amber-100 text-amber-700',
  Sold: 'bg-blue-100 text-blue-700',
  Rented: 'bg-violet-100 text-violet-700',
  'Off Market': 'bg-slate-100 text-slate-700',
};

export default function Properties() {
  const { activeCompany } = useOutletContext();
  const companyId = activeCompany?.id || activeCompany?._id;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  useEffect(() => {
    const previews = photoFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPhotoPreviews(previews);
    return () => previews.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [photoFiles]);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties', companyId],
    queryFn: () => api.entities.Property.filter({ company_id: companyId }, '-created_date'),
    enabled: !!companyId,
    initialData: [],
  });

  const visibleProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    return properties.filter((property) => {
      const matchesFilter = filter === 'All' || property.status === filter;
      const matchesSearch = !query || [property.title, property.address, property.property_type]
        .some((value) => value?.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [filter, properties, search]);

  const stats = useMemo(() => ({
    total: properties.length,
    available: properties.filter((property) => property.status === 'Available').length,
    reserved: properties.filter((property) => property.status === 'Reserved').length,
    portfolio: properties.reduce((total, property) => total + Number(property.price || 0), 0),
  }), [properties]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setPhotoFiles([]);
    setPhotoPreviews([]);
  };

  const saveMutation = useMutation({
    mutationFn: (formData) => editing
      ? api.entities.Property.updateMultipart(propertyId(editing), formData)
      : api.entities.Property.createMultipart(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', companyId] });
      toast.success(editing ? 'Property updated' : 'Property added');
      closeDialog();
    },
    onError: (error) => toast.error(error.message || 'Unable to save property'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Property.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', companyId] });
      setDeleteTarget(null);
      toast.success('Property deleted');
    },
    onError: (error) => toast.error(error.message || 'Unable to delete property'),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setDialogOpen(true);
  };

  const openEdit = (property) => {
    setEditing(property);
    setForm({
      title: property.title || '',
      property_type: property.property_type || 'House',
      listing_type: property.listing_type || 'Sale',
      status: property.status || 'Available',
      price: property.price ?? '',
      address: property.address || '',
      bedrooms: property.bedrooms ?? 0,
      bathrooms: property.bathrooms ?? 0,
      area: property.area ?? 0,
      description: property.description || '',
      photos: property.photos || [],
    });
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setDialogOpen(true);
  };

  const uploadPhotos = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const remainingSlots = 10 - form.photos.length - photoFiles.length;
    if (files.length > remainingSlots) {
      toast.error(`You can upload up to 10 photos per property`);
      return;
    }
    setPhotoFiles((current) => [...current, ...files]);
    event.target.value = '';
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.address.trim()) {
      toast.error('Title and address are required');
      return;
    }
    if (form.price === '' || Number(form.price) < 0) {
      toast.error('Enter a valid price');
      return;
    }
    const formData = new FormData();
    const propertyData = {
      ...form,
      company_id: companyId,
      price: Number(form.price),
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      area: Number(form.area) || 0,
    };
    Object.entries(propertyData).forEach(([key, value]) => {
      if (key !== 'photos') formData.append(key, String(value ?? ''));
    });
    formData.append('existing_photos', JSON.stringify(form.photos));
    photoFiles.forEach((file) => formData.append('photos', file));
    setUploading(true);
    saveMutation.mutate(formData, { onSettled: () => setUploading(false) });
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-xl sm:px-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300"><Sparkles className="h-3.5 w-3.5" /> Portfolio workspace</div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Properties</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">Your listings, presented clearly and ready for the next viewing.</p>
          </div>
          <Button onClick={openAdd} className="w-full gap-2 bg-amber-300 text-slate-950 hover:bg-amber-200 sm:w-auto"><Plus className="w-4 h-4" /> Add property</Button>
        </div>
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[24px] border-white/5" />
        <div className="absolute -bottom-28 right-24 h-56 w-56 rounded-full border border-amber-300/20" />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total listings', value: stats.total, icon: Building2 },
          { label: 'Available now', value: stats.available, icon: Check },
          { label: 'Reserved', value: stats.reserved, icon: Sparkles },
          { label: 'Portfolio value', value: stats.portfolio.toLocaleString(), icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><Icon className="h-4 w-4" /></div><p className="text-xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, address, or type" className="border-0 bg-muted/50 pl-9 shadow-none focus-visible:ring-1" /></div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {['All', ...PROPERTY_STATUSES].map((status) => <Button key={status} size="sm" variant={filter === status ? 'default' : 'ghost'} onClick={() => setFilter(status)} className="whitespace-nowrap">{status}</Button>)}
        </div>
      </section>

      {isLoading ? <div className="py-16 text-center text-muted-foreground">Loading properties...</div> : visibleProperties.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl"><Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" /><p>No properties found.</p><Button onClick={openAdd} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" /> Add your first property</Button></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleProperties.map((property) => (
            <article key={propertyId(property)} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-52 overflow-hidden bg-muted">
                {property.photos?.[0] ? <img src={photoUrl(property.photos[0])} alt={property.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Building2 className="h-10 w-10 opacity-20" /></div>}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                <Badge className={`absolute left-3 top-3 border-0 ${STATUS_STYLES[property.status || 'Available']}`}>{property.status || 'Available'}</Badge>
                <Badge className="absolute right-3 top-3 border-0 bg-white/90 text-slate-900">{property.listing_type}</Badge>
                <p className="absolute bottom-3 left-4 text-lg font-semibold text-white">{Number(property.price || 0).toLocaleString()}</p>
              </div>
              <div className="space-y-3 p-4">
                <div><h2 className="truncate font-semibold">{property.title}</h2><p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{property.address}</p></div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{property.bedrooms} beds</span>
                  <span className="inline-flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} baths</span>
                  <span className="inline-flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{property.area} sqft</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-xs text-muted-foreground">{property.property_type} {property.photos?.length ? `· ${property.photos.length} photo${property.photos.length > 1 ? 's' : ''}` : ''}</span>
                  <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(property)} title="Edit property"><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget(property)} title="Delete property"><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          <div className="shrink-0 border-b border-slate-800 bg-slate-950 px-5 py-5 text-white sm:px-7">
            <DialogHeader>
              <div className="flex items-start gap-3 pr-8">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-slate-950 shadow-lg shadow-amber-300/10"><Building2 className="h-5 w-5" /></div>
                <div><DialogTitle className="text-xl text-white">{editing ? 'Edit property' : 'Create a listing'}</DialogTitle><p className="mt-1 text-sm text-slate-300">Keep the essentials sharp for every buyer and renter.</p></div>
              </div>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-slate-50/70 px-5 py-6 sm:px-7">
              <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white">01</span><div><h3 className="text-sm font-semibold">Listing details</h3><p className="text-xs text-muted-foreground">The essentials people scan first.</p></div></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="property-title" className="text-xs font-semibold">Property title <span className="text-amber-600">*</span></Label><Input className="h-11 bg-background" id="property-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Modern 3 Bedroom House" /></div>
                  <div className="space-y-1.5"><Label className="text-xs font-semibold">Property type</Label><Select value={form.property_type} onValueChange={(value) => setForm({ ...form, property_type: value })}><SelectTrigger className="h-11 bg-background"><SelectValue /></SelectTrigger><SelectContent>{PROPERTY_TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-xs font-semibold">Listing type</Label><Select value={form.listing_type} onValueChange={(value) => setForm({ ...form, listing_type: value })}><SelectTrigger className="h-11 bg-background"><SelectValue /></SelectTrigger><SelectContent>{LISTING_TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-xs font-semibold">Status</Label><Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}><SelectTrigger className="h-11 bg-background"><SelectValue /></SelectTrigger><SelectContent>{PROPERTY_STATUSES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label htmlFor="property-price" className="text-xs font-semibold">Price <span className="text-amber-600">*</span></Label><Input className="h-11 bg-background" id="property-price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" /></div>
                  <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="property-address" className="text-xs font-semibold">Address <span className="text-amber-600">*</span></Label><Input className="h-11 bg-background" id="property-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full property address" /></div>
                </div>
              </section>
              <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white">02</span><div><h3 className="text-sm font-semibold">Property specs</h3><p className="text-xs text-muted-foreground">Give the listing useful dimensions.</p></div></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="space-y-1.5"><Label htmlFor="property-bedrooms" className="text-xs font-semibold">Bedrooms</Label><Input className="h-11 bg-background" id="property-bedrooms" type="number" min="0" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div><div className="space-y-1.5"><Label htmlFor="property-bathrooms" className="text-xs font-semibold">Bathrooms</Label><Input className="h-11 bg-background" id="property-bathrooms" type="number" min="0" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div><div className="space-y-1.5"><Label htmlFor="property-area" className="text-xs font-semibold">Area (sq ft)</Label><Input className="h-11 bg-background" id="property-area" type="number" min="0" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div></div>
              </section>
              <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white">03</span><div><h3 className="text-sm font-semibold">Story & media</h3><p className="text-xs text-muted-foreground">Add context and make the listing memorable.</p></div></div>
                <div className="space-y-4"><div className="space-y-1.5"><Label htmlFor="property-description" className="text-xs font-semibold">Description</Label><Textarea id="property-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What makes this property worth viewing?" className="min-h-24 resize-none bg-background" /></div><div className="space-y-2"><div className="flex items-center justify-between"><Label className="text-xs font-semibold">Photos</Label><span className="text-xs text-muted-foreground">{form.photos.length + photoFiles.length}/10 selected</span></div><label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-muted/30 px-3 py-6 text-sm transition-colors hover:border-amber-400 hover:bg-amber-50/50"><UploadCloud className="h-5 w-5 text-muted-foreground" />{uploading ? 'Saving photos...' : 'Drop photos here or browse'}<span className="text-xs text-muted-foreground">JPG, PNG, WEBP · up to 10 photos</span><input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple className="hidden" onChange={uploadPhotos} disabled={uploading || form.photos.length + photoFiles.length >= 10} /></label>{(form.photos.length > 0 || photoFiles.length > 0) && <div className="grid grid-cols-4 gap-2">{form.photos.map((photo, index) => <div key={`${photo}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg"><img src={photoUrl(photo)} alt={`Property ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => setForm({ ...form, photos: form.photos.filter((_, photoIndex) => photoIndex !== index) })} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label="Remove photo"><X className="h-3 w-3" /></button></div>)}{photoPreviews.map(({ file, url }, index) => <div key={`${file.name}-${file.lastModified}`} className="group relative aspect-square overflow-hidden rounded-lg"><img src={url} alt={file.name} className="h-full w-full object-cover" /><button type="button" onClick={() => setPhotoFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label="Remove photo"><X className="h-3 w-3" /></button></div>)}</div>}</div></div>
              </section>
            </div>
            <DialogFooter className="shrink-0 border-t border-border bg-card px-5 py-4 sm:px-7"><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit" disabled={saveMutation.isPending || uploading} className="bg-slate-950 text-white hover:bg-slate-800">{saveMutation.isPending ? 'Saving...' : editing ? 'Update property' : 'Create property'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} itemName={deleteTarget?.title || 'this property'} itemType="property" onCancel={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate(propertyId(deleteTarget))} />
    </div>
  );
}