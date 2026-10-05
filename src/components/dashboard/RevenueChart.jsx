import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', revenue: 18000, expenses: 12000 },
  { month: 'Feb', revenue: 22000, expenses: 14000 },
  { month: 'Mar', revenue: 28000, expenses: 13000 },
  { month: 'Apr', revenue: 24000, expenses: 16000 },
  { month: 'May', revenue: 32000, expenses: 15000 },
  { month: 'Jun', revenue: 38000, expenses: 18000 },
  { month: 'Jul', revenue: 35000, expenses: 17000 },
  { month: 'Aug', revenue: 42000, expenses: 19000 },
  { month: 'Sep', revenue: 45000, expenses: 20000 },
  { month: 'Oct', revenue: 48000, expenses: 22000 },
  { month: 'Nov', revenue: 52000, expenses: 21000 },
  { month: 'Dec', revenue: 58000, expenses: 24000 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: ${entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function RevenueChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-sm">Revenue vs Expenses</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 12 months overview</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(160, 84%, 39%)" fill="url(#revGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="hsl(217, 91%, 60%)" fill="url(#expGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}