import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingDown, TrendingUp, BarChart2, Filter, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { subMonths, subQuarters, subYears, isAfter, parseISO, startOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DATE_FILTERS = [
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom', value: 'custom' },
];

function getDateFrom(filter) {
  const now = new Date();
  if (filter === 'month') return subMonths(now, 1);
  if (filter === 'quarter') return subMonths(now, 3);
  if (filter === 'year') return subYears(now, 1);
  return null;
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.bg}`}>
          <Icon className={`w-4 h-4 ${color.text}`} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color.text}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function FinancialSection({ companies, allInvoices, allExpenses }) {
  const [dateFilter, setDateFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const filteredInvoices = useMemo(() => {
    let inv = allInvoices.filter(i => i.status === 'paid');
    if (companyFilter !== 'all') inv = inv.filter(i => i.company_id === companyFilter);
    const from = dateFilter === 'custom' ? (customFrom ? startOfDay(new Date(customFrom)) : null) : getDateFrom(dateFilter);
    const to = dateFilter === 'custom' && customTo ? startOfDay(new Date(customTo)) : null;
    if (from) inv = inv.filter(i => i.due_date && isAfter(parseISO(i.due_date), from));
    if (to) inv = inv.filter(i => i.due_date && !isAfter(parseISO(i.due_date), to));
    return inv;
  }, [allInvoices, companyFilter, dateFilter, customFrom, customTo]);

  const filteredExpenses = useMemo(() => {
    let exp = allExpenses.filter(e => e.status === 'approved');
    if (companyFilter !== 'all') exp = exp.filter(e => e.company_id === companyFilter);
    const from = dateFilter === 'custom' ? (customFrom ? startOfDay(new Date(customFrom)) : null) : getDateFrom(dateFilter);
    const to = dateFilter === 'custom' && customTo ? startOfDay(new Date(customTo)) : null;
    if (from) exp = exp.filter(e => e.date && isAfter(parseISO(e.date), from));
    if (to) exp = exp.filter(e => e.date && !isAfter(parseISO(e.date), to));
    return exp;
  }, [allExpenses, companyFilter, dateFilter, customFrom, customTo]);

  const totalRevenue = filteredInvoices.reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Per-company breakdown
  const companyBreakdown = useMemo(() => {
    return companies.map(c => {
      const rev = allInvoices.filter(i => i.status === 'paid' && i.company_id === c.id).reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
      const exp = allExpenses.filter(e => e.status === 'approved' && e.company_id === c.id).reduce((s, e) => s + (e.amount || 0), 0);
      return { name: c.name, Revenue: rev, Expenses: exp, Profit: rev - exp };
    });
  }, [companies, allInvoices, allExpenses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Financial Overview</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1 flex-wrap">
          {DATE_FILTERS.map(f => (
            <Button
              key={f.value}
              size="sm"
              variant={dateFilter === f.value ? 'default' : 'outline'}
              className="h-7 text-xs px-3"
              onClick={() => setDateFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="h-7 w-44 text-xs">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Custom date range */}
      {dateFilter === 'custom' && (
        <div className="flex gap-3 items-center">
          <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="w-40 h-8 text-xs" />
          <span className="text-muted-foreground text-xs">to</span>
          <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="w-40 h-8 text-xs" />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`}
          color={{ bg: 'bg-green-100', text: 'text-green-600' }} sub={`${filteredInvoices.length} paid invoices`} />
        <StatCard icon={TrendingDown} label="Total Expenses" value={`$${totalExpenses.toLocaleString()}`}
          color={{ bg: 'bg-red-100', text: 'text-red-500' }} sub={`${filteredExpenses.length} approved`} />
        <StatCard icon={TrendingUp} label="Net Profit" value={`${netProfit < 0 ? '-' : ''}$${Math.abs(netProfit).toLocaleString()}`}
          color={{ bg: netProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100', text: netProfit >= 0 ? 'text-emerald-600' : 'text-red-500' }} sub="Revenue − Expenses" />
        <StatCard icon={BarChart2} label="Profit Margin" value={`${profitMargin}%`}
          color={{ bg: 'bg-blue-100', text: 'text-blue-600' }} sub="Overall margin" />
      </div>

      {/* Per company chart */}
      {companies.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Company-wise Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={companyBreakdown} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `$${v.toLocaleString()}`} />
              <Bar dataKey="Revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Company table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Company Summary</h3>
        </div>
        <div className="divide-y divide-border">
          {companies.map(c => {
            const row = companyBreakdown.find(r => r.name === c.name) || { Revenue: 0, Expenses: 0, Profit: 0 };
            return (
              <div key={c.id} className="px-5 py-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.industry || 'No industry'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600 font-medium">${row.Revenue.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">revenue</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-red-500 font-medium">${row.Expenses.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">expenses</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${row.Profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {row.Profit < 0 ? '-' : ''}${Math.abs(row.Profit).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">profit</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}