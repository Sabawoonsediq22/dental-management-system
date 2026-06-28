import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/Badge";
import {
  CurrencyIcon,
  PatientIcon,
  ClockIcon,
  ToothIcon,
  PlusIcon,
  ActivityIcon,
} from "../../shared/icons/icons";
import { useUpdateVisitStatus } from "../../hooks/useVisits";
import { useDashboardStats, usePatientsFlow, useProcedureDistribution, useRecentPatients } from "../../hooks/useDashboard";
import StatCard from "../../components/dashboard/StatCard";
import ChartCard from "../../components/dashboard/ChartCard";
import RecentPatientsTable from "../../components/dashboard/RecentPatientsTable";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ProcedureDistribution } from "../../types/ApiTypes";
import { toast } from "../../lib/toast-utils";
import { format } from "date-fns";

const COLORS = [
  "#006A71", "#005E8A", "#F2C12E", "#9B5DE5", "#00C49A",
  "#FF6B6B", "#FF8C42", "#4ECDC4", "#6C5CE7", "#A8E6CF",
  "#FFD93D", "#FF6B6B", "#95E1D3", "#F38181", "#AA96DA",
  "#FCBAD3", "#A1C4FD", "#C2E9FB", "#D4A5A5", "#9ED2C6",
  "#FFB7B2", "#B5EAD7",
];

const AUTO_REFRESH_INTERVAL = 300000;

const formatAFN = (val: number) =>
  val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " AFN";

const computeTrend = (
  today: number,
  yesterday: number,
): { value: string; positive: boolean } | undefined => {
  if (yesterday <= 0) return undefined;
  const rawPct = ((today - yesterday) / yesterday) * 100;
  const clamped = Math.max(-100, Math.min(100, rawPct));
  const sign = clamped >= 0 ? "+" : "";
  return { value: `${sign}${clamped.toFixed(1)}% vs yesterday`, positive: clamped >= 0 };
};

interface StatCardDef {
  title: string;
  icon: React.ReactNode;
  loading?: boolean;
  value?: string;
  secondary?: string;
  badge?: React.ReactNode;
  trend?: { value: string; positive: boolean };
}

