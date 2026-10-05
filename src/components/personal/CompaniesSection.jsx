import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from '@/api/apiClient';

export default function CompaniesSection({
  companies,
  allInvoices,
  allExpenses,
  onDeleteCompany,
}) {
  const navigate = useNavigate();

  const [deleteId, setDeleteId] = useState(null);
  const [localCompanies, setLocalCompanies] = useState(companies);

  // keep sync if parent updates
  useEffect(() => {
    setLocalCompanies(companies);
  }, [companies]);

  const confirmDelete = async () => {
    if (!deleteId) return;

    setLocalCompanies((prev) => prev.filter((c) => c.id !== deleteId));

    try {
      await onDeleteCompany?.(deleteId);

      toast.success("Company deleted successfully");
    } catch (err) {
      console.error(err);

      setLocalCompanies(companies);

      toast.error("Failed to delete company");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* MODAL */}
      {deleteId && (
        <div className="fixed inset-0  flex items-center justify-center z-50 px-4">
          <div className=" rounded-3xl bg-zinc-100 dark:bg-zinc-900 p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-semibold">Delete company?</h2>
            <p className="text-sm  mt-2">
              This will permanently remove the selected company from your personal workspace.
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl  text-white text-sm bg-red-500 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Personal Companies</p>
          <h2 className="text-2xl font-semibold">My companies</h2>
          <p className="text-sm text-slate-500 mt-1">
            Track your companies, revenue, expenses and profit in one place.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          className="gap-2"
          onClick={() => navigate('/personal/companies/new')}
        >
          <Plus className="w-4 h-4" /> Create company
        </Button>
      </div>

      {localCompanies.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-semibold">No personal companies yet</h3>
          <p className="text-sm text-slate-500 mt-2">
            Create a company to start tracking your growth and expenses.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-5"
            onClick={() => navigate('/personal/companies/new')}
          >
            Create company
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {localCompanies.map((c) => {
            const revenue = allInvoices
              .filter((i) => i.status === 'paid' && i.company_id === c.id)
              .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);

            const expenses = allExpenses
              .filter((e) => e.status === 'approved' && e.company_id === c.id)
              .reduce((s, e) => s + (e.amount || 0), 0);

            const profit = revenue - expenses;

            return (
              <div
                key={c.id}
                className="group rounded-3xl border border-slate-200 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl ">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.name} className="h-12 w-12 rounded-2xl object-cover" />
                      ) : (
                        <Building2 className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-semibold ">{c.name}</p>
                      <p className="text-sm  mt-1">
                        {c.industry || 'Industry not set'} · {c.country || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteId(c.id)}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl p-4 text-left">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-700">Revenue</p>
                    <p className="mt-2 text-lg font-semibold text-emerald-900">${revenue.toLocaleString()}</p>
                  </div>
                  <div className="rounded-3xl p-4 text-left">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-rose-700">Expenses</p>
                    <p className="mt-2 text-lg font-semibold text-rose-900">${expenses.toLocaleString()}</p>
                  </div>
                  <div className={`rounded-3xl p-4 text-left ${profit >= 0 ? '' : 'bg-rose-50 text-rose-800'}`}>
                    <p className="text-[11px] uppercase tracking-[0.22em]">Profit</p>
                    <p className="mt-2 text-lg font-semibold">${profit.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      const companyId = c.id || c._id;
                      if (companyId) {
                        api.auth.setActiveCompanyId(companyId);
                      }
                      navigate('/');
                    }}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium "
                  >
                    View dashboard
                  </button>
                  <button
                    onClick={() => setDeleteId(c.id)}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
