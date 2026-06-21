import { Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MainLayout from "./components/layouts/MainLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Patients from "./pages/Patients/Patients";
import NewPatient from "./pages/NewPatient/NewPatient";
import NewVisit from "./pages/NewVisit/NewVisit";
import PatientProfile from "./pages/PatientProfile/PatientProfile";
import Reports from "./pages/Reports/Reports";
import Settings from "./pages/Setting/Settings";
import "./i18n";
import { LoadingSpinner } from "./components/ui";
import Billing from "./pages/Billing/Billing";
import About from "./pages/About/About";
import Help from "./pages/Help/Help";

function App() {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set initial direction based on language
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
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <MainLayout>
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
      </MainLayout>
    </Suspense>
  );
}

export default App;
