
import React, { useState, useEffect } from 'react';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import NoCompanyBanner from '@/components/ui/NoCompanyBanner';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Users,
  Percent,
  DollarSign,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const getEmptyAgreements = () => [
  { title: '', description: '' },
  { title: '', description: '' },
  { title: '', description: '' },
  { title: '', description: '' },
];

const getInitialForm = () => ({
  name: '',
  user_email: '',
  role: 'investor',
  equity_percentage: 0,
  total_invested: 0,
  agreements: getEmptyAgreements(),
  contract_id: '',
});

const getInvestorId = (investor) => investor?.id || investor?._id;

export default function Investors() {
  const { activeCompany, companies, currentUser } = useOutletContext();
  const companyId = activeCompany?.id || activeCompany?._id;
  const queryClient = useQueryClient();

  const isOwner =
    activeCompany?.created_by?.toLowerCase() === currentUser?.email?.toLowerCase();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(getInitialForm());
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
  const draft = localStorage.getItem('investorDraft');

  if (draft) {
    setForm(JSON.parse(draft));
  }
}, []);

useEffect(() => {
  console.log("Saving draft", form);

  localStorage.setItem(
    "investorDraft",
    JSON.stringify(form)
  );
}, [form]);


  const roles = [
    'owner',
    'admin',
    'investor',
    'finance_manager',
    'accountant',
    'auditor',
    'viewer',
  ];

  const { data: investors = [], isLoading } = useQuery({
    queryKey: ['investors', companyId],
    queryFn: () => api.entities.Investor.filter({ company_id: companyId }),
    initialData: [],
    enabled: !!companyId,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', companyId],
    queryFn: () => api.entities.Contract.filter({ company_id: companyId }),
    initialData: [],
    enabled: !!companyId && isOwner,
  });

  const logActivity = (action, details) => {
    if (!companyId) return;

    return api.entities.Activity.create({
      company_id: companyId,
      action,
      entity_type: 'investor',
      details,
    });
  };

  // const closeDialog = () => {
  //   setDialogOpen(false);
  //   setEditing(null);
  //   setForm(getInitialForm());
  // };
const closeDialog = () => {
    console.log(form);

  setDialogOpen(false);
  setEditing(null);
};
  // const openAdd = () => {
  //   setEditing(null);
  //   setForm(getInitialForm());
  //   setDialogOpen(true);
  // };
