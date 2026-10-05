import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Receipt, FileText, Users, FolderOpen, DollarSign, CheckCircle, Shield } from 'lucide-react';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import DeleteActivity from './DeleteActivity';

const iconMap = {
  expense: Receipt,
  invoice: FileText,
  investor: Users,
  document: FolderOpen,
  payout: DollarSign,
  security: Shield,
};

export default function ActivityLog() {
  const { activeCompany } = useOutletContext();
  const companyId = activeCompany?.id;

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['all-activities', companyId],
    queryFn: () => companyId
      ? api.entities.Activity.filter({ company_id: companyId }, '-created_date', 50)
      : api.entities.Activity.list('-created_date', 50),
    initialData: [],
  });

  return (
  <div className="space-y-6">
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete audit trail of all actions
        </p>
      </div>
      <DeleteActivity />
    </div>

    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {isLoading ? (
        <TableSkeleton rows={6} cols={3} />
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/70">
          {activities.map((a, i) => {
            const Icon = iconMap[a.entity_type] || CheckCircle;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="group flex items-start gap-4 p-5 hover:bg-muted/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-muted border border-border/60 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-foreground/5 transition-colors">
                  <Icon className="w-4 h-4 text-foreground/70" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{a.action}</p>
                    {a.entity_type && (
                      <Badge
                        variant="outline"
                        className="capitalize text-[11px] font-medium tracking-wide text-muted-foreground border-border flex-shrink-0"
                      >
                        {a.entity_type}
                      </Badge>
                    )}
                  </div>

                  {a.details && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {a.details}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/70">
                      {a.user_name || a.created_by}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{format(new Date(a.created_date), 'MMM d, yyyy · h:mm a')}</span>
                  </div>

                  {(a.old_value || a.new_value) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {a.old_value && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-muted border border-border/60 text-muted-foreground">
                          <span className="text-[10px] uppercase tracking-wide font-semibold opacity-60">
                            Before
                          </span>
                          {a.old_value}
                        </span>
                      )}
                      {a.new_value && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-foreground/5 border border-border/60 text-foreground font-medium">
                          <span className="text-[10px] uppercase tracking-wide font-semibold opacity-60">
                            After
                          </span>
                          {a.new_value}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);
}