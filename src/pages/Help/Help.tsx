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

const sections: GuideEntry[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Monitor clinic performance with real-time stats, charts, and patient flow tracking.",
    icon: DashboardIcon,
    steps: [
      "View key metrics: Daily Revenue, Patients Today, Outstanding Balance, and Procedures Performed in the stat cards at the top.",
      "Toggle between Daily and Weekly views on the Patients Flow chart to spot visit patterns.",
      "Hover over any chart to see detailed tooltips with exact values.",
      "Check the Procedure Distribution chart (right side) to see which treatments are most common.",
      "Scroll down to the Recent Patients table to see the latest visits and update their status.",
      "Data auto-refreshes every 5 minutes — the green pulse indicator confirms live sync.",
    ],
    tips: [
      "Click a patient row in the Recent Patients table to jump to their full profile.",
      "Use the daily/weekly toggle to compare today's activity against the weekly trend.",
      "The outstanding balance badge turns red when the amount is high.",
    ],
    links: [
      { label: "Go to Dashboard", href: "/dashboard" },
    ],
  },
  {
    id: "patients",
    title: "Patient Management",
    description: "Add, search, and manage patients. Record visits, treatments, and track history.",
    icon: PatientIcon,
    steps: [
      "Navigate to Patients and click 'Add New Patient' to open the registration form.",
      "Fill in patient details (name, phone, age, gender, address) and optionally add medical history (allergies, medications, conditions).",
      "Add procedures directly during registration — select procedure names, specify tooth numbers, and set quantities.",
      "Set a discount and initial payment amount, then the system automatically generates the visit + invoice.",
      "Click on any patient in the list to open their profile with full treatment history, x-rays, and billing info.",
      "Use the search bar to quickly find patients by name or phone number.",
    ],
    tips: [
      "You can add multiple procedures at once during patient registration.",
      "Tooth numbers are entered as comma-separated values (e.g., 18, 19, 20).",
      "The patient list shows initials avatars and last visit date at a glance.",
    ],
    links: [
      { label: "View All Patients", href: "/patients" },
      { label: "Add New Patient", href: "/patients/new" },
    ],
  },
  {
    id: "visits",
    title: "Visits & Treatments",
    description: "Record new visits, add procedures, and manage treatment records per patient.",
    icon: ToothIcon,
    steps: [
      "From a patient's profile, click 'New Visit' to start a new treatment session.",
      "Select the date (defaults to today) and enter the chief complaint and clinical notes.",
      "Choose procedures from the dropdown — each with quantity and tooth-specific details.",
      "The dental chart visually highlights selected teeth for easy reference.",
      "After saving, the treatment appears in the patient's timeline with status tracking.",
      "Update visit status (Open → Completed → Cancelled) as the treatment progresses.",
    ],
    tips: [
      "Use the dental chart for a visual overview — it's faster than typing tooth numbers.",
      "Clinical notes are preserved and viewable in the treatment history.",
      "A single visit can include multiple procedures across different teeth.",
    ],
    links: [
      { label: "Browse Patients", href: "/patients" },
    ],
  },
  {
    id: "billing",
    title: "Billing & Invoices",
    description: "Create invoices, record payments, and track outstanding balances.",
    icon: BillingIcon,
    steps: [
      "Invoices are auto-generated when you create a visit with procedures and a paid amount.",
      "Visit the Billing page to see all invoices with status filters (All, Unpaid, Partial, Paid).",
      "Search invoices by patient name or invoice number using the search bar.",
      "Click any invoice to view details, including itemized procedures, payments, and receipt.",
      "Click 'Record Payment' on an unpaid or partially paid invoice to log a new payment.",
      "Select payment method (Cash, Card, Mobile, Insurance) and add optional notes.",
      "Outstanding balances update automatically — the Billing page shows the total owed at the top.",
    ],
    tips: [
      "Use the status filter tabs to quickly find unpaid invoices needing follow-up.",
      "The summary bar shows total outstanding, unpaid, partial, and paid counts.",
      "Each invoice can have multiple payments recorded against it.",
    ],
    links: [
      { label: "Go to Billing", href: "/billing" },
    ],
  },
  {
    id: "reports",
    title: "Reports & Export",
    description: "View analytics and export data in CSV or PDF format.",
    icon: ReportsIcon,
    steps: [
      "The Reports page shows summary stat cards for active patients, visits, revenue, and outstanding balance.",
      "The Revenue Trend chart displays monthly revenue over the past year — hover for exact values.",
      "The Visit Distribution bar chart breaks down visits by status (Completed, Cancelled, Active).",
      "To export data, choose your format (PDF or CSV) using the toggle at the top of the Export section.",
      "Click Patient Report, Financial Report, or Treatment Report to download immediately.",
      "PDF exports include professional formatting with headers, dates, and styled tables.",
    ],
    tips: [
      "PDF is best for sharing with colleagues or printing; CSV is best for spreadsheet analysis.",
      "The revenue chart shows 12 months of data — useful for year-over-year comparisons.",
      "Exported files are named with the current date for easy organization.",
    ],
    links: [
      { label: "View Reports", href: "/reports" },
    ],
  },
  {
    id: "settings",
    title: "Settings & Preferences",
    description: "Configure clinic information, language, and appearance.",
    icon: SettingsIcon,
    steps: [
      "Click the gear icon in the top-right header or navigate to Settings.",
      "Update clinic name, phone, and address — this info appears on receipts and exports.",
      "Switch between English and Pashto using the language toggle at the bottom of the sidebar.",
      "Toggle dark/light theme using the sun/moon icon in the header.",
      "All settings are saved automatically and persist across app restarts.",
    ],
    tips: [
      "The clinic name on receipts comes from your Settings — keep it up to date.",
      "Language and theme preferences are stored in the database.",
    ],
    links: [
      { label: "Open Settings", href: "/settings" },
    ],
  },
];

