import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['hsl(160, 84%, 39%)', 'hsl(217, 91%, 60%)', 'hsl(47, 96%, 53%)', 'hsl(271, 91%, 65%)', 'hsl(349, 89%, 60%)'];

export default function InvestorBreakdown({ companyId }) {
  const { data: investors = [] } = useQuery({
    queryKey: ['investors', companyId],
    queryFn: () => companyId
      ? api.entities.Investor.filter({ company_id: companyId })
      : api.entities.Investor.list(),
    initialData: [],
  });

  const chartData = investors
    .filter(inv => inv.equity_percentage > 0)
    .map(inv => ({ name: inv.name, value: inv.equity_percentage }));

  if (chartData.length === 0) {
    chartData.push({ name: 'No data', value: 100 });
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-sm mb-4">Ownership Split</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val) => `${val}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 mt-2">
        {investors.map((inv, i) => (
          <div key={inv.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-muted-foreground">{inv.name}</span>
            </div>
            <span className="font-semibold">{inv.equity_percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}