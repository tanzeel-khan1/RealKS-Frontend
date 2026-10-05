import React, { useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/apiClient";
import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";

const STEPS = [
  { icon: Building2, label: "Company Info" },
  { icon: CheckCircle, label: "Complete" },
];

export default function CreateCompany() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setActiveCompany } = useOutletContext();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    country: "",
    currency: "USD",
    description: "",
    fiscal_year_start: "January",
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => api.entities.Company.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      api.entities.Company.create({
        ...data,
        setup_progress: 80,
        status: "active",
      }),
    onSuccess: async (newCompany) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setActiveCompany(newCompany);
      api.auth.setActiveCompanyId(newCompany.id);
      setStep(1);
      const returnTo = searchParams.get("returnTo");
      if (returnTo === "personal") {
        navigate("/personal", {
          replace: true,
          state: { activeSection: "companies" },
        });
      }
    },
  });

  const canCreateCompany = (existingCompaniesCount = 0) => {
    return existingCompaniesCount < 1;
  };

  const handleCreateClick = (companiesCount) => {
    const allowed = canCreateCompany(companiesCount);

    if (!allowed) {
      setShowLimitModal(true);
      return;
    }

    createMutation.mutate(form);
  };
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Progress */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Company</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your workspace in minutes
        </p>
        <Progress value={progress} className="mt-4 h-1.5" />
        <div className="flex justify-between mt-3">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 text-xs font-medium ${i <= step ? "text-primary" : "text-muted-foreground"}`}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        {/* STEP 0: Company Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Company Information</h2>
            <div>
              <Label>Company Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Industry</Label>
                <Input
                  value={form.industry}
                  onChange={(e) =>
                    setForm({ ...form, industry: e.target.value })
                  }
                  placeholder="Technology"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  placeholder="United States"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Currency</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm({ ...form, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["USD", "EUR", "GBP", "CAD", "AUD", "INR", "PKR"].map(
                      (c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fiscal Year Start</Label>
                <Select
                  value={form.fiscal_year_start}
                  onValueChange={(v) =>
                    setForm({ ...form, fiscal_year_start: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["January", "April", "July", "October"].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Brief description"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* STEP 1: Complete */}
        {step === 1 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Company Created!</h2>
            <p className="text-sm text-muted-foreground mt-3">
              Your workspace is ready. Start adding investors and tracking
              finances.
            </p>
            <Button
              onClick={() =>
                navigate("/personal", {
                  replace: true,
                  state: { activeSection: "companies" },
                })
              }
              className="mt-6 gap-2"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </motion.div>

      {step < 1 && (
        <>
          <div className="flex justify-end">
            <Button
              onClick={() => handleCreateClick(companies.length)}
              disabled={!form.name || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...
                </>
              ) : (
                <>
                  Create Company <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
            <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
              <div className="relative overflow-hidden bg-[#0c0e16] px-6 py-8 text-center">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(231,182,60,0.15),transparent_55%)]" />
                <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f0c74f] via-[#d9ac34] to-[#9a7718] shadow-[0_10px_30px_-8px_rgba(199,154,39,0.8)]">
                  <Building2 className="h-6 w-6 text-black" />
                </div>
                <h2 className="relative text-xl font-semibold text-white">
                  One company per account
                </h2>
              </div>
              <div className="px-6 py-6">
                <p className="text-sm leading-6 text-muted-foreground">
                  You can only create one company with this email address. You already have an active workspace, so you cannot create another company from this account.
                </p>
              </div>
              <DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:justify-between">
                <Button variant="outline" onClick={() => setShowLimitModal(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowLimitModal(false);
                    navigate("/personal", {
                      replace: true,
                      state: { activeSection: "companies" },
                    });
                  }}
                >
                  Go to my workspace
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