const faqs: FaqEntry[] = [
  {
    q: "How do I add a new patient with a treatment?",
    a: "Go to Patients → 'Add New Patient'. Fill in their details, then scroll to 'Procedures' to add treatments right away. Set a discount and payment — the system creates the patient, visit, and invoice in one step.",
  },
  {
    q: "How do I record a payment on an existing invoice?",
    a: "Go to Billing, find the invoice (use the search or status filter), click on it to open details, then click 'Record Payment'. Enter the amount, select method, and save.",
  },
  {
    q: "Can I export treatment data for a single patient?",
    a: "Yes! Open the patient's profile, scroll to their treatment history, and click the download icon. You can export as CSV (spreadsheet), PDF (formatted report), or plain text summary.",
  },
  {
    q: "How do I search for a patient?",
    a: "Press Ctrl+K (Cmd+K on Mac) to open the global search modal from anywhere in the app. Type the patient's name or phone number. You can also use the search bar on the Patients page.",
  },
  {
    q: "What do the visit statuses mean?",
    a: "Open = Treatment is in progress. Completed = Treatment is finished. Cancelled = The visit was cancelled. You can change status from the dashboard's Recent Patients table or the patient's profile.",
  },
  {
    q: "How do I print a receipt?",
    a: "From the Billing page, open an invoice and scroll to the receipt section. Use your browser's print function (Ctrl+P) or export the invoice details as PDF from the Reports page.",
  },
  {
    q: "Is my data backed up?",
    a: "The application stores data locally in a SQLite database. The Reports page does not currently include an automatic backup feature — periodically export your data via the Reports page for safekeeping.",
  },
  {
    q: "How do I change the language?",
    a: "Open the sidebar (left panel) and scroll to the bottom. You'll see a language toggle — tap it to switch between English and Pashto. The UI updates immediately.",
  },
];

const shortcuts = [
  { keys: ["Ctrl", "K"], action: "Open global search" },
  { keys: ["Ctrl", "N"], action: "Add new patient" },
  { keys: ["Ctrl", "B"], action: "Go to Billing" },
  { keys: ["Ctrl", "R"], action: "Go to Reports" },
  { keys: ["Ctrl", "D"], action: "Go to Dashboard" },
  { keys: ["Ctrl", ","], action: "Open Settings" },
  { keys: ["?"], action: "Open this Help page" },
];

