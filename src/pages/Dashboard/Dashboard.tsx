import React, { useState } from "react";
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
} from "../../shared/icons/icons";
import PatientAvatar from "../../components/ui/PatientAvatar";
import {
  useDashboardStats,
  usePatientsFlow,
  useProcedureDistribution,
  useRecentPatients,
} from "../../hooks/useDashboard";
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
  Legend,
} from "recharts";
import type { ProcedureDistribution, RecentPatient } from "../../types/ApiTypes";

const COLORS = [
  "#005eb8",
  "#00b4d8",
  "#90e0ef",
  "#0077b6",
  "#48cae4",
  "#023e8a",
];

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
}> = ({ title, value, icon, badge }) => (
  <div className="flex-1 rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className="rounded-lg bg-blue-50 p-2 sm:p-3 text-primary dark:bg-blue-900/30">
        {icon}
      </div>
    </div>
    {badge && <div className="mt-3 sm:mt-4">{badge}</div>}
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [flowMode, setFlowMode] = useState<"daily" | "weekly">("weekly");

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: flowData } = usePatientsFlow(flowMode);
  const { data: procData } = useProcedureDistribution();
  const { data: recentPatients } = useRecentPatients(4);

  const formatAFN = (val: number) =>
    val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " AFN";

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            {t("dashboard.welcome", "WELCOME BACK")}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t("dashboard.title", "Clinic Dashboard")}
          </h1>
        </div>
        <Button
          onClick={() => navigate("/patients/new")}
          className="gap-2 rounded-lg bg-primary px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base text-white hover:bg-primary/90 w-full sm:w-auto"
        >
          <PlusIcon size="md" />
          <span>{t("nav.newPatient", "Add New Patient")}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard
          title={t("dashboard.stats.dailyRevenue", "Daily Revenue")}
          value={statsLoading ? "..." : formatAFN(stats?.daily_revenue ?? 0)}
          icon={<CurrencyIcon size="md" />}
          badge={
            <Badge variant="success" className="text-xs font-semibold">
              +12%
            </Badge>
          }
        />
        <StatCard
          title={t("dashboard.stats.patientsToday", "Patients Today")}
          value={statsLoading ? "..." : String(stats?.patients_today ?? 0)}
          icon={<PatientIcon size="md" />}
        />
        <StatCard
          title={t("dashboard.stats.outstandingBalance", "Outstanding Balance")}
          value={statsLoading ? "..." : formatAFN(stats?.outstanding_balance ?? 0)}
          icon={<ClockIcon size="md" />}
          badge={
            <Badge variant="warning" className="text-xs font-semibold">
              {t("common.high", "High")}
            </Badge>
          }
        />
        <StatCard
          title={t("dashboard.stats.proceduresPerformed", "Procedures Performed")}
          value={statsLoading ? "..." : String(stats?.procedures_performed ?? 0).padStart(2, "0")}
          icon={<ToothIcon size="md" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <Card className="col-span-1 lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold">
              {t("dashboard.patientsFlow", "Patients Flow")}
            </CardTitle>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setFlowMode("daily")}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                  flowMode === "daily"
                    ? "bg-primary text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {t("dashboard.daily", "Daily")}
              </button>
              <button
                onClick={() => setFlowMode("weekly")}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                  flowMode === "weekly"
                    ? "bg-primary text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {t("dashboard.weekly", "Weekly")}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64 lg:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowData ?? []}>
                  <defs>
                    <linearGradient id="colorCheckIns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#005eb8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#005eb8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
                  <XAxis
                    dataKey="label"
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
                      backgroundColor: "var(--tooltip-bg, #ffffff)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="check_ins"
                    stroke="#005eb8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCheckIns)"
                    name="Check-ins"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#00b4d8"
                    strokeWidth={2}
                    fill="transparent"
                    name="Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-5">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold">
              {t("dashboard.procedureDistribution", "Procedure Distribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64 lg:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={procData ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="name"
                  >
                    {(procData ?? []).map((_: ProcedureDistribution, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                      backgroundColor: "#ffffff",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-semibold">
            {t("dashboard.recentPatients", "Recent Patients")}
          </CardTitle>
          <Button
            variant="ghost"
            className="text-xs sm:text-sm font-medium text-primary hover:text-primary/80"
            onClick={() => navigate("/patients")}
          >
            {t("dashboard.viewAllPatients", "View All Patients")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("dashboard.table.fullName", "FULL NAME")}
                  </th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("dashboard.table.phone", "PHONE")}
                  </th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("dashboard.table.ageGender", "AGE / GENDER")}
                  </th>
                  <th className="hidden md:table-cell px-4 sm:px-6 py-2 sm:py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("dashboard.table.address", "ADDRESS")}
                  </th>
                  <th className="hidden sm:table-cell px-4 sm:px-6 py-2 sm:py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("dashboard.table.lastVisit", "LAST VISIT")}
                  </th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("dashboard.table.status", "STATUS")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentPatients?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      {t("dashboard.noRecentPatients", "No recent patients")}
                    </td>
                  </tr>
                ) : (
                  recentPatients?.map((patient: RecentPatient) => (
                    <tr
                      key={patient.id}
                      className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <PatientAvatar
                            name={patient.full_name}
                            size="sm"
                          />
                          <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-base">
                            {patient.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                        {patient.phone}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                        {patient.age} / {patient.gender}
                      </td>
                      <td className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                        {patient.address}
                      </td>
                      <td className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                        {new Date(patient.visit_date).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          }
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <Badge
                          variant={
                            patient.status === "Completed"
                              ? "success"
                              : patient.status === "Open"
                              ? "info"
                              : "destructive"
                          }
                          className="text-xs font-medium"
                        >
                          {patient.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;