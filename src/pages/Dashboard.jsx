import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/apiClient";
import {
  ChevronRight,
  TrendingUp,
  Download,
  CircleDollarSign,
  Receipt,
  Clock3,
  FileText,
} from "lucide-react";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";
import { formatCurrency } from "@/lib/currency";
import jsPDF from "jspdf";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CustomBarTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value, currency)}
        </p>
      ))}
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value, currency)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { activeCompany } = useOutletContext();
  const navigate = useNavigate();
  const companyId = activeCompany?.id;
  const currency = activeCompany?.currency || "USD";

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ["expenses", companyId],
    queryFn: () =>
      companyId ? api.entities.Expense.filter({ company_id: companyId }) : [],
    initialData: [],
  });

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["invoices", companyId],
    queryFn: () =>
      companyId ? api.entities.Invoice.filter({ company_id: companyId }) : [],
    initialData: [],
  });

  const isLoading = expLoading || invLoading;

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const outstandingInvoices = invoices.filter(
    (invoice) => !["paid", "draft", "archived"].includes(invoice.status),
  );
  const outstandingTotal = outstandingInvoices.reduce(
    (sum, invoice) => sum + (invoice.total_amount || invoice.amount || 0),
    0,
  );

  const now = new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const monthlyData = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
    const month = date.toLocaleString(language === "ar" ? "ar" : "en", {
      month: "short",
    });
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const rev = invoices
      .filter(
        (invoice) =>
          invoice.status === "paid" &&
          invoice.due_date &&
          `${new Date(invoice.due_date).getFullYear()}-${new Date(invoice.due_date).getMonth()}` === monthKey,
      )
      .reduce((sum, invoice) => sum + (invoice.total_amount || invoice.amount || 0), 0);
    const exp = expenses
      .filter((expense) => {
        if (!expense.date) return false;
        const expenseDate = new Date(expense.date);
        return `${expenseDate.getFullYear()}-${expenseDate.getMonth()}` === monthKey;
      })
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);
    return { month, revenue: rev, expenses: exp, profit: rev - exp };
  });
  const currentMonthProfit = monthlyData[monthlyData.length - 1]?.profit || 0;

  const today = new Date().toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const currentYear = new Date().getFullYear();
  const [downloading, setDownloading] = useState(false);

  const downloadFinancialStatement = () => {
    setDownloading(true);
    const doc = new jsPDF();
    const companyName = activeCompany?.name || "Company";
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageW, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(companyName, 14, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Financial Statement — ${currentYear}`, 14, 28);
    doc.text(`Generated: ${today}`, pageW - 14, 28, { align: "right" });

    // Summary section
    let y = 52;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", 14, y);
    y += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    const yearExpenses = expenses
      .filter((e) => e.date && new Date(e.date).getFullYear() === currentYear)
      .reduce((s, e) => s + (e.amount || 0), 0);
    const yearRevenue = invoices
      .filter(
        (i) =>
          i.status === "paid" &&
          i.due_date &&
          new Date(i.due_date).getFullYear() === currentYear,
      )
      .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
    const yearProfit = yearRevenue - yearExpenses;

    const summaryRows = [
      ["Total Revenue", formatCurrency(yearRevenue, currency)],
      [t("dashboard.totalExpenses"), formatCurrency(yearExpenses, currency)],
      ["Net Profit / Loss", formatCurrency(yearProfit, currency)],
    ];

    summaryRows.forEach(([label, value], i) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(label, 14, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(yearProfit < 0 && label.includes("Net") ? 200 : 0, 0, 0);
      doc.text(value, pageW - 14, y, { align: "right" });
      if (i < summaryRows.length - 1) {
        doc.setDrawColor(230, 230, 230);
        doc.line(14, y + 3, pageW - 14, y + 3);
      }
      y += 12;
    });

    // Monthly breakdown
    y += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Monthly Breakdown", 14, y);
    y += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageW - 14, y);
    y += 7;

    // Table header
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Month", 14, y);
    doc.text("Revenue", 85, y, { align: "right" });
    doc.text("Expenses", 140, y, { align: "right" });
    doc.text("Profit", pageW - 14, y, { align: "right" });
    y += 6;

    MONTHS.forEach((month, idx) => {
      const rev = invoices
        .filter(
          (i) =>
            i.status === "paid" &&
            i.due_date &&
            new Date(i.due_date).getMonth() === idx &&
            new Date(i.due_date).getFullYear() === currentYear,
        )
        .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
      const exp = expenses
        .filter(
          (e) =>
            e.date &&
            new Date(e.date).getMonth() === idx &&
            new Date(e.date).getFullYear() === currentYear,
        )
        .reduce((s, e) => s + (e.amount || 0), 0);
      const profit = rev - exp;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.text(month, 14, y);
      doc.text(formatCurrency(rev, currency), 85, y, { align: "right" });
      doc.text(formatCurrency(exp, currency), 140, y, { align: "right" });
      doc.setTextColor(
        profit >= 0 ? 30 : 200,
        profit >= 0 ? 130 : 0,
        profit >= 0 ? 60 : 0,
      );
      doc.text(formatCurrency(profit, currency), pageW - 14, y, {
        align: "right",
      });
      doc.setDrawColor(240, 240, 240);
      doc.line(14, y + 2, pageW - 14, y + 2);
      y += 8;
    });

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(
      `${companyName} · Confidential Financial Statement · ${currentYear}`,
      pageW / 2,
      290,
      { align: "center" },
    );

    doc.save(`${companyName}_Financial_Statement_${currentYear}.pdf`);
    setDownloading(false);
  };

  const metricCards = [
    {
      label: t("dashboard.totalRevenue"),
      value: formatCurrency(totalRevenue, currency),
      detail: `${paidInvoices.length} ${t("dashboard.paidInvoices")}`,
      icon: CircleDollarSign,
      tone: "blue",
    },
    {
      label: t("dashboard.totalExpenses"),
      value: formatCurrency(totalExpenses, currency),
      detail: `${expenses.length} ${t("dashboard.recordedExpenses")}`,
      icon: Receipt,
      tone: "amber",
    },
    {
      label: t("dashboard.netProfit"),
      value: formatCurrency(netProfit, currency),
      detail: t("dashboard.revenueMinusExpenses"),
      icon: TrendingUp,
      tone: netProfit >= 0 ? "green" : "red",
    },
    {
      label: t("dashboard.outstanding"),
      value: formatCurrency(outstandingTotal, currency),
      detail: `${outstandingInvoices.length} ${t("dashboard.openInvoices")}`,
      icon: Clock3,
      tone: "violet",
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
      <section className="panel-hero relative overflow-hidden rounded-[28px] px-6 py-7 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-20 -top-36 h-80 w-80 rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute -right-8 -top-24 h-56 w-56 rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 bg-[radial-gradient(circle_at_center,rgba(91,122,212,0.24),transparent_68%)]" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
              {t("dashboard.executiveOverview")}
            </div>
            <h1 className="font-display text-3xl font-normal tracking-tight text-white sm:text-[42px]">
              {activeCompany?.name || "Ranvola"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
              {t("dashboard.clearView")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
              {new Date().toLocaleDateString(language === "ar" ? "ar" : "en", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <Button
              onClick={downloadFinancialStatement}
              disabled={downloading || !activeCompany}
              size="lg"
              className="h-11 gap-2 rounded-xl border border-white/15 bg-white text-xs font-semibold text-slate-900 shadow-lg shadow-black/10 hover:bg-white/90"
            >
              <Download className="h-4 w-4" />
              {downloading
                ? t("dashboard.generating")
                : `${t("dashboard.downloadStatement")} ${currentYear}`}
            </Button>
          </div>
        </div>
      </section>

      <section aria-label={t("dashboard.financialSummary")} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          const toneClasses = {
            blue: "bg-blue-500/10 text-blue-600 dark:text-blue-300 ring-blue-500/10",
            amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-amber-500/10",
            green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-emerald-500/10",
            red: "bg-rose-500/10 text-rose-600 dark:text-rose-300 ring-rose-500/10",
            violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-violet-500/10",
          };
          return (
            <div
              key={metric.label}
              className="card-surface group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-float)]"
            >
              <div className="mb-6 flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {metric.label}
                </p>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${toneClasses[metric.tone]}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
              </div>
              <p className="truncate text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
                {metric.value}
              </p>
              <p className="mt-2 truncate text-xs text-muted-foreground">
                {metric.detail}
              </p>
              <div className="pointer-events-none absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-primary/[0.035] transition-transform duration-500 group-hover:scale-125" />
            </div>
          );
        })}
      </section>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Bar Chart - Total Revenue */}
        <div className="card-surface rounded-2xl p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow mb-1">{t("dashboard.performance")}</p>
              <h3 className="text-base font-semibold">{t("dashboard.revenueAndExpenses")}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("dashboard.last12Months")}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {t("dashboard.revenue")}
              </span>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                {t("dashboard.totalExpenses")}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barCategoryGap="30%" barGap={3} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="4 8" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                content={<CustomBarTooltip currency={currency} />}
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
              />
              <Bar
                dataKey="revenue"
                name={t("dashboard.revenue")}
                fill="hsl(var(--primary))"
                radius={[5, 5, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name={t("dashboard.totalExpenses")}
                fill="hsl(var(--muted-foreground) / 0.28)"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-surface rounded-2xl p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-1">{t("dashboard.trend")}</p>
              <h3 className="text-base font-semibold">{t("dashboard.monthlyProfit")}</h3>
              <div className="mt-2 flex items-center gap-2">
                <p className={`text-2xl font-semibold tracking-tight ${currentMonthProfit < 0 ? "text-destructive" : "text-foreground"}`}>
                  {formatCurrency(currentMonthProfit, currency)}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.thisMonth")}</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <TrendingUp className="h-[18px] w-[18px]" />
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="4 8" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomLineTooltip currency={currency} />} />
              <Line
                type="monotone"
                dataKey="profit"
                name={t("dashboard.netProfit")}
                stroke={currentMonthProfit < 0 ? "hsl(var(--destructive))" : "hsl(152, 58%, 42%)"}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-surface overflow-hidden rounded-2xl p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">{t("dashboard.activity")}</p>
            <h3 className="text-base font-semibold">{t("dashboard.recentInvoices")}</h3>
          </div>
          <button
            onClick={() => navigate("/invoices")}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t("dashboard.seeAll")} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {isLoading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FileText className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">{t("dashboard.noInvoices")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.invoicesWillAppear")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border/70 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="pb-3 text-left font-semibold">{t("dashboard.invoice")}</th>
                  <th className="hidden pb-3 text-left font-semibold sm:table-cell">
                    {t("dashboard.recipient")}
                  </th>
                  <th className="pb-3 text-right font-semibold">{t("dashboard.amount")}</th>
                  <th className="pb-3 text-right font-semibold">{t("dashboard.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invoices.slice(0, 5).map((inv) => (
                  <tr
                    key={inv.id}
                    className="text-sm transition-colors hover:bg-muted/40"
                  >
                    <td className="py-3.5 font-medium">{inv.title}</td>
                    <td className="hidden py-3.5 text-muted-foreground sm:table-cell">
                      {inv.recipient_name || "—"}
                    </td>
                    <td className="py-3.5 text-right font-semibold tabular-nums">
                      {formatCurrency(inv.total_amount || inv.amount || 0, inv.currency || currency)}
                    </td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
                          inv.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : inv.status === "overdue"
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