const SearchGuide: React.FC<{
  query: string;
  results: { section: string; entry: GuideEntry; matchType: string }[];
  onSelect: (id: string) => void;
  onClear: () => void;
}> = ({ query, results, onSelect, onClear }) => {
  if (!query.trim()) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 max-h-80 overflow-y-auto">
      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          {results.length} result{results.length !== 1 ? "s" : ""}
        </span>
        <button onClick={onClear} className="text-xs text-primary hover:underline cursor-pointer">
          Clear
        </button>
      </div>
      {results.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-400">
          No results found for "{query}"
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

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const results: { section: string; entry: GuideEntry; matchType: string }[] = [];

    for (const entry of sections) {
      if (entry.title.toLowerCase().includes(q)) {
        results.push({ section: entry.title, entry, matchType: "Title" });
        continue;
      }
      if (entry.description.toLowerCase().includes(q)) {
        results.push({ section: entry.title, entry, matchType: "Description" });
        continue;
      }
      for (const step of entry.steps) {
        if (step.toLowerCase().includes(q)) {
          results.push({ section: entry.title, entry, matchType: "Step" });
          break;
        }
      }
    }

    if (results.length === 0) {
      for (const faq of faqs) {
        if (faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q)) {
          const entry = sections.find((s) => s.id === "patients")!;
          results.push({ section: "FAQ", entry, matchType: "FAQ" });
          break;
        }
      }
    }

    return results;
  }, [searchQuery]);

  const handleSearchSelect = useCallback((id: string) => {
    setActiveTab(id);
    setSearchQuery("");
  }, []);

  const handleNav = useCallback((href: string) => {
    navigate(href);
  }, [navigate]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            {t("help.subtitle", "SUPPORT CENTER")}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t("help.title", "Help & Documentation")}
          </h1>
        </div>
      </div>

      <div className="relative">
        <div className="relative">
          <SearchIcon size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, steps, FAQs..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <SearchGuide
          query={searchQuery}
          results={searchResults}
          onSelect={handleSearchSelect}
          onClear={() => setSearchQuery("")}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap gap-1 bg-transparent p-0 border-b border-gray-200 dark:border-gray-700 rounded-none w-full overflow-x-auto">
          {[
            { id: "getting-started", label: "Getting Started", icon: HelpIcon },
            ...sections.map((s) => ({ id: s.id, label: s.title, icon: s.icon })),
            { id: "faq", label: "FAQ", icon: HelpIcon },
            { id: "shortcuts", label: "Shortcuts", icon: HelpIcon },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <tab.icon size="xs" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="getting-started">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 text-sm font-bold">1</span>
                  Welcome to the System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  The Dental Clinic Management System helps you manage patients, record treatments,
                  handle billing, and generate reports — all in one place. Use the sidebar on the left
                  to navigate between sections.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-sm font-bold">2</span>
                  Quick Start Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {[
                    "Add a patient via Patients → Add New Patient",
                    "Record a visit with procedures and clinical notes",
                    "Generate invoice and collect payment",
                    "View analytics on the Dashboard and Reports pages",
                    "Export data as PDF or CSV for your records",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold">Navigation Guide</CardTitle>
              <CardDescription>Click any card below to jump directly to that section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveTab(s.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all cursor-pointer"
                  >
                    <s.icon size="lg" className="text-primary" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                      {s.title}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-50 p-2.5 text-primary dark:bg-blue-900/30">
                        <section.icon size="lg" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">✓</span>
                      Step-by-Step Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {section.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {section.tips && section.tips.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <span className="text-amber-500 text-base">💡</span>
                        Pro Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {section.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {section.links && section.links.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold">Quick Links</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {section.links.map((link, i) => (
                        <button
                          key={i}
                          onClick={() => handleNav(link.href)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer text-left"
                        >
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {link.label}
                          </span>
                          <ChevronRightIcon size="xs" className="text-gray-400" />
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Search above or check the FAQ tab for answers to common questions.
                    </p>
                    <button
                      onClick={() => setActiveTab("faq")}
                      className="text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                      Browse FAQs →
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold">
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Click a question to expand the answer. {faqs.length} topics covered.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 rounded-xl border border-gray-200 dark:border-gray-700">
                {faqs.map((faq, i) => (
                  <div key={i} className="last:border-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-4 sm:px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white pr-4">
                        {faq.q}
                      </span>
                      <span className={`text-lg text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>
                        +
                      </span>
                    </button>
                    {openFaq === i && (
                      <div className="px-4 sm:px-6 pb-4 -mt-1">
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
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

        <TabsContent value="shortcuts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                ⌨ Keyboard Shortcuts
              </CardTitle>
              <CardDescription>
                Speed up your workflow with these keyboard shortcuts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.action}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <React.Fragment key={key}>
                          {j > 0 && <span className="text-xs text-gray-400">+</span>}
                          <kbd className="px-2 py-0.5 text-xs font-mono font-bold rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm">
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
