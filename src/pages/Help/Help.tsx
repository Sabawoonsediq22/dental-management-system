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

const sectionConfig = [
  { id: "dashboard", icon: DashboardIcon },
  { id: "patients", icon: PatientIcon },
  { id: "visits", icon: ToothIcon },
  { id: "billing", icon: BillingIcon },
  { id: "reports", icon: ReportsIcon },
  { id: "settings", icon: SettingsIcon },
] as const;

const shortcutsConfig = [
  { keys: ["Ctrl", "K"] as const },
  { keys: ["Ctrl", "N"] as const },
  { keys: ["Ctrl", "B"] as const },
  { keys: ["Ctrl", "R"] as const },
  { keys: ["Ctrl", "D"] as const },
  { keys: ["Ctrl", ","] as const },
  { keys: ["?"] as const },
];

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
          {t("help.search.resultsCount", { count: results.length, plural: results.length === 1 ? t("help.search.result") : t("help.search.results") })}
        </span>
        <button onClick={onClear} className="text-xs text-primary hover:underline cursor-pointer">
          {t("help.search.clear", "Clear")}
        </button>
      </div>
      {results.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-400">
          {t("help.search.noResults", { query })}
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

  const sections = useMemo<GuideEntry[]>(() => {
    return sectionConfig.map(({ id, icon }) => {
      const baseKey = `help.guide.${id}`;
      const steps: string[] = [];
      for (let i = 1; i <= 10; i++) {
        const key = `${baseKey}.step${i}`;
        const val = t(key);
        if (typeof val === "string" && val !== key) {
          steps.push(val);
        }
      }
      const tips: string[] = [];
      for (let i = 1; i <= 10; i++) {
        const key = `${baseKey}.tip${i}`;
        const val = t(key);
        if (typeof val === "string" && val !== key) {
          tips.push(val);
        }
      }
      const links: { label: string; href: string }[] = [];
      const hrefs: Record<string, string> = {
        dashboard: "/dashboard",
        patients: "/patients",
        visits: "/patients",
        billing: "/billing",
        reports: "/reports",
        settings: "/settings",
      };
      for (let i = 1; i <= 5; i++) {
        const key = `${baseKey}.link${i}`;
        const val = t(key);
        if (typeof val === "string" && val !== key) {
          links.push({ label: val, href: hrefs[id] || "/" });
        }
      }
      return { id, title: t(`${baseKey}.title`), description: t(`${baseKey}.description`), icon, steps, tips, links };
    });
  }, [t]);

  const faqs = useMemo(() => {
    const result: { q: string; a: string }[] = [];
    for (let i = 1; i <= 10; i++) {
      const qKey = `help.faq.q${i}`;
      const aKey = `help.faq.a${i}`;
      const q = t(qKey);
      const a = t(aKey);
      if (typeof q === "string" && q !== qKey) {
        result.push({ q, a });
      }
    }
    return result;
  }, [t]);

  const shortcuts = useMemo(() => {
    const actions = [
      "openSearch",
      "newPatient",
      "goToBilling",
      "goToReports",
      "goToDashboard",
      "openSettings",
      "openHelp",
    ];
    return shortcutsConfig.map((item, i) => ({
      keys: item.keys,
      action: t(`help.shortcuts.${actions[i]}`),
    }));
  }, [t]);

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
  }, [searchQuery, sections, faqs]);

  const handleSearchSelect = useCallback((id: string) => {
    setActiveTab(id);
    setSearchQuery("");
  }, []);

  const handleNav = useCallback((href: string) => {
    navigate(href);
  }, [navigate]);

  const tabs = useMemo(() => [
    { id: "getting-started", label: t("help.tabs.gettingStarted"), icon: HelpIcon },
    ...sections.map((s) => ({ id: s.id, label: s.title, icon: s.icon })),
    { id: "faq", label: t("help.tabs.faq"), icon: HelpIcon },
    { id: "shortcuts", label: t("help.tabs.shortcuts"), icon: HelpIcon },
  ], [t, sections]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            {t("help.subtitle")}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t("help.title")}
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
            placeholder={t("help.searchPlaceholder")}
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
        <TabsList className="flex-wrap gap-2 bg-transparent p-2 border-b border-gray-200 dark:border-gray-700 rounded-none w-full overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none dark:hover:text-gray-300 transition-colors bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer"
            >
              <tab.icon size="xs" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="getting-started" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 text-sm font-bold">1</span>
                  {t("help.gettingStarted.welcomeTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white dark:bg-gray-800 rounded-b-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t("help.gettingStarted.welcomeDesc")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-sm font-bold">2</span>
                  {t("help.gettingStarted.quickStartTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white dark:bg-gray-800 rounded-b-lg">
                <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {(t("help.gettingStarted.quickStartSteps", { returnObjects: true }) as unknown as string[]).map((step, i) => (
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
              <CardTitle className="text-base sm:text-lg font-semibold">{t("help.gettingStarted.navGuideTitle")}</CardTitle>
              <CardDescription>{t("help.gettingStarted.navGuideDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="bg-white dark:bg-gray-800 rounded-b-lg">
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
                      <span className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{"\u2713"}</span>
                      {t("help.section.stepByStep")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-gray-800 rounded-b-lg">
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
                        <span className="text-amber-500 text-base">{"\uD83D\uDCA1"}</span>
                        {t("help.section.proTips")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="bg-white dark:bg-gray-800 rounded-b-lg">
                      <ul className="space-y-2">
                        {section.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className="text-amber-500 mt-0.5">{"\u2022"}</span>
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
                      <CardTitle className="text-sm font-semibold">{t("help.section.quickLinks")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 bg-white dark:bg-gray-800 rounded-b-lg">
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
                    <CardTitle className="text-sm font-semibold">{t("help.section.needHelp")}</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-gray-800 rounded-b-lg space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {t("help.section.needHelpDesc")}
                    </p>
                    <button
                      onClick={() => setActiveTab("faq")}
                      className="text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                      {t("help.section.browseFaqs")}
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
                {t("help.faq.title")}
              </CardTitle>
              <CardDescription>
                {t("help.faq.description", { count: faqs.length })}
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white dark:bg-gray-800 rounded-b-lg space-y-2">
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
                {"\u2328"} {t("help.shortcuts.title")}
              </CardTitle>
              <CardDescription>
                {t("help.shortcuts.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white dark:bg-gray-800 rounded-b-lg">
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
