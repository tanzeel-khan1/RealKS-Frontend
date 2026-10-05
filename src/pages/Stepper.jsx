// import React, { useState } from 'react';
// import { useOutletContext } from 'react-router-dom';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { api } from '@/api/apiClient';
// import { Plus, Pencil, Trash2, CheckCircle2, Circle, Loader, GripVertical, X, Check } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import NoCompanyBanner from '@/components/ui/NoCompanyBanner';
// import { toast } from 'sonner';
// import { motion, AnimatePresence } from 'framer-motion';

// const STATUS_CONFIG = {
//   not_started: { label: 'Not Started', dot: 'bg-muted-foreground/40',  ring: 'ring-muted-foreground/30',  text: 'text-muted-foreground',  badge: 'bg-muted text-muted-foreground' },
//   in_progress:  { label: 'In Progress', dot: 'bg-yellow-500',           ring: 'ring-yellow-400/60',        text: 'text-yellow-600',        badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
//   completed:    { label: 'Completed',   dot: 'bg-green-500',            ring: 'ring-green-400/60',         text: 'text-green-600',         badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
// };

// const STEP_COLORS = [
//   { id: 'yellow',  hex: '#EAB308' },
//   { id: 'orange',  hex: '#F97316' },
//   { id: 'purple',  hex: '#A855F7' },
//   { id: 'blue',    hex: '#3B82F6' },
//   { id: 'green',   hex: '#22C55E' },
//   { id: 'pink',    hex: '#EC4899' },
//   { id: 'red',     hex: '#EF4444' },
//   { id: 'cyan',    hex: '#06B6D4' },
// ];

// const emptyForm = { title: '', description: '', status: 'not_started', color: 'yellow' };

// export default function Stepper() {
//   const { activeCompany, companies } = useOutletContext();
//   const companyId = activeCompany?.id;
//   const queryClient = useQueryClient();

//   const [dialog, setDialog] = useState(false);
//   const [editing, setEditing] = useState(null);
//   const [form, setForm] = useState(emptyForm);
//   const [deleteTarget, setDeleteTarget] = useState(null);

//   if (!companyId) return <NoCompanyBanner hasNoCompanies={!companies?.length} />;

//   const { data: steps = [], isLoading } = useQuery({
//     queryKey: ['steps', companyId],
//     queryFn: () => api.entities.Step.filter({ company_id: companyId }),
//     initialData: [],
//     enabled: !!companyId,
//   });

//   const createMutation = useMutation({
//     mutationFn: (d) => api.entities.Step.create({ ...d, company_id: companyId }),
//     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['steps'] }); closeDialog(); toast.success('Step added'); },
//     onError: () => toast.error('Failed to add step'),
//   });

//   const updateMutation = useMutation({
//     mutationFn: ({ id, data }) => api.entities.Step.update(id, data),
//     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['steps'] }); closeDialog(); toast.success('Step updated'); },
//     onError: () => toast.error('Failed to update step'),
//   });

//   const deleteMutation = useMutation({
//     mutationFn: (id) => api.entities.Step.delete(id),
//     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['steps'] }); setDeleteTarget(null); toast.success('Step deleted'); },
//   });

//   const closeDialog = () => { setDialog(false); setEditing(null); setForm(emptyForm); };

//   const openCreate = () => { setEditing(null); setForm(emptyForm); setDialog(true); };
//   const openEdit = (step) => {
//     setEditing(step);
//     setForm({ title: step.title, description: step.description || '', status: step.status, color: step.color || 'yellow' });
//     setDialog(true);
//   };

//   const handleSubmit = () => {
//     if (!form.title.trim()) return;
//     if (editing) updateMutation.mutate({ id: editing.id, data: form });
//     else createMutation.mutate(form);
//   };

//   const cycleStatus = (step) => {
//     const order = ['not_started', 'in_progress', 'completed'];
//     const next = order[(order.indexOf(step.status) + 1) % order.length];
//     updateMutation.mutate({ id: step.id, data: { status: next } });
//   };

//   const completed = steps.filter(s => s.status === 'completed').length;
//   const inProgress = steps.filter(s => s.status === 'in_progress').length;
//   const pct = steps.length ? Math.round((completed / steps.length) * 100) : 0;

//   const colorHex = (c) => STEP_COLORS.find(s => s.id === c)?.hex || '#EAB308';