const FLOW_MODES = ["daily", "weekly"] as const;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [flowMode, setFlowMode] = useState<"daily" | "weekly">("weekly");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { data: stats, isLoading: statsLoading, isError: statsError } =
    useDashboardStats();
  const { data: flowData } = usePatientsFlow(flowMode);
  const { data: procData } = useProcedureDistribution();
  const { data: recentPatients, refetch: refetchRecentPatients } =
    useRecentPatients(4);
  const updateStatusMutation = useUpdateVisitStatus();

  const handleUpdateStatus = useCallback(
    async (visitId: string, newStatus: string) => {
      await updateStatusMutation.mutateAsync({
        id: visitId,
        status: newStatus as "Open" | "Completed" | "Cancelled",
      });
      toast.success({ title: t("dashboard.notifications.statusUpdated", "Status updated to {{status}}", { status: newStatus }) });
    },
    [updateStatusMutation],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const statCards: StatCardDef[] = React.useMemo(() => {
    if (statsLoading) {
      return [
        { title: t("dashboard.stats.dailyRevenue", "Daily Revenue"), icon: <CurrencyIcon size="lg" />, loading: true },
        { title: t("dashboard.stats.patientsToday", "Patients Today"), icon: <PatientIcon size="lg" />, loading: true },
        { title: t("dashboard.stats.outstandingBalance", "Outstanding Balance"), icon: <ClockIcon size="lg" />, loading: true },
        { title: t("dashboard.stats.proceduresPerformed", "Procedures Performed"), icon: <ToothIcon size="lg" />, loading: true },
      ];
    }

    if (statsError || !stats) {
      return [
        { title: t("dashboard.stats.dailyRevenue", "Daily Revenue"), value: "0", icon: <CurrencyIcon size="lg" /> },
        { title: t("dashboard.stats.patientsToday", "Patients Today"), value: "0", icon: <PatientIcon size="lg" /> },
        { title: t("dashboard.stats.outstandingBalance", "Outstanding Balance"), value: `0 ${t("billing.currency", "AFN")}`, secondary: `0 ${t("dashboard.invoices", "invoices")}`, icon: <ClockIcon size="lg" /> },
        { title: t("dashboard.stats.proceduresPerformed", "Procedures Performed"), value: "00", icon: <ToothIcon size="lg" /> },
      ];
    }

    const balance = stats.outstanding_balance;
    const outstandingBadge =
      balance === 0
        ? <Badge variant="success" className="text-[10px] sm:text-xs font-bold px-2 py-0.5">{t("dashboard.clear", "Clear")}</Badge>
        : balance < 10000
          ? <Badge variant="info" className="text-[10px] sm:text-xs font-bold px-2 py-0.5">{t("dashboard.low", "Low")}</Badge>
          : balance < 50000
            ? <Badge variant="warning" className="text-[10px] sm:text-xs font-bold px-2 py-0.5">{t("dashboard.medium", "Medium")}</Badge>
            : <Badge variant="destructive" className="text-[10px] sm:text-xs font-bold px-2 py-0.5">{t("dashboard.high", "High")}</Badge>;

    return [
      { title: t("dashboard.stats.dailyRevenue", "Daily Revenue"), value: formatAFN(stats.daily_revenue), icon: <CurrencyIcon size="lg" />, trend: computeTrend(stats.daily_revenue, stats.yesterday_revenue) },
      { title: t("dashboard.stats.patientsToday", "Patients Today"), value: String(stats.patients_today), icon: <PatientIcon size="lg" />, trend: computeTrend(stats.patients_today, stats.yesterday_patients) },
      { title: t("dashboard.stats.outstandingBalance", "Outstanding Balance"), value: formatAFN(stats.outstanding_balance), secondary: t("dashboard.invoiceCount", { count: stats.outstanding_invoices_count }), icon: <ClockIcon size="lg" />, badge: outstandingBadge },
      { title: t("dashboard.stats.proceduresPerformed", "Procedures Performed"), value: String(stats.procedures_performed).padStart(2, "0"), icon: <ToothIcon size="lg" />, trend: computeTrend(stats.procedures_performed, stats.yesterday_procedures) },
    ];
  }, [stats, statsLoading, statsError, t]);



  return (
    <div className="space-y-4 sm:space-y-6 xl:space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-0.5">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-teal-600 dark:text-teal-400">
            {t("dashboard.welcome", "WELCOME BACK")}
          </p>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t("dashboard.title", "Clinic Dashboard")}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {t("dashboard.lastUpdated", "Last updated")}: {format(lastUpdated, "HH:mm:ss")}
            </span>
            <div
              className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
              title={t("dashboard.realTimeSync", "Real-time sync")}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full xl:w-auto">
          <Button
            onClick={() => navigate("/patients/new")}
            className="gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full xl:w-auto"
          >
            <PlusIcon size="md" />
            <span>{t("nav.newPatient", "Add New Patient")}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value ?? ""}
            icon={stat.icon}
            badge={stat.badge}
            trend={stat.trend}
            loading={stat.loading ?? false}
            secondary={stat.secondary}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <ChartCard
          title={t("dashboard.patientsFlow", "Patients Flow")}
          className="col-span-1 lg:col-span-7"
          icon={<ActivityIcon size="md" />}
          action={
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {FLOW_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFlowMode(mode)}
                  className={`px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    flowMode === mode
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {t(`dashboard.${mode}`, mode.charAt(0).toUpperCase() + mode.slice(1))}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-56 sm:h-64 lg:h-72 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={flowData ?? []} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                  className="dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
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
                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                    backgroundColor: "white",
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="check_ins"
                  stroke="#006A71"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#006A71", stroke: "#fff", strokeWidth: 2 }}
                  name={t("dashboard.checkIns", "Check-ins")}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#005E8A"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#005E8A", stroke: "#fff", strokeWidth: 2 }}
                  name={t("dashboard.completed", "Completed")}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title={t("dashboard.procedureDistribution", "Procedure Distribution")}
          icon={<ActivityIcon size="md" />}
          className="col-span-1 lg:col-span-5"
        >
          <div className="h-56 sm:h-64 lg:h-72 w-full">
            {procData && procData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={procData} margin={{ top: 20, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} className="dark:stroke-gray-700" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
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
                      boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                      backgroundColor: "white",
                      fontSize: 12,
                    }}
                    formatter={(value: unknown, name: unknown) => [value as number, name as string]}
                  />
                  <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                    animationDuration={600}
                    animationEasing="ease-out"
                    label={{ position: "top", fontSize: 11, fontWeight: 600, fill: "#374151" }}
                  >
                    {procData.map((_: ProcedureDistribution, i: number) => (
                      <Cell key={_.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-2">
                <span className="text-xs font-medium">{t("dashboard.noDataAvailable", "No data available")}</span>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      <RecentPatientsTable
        patients={recentPatients ?? []}
        onUpdateStatus={handleUpdateStatus}
        onRefetch={refetchRecentPatients}
      />

      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 px-1">
        <div className="flex items-center gap-3">
          <span>{t("dashboard.liveDataFromDb", "Live data from database")}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5">
          <ActivityIcon size="xs" />
          <span>{t("dashboard.autoRefresh", "Auto-refresh every 5 min")}</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
