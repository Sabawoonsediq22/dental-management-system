import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/Badge";
import {
  CurrencyIcon,
  PatientIcon,
  ClockIcon,
  ToothIcon,
  PlusIcon,
  TrendingUpIcon,
  ActivityIcon,
  PieChartIcon,
  ListIcon,
  ChevronRightIcon,
  CalendarIcon,
  UsersIcon,
} from "../../shared/icons/icons";
import PatientAvatar from "../../components/ui/PatientAvatar";
import {
  useDashboardStats,
  usePatientsFlow,
  useProcedureDistribution,
  useRecentPatients,
} from "../../hooks/useDashboard";
import { useUpdateVisitStatus } from "../../hooks/useVisits";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type {
  ProcedureDistribution,
  RecentPatient,
} from "../../types/ApiTypes";
import { toast } from "../../lib/toast-utils";
import { statusConfig } from "../../components/common/badgeStatusConfig";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import TreatmentStatusChangeModal from "../../components/patients/TreatmentStatusChangeModal";

const COLORS = [
  "#006A71",
  "#005E8A",
  "#F2C12E",
  "#9B5DE5",
  "#00C49A",
  "#FF6B6B",
];

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  loading?: boolean;
}> = ({ title, value, icon, badge, trend, loading }) => (
  <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-0 shadow-sm group">
    <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50" />
    <CardContent className="relative p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                ...
              </span>
            ) : (
              value
            )}
          </p>
          {trend && !loading && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUpIcon
                size="xs"
                className={`${trend.positive ? "text-green-500" : "text-red-500"}`}
              />
              <span
                className={`text-[10px] sm:text-xs font-semibold ${trend.positive ? "text-green-600" : "text-red-600"}`}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-2.5 sm:p-3 text-primary shadow-sm group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      {badge && <div className="mt-3 sm:mt-4">{badge}</div>}
    </CardContent>
  </Card>
);

const ChartCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, icon, children, action, className }) => (
  <div className={className}>
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <CardTitle className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {title}
            </CardTitle>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-5">{children}</CardContent>
    </Card>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [flowMode, setFlowMode] = useState<"daily" | "weekly">("weekly");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedPatientForStatus, setSelectedPatientForStatus] =
    useState<RecentPatient | null>(null);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: flowData } = usePatientsFlow(flowMode);
  const { data: procData } = useProcedureDistribution();
  const { data: recentPatients, refetch: refetchRecentPatients } =
    useRecentPatients(4);
  const updateStatusMutation = useUpdateVisitStatus();

  const formatAFN = (val: number) =>
    val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " AFN";

  const handleStatusSave = useCallback(
    async (newStatus: string) => {
      if (!selectedPatientForStatus?.visit_id) return;
      try {
        await updateStatusMutation.mutateAsync({
          id: selectedPatientForStatus.visit_id,
          status: newStatus as "Open" | "Completed" | "Cancelled",
        });
        toast.success(`Status updated to ${newStatus}`);
        refetchRecentPatients();
      } catch (error) {
        toast.error("Failed to update status");
      }
    },
    [selectedPatientForStatus, updateStatusMutation, refetchRecentPatients],
  );

  const openStatusModal = useCallback(
    (patient: RecentPatient, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedPatientForStatus(patient);
      setStatusModalOpen(true);
    },
    [],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: t("dashboard.stats.dailyRevenue", "Daily Revenue"),
      value: formatAFN(stats?.daily_revenue ?? 0),
      icon: <CurrencyIcon size="lg" />,
      trend: { value: "+12.5%", positive: true },
      badge: (
        <Badge
          variant="success"
          className="text-[10px] sm:text-xs font-bold px-2 py-0.5"
        >
          +12%
        </Badge>
      ),
    },
    {
      title: t("dashboard.stats.patientsToday", "Patients Today"),
      value: String(stats?.patients_today ?? 0),
      icon: <PatientIcon size="lg" />,
      trend: { value: "+3 from yesterday", positive: true },
      badge: (
        <Badge
          variant="info"
          className="text-[10px] sm:text-xs font-bold px-2 py-0.5"
        >
          Active
        </Badge>
      ),
    },
    {
      title: t("dashboard.stats.outstandingBalance", "Outstanding Balance"),
      value: formatAFN(stats?.outstanding_balance ?? 0),
      icon: <ClockIcon size="lg" />,
      trend: { value: "-2.1%", positive: true },
      badge: (
        <Badge
          variant="warning"
          className="text-[10px] sm:text-xs font-bold px-2 py-0.5"
        >
          {t("common.high", "High")}
        </Badge>
      ),
    },
    {
      title: t("dashboard.stats.proceduresPerformed", "Procedures Performed"),
      value: String(stats?.procedures_performed ?? 0).padStart(2, "0"),
      icon: <ToothIcon size="lg" />,
      badge: (
        <Badge
          variant="default"
          className="text-[10px] sm:text-xs font-bold px-2 py-0.5"
        >
          Today
        </Badge>
      ),
    },
  ];

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
              Last updated: {format(lastUpdated, "HH:mm:ss")}
            </span>
            <div
              className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
              title="Real-time sync"
            />
          </div>
        </div>
          <Button
            onClick={() => navigate("/patients/new")}
            className="gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full xl:w-auto"
          >
            <PlusIcon size="md" />
            <span>{t("nav.newPatient", "Add New Patient")}</span>
          </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            badge={stat.badge}
            trend={stat.trend}
            loading={statsLoading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <ChartCard
          title={t("dashboard.patientsFlow", "Patients Flow")}
          className="col-span-1 lg:col-span-7"
          icon={<ActivityIcon size="md" />}
          action={
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden col-span-8">
              <button
                onClick={() => setFlowMode("daily")}
                className={`px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  flowMode === "daily"
                    ? "bg-gradient-to-r from-[#006A71] to-[#005E8A] text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {t("dashboard.daily", "Daily")}
              </button>
              <button
                onClick={() => setFlowMode("weekly")}
                className={`px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  flowMode === "weekly"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {t("dashboard.weekly", "Weekly")}
              </button>
            </div>
          }
        >
          <div className="h-56 sm:h-64 lg:h-72 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flowData ?? []}>
                <defs>
                  <linearGradient
                    id="colorCheckIns"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#006A71" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#006A71" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorCompleted"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#005E8A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#005E8A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  className="dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  dx={-8}
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
                <Area
                  type="monotone"
                  dataKey="check_ins"
                  stroke="#006A71"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCheckIns)"
                  name="Check-ins"
                  activeDot={{
                    r: 6,
                    fill: "#006A71",
                    stroke: "white",
                    strokeWidth: 2,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#005E8A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                  activeDot={{
                    r: 6,
                    fill: "#005E8A",
                    stroke: "white",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title={t("dashboard.procedureDistribution", "Procedure Distribution")}
          icon={<PieChartIcon size="md" />}
          className="col-span-1 lg:col-span-5"
        >
          <div className="h-56 sm:h-64 lg:h-72 w-full">
            {procData && procData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={procData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                    stroke="none"
                  >
                    {(procData ?? []).map(
                      (_: ProcedureDistribution, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                      backgroundColor: "white",
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-2">
                <PieChartIcon size="xl" />
                <span className="text-xs font-medium">No data available</span>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <ListIcon size="md" />
            </div>
            <CardTitle className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {t("dashboard.recentPatients", "Recent Patients")}
            </CardTitle>
            {recentPatients && recentPatients.length > 0 && (
              <Badge
                variant="default"
                className="text-[10px] font-bold px-2 py-0.5"
              >
                {recentPatients.length} patients
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] sm:text-xs font-bold text-primary hover:text-primary/80 gap-1"
              onClick={() => navigate("/patients")}
            >
              {t("dashboard.viewAllPatients", "View All Patients")}
              <ChevronRightIcon size="xs" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto -mx-px">
            {recentPatients?.length === 0 ? (
              <div className="py-10 sm:py-14 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <UsersIcon
                    size="xl"
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("dashboard.noRecentPatients", "No recent patients")}
                </p>
              </div>
            ) : (
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50">
                    <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
                      {t("dashboard.table.fullName", "PATIENT")}
                    </th>
                    <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
                      {t("dashboard.table.phone", "CONTACT")}
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
                      AGE
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
                      {t("dashboard.table.address", "ADDRESS")}
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
                      {t("dashboard.table.lastVisit", "LAST VISIT")}
                    </th>
                    <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {recentPatients?.map((patient: RecentPatient) => {
                    const statusStyle =
                      statusConfig[patient.status] || statusConfig.Completed;
                    return (
                      <tr
                        key={patient.id}
                        className="group cursor-pointer transition-all duration-200 hover:bg-gray-50/70 dark:hover:bg-gray-800/30"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative">
                              <PatientAvatar
                                name={patient.full_name}
                                size="sm"
                                className="ring-2 ring-gray-100 dark:ring-gray-700 group-hover:ring-primary/30 transition-all"
                              />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm group-hover:text-primary transition-colors truncate max-w-25 sm:max-w-40">
                              {patient.full_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            {patient.phone ? (
                              <span className="text-[10px] sm:text-xs font-mono">
                                {patient.phone}
                              </span>
                            ) : (
                              <span className="text-[10px] sm:text-xs text-gray-400">
                                --
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-5 py-3 sm:py-4">
                          <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300">
                            {patient.age}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-400 mx-1">
                            /
                          </span>
                          <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 capitalize">
                            {patient.gender.toLowerCase()}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-3 sm:px-5 py-3 sm:py-4">
                          <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 truncate block max-w-37.5">
                            {patient.address || "—"}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-5 py-3 sm:py-4">
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            <CalendarIcon size="xs" className="text-gray-400" />
                            <span className="text-[10px] sm:text-xs font-medium">
                              {format(
                                new Date(patient.visit_date),
                                "MMM dd, yyyy",
                              )}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-3 sm:px-5 py-3 sm:py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative group/status inline-flex">
                            <button
                              onClick={(e) => openStatusModal(patient, e)}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer",
                                statusStyle.bg,
                                statusStyle.text,
                                "hover:shadow-sm active:scale-95",
                              )}
                              title="Click to change status"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  patient.status === "Completed"
                                    ? "bg-green-500"
                                    : patient.status === "Open"
                                      ? "bg-blue-500"
                                      : "bg-red-400"
                                }`}
                              />
                              {patient.status}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 px-1">
        <div className="flex items-center gap-3">
          <span>Live data from database</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5">
          <ActivityIcon size="xs" />
          <span>Auto-refresh every 5 min</span>
        </div>
      </div>

      {selectedPatientForStatus && (
        <TreatmentStatusChangeModal
          isOpen={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false);
            setSelectedPatientForStatus(null);
          }}
          currentStatus={selectedPatientForStatus.status}
          onSave={handleStatusSave}
        />
      )}
    </div>
  );
};

export default Dashboard;