const openAdd = () => {
  setEditing(null);

  const draft = localStorage.getItem('investorDraft');

  if (draft) {
    setForm(JSON.parse(draft));
  } else {
    setForm(getInitialForm());
  }

  setDialogOpen(true);
};
  const openEdit = (inv) => {
    const existingAgreements = Array.isArray(inv.agreements)
      ? inv.agreements
      : [];

    setEditing(inv);

    setForm({
      name: inv.name || '',
      user_email: inv.user_email || '',
      role: inv.role || 'investor',
      equity_percentage: inv.equity_percentage || 0,
      total_invested: inv.total_invested || 0,
      agreements: [
        ...existingAgreements.map((agreement) => ({
          title: agreement.title || '',
          description: agreement.description || '',
        })),
        ...getEmptyAgreements(),
      ].slice(0, 4),
      contract_id: inv.contract_id ? (inv.contract_id._id || inv.contract_id) : '',
    });

    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open) => {
    if (!open) {
      closeDialog();
      return;
    }

    setDialogOpen(true);
  };

  const handleAgreementChange = (index, field, value) => {
    const updatedAgreements = [...form.agreements];

    updatedAgreements[index] = {
      ...updatedAgreements[index],
      [field]: value,
    };

    setForm({
      ...form,
      agreements: updatedAgreements,
    });
  };

  const createMutation = useMutation({
    mutationFn: (data) =>
      api.entities.Investor.create({
        ...data,
        company_id: companyId,
      }),
    // onSuccess: (inv) => {
    //   queryClient.invalidateQueries({ queryKey: ['investors', companyId] });
    //   logActivity(`New investor added: ${inv.name}`, `Role: ${inv.role}`);
    //   toast.success(`Investor "${inv.name}" added successfully`);
    //   closeDialog();
    // },
    
    onSuccess: (inv) => {
  localStorage.removeItem('investorDraft');

  queryClient.invalidateQueries({
    queryKey: ['investors', companyId],
  });

  closeDialog();
},
    onError: (error) => {
      toast.error(error?.response?.data?.message || error.message || 'Failed to add investor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Investor.update(id, data),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['investors', companyId] });
      logActivity(`Investor updated: ${inv.name}`, `Role: ${inv.role}`);
      toast.success(`Investor "${inv.name}" updated`);
      closeDialog();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error.message || 'Failed to update investor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Investor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors', companyId] });
      toast.success('Investor removed');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete investor');
    },
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Investor name is required');
      return;
    }

    const cleanedAgreements = form.agreements
      .map((agreement) => ({
        title: agreement.title.trim(),
        description: agreement.description.trim(),
      }))
      .filter((agreement) => agreement.title || agreement.description);

    const hasInvalidAgreement = cleanedAgreements.some(
      (agreement) => !agreement.title || !agreement.description
    );

    if (hasInvalidAgreement) {
      toast.error('Agreement title and description both are required');
      return;
    }

    if (cleanedAgreements.length > 4) {
      toast.error('Maximum 4 agreements are allowed');
      return;
    }

    const trimmedEmail = form.user_email.toLowerCase().trim();
    const payload = {
      ...form,
      name: form.name.trim(),
      user_email: trimmedEmail,
      equity_percentage: Number(form.equity_percentage) || 0,
      total_invested: Number(form.total_invested) || 0,
      agreements: cleanedAgreements,
      contract_id: form.contract_id || null,
      // If email is provided and it's a new invite, mark as pending so the user must accept
      ...(!editing && trimmedEmail ? { invitation_status: 'pending' } : {}),
    };

    if (editing) {
      updateMutation.mutate({
        id: getInvestorId(editing),
        data: payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = () => {
    const id = getInvestorId(deleteTarget);

    if (!id) {
      toast.error('Investor id not found');
      return;
    }

    deleteMutation.mutate(id);
    setDeleteTarget(null);
  };

  const activeInvestors = investors.filter(
  (investor) => investor.status === "active"
);

const totalEquity = activeInvestors.reduce(
  (sum, investor) => sum + (Number(investor.equity_percentage) || 0),
  0
);

const totalInvested = activeInvestors.reduce(
  (sum, investor) => sum + (Number(investor.total_invested) || 0),
  0
)

  if (!companyId) {
    return <NoCompanyBanner hasNoCompanies={!companies?.length} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage partners and ownership
          </p>
        </div>

        <Button onClick={openAdd} disabled={!companyId} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Investor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Investors</p>
              {/* <p className="text-xl font-bold">{investors.length}</p> */}
              <p className="text-xl font-bold">{activeInvestors.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Allocated Equity</p>
              <p className="text-xl font-bold">{totalEquity}%</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Invested</p>
              <p className="text-xl font-bold">
                ${totalInvested.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                    Name
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                    Role
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                    Equity
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                    Invested
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                    Agreements
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3"></th>
                </tr>
              </thead>

              <tbody>
                <AnimatePresence>
                  {investors.map((inv, index) => (
                    <motion.tr
                      key={getInvestorId(inv) || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {inv.name?.charAt(0)?.toUpperCase()}
                          </div>

                          <div>
                            <p className="text-sm font-medium">{inv.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {inv.user_email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge variant="secondary" className="capitalize text-xs">
                          {inv.role?.replace('_', ' ')}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-sm font-semibold">
                        {inv.equity_percentage || 0}%
                      </td>

                      <td className="px-5 py-3.5 text-sm">
                        ${(inv.total_invested || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 text-sm">
                        {inv.agreements?.length || 0}/4
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge
                          className={`text-xs ${
                            inv.status === 'active'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {inv.status || 'active'}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(inv)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(inv)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {investors.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No investors yet. Add your first partner.
              </div>
            )}
          </>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.name}
        itemType="Investor"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
<Dialog
  open={dialogOpen}
  onOpenChange={(open) => {
    if (!open) closeDialog();
    else setDialogOpen(true);
  }}
>
<DialogContent className="w-[92vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-xl shadow-xl border">    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <DialogTitle className="text-xl font-semibold">
            {editing ? 'Edit Investor' : 'Add Investor'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Add investor details, ownership, investment amount, and agreements.
          </p>
        </div>

        <Badge variant="secondary" className="capitalize">
          {form.role?.replace('_', ' ')}
        </Badge>
      </div>
    </DialogHeader>

    <div className="max-h-[68vh] overflow-y-auto px-6 py-5 space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Basic Information</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Main profile details for this investor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              placeholder="Full name"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={form.user_email}
              onChange={(e) =>
                setForm({
                  ...form,
                  user_email: e.target.value,
                })
              }
              placeholder="Email address"
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={form.role}
            onValueChange={(value) =>
              setForm({
                ...form,
                role: value,
              })
            }
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role} className="capitalize">
                  {role.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isOwner && contracts.length > 0 && (
          <div className="space-y-2">
            <Label>Assign Contract <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Select
              value={form.contract_id || 'none'}
              onValueChange={(v) => setForm({ ...form, contract_id: v === 'none' ? '' : v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="No contract" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No contract</SelectItem>
                {contracts.map((c) => (
                  <SelectItem key={c.id || c._id} value={c.id || c._id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.user_email && form.contract_id && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                This user will receive an invitation and must agree to the contract before getting access.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Investment Details</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Equity and invested amount for this investor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Equity Percentage</Label>
            <div className="relative">
              <Input
                type="number"
                value={form.equity_percentage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    equity_percentage: Number(e.target.value),
                  })
                }
                className="h-11 pr-10"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Total Invested</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                value={form.total_invested}
                onChange={(e) =>
                  setForm({
                    ...form,
                    total_invested: Number(e.target.value),
                  })
                }
                className="h-11 pl-8"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

     
    </div>

    <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
      <div className="flex w-full flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={closeDialog}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending || updateMutation.isPending}
          className="gap-2"
        >
          {(createMutation.isPending || updateMutation.isPending) && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}

          {editing ? 'Update Investor' : 'Add Investor'}
        </Button>
      </div>
    </DialogFooter>
  </DialogContent>
</Dialog>
     
    </div>
  );
}