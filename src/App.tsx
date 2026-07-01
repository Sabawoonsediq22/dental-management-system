import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MainLayout from "./components/layouts/MainLayout";
import "./i18n";
import { LoadingSpinner } from "./components/ui";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Patients = lazy(() => import("./pages/Patients/Patients"));
const NewPatient = lazy(() => import("./pages/NewPatient/NewPatient"));
const NewVisit = lazy(() => import("./pages/NewVisit/NewVisit"));
const PatientProfile = lazy(() => import("./pages/PatientProfile/PatientProfile"));
const Reports = lazy(() => import("./pages/Reports/Reports"));
const Settings = lazy(() => import("./pages/Setting/Settings"));
const Billing = lazy(() => import("./pages/Billing/Billing"));
const About = lazy(() => import("./pages/About/About"));
const Help = lazy(() => import("./pages/Help/Help"));

const PageLoader = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.documentElement.dir = ["ps"].includes(i18n.language)
      ? "rtl"
      : "ltr";
    document.documentElement.lang = i18n.language;
    setIsLoading(false);
  }, [i18n.language]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/new" element={<NewPatient />} />
            <Route path="/patients/:id/visits/new" element={<NewVisit />} />
            <Route path="/patients/:id" element={<PatientProfile />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/billing/invoices/:id" element={<Billing />} />
            <Route path="/billing/receipts/:id" element={<Billing />} />
            <Route path="/billing/payments/:id" element={<Billing />} />
            <Route path="/visits/:id" element={<Patients />} />
            <Route path="/treatments/:id" element={<Patients />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </ErrorBoundary>
  );
}

export default App;