//   return (
//     <div className="space-y-6 max-w-4xl mx-auto">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
//             🛣️ Roadmap Stepper
//           </h1>
//           <p className="text-sm text-muted-foreground mt-0.5">
//             {steps.length} steps · {completed} completed · {inProgress} in progress
//           </p>
//         </div>
//         <Button onClick={openCreate} className="gap-2">
//           <Plus className="w-4 h-4" /> Add Step
//         </Button>
//       </div>

//       {/* Progress bar */}
//       {steps.length > 0 && (
//         <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
//           <div className="flex-1">
//             <div className="flex items-center justify-between mb-1.5">
//               <span className="text-xs font-semibold text-muted-foreground">Overall Progress</span>
//               <span className="text-xs font-bold">{pct}%</span>
//             </div>
//             <div className="h-2 bg-muted rounded-full overflow-hidden">
//               <motion.div
//                 className="h-full bg-primary rounded-full"
//                 initial={{ width: 0 }}
//                 animate={{ width: `${pct}%` }}
//                 transition={{ duration: 0.6, ease: 'easeOut' }}
//               />
//             </div>
//           </div>
//           <div className="flex gap-4 flex-shrink-0 text-center">
//             {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
//               <div key={key}>
//                 <p className="text-lg font-bold">{steps.filter(s => s.status === key).length}</p>
//                 <p className={`text-[10px] font-medium ${cfg.text}`}>{cfg.label}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Empty state */}
//       {!isLoading && steps.length === 0 && (
//         <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
//           <span className="text-6xl opacity-30">🛣️</span>
//           <div className="text-center">
//             <p className="font-semibold text-foreground">No steps yet</p>
//             <p className="text-sm mt-1">Add your first roadmap step to get started.</p>
//           </div>
//           <Button onClick={openCreate} className="gap-2 mt-1">
//             <Plus className="w-4 h-4" /> Add First Step
//           </Button>
//         </div>
//       )}

//       {/* Roadmap */}
//       {steps.length > 0 && (
//         <div className="relative">
//           {/* Central connecting line */}
//           <div className="absolute left-1/2 -translate-x-px top-8 bottom-8 w-0.5 bg-gradient-to-b from-border via-border/60 to-border/20 hidden md:block" />

//           <div className="space-y-0">
//             <AnimatePresence>
//               {steps.map((step, idx) => {
//                 const isLeft = idx % 2 === 0;
//                 const cfg = STATUS_CONFIG[step.step || step.status] || STATUS_CONFIG[step.status];
//                 const hex = colorHex(step.color);
//                 const isCompleted = step.status === 'completed';
//                 const isInProgress = step.status === 'in_progress';

//                 return (
//                   <motion.div
//                     key={step.id}
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, scale: 0.95 }}
//                     transition={{ delay: idx * 0.05 }}
//                     className="relative flex items-center justify-center md:grid md:grid-cols-[1fr_auto_1fr] gap-0 py-3"
//                   >
//                     {/* Left content */}
//                     <div className={`${isLeft ? 'md:flex' : 'md:hidden'} hidden flex-col items-end pr-6`}>
//                       <StepCard
//                         step={step} hex={hex} cfg={STATUS_CONFIG[step.status]}
//                         onEdit={() => openEdit(step)}
//                         onDelete={() => setDeleteTarget(step)}
//                         onCycleStatus={() => cycleStatus(step)}
//                         align="right"
//                       />
//                     </div>

//                     {/* Center node */}
//                     <div className="flex flex-col items-center relative z-10 flex-shrink-0">
//                       <button
//                         onClick={() => cycleStatus(step)}
//                         title="Click to cycle status"
//                         className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all hover:scale-110 ring-4 shadow-lg
//                           ${isCompleted ? 'text-white ring-green-400/60' : isInProgress ? 'text-white ring-yellow-400/60' : 'text-white ring-border/40'}`}
//                         style={{ backgroundColor: isCompleted ? '#22C55E' : isInProgress ? hex : '#6B7280' }}
//                       >
//                         {isCompleted ? <Check className="w-5 h-5" /> : isInProgress ? <Loader className="w-4 h-4 animate-spin" /> : step.step_number}
//                       </button>
//                     </div>

//                     {/* Right content */}
//                     <div className={`${!isLeft ? 'md:flex' : 'md:hidden'} hidden flex-col items-start pl-6`}>
//                       <StepCard
//                         step={step} hex={hex} cfg={STATUS_CONFIG[step.status]}
//                         onEdit={() => openEdit(step)}
//                         onDelete={() => setDeleteTarget(step)}
//                         onCycleStatus={() => cycleStatus(step)}
//                         align="left"
//                       />
//                     </div>

