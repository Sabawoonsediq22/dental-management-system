import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";
import { Badge } from "../../components/ui/Badge";
import {
  DashboardIcon,
  PatientIcon,
  ToothIcon,
  BillingIcon,
  ReportsIcon,
  SettingsIcon,
  HelpIcon,
  SearchIcon,
  ChevronRightIcon,
} from "../../shared/icons/icons";

type HelpIconProps = { className?: string; size?: "xs" | "sm" | "md" | "lg" | "xl" };

interface GuideEntry {
  id: string;
  title: string;
  description: string;
  icon: React.FC<HelpIconProps>;
  steps: string[];
  tips?: string[];
  links?: { label: string; href: string }[];
}

interface FaqEntry {
  q: string;
  a: string;
}

const SearchGuide: React.FC<{
  query: string;
  results: { section: string; entry: GuideEntry; matchType: string }[];
  onSelect: (id: string) => void;
  onClear: () => void;
}> = ({ query, results, onSelect, onClear }) => {
  const { t } = useTranslation();
  if (!query.trim()) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 max-h-80 overflow-y-auto">
      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          {t("help.search.resultsCount", {
            count: results.length,
            plural: results.length === 1
              ? t("help.search.result", "result")
              : t("help.search.results", "results"),
          })}
        </span>
        <button onClick={onClear} className="text-xs text-primary hover:underline cursor-pointer">
          {t("help.search.clear", "Clear")}
        </button>
      </div>
      {results.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-400">
          {t("help.search.noResults", `No results found for "${query}"`)}
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {results.slice(0, 20).map((r, i) => (
            <button
              key={i}
              onClick={() => onSelect(r.entry.id)}
              className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition-colors cursor-pointer"
            >
              <r.entry.icon size="sm" className="mt-0.5 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {r.entry.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {r.entry.description}
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px] ml-auto">
                {r.matchType}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Help: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const sections = useMemo<GuideEntry[]>(() => [
    {
      id: "dashboard",
      title: t("help.guide.dashboard.title", "Dashboard"),
      description: t("help.guide.dashboard.description", "Monitor clinic performance with real-time stats, charts, and patient flow tracking."),
      icon: DashboardIcon,
      steps: [
        t("help.guide.dashboard.step1", "View key metrics: Daily Revenue, Patients Today, Outstanding Balance, and Procedures Performed in the stat cards at the top."),
        t("help.guide.dashboard.step2", "Toggle between Daily and Weekly views on the Patients Flow chart to spot visit patterns."),
        t("help.guide.dashboard.step3", "Hover over any chart to see detailed tooltips with exact values."),
        t("help.guide.dashboard.step4", "Check the Procedure Distribution chart (right side) to see which treatments are most common."),
        t("help.guide.dashboard.step5", "Scroll down to the Recent Patients table to see the latest visits and update their status."),
        t("help.guide.dashboard.step6", "Data auto-refreshes every 5 minutes — the green pulse indicator confirms live sync."),
      ],
      tips: [
        t("help.guide.dashboard.tip1", "Click a patient row in the Recent Patients table to jump to their full profile."),
        t("help.guide.dashboard.tip2", "Use the daily/weekly toggle to compare today's activity against the weekly trend."),
        t("help.guide.dashboard.tip3", "The outstanding balance badge turns red when the amount is high."),
      ],
      links: [
        { label: t("help.guide.dashboard.link1", "Go to Dashboard"), href: "/dashboard" },
      ],
    },
    {
      id: "patients",
      title: t("help.guide.patients.title", "Patient Management"),
      description: t("help.guide.patients.description", "Add, search, and manage patients. Record visits, treatments, and track history."),
      icon: PatientIcon,
      steps: [
        t("help.guide.patients.step1", "Navigate to Patients and click 'Add New Patient' to open the registration form."),
        t("help.guide.patients.step2", "Fill in patient details (name, phone, age, gender, address) and optionally add medical history (allergies, medications, conditions)."),
        t("help.guide.patients.step3", "Add procedures directly during registration — select procedure names, specify tooth numbers, and set quantities."),
        t("help.guide.patients.step4", "Set a discount and initial payment amount, then the system automatically generates the visit + invoice."),
        t("help.guide.patients.step5", "Click on any patient in the list to open their profile with full treatment history, x-rays, and billing info."),
        t("help.guide.patients.step6", "Use the search bar to quickly find patients by name or phone number."),
      ],
      tips: [
        t("help.guide.patients.tip1", "You can add multiple procedures at once during patient registration."),
        t("help.guide.patients.tip2", "Tooth numbers are entered as comma-separated values (e.g., 18, 19, 20)."),
        t("help.guide.patients.tip3", "The patient list shows initials avatars and last visit date at a glance."),
      ],
      links: [
        { label: t("help.guide.patients.link1", "View All Patients"), href: "/patients" },
        { label: t("help.guide.patients.link2", "Add New Patient"), href: "/patients/new" },
      ],
    },
    {
      id: "visits",
      title: t("help.guide.visits.title", "Visits & Treatments"),
      description: t("help.guide.visits.description", "Record new visits, add procedures, and manage treatment records per patient."),
      icon: ToothIcon,
      steps: [
        t("help.guide.visits.step1", "From a patient's profile, click 'New Visit' to start a new treatment session."),
        t("help.guide.visits.step2", "Select the date (defaults to today) and enter the chief complaint and clinical notes."),
        t("help.guide.visits.step3", "Choose procedures from the dropdown — each with quantity and tooth-specific details."),
        t("help.guide.visits.step4", "The dental chart visually highlights selected teeth for easy reference."),
        t("help.guide.visits.step5", "After saving, the treatment appears in the patient's timeline with status tracking."),
        t("help.guide.visits.step6", "Update visit status (Open → Completed → Cancelled) as the treatment progresses."),
      ],
      tips: [
        t("help.guide.visits.tip1", "Use the dental chart for a visual overview — it's faster than typing tooth numbers."),
        t("help.guide.visits.tip2", "Clinical notes are preserved and viewable in the treatment history."),
        t("help.guide.visits.tip3", "A single visit can include multiple procedures across different teeth."),
      ],
      links: [
        { label: t("help.guide.visits.link1", "Browse Patients"), href: "/patients" },
      ],
    },
    {
      id: "billing",
      title: t("help.guide.billing.title", "Billing & Invoices"),
      description: t("help.guide.billing.description", "Create invoices, record payments, and track outstanding balances."),
      icon: BillingIcon,
      steps: [
        t("help.guide.billing.step1", "Invoices are auto-generated when you create a visit with procedures and a paid amount."),
        t("help.guide.billing.step2", "Visit the Billing page to see all invoices with status filters (All, Unpaid, Partial, Paid)."),
        t("help.guide.billing.step3", "Search invoices by patient name or invoice number using the search bar."),
        t("help.guide.billing.step4", "Click any invoice to view details, including itemized procedures, payments, and receipt."),
        t("help.guide.billing.step5", "Click 'Record Payment' on an unpaid or partially paid invoice to log a new payment."),
        t("help.guide.billing.step6", "Select payment method (Cash, Card, Mobile, Insurance) and add optional notes."),
        t("help.guide.billing.step7", "Outstanding balances update automatically — the Billing page shows the total owed at the top."),
      ],
      tips: [
        t("help.guide.billing.tip1", "Use the status filter tabs to quickly find unpaid invoices needing follow-up."),
        t("help.guide.billing.tip2", "The summary bar shows total outstanding, unpaid, partial, and paid counts."),
        t("help.guide.billing.tip3", "Each invoice can have multiple payments recorded against it."),
      ],
      links: [
        { label: t("help.guide.billing.link1", "Go to Billing"), href: "/billing" },
      ],
    },
    {
      id: "reports",
      title: t("help.guide.reports.title", "Reports & Export"),
      description: t("help.guide.reports.description", "View analytics and export data in CSV or PDF format."),
      icon: ReportsIcon,
      steps: [
        t("help.guide.reports.step1", "The Reports page shows summary stat cards for active patients, visits, revenue, and outstanding balance."),
        t("help.guide.reports.step2", "The Revenue Trend chart displays monthly revenue over the past year — hover for exact values."),
        t("help.guide.reports.step3", "The Visit Distribution bar chart breaks down visits by status (Completed, Cancelled, Active)."),
        t("help.guide.reports.step4", "To export data, choose your format (PDF or CSV) using the toggle at the top of the Export section."),
        t("help.guide.reports.step5", "Click Patient Report, Financial Report, or Treatment Report to download immediately."),
        t("help.guide.reports.step6", "PDF exports include professional formatting with headers, dates, and styled tables."),
      ],
      tips: [
        t("help.guide.reports.tip1", "PDF is best for sharing with colleagues or printing; CSV is best for spreadsheet analysis."),
        t("help.guide.reports.tip2", "The revenue chart shows 12 months of data — useful for year-over-year comparisons."),
        t("help.guide.reports.tip3", "Exported files are named with the current date for easy organization."),
      ],
      links: [
        { label: t("help.guide.reports.link1", "View Reports"), href: "/reports" },
      ],
    },
    {
      id: "settings",
      title: t("help.guide.settings.title", "Settings & Preferences"),
      description: t("help.guide.settings.description", "Configure clinic information, language, and appearance."),
      icon: SettingsIcon,
      steps: [
        t("help.guide.settings.step1", "Click the gear icon in the top-right header or navigate to Settings."),
        t("help.guide.settings.step2", "Update clinic name, phone, and address — this info appears on receipts and exports."),
        t("help.guide.settings.step3", "Switch between English and Pashto using the language toggle at the bottom of the sidebar."),
        t("help.guide.settings.step4", "Toggle dark/light theme using the sun/moon icon in the header."),
        t("help.guide.settings.step5", "All settings are saved automatically and persist across app restarts."),
      ],
      tips: [
        t("help.guide.settings.tip1", "The clinic name on receipts comes from your Settings — keep it up to date."),
        t("help.guide.settings.tip2", "Language and theme preferences are stored in the database."),
      ],
      links: [
        { label: t("help.guide.settings.link1", "Open Settings"), href: "/settings" },
      ],
    },
  ], [t]);

  const faqs = useMemo<FaqEntry[]>(() => [
    {
      q: t("help.faq.q1", "How do I add a new patient with a treatment?"),
      a: t("help.faq.a1", "Go to Patients → 'Add New Patient'. Fill in their details, then scroll to 'Procedures' to add treatments right away. Set a discount and payment — the system creates the patient, visit, and invoice in one step."),
    },
    {
      q: t("help.faq.q2", "How do I record a payment on an existing invoice?"),
      a: t("help.faq.a2", "Go to Billing, find the invoice (use the search or status filter), click on it to open details, then click 'Record Payment'. Enter the amount, select method, and save."),
    },
    {
      q: t("help.faq.q3", "Can I export treatment data for a single patient?"),
      a: t("help.faq.a3", "Yes! Open the patient's profile, scroll to their treatment history, and click the download icon. You can export as CSV (spreadsheet), PDF (formatted report), or plain text summary."),
    },
    {
      q: t("help.faq.q4", "How do I search for a patient?"),
      a: t("help.faq.a4", "Press Ctrl+K (Cmd+K on Mac) to open the global search modal from anywhere in the app. Type the patient's name or phone number. You can also use the search bar on the Patients page."),
    },
    {
      q: t("help.faq.q5", "What do the visit statuses mean?"),
      a: t("help.faq.a5", "Open = Treatment is in progress. Completed = Treatment is finished. Cancelled = The visit was cancelled. You can change status from the dashboard's Recent Patients table or the patient's profile."),
    },
    {
      q: t("help.faq.q6", "How do I print a receipt?"),
      a: t("help.faq.a6", "From the Billing page, open an invoice and scroll to the receipt section. Use your browser's print function (Ctrl+P) or export the invoice details as PDF from the Reports page."),
    },
    {
      q: t("help.faq.q7", "Is my data backed up?"),
      a: t("help.faq.a7", "The application stores data locally in a SQLite database. The Reports page does not currently include an automatic backup feature — periodically export your data via the Reports page for safekeeping."),
    },
    {
      q: t("help.faq.q8", "How do I change the language?"),
      a: t("help.faq.a8", "Open the sidebar (left panel) and scroll to the bottom. You'll see a language toggle — tap it to switch between English and Pashto. The UI updates immediately."),
    },
  ], [t]);

  const shortcuts = useMemo(() => [
    { keys: ["Ctrl", "K"], action: t("help.shortcuts.openSearch", "Open global search") },
    { keys: ["Ctrl", "N"], action: t("help.shortcuts.newPatient", "Add new patient") },
    { keys: ["Ctrl", "B"], action: t("help.shortcuts.goToBilling", "Go to Billing") },
    { keys: ["Ctrl", "R"], action: t("help.shortcuts.goToReports", "Go to Reports") },
    { keys: ["Ctrl", "D"], action: t("help.shortcuts.goToDashboard", "Go to Dashboard") },
    { keys: ["Ctrl", ","], action: t("help.shortcuts.openSettings", "Open Settings") },
    { keys: ["?"], action: t("help.shortcuts.openHelp", "Open this Help page") },
  ], [t]);

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const results: { section: string; entry: GuideEntry; matchType: string }[] = [];

    for (const entry of sections) {
      if (entry.title.toLowerCase().includes(q)) {
        results.push({ section: entry.title, entry, matchType: t("help.search.matchType.title", "Title") });
        continue;
      }
      if (entry.description.toLowerCase().includes(q)) {
        results.push({ section: entry.title, entry, matchType: t("help.search.matchType.description", "Description") });
        continue;
      }
      for (const step of entry.steps) {
        if (step.toLowerCase().includes(q)) {
          results.push({ section: entry.title, entry, matchType: t("help.search.matchType.step", "Step") });
          break;
        }
      }
    }

    if (results.length === 0) {
      for (const faq of faqs) {
        if (faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q)) {
          const entry = sections.find((s) => s.id === "patients")!;
          results.push({ section: t("help.search.matchType.faq", "FAQ"), entry, matchType: t("help.search.matchType.faq", "FAQ") });
          break;
        }
      }
    }

    return results;
  }, [searchQuery, sections, faqs, t]);

  const handleSearchSelect = useCallback((id: string) => {
    setActiveTab(id);
    setSearchQuery("");
  }, []);

  const handleNav = useCallback((href: string) => {
    navigate(href);
  }, [navigate]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary/90 to-primary/70 dark:from-primary/90 dark:via-primary/80 dark:to-primary/60 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
            <HelpIcon size="xl" className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
              {t("help.subtitle", "SUPPORT CENTER")}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white">
              {t("help.title", "Help & Documentation")}
            </h1>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="relative group">
          <SearchIcon size="sm" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("help.searchPlaceholder", "Search guides, steps, FAQs...")}
            className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
          />
        </div>
        <SearchGuide
          query={searchQuery}
          results={searchResults}
          onSelect={handleSearchSelect}
          onClear={() => setSearchQuery("")}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap gap-1.5 bg-transparent p-0 border-b border-gray-200 dark:border-gray-700 rounded-none w-full overflow-x-auto pb-px">
          {[
            { id: "getting-started", label: t("help.tabs.gettingStarted", "Getting Started"), icon: HelpIcon },
            ...sections.map((s) => ({ id: s.id, label: s.title, icon: s.icon })),
            { id: "faq", label: t("help.tabs.faq", "FAQ"), icon: HelpIcon },
            { id: "shortcuts", label: t("help.tabs.shortcuts", "Shortcuts"), icon: HelpIcon },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm hover:text-gray-700 dark:hover:text-gray-300 transition-all"
            >
              <tab.icon size="xs" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Getting Started */}
        <TabsContent value="getting-started" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary/40 to-primary/60" />
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shadow-sm">1</span>
                  {t("help.gettingStarted.welcomeTitle", "Welcome to the System")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t("help.gettingStarted.welcomeDesc", "The Dental Clinic Management System helps you manage patients, record treatments, handle billing, and generate reports — all in one place. Use the sidebar on the left to navigate between sections.")}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-400 to-blue-600" />
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-sm font-bold shadow-sm">2</span>
                  {t("help.gettingStarted.quickStartTitle", "Quick Start Workflow")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  {[
                    t("help.gettingStarted.quickStartStep1", "Add a patient via Patients → Add New Patient"),
                    t("help.gettingStarted.quickStartStep2", "Record a visit with procedures and clinical notes"),
                    t("help.gettingStarted.quickStartStep3", "Generate invoice and collect payment"),
                    t("help.gettingStarted.quickStartStep4", "View analytics on the Dashboard and Reports pages"),
                    t("help.gettingStarted.quickStartStep5", "Export data as PDF or CSV for your records"),
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold">{t("help.gettingStarted.navGuideTitle", "Navigation Guide")}</CardTitle>
              <CardDescription>{t("help.gettingStarted.navGuideDesc", "Click any card below to jump directly to that section")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveTab(s.id)}
                    className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/30 hover:shadow-md hover:bg-white dark:hover:bg-gray-750 transition-all duration-200 cursor-pointer"
                  >
                    <div className="p-2.5 rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-200">
                      <s.icon size="lg" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {s.title}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section detail pages */}
        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="pt-4 sm:pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Section header */}
                <Card className="relative overflow-hidden border-0 shadow-sm">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-r" />
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-linear-to-br from-primary/10 to-primary/5 p-3 text-primary shadow-sm shrink-0">
                        <section.icon size="lg" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">{section.title}</CardTitle>
                        <CardDescription className="text-sm mt-0.5">{section.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Step-by-step */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shadow-sm">✓</span>
                      {t("help.section.stepByStep", "Step-by-Step Guide")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-0">
                      {section.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-4 pb-4 last:pb-0 relative">
                          {i < section.steps.length - 1 && (
                            <div className="absolute left-3 top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                          )}
                          <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Pro Tips */}
                {section.tips && section.tips.length > 0 && (
                  <Card className="relative overflow-hidden border-0 shadow-sm">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-amber-400 to-amber-500" />
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <span className="text-amber-500 text-base">💡</span>
                        {t("help.section.proTips", "Pro Tips")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2.5">
                        {section.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Links */}
                {section.links && section.links.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold">{t("help.section.quickLinks", "Quick Links")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {section.links.map((link, i) => (
                        <button
                          key={i}
                          onClick={() => handleNav(link.href)}
                          className="group w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all cursor-pointer text-left"
                        >
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
                            {link.label}
                          </span>
                          <ChevronRightIcon size="xs" className="text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Need Help? */}
                <Card className="relative overflow-hidden border-0 bg-linear-to-br from-primary/[0.04] to-primary/[0.02] dark:from-primary/[0.08] dark:to-primary/[0.04] shadow-sm">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,94,184,0.06),transparent_50%)]" />
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">?</span>
                      {t("help.section.needHelp", "Need Help?")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                      {t("help.section.needHelpDesc", "Search above or check the FAQ tab for answers to common questions.")}
                    </p>
                    <button
                      onClick={() => setActiveTab("faq")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                    >
                      {t("help.section.browseFaqs", "Browse FAQs →")}
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}

        {/* FAQ */}
        <TabsContent value="faq" className="pt-4 sm:pt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm">?</span>
                {t("help.faq.title", "Frequently Asked Questions")}
              </CardTitle>
              <CardDescription>
                {t("help.faq.description", "Click a question to expand the answer. {{count}} topics covered.", { count: faqs.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-100 dark:divide-gray-700/60 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {faqs.map((faq, i) => (
                  <div key={i} className="last:border-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-4 sm:px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white pr-4 group-hover:text-primary transition-colors">
                        {faq.q}
                      </span>
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 text-gray-400 shrink-0 transition-all duration-300 ${openFaq === i ? "bg-primary border-primary text-white rotate-45" : "group-hover:border-gray-400 dark:group-hover:border-gray-500"}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </span>
                    </button>
                    {openFaq === i && (
                      <div className="px-4 sm:px-6 pb-5 -mt-1">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 text-sm text-gray-600 dark:text-gray-300 leading-relaxed shadow-sm">
                          {faq.a}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shortcuts */}
        <TabsContent value="shortcuts" className="pt-4 sm:pt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </span>
                {t("help.shortcuts.title", "Keyboard Shortcuts")}
              </CardTitle>
              <CardDescription>
                {t("help.shortcuts.description", "Speed up your workflow with these keyboard shortcuts.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/20 hover:shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {shortcut.action}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <React.Fragment key={key}>
                          {j > 0 && <span className="text-xs text-gray-400">+</span>}
                          <kbd className="px-2 py-1 text-xs font-mono font-bold rounded-lg border border-gray-300 dark:border-gray-600 bg-linear-to-b from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750 text-gray-700 dark:text-gray-200 shadow-sm">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Help;
