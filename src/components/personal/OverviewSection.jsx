import React, { useMemo } from "react";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  BarChart2,
  Building2,
  Download,
} from "lucide-react";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import jsPDF from "jspdf";

export default function OverviewSection({
  currentUser,
  companies,
  allInvoices,
  allExpenses,
}) {
  // ✅ TOTAL (no filters)
  const totalRevenue = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);

  const totalExpensesAmt = allExpenses
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + (e.amount || 0), 0);

  const netProfit = totalRevenue - totalExpensesAmt;

  const profitMargin =
    totalRevenue > 0
      ? ((netProfit / totalRevenue) * 100).toFixed(1)
      : 0;

  const pendingRevenue = allInvoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);

  // 📊 Chart (last 6 months)
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const rev = allInvoices
        .filter(
          (inv) =>
            inv.status === "paid" &&
            isWithinInterval(new Date(inv.created_date), {
              start,
              end,
            })
        )
        .reduce(
          (s, i) => s + (i.total_amount || i.amount || 0),
          0
        );

      const exp = allExpenses
        .filter(
          (exp) =>
            exp.status === "approved" &&
            isWithinInterval(new Date(exp.created_date), {
              start,
              end,
            })
        )
        .reduce((s, e) => s + (e.amount || 0), 0);

      return {
        month: format(date, "MMM"),
        Revenue: rev,
        Expenses: exp,
      };
    });
  }, [allInvoices, allExpenses]);

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Financial Report", 20, 20);

    const rows = [
      ["Total Revenue", `$${totalRevenue.toLocaleString()}`],
      [
        "Total Expenses",
        `$${totalExpensesAmt.toLocaleString()}`,
      ],
      [
        "Net Profit",
        `$${netProfit.toLocaleString()}`,
      ],
      ["Profit Margin", `${profitMargin}%`],
      [
        "Pending Revenue",
        `$${pendingRevenue.toLocaleString()}`,
      ],
    ];

    let y = 40;
    rows.forEach(([k, v]) => {
      doc.text(`${k}: ${v}`, 20, y);
      y += 10;
    });

    doc.save("financial-report.pdf");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
         Overview 
        </h1>
      </div>

      {/* Export */}
      <button
        onClick={handleExportPDF}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border"
      >
        <Download size={14} /> Export PDF
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<DollarSign />}
          label="Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
        />
        <StatCard
          icon={<TrendingDown />}
          label="Expenses"
          value={`$${totalExpensesAmt.toLocaleString()}`}
        />
        <StatCard
          icon={<TrendingUp />}
          label="Profit"
          value={`$${netProfit.toLocaleString()}`}
        />
        <StatCard
          icon={<BarChart2 />}
          label="Margin"
          value={`${profitMargin}%`}
        />
      </div>

      {/* Chart */}
      <div className="border rounded-xl p-5">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              dataKey="Revenue"
              stroke="#22c55e"
              fill="#22c55e33"
            />
            <Area
              dataKey="Expenses"
              stroke="#ef4444"
              fill="#ef444433"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Companies */}
      <div className="border rounded-xl p-4">
        <h2 className="font-semibold mb-3">
          Companies
        </h2>

        {companies.map((c) => {
          const rev = allInvoices
            .filter(
              (i) =>
                i.status === "paid" &&
                i.company_id === c.id
            )
            .reduce(
              (s, i) =>
                s + (i.total_amount || i.amount || 0),
              0
            );

          const exp = allExpenses
            .filter(
              (e) =>
                e.status === "approved" &&
                e.company_id === c.id
            )
            .reduce((s, e) => s + (e.amount || 0), 0);

          return (
            <div
              key={c.id}
              className="flex justify-between py-2"
            >
              <span>{c.name}</span>
              <span>
                ${ (rev - exp).toLocaleString() }
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-bold mt-2">
        {value}
      </p>
    </div>
  );
}