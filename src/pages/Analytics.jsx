import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Percent, ArrowUpRight } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-xs font-semibold mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>{entry.name}: ${entry.value.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { activeCompany } = useOutletContext();
  const companyId = activeCompany?.id;

  const { data: investors = [] } = useQuery({
    queryKey: ['investors-analytics', companyId],
    queryFn: () => companyId ? api.entities.Investor.filter({ company_id: companyId }) : api.entities.Investor.list(),
    initialData: [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices-analytics', companyId],
    queryFn: () => companyId ? api.entities.Invoice.filter({ company_id: companyId }) : api.entities.Invoice.list(),
    initialData: [],
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-analytics', companyId],
    queryFn: () => companyId ? api.entities.Expense.filter({ company_id: companyId }) : api.entities.Expense.list(),
    initialData: [],
  });

  const totalInvested = investors.reduce((s, i) => s + (i.total_invested || 0), 0);
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
  const roi = totalInvested > 0 ? ((totalRevenue - totalInvested) / totalInvested * 100).toFixed(1) : 0;

  const monthlyData = MONTHS.map((month, idx) => {
    const revenue = invoices
      .filter(i => i.status === 'paid' && i.due_date && new Date(i.due_date).getMonth() === idx)
      .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
    const exp = expenses
      .filter(e => e.date && new Date(e.date).getMonth() === idx)
      .reduce((s, e) => s + (e.amount || 0), 0);
    return { month, revenue, expenses: exp, profit: revenue - exp };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Financial insights and investor performance</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, change: null },
          { label: 'Total Invested', value: `$${totalInvested.toLocaleString()}`, icon: ArrowUpRight, change: null },
          { label: 'ROI', value: `${roi}%`, icon: TrendingUp, change: null },
          { label: 'Avg Equity', value: `${investors.length > 0 ? (investors.reduce((s, i) => s + (i.equity_percentage || 0), 0) / investors.length).toFixed(1) : 0}%`, icon: Percent },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
            {stat.change && <p className="text-xs text-primary mt-1">{stat.change} vs last quarter</p>}
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Monthly P&L</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Profit Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="profit" name="Net Profit" stroke="hsl(160, 84%, 39%)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Investor Performance */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4">Investor Performance</h3>
        {investors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Add investors to see performance data</p>
        ) : (
          <div className="space-y-4">
            {investors.map(inv => {
              const profit = totalRevenue * (inv.equity_percentage / 100);
              return (
                <div key={inv.id} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {inv.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{inv.name}</p>
                    <p className="text-xs text-muted-foreground">{inv.equity_percentage}% equity</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${profit.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Profit share</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${(inv.total_invested || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Invested</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}