//                     {/* Mobile: always show card below node */}
//                     <div className="md:hidden col-span-3 px-4 pt-2">
//                       <StepCard
//                         step={step} hex={hex} cfg={STATUS_CONFIG[step.status]}
//                         onEdit={() => openEdit(step)}
//                         onDelete={() => setDeleteTarget(step)}
//                         onCycleStatus={() => cycleStatus(step)}
//                         align="left"
//                       />
//                     </div>
//                   </motion.div>
//                 );
//               })}
//             </AnimatePresence>
//           </div>

//           {/* End marker */}
//           {steps.length > 0 && (
//             <div className="flex justify-center mt-2">
//               <div className="flex flex-col items-center gap-1 text-muted-foreground">
//                 <div className="w-3 h-3 rounded-full border-2 border-border" />
//                 <span className="text-[10px]">End</span>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Add Step CTA at bottom */}
//       {steps.length > 0 && (
//         <div className="flex justify-center pt-2">
//           <button
//             onClick={openCreate}
//             className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border rounded-xl px-6 py-3 hover:border-primary hover:bg-muted/30"
//           >
//             <Plus className="w-4 h-4" /> Add Next Step
//           </button>
//         </div>
//       )}

//       {/* Create / Edit Dialog */}
//       <Dialog open={dialog} onOpenChange={closeDialog}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>{editing ? `Edit Step ${editing.step_number}` : 'Add New Step'}</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div>
//               <Label>Step Title *</Label>
//               <Input
//                 value={form.title}
//                 onChange={e => setForm({ ...form, title: e.target.value })}
//                 placeholder="e.g. MVP Launch, Market Research..."
//               />
//             </div>
//             <div>
//               <Label>Description</Label>
//               <Textarea
//                 value={form.description}
//                 onChange={e => setForm({ ...form, description: e.target.value })}
//                 placeholder="What needs to happen in this step?"
//                 className="min-h-[90px] resize-none"
//               />
//             </div>
//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <Label>Status</Label>
//                 <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
//                   <SelectTrigger><SelectValue /></SelectTrigger>
//                   <SelectContent>
//                     {Object.entries(STATUS_CONFIG).map(([k, v]) => (
//                       <SelectItem key={k} value={k}>{v.label}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div>
//                 <Label>Color</Label>
//                 <div className="flex gap-1.5 flex-wrap mt-2">
//                   {STEP_COLORS.map(c => (
//                     <button
//                       key={c.id}
//                       onClick={() => setForm({ ...form, color: c.id })}
//                       className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${form.color === c.id ? 'ring-2 ring-offset-1 ring-foreground scale-110' : ''}`}
//                       style={{ backgroundColor: c.hex }}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={closeDialog}>Cancel</Button>
//             <Button
//               onClick={handleSubmit}
//               disabled={!form.title.trim() || createMutation.isPending || updateMutation.isPending}
//             >
//               {editing ? 'Save Changes' : 'Add Step'}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirm */}
//       <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
//         <DialogContent className="max-w-sm">
//           <DialogHeader><DialogTitle>Delete Step?</DialogTitle></DialogHeader>
//           <p className="text-sm text-muted-foreground">
//             Are you sure you want to delete <strong>Step {deleteTarget?.step_number}: {deleteTarget?.title}</strong>? Steps will be re-numbered automatically.
//           </p>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
//             <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
//               Delete
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// // ── StepCard ─────────────────────────────────────────────────────────────────
// function StepCard({ step, hex, cfg, onEdit, onDelete, onCycleStatus, align }) {
//   return (
//     <div
//       className={`group relative bg-card border border-border rounded-xl p-4 w-full max-w-[300px] shadow-sm hover:shadow-md transition-all
//         ${align === 'right' ? 'text-right' : 'text-left'}`}
//       style={{ borderLeftColor: align === 'left' ? hex : undefined, borderLeftWidth: align === 'left' ? 3 : undefined,
//                borderRightColor: align === 'right' ? hex : undefined, borderRightWidth: align === 'right' ? 3 : undefined }}
//     >
//       {/* Step number label */}
//       <div className={`flex items-center gap-1.5 mb-2 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
//         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
//           Step {step.step_number}
//         </span>
//         <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
//           {cfg.label}
//         </span>
//       </div>

//       {/* Title */}
//       <p className="text-sm font-bold leading-snug">{step.title}</p>

