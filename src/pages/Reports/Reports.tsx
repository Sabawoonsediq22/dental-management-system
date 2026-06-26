import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, LoadingSpinner } from "../../components/ui";
import { useReportSummary } from "../../hooks/useReports";
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
import { CurrencyIcon, PatientIcon, ToothIcon, CalendarIcon } from "../../shared/icons/icons";

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

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { data: summary, isLoading, error } = useReportSummary();

  if (isLoading) {
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

  const reportData = [
    {
      name: t("reports.months.jan", "Jan"),
      revenue: summary?.revenue_this_month ? summary.revenue_this_month / 12 : 0,
      visits: (summary?.total_visits_this_month || 0) / 12,
    },
  ];

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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#005eb8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#005eb8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => formatAFN(val)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                      backgroundColor: "var(--tooltip-bg, #ffffff)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#005eb8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name={t("reports.charts.revenue", "Revenue")}
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                      backgroundColor: "#ffffff",
                    }}
                  />
                  <Bar dataKey="value" name={t("reports.charts.count", "Count")} radius={[4, 4, 0, 0]}>
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
          <CardTitle className="text-base sm:text-lg font-semibold">
            {t("reports.export.title", "Export Reports")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
              onClick={() => console.log("Export patients report")}
            >
              <PatientIcon size="md" className="mb-3 text-primary" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t("reports.export.patients", "Patient Report")}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("reports.export.patientsDesc", "Export patient records and statistics")}
              </span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
              onClick={() => console.log("Export financial report")}
            >
              <CurrencyIcon size="md" className="mb-3 text-primary" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t("reports.export.financial", "Financial Report")}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("reports.export.financialDesc", "Export invoices and payment history")}
              </span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
              onClick={() => console.log("Export treatment report")}
            >
              <ToothIcon size="md" className="mb-3 text-primary" />
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