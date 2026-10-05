import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Receipt, FileText, Users, FolderOpen, DollarSign, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const iconMap = {
  expense: Receipt,
  invoice: FileText,
  investor: Users,
  document: FolderOpen,
  payout: DollarSign,
  default: CheckCircle,
};

export default function ActivityFeed({ companyId }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activities', companyId],
    queryFn: () => companyId
      ? api.entities.Activity.filter({ company_id: companyId }, '-created_date', 10)
      : api.entities.Activity.list('-created_date', 10),
    initialData: [],
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-sm mb-4">Recent Activity</h3>
      <ScrollArea className="h-72">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {activities.map((a, i) => {
              const Icon = iconMap[a.entity_type] || iconMap.default;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex gap-3 items-start"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.action}</p>
                    {a.details && <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.details}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.user_name || a.created_by} · {format(new Date(a.created_date), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}