//       {/* Description */}
//       {step.description && (
//         <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">{step.description}</p>
//       )}

//       {/* Actions */}
//       <div className={`flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity ${align === 'right' ? 'justify-start flex-row-reverse' : 'justify-start'}`}>
//         <button
//           onClick={onEdit}
//           className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
//           title="Edit"
//         >
//           <Pencil className="w-3.5 h-3.5" />
//         </button>
//         <button
//           onClick={onCycleStatus}
//           className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
//           title="Cycle status"
//         >
//           <CheckCircle2 className="w-3.5 h-3.5" />
//         </button>
//         <button
//           onClick={onDelete}
//           className="p-1 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
//           title="Delete"
//         >
//           <Trash2 className="w-3.5 h-3.5" />
//         </button>
//       </div>
//     </div>
//   );
// }
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader,
  X,
  Check,
  Rocket,
  Crown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import NoCompanyBanner from '@/components/ui/NoCompanyBanner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
  not_started: {
    label: 'Not Started',
    badge: 'bg-yellow-200 text-yellow-900',
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-orange-200 text-orange-900',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-green-200 text-green-900',
  },
};

const STEP_COLORS = [
  { id: 'yellow', hex: '#FACC15' },
  { id: 'orange', hex: '#F97316' },
  { id: 'purple', hex: '#A855F7' },
  { id: 'blue', hex: '#3B82F6' },
  { id: 'green', hex: '#22C55E' },
  { id: 'pink', hex: '#EC4899' },
  { id: 'red', hex: '#EF4444' },
  { id: 'cyan', hex: '#06B6D4' },
];

const emptyForm = {
  title: '',
  description: '',
  status: 'not_started',
  color: 'yellow',
};

export default function Stepper() {
  const { activeCompany, companies } = useOutletContext();
  const companyId = activeCompany?.id;
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ['steps', companyId],
    queryFn: () => api.entities.Step.filter({ company_id: companyId }),
    initialData: [],
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      api.entities.Step.create({
        ...data,
        company_id: companyId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steps'] });
      closeDialog();
      toast.success('Step added');
    },
    onError: () => toast.error('Failed to add step'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Step.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steps'] });
      closeDialog();
      toast.success('Step updated');
    },
    onError: () => toast.error('Failed to update step'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Step.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steps'] });
      setDeleteTarget(null);
      toast.success('Step deleted');
    },
    onError: () => toast.error('Failed to delete step'),
  });

  const closeDialog = () => {
    setDialog(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialog(true);
  };

  const openEdit = (step) => {
    setEditing(step);
    setForm({
      title: step.title || '',
      description: step.description || '',
      status: step.status || 'not_started',
      color: step.color || 'yellow',
    });
    setDialog(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        data: form,
      });
    } else {
      createMutation.mutate(form);
    }
  };

  const cycleStatus = (step) => {
    const order = ['not_started', 'in_progress', 'completed'];
    const currentIndex = order.indexOf(step.status);
    const next = order[(currentIndex + 1) % order.length];

    updateMutation.mutate({
      id: step.id,
      data: { status: next },
    });
  };

  const completed = steps.filter((s) => s.status === 'completed').length;
  const inProgress = steps.filter((s) => s.status === 'in_progress').length;
  const pct = steps.length ? Math.round((completed / steps.length) * 100) : 0;

  if (!companyId) {
    return <NoCompanyBanner hasNoCompanies={!companies?.length} />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <RoadmapHeader
        steps={steps}
        completed={completed}
        inProgress={inProgress}
        pct={pct}
        onCreate={openCreate}
      />

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader className="w-5 h-5 animate-spin mr-2" />
          Loading roadmap...
        </div>
      )}

      {!isLoading && steps.length === 0 && (
        <EmptyState onCreate={openCreate} />
      )}

      {!isLoading && steps.length > 0 && (
        <RoadmapView
          steps={steps}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onCycleStatus={cycleStatus}
        />
      )}

      <StepDialog
        open={dialog}
        editing={editing}
        form={form}
        setForm={setForm}
        closeDialog={closeDialog}
        handleSubmit={handleSubmit}
        createPending={createMutation.isPending}
        updatePending={updateMutation.isPending}
      />

      <DeleteDialog
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        deleteMutation={deleteMutation}
      />
    </div>
  );
}

