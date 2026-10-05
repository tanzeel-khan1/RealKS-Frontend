import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/apiClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Mail, Building2, UserCircle2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function InvitationModal({ invitations, onDone }) {
  const [index, setIndex] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const current = invitations[index];
  const hasContract = !!current?.contract_id;

  const advance = () => {
    if (index < invitations.length - 1) {
      setIndex((i) => i + 1);
      setAgreed(false);
      return;
    }

    qc.invalidateQueries(["companies"]);
    onDone();
    navigate('/personal', { replace: true });
  };

  const acceptMutation = useMutation({
    mutationFn: () => api.invitations.accept(current.id || current._id, {
      contract_agreed: agreed,
      initial_investment: current.total_invested,
    }),
    onSuccess: () => {
      toast.success("Invitation accepted! You now have access.");
      qc.invalidateQueries(["companies"]);
      onDone();
      navigate('/personal', { replace: true });
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.invitations.reject(current.id || current._id),
    onSuccess: () => {
      toast.info("Invitation declined.");
      advance();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!current) return null;

  const company = current.company_id;
  const contract = current.contract_id;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Company Invitation
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {invitations.length > 1 && (
            <p className="text-xs text-muted-foreground text-right">
              {index + 1} of {invitations.length} invitations
            </p>
          )}

          {/* Company info */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
            <Building2 className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">{company?.name || "A company"}</p>
              {company?.industry && (
                <p className="text-xs text-muted-foreground">{company.industry}</p>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-2">
            <UserCircle2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">You are invited as</span>
            <Badge variant="secondary" className="capitalize">{current.role}</Badge>
          </div>

          {/* Contract section */}
          {hasContract && contract ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Contract: {contract.title}</span>
              </div>
              {contract.description && (
                <p className="text-xs text-muted-foreground pl-6">{contract.description}</p>
              )}
              <ScrollArea className="h-48 rounded-md border bg-muted/30 p-3">
                <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono">
                  {contract.content || "No contract content provided."}
                </div>
              </ScrollArea>

              <Separator />

              <div className="flex items-start gap-3">
                <Checkbox
                  id="agree-contract"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(!!v)}
                  className="mt-0.5"
                />
                <label htmlFor="agree-contract" className="text-sm leading-snug cursor-pointer select-none">
                  I have read and agree to the terms of this contract.
                </label>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No contract attached to this invitation.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => rejectMutation.mutate()}
            disabled={rejectMutation.isPending || acceptMutation.isPending}
          >
            Decline
          </Button>
          <Button
            className="flex-1"
            onClick={() => acceptMutation.mutate()}
            disabled={
              (hasContract && !agreed) ||
              acceptMutation.isPending ||
              rejectMutation.isPending
            }
          >
            {hasContract && !agreed ? "Agree to Contract First" : "Accept Invitation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
