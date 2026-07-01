import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, LoadingSpinner } from "../../components/ui";
import { useReportSummary, useMonthlyRevenue } from "../../hooks/useReports";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { CurrencyIcon, PatientIcon, ToothIcon, CalendarIcon, DownloadIcon, FileIcon } from "../../shared/icons/icons";
import type { MonthlyRevenuePoint } from "../../types/ApiTypes";
import { exportPatientsReport, exportFinancialReport, exportTreatmentReport } from "../../lib/export";
import type { ReportFormat } from "../../lib/export";
import { toast } from "../../lib/toast-utils";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: {
    value: string;
    positive?: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {change && (
          <p className={`mt-1 text-xs font-medium ${change.positive ? "text-green-600" : "text-gray-500"}`}>
            {change.value}
          </p>
        )}
      </div>
      <div className="rounded-lg bg-blue-50 p-2 sm:p-3 text-primary dark:bg-blue-900/30">
        {icon}
      </div>
    </div>
  </div>
);

const formatAFN = (val: number) =>
  val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " AFN";

const formatMonth = (monthStr: string) => {
  const [, m] = monthStr.split("-");
  return MONTH_NAMES[parseInt(m, 10) - 1] || monthStr;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}

const RevenueTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
        {formatAFN(payload[0].value)}
      </p>
    </div>
  );
};

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { data: summary, isLoading, error } = useReportSummary();
  const { data: monthlyRevenue, isLoading: revenueLoading } = useMonthlyRevenue();
  const [exporting, setExporting] = useState<string | null>(null);
  const [format, setFormat] = useState<ReportFormat>("pdf");

  if (isLoading || revenueLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" text={t("reports.loading", "Loading reports...")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-red-500">
          {t("reports.error", "Error loading reports")}: {String(error)}
        </div>
      </div>
    );
  }

  const chartData: (MonthlyRevenuePoint & { monthLabel: string })[] =
    monthlyRevenue && monthlyRevenue.length > 0
      ? monthlyRevenue.map((p) => ({ ...p, monthLabel: formatMonth(p.month) }))
      : summary
        ? [
            {
              month: new Date().toISOString().slice(0, 7),
              revenue: summary.revenue_this_month,
              monthLabel: formatMonth(new Date().toISOString().slice(0, 7)),
            },
          ]
        : [];

  const handleExport = async (type: string, fn: (format: ReportFormat) => Promise<void>) => {
    setExporting(type);
    try {
      await fn(format);
      toast.success({ title: t("reports.export.success", "Report exported successfully") });
    } catch (err) {
      toast.error({ title: t("reports.export.error", "Failed to export report"), description: String(err) });
    } finally {
      setExporting(null);
    }
  };

  const visitStatusData = summary
    ? [
        {
          name: t("reports.status.completed", "Completed"),
          value: summary.completed_visits_this_month,
          fill: "#22c55e",
        },
        {
          name: t("reports.status.cancelled", "Cancelled"),
          value: summary.cancelled_visits_this_month,
          fill: "#ef4444",
        },
        {
          name: t("reports.status.active", "Active"),
          value: Math.max(0, (summary.total_visits_this_month || 0) - summary.completed_visits_this_month - summary.cancelled_visits_this_month),
          fill: "#3b82f6",
        },
      ]
    : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
          {t("reports.subtitle", "CLINIC ANALYTICS")}
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {t("reports.title", "Reports")}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard
          title={t("reports.stats.activePatients", "Active Patients")}
          value={String(summary?.active_patients ?? 0)}
          icon={<PatientIcon size="md" />}
          change={{ value: t("reports.trend.monthly", "This month") }}
        />
        <StatCard
          title={t("reports.stats.totalVisits", "Total Visits")}
          value={String(summary?.total_visits_this_month ?? 0)}
          icon={<CalendarIcon size="md" />}
          change={{ value: t("reports.trend.monthly", "This month") }}
        />
        <StatCard
          title={t("reports.stats.revenue", "Revenue")}
          value={formatAFN(summary?.revenue_this_month ?? 0)}
          icon={<CurrencyIcon size="md" />}
          change={{ value: t("reports.trend.monthly", "This month") }}
        />
        <StatCard
          title={t("reports.stats.outstanding", "Outstanding")}
          value={formatAFN(summary?.outstanding_balance ?? 0)}
          icon={<CurrencyIcon size="md" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              {t("reports.charts.revenueTrend", "Revenue Trend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
                      <stop offset="50%" stopColor="#0d9488" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                    className="dark:stroke-gray-700"
                  />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)}
                    width={40}
                  />
                  <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "#0d9488", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name={t("reports.charts.revenue", "Revenue")}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#0d9488",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              {t("reports.charts.visitDistribution", "Visit Distribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={visitStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} className="dark:stroke-gray-700" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                      backgroundColor: "#ffffff",
                    }}
                    cursor={{ fill: "#f9fafb" }}
                  />
                  <Bar dataKey="value" name={t("reports.charts.count", "Count")} radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {visitStatusData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg font-semibold">
              {t("reports.export.title", "Export Reports")}
            </CardTitle>
            <div className="flex items-center gap-2 self-start">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("reports.export.format", "Format:")}
              </span>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setFormat("pdf")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                    format === "pdf"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <FileIcon size="sm" />
                  PDF
                </button>
                <button
                  onClick={() => setFormat("csv")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                    format === "csv"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <FileIcon size="sm" />
                  CSV
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed "
              onClick={() => handleExport("patients", exportPatientsReport)}
              disabled={exporting !== null}
            >
              {exporting === "patients" ? (
                <LoadingSpinner size="md" />
              ) : (
                <PatientIcon size="md" className="mb-3 text-primary" />
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t("reports.export.patients", "Patient Report")}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("reports.export.patientsDesc", "Export patient records and statistics")}
              </span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleExport("financial", exportFinancialReport)}
              disabled={exporting !== null}
            >
              {exporting === "financial" ? (
                <LoadingSpinner size="md" />
              ) : (
                <DownloadIcon size="md" className="mb-3 text-primary" />
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t("reports.export.financial", "Financial Report")}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("reports.export.financialDesc", "Export invoices and payment history")}
              </span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleExport("treatment", exportTreatmentReport)}
              disabled={exporting !== null}
            >
              {exporting === "treatment" ? (
                <LoadingSpinner size="md" />
              ) : (
                <ToothIcon size="md" className="mb-3 text-primary" />
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t("reports.export.treatment", "Treatment Report")}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("reports.export.treatmentDesc", "Export treatment history and procedures")}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;