function RoadmapHeader({
  steps,
  completed,
  inProgress,
  pct,
  onCreate,
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Roadmap Stepper
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {steps.length} steps · {completed} completed · {inProgress} in progress
          </p>
        </div>

        <Button onClick={onCreate} className="gap-2 w-full md:w-auto">
          <Plus className="w-4 h-4" />
          Add Step
        </Button>
      </div>

      {steps.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Overall Progress
            </span>
            <span className="text-xs font-bold">{pct}%</span>
          </div>

          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4 border border-dashed border-border rounded-2xl">
      <span className="text-6xl opacity-30">🛣️</span>

      <div className="text-center">
        <p className="font-semibold text-foreground">No steps yet</p>
        <p className="text-sm mt-1">
          Add your first roadmap step to get started.
        </p>
      </div>

      <Button onClick={onCreate} className="gap-2 mt-1">
        <Plus className="w-4 h-4" />
        Add First Step
      </Button>
    </div>
  );
}

function RoadmapView({
  steps,
  onCreate,
  onEdit,
  onDelete,
  onCycleStatus,
}) {
  return (
    <div className="relative overflow-hidden   px-4 md:px-10 py-8 md:py-10  min-h-[720px]">
      <RoadmapBackground />

      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="w-9 h-9 rounded-full bg-[#ffc400] text-[#3b064c] flex items-center justify-center shadow-lg">
          <Crown className="w-5 h-5 fill-current" />
        </div>

       
      </div>

      <div className="relative z-10">
        <RoadPath />

        <div className="space-y-6 md:space-y-2">
          <AnimatePresence>
            {steps.map((step, index) => {
              const align = index % 2 === 0 ? 'left' : 'right';

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: index * 0.04 }}
                  className="relative grid grid-cols-1 md:grid-cols-[1fr_96px_1fr] items-center min-h-[118px] md:min-h-[132px]"
                >
                  <div className="hidden md:flex justify-end pr-5">
                    {align === 'left' && (
                      <StepCard
                        step={step}
                        align="left"
                        onEdit={() => onEdit(step)}
                        onDelete={() => onDelete(step)}
                        onCycleStatus={() => onCycleStatus(step)}
                      />
                    )}
                  </div>

                  <div className="hidden md:flex justify-center relative z-20">
                    <StepNode
                      step={step}
                      onClick={() => onCycleStatus(step)}
                    />
                  </div>

                  <div className="hidden md:flex justify-start pl-5">
                    {align === 'right' && (
                      <StepCard
                        step={step}
                        align="right"
                        onEdit={() => onEdit(step)}
                        onDelete={() => onDelete(step)}
                        onCycleStatus={() => onCycleStatus(step)}
                      />
                    )}
                  </div>

                  <div className="md:hidden relative pl-16">
                    <div className="absolute left-2 top-1">
                      <StepNode
                        step={step}
                        onClick={() => onCycleStatus(step)}
                      />
                    </div>

                    <StepCard
                      step={step}
                      align="right"
                      onEdit={() => onEdit(step)}
                      onDelete={() => onDelete(step)}
                      onCycleStatus={() => onCycleStatus(step)}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="flex justify-center pt-8">
          <button
            onClick={onCreate}
            className="flex items-center gap-2 rounded-full bg-[#ffc400] px-6 py-3 text-sm font-black text-[#3b064c] shadow-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Add Next Step
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 right-5 text-[#ffc400] rotate-12 opacity-90">
        <Rocket className="w-16 h-16 fill-current" />
      </div>
    </div>
  );
}

function RoadmapBackground() {
  return (
    <>
      <div className="absolute inset-0 " />

      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-8 top-20 w-32 h-32 border border-white/10 rotate-45" />
        <div className="absolute right-14 top-40 w-28 h-28 border border-white/10 rotate-45" />
        <div className="absolute left-20 bottom-24 w-24 h-24 border border-white/10 rotate-45" />
      </div>

      <div className="absolute left-1/2 top-2 -translate-x-1/2 text-[#ffc400] opacity-80 text-3xl leading-none">
        
      </div>

      <div className="absolute left-1/2 bottom-16 -translate-x-1/2 text-[#ffc400] opacity-80 text-3xl leading-none">
        
      </div>
    </>
  );
}

function RoadPath() {
  return (
    <>
      <svg
        className="hidden md:block absolute left-1/2 top-0 h-[calc(100%-80px)] w-[190px] -translate-x-1/2 pointer-events-none overflow-visible"
        viewBox="0 0 190 900"
        preserveAspectRatio="none"
      >
        <path
          d="
            M95 0
            C95 55 35 55 35 115
            C35 175 155 175 155 235
            C155 295 35 295 35 355
            C35 415 155 415 155 475
            C155 535 35 535 35 595
            C35 655 155 655 155 715
            C155 775 95 775 95 900
          "
          fill="none"
          stroke="#f6a400"
          strokeWidth="32"
          strokeLinecap="round"
        />

        <path
          d="
            M95 0
            C95 55 35 55 35 115
            C35 175 155 175 155 235
            C155 295 35 295 35 355
            C35 415 155 415 155 475
            C155 535 35 535 35 595
            C35 655 155 655 155 715
            C155 775 95 775 95 900
          "
          fill="none"
          stroke="#3b064c"
          strokeWidth="4"
          strokeDasharray="8 9"
          strokeLinecap="round"
        />
      </svg>

      <div className="md:hidden absolute left-[34px] top-3 bottom-24 w-8 rounded-full border-l-[12px] border-[#f6a400]">
        <div className="absolute left-[-8px] top-0 bottom-0 border-l-2 border-dashed border-[#3b064c]" />
      </div>
    </>
  );
}

function StepNode({ step, onClick }) {
  const isCompleted = step.status === 'completed';
  const isInProgress = step.status === 'in_progress';

  return (
    <button
      onClick={onClick}
      title="Click to cycle status"
      className="w-12 h-12 rounded-full bg-[#1b1020] border-[5px] border-[#f6a400] text-white flex items-center justify-center text-sm font-black shadow-xl hover:scale-110 transition-transform"
    >
      {isCompleted ? (
        <Check className="w-5 h-5" />
      ) : isInProgress ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        step.step_number
      )}
    </button>
  );
}

function StepCard({
  step,
  align,
  onEdit,
  onDelete,
  onCycleStatus,
}) {
  const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.not_started;

  return (
    <div
      className={`
        group relative w-full max-w-[285px] rounded-xl
        bg-gradient-to-br from-[#ffd21a] via-[#ffc400] to-[#f6a400]
        px-4 py-3 text-[#2b1600] shadow-[0_12px_30px_rgba(0,0,0,0.22)]
        border border-yellow-300/70
        ${align === 'left' ? 'md:text-left' : 'md:text-left'}
      `}
    >
      <div
        className={`
          hidden md:block absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-[#f6a400] rotate-45
          ${align === 'left' ? '-right-2' : '-left-2'}
        `}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wide">
            Phase {step.step_number}
          </span>

          <span
            className={`
              text-[9px] font-bold px-1.5 py-0.5 rounded-full
              ${cfg.badge}
            `}
          >
            {cfg.label}
          </span>
        </div>

        <p className="text-sm font-black leading-snug">
          {step.title}
        </p>

        {step.description && (
          <p className="text-[11px] mt-1.5 leading-relaxed text-[#5a3700] line-clamp-3">
            {step.description}
          </p>
        )}

        <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 rounded-md hover:bg-black/10 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onCycleStatus}
            className="p-1 rounded-md hover:bg-black/10 transition-colors"
            title="Cycle status"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onDelete}
            className="p-1 rounded-md hover:bg-red-500/20 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StepDialog({
  open,
  editing,
  form,
  setForm,
  closeDialog,
  handleSubmit,
  createPending,
  updatePending,
}) {
  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit Step ${editing.step_number}` : 'Add New Step'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Step Title *</Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              placeholder="e.g. MVP Launch, Market Research..."
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              placeholder="What needs to happen in this step?"
              className="min-h-[90px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    status: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-1.5 flex-wrap mt-2">
                {STEP_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        color: color.id,
                      })
                    }
                    className={`
                      w-6 h-6 rounded-full transition-transform hover:scale-110
                      ${form.color === color.id ? 'ring-2 ring-offset-1 ring-foreground scale-110' : ''}
                    `}
                    style={{ backgroundColor: color.hex }}
                    title={color.id}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!form.title.trim() || createPending || updatePending}
          >
            {createPending || updatePending ? (
              <Loader className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {editing ? 'Save Changes' : 'Add Step'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  deleteTarget,
  setDeleteTarget,
  deleteMutation,
}) {
  return (
    <Dialog
      open={!!deleteTarget}
      onOpenChange={() => setDeleteTarget(null)}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Step?</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{' '}
          <strong>
            Step {deleteTarget?.step_number}: {deleteTarget?.title}
          </strong>
          ? Steps will be re-numbered automatically.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}