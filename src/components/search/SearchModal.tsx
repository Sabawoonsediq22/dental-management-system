import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  SearchIcon,
  ChevronRightIcon,
  PatientIcon,
  ReceiptIcon,
  PaymentIcon,
  ToothIcon,
  ActivityIcon,
} from "../../shared/icons/icons";
import { cn } from "../../lib/utils";
import { useDebounce } from "../../hooks/useDebounce";
import { api } from "../../lib/api";
import type { SearchResult } from "../../types/SearchTypes";
import { useRecentSearches } from "../../hooks/useDebounce";
import { Input } from "../ui";

const categoryIcons: Record<string, React.ReactNode> = {
  patient: <PatientIcon size="sm" />,
  invoice: <ReceiptIcon size="sm" />,
  receipt: <ReceiptIcon size="sm" />,
  visit: <ActivityIcon size="sm" />,
  treatment: <ToothIcon size="sm" />,
  payment: <PaymentIcon size="sm" />,
};

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [recentVersion, setRecentVersion] = React.useState(0);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const { getSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();
  const recentSearches = React.useMemo(() => getSearches(), [recentVersion, getSearches]);
  const isRTL = i18n.language === "ps";

  const categoryLabels = React.useMemo((): Record<string, string> => ({
    patient: t("search.category.patients", "PATIENTS"),
    invoice: t("search.category.invoices", "INVOICES"),
    receipt: t("search.category.receipts", "RECEIPTS"),
    visit: t("search.category.visits", "VISITS"),
    treatment: t("search.category.treatments", "TREATMENTS"),
    payment: t("search.category.payments", "PAYMENTS"),
  }), [t]);

  const showRecent = debouncedQuery.length === 0;

  const resetState = React.useCallback(() => {
    setQuery("");
    setResults([]);
    setSelectedIndex(-1);
    setRecentVersion((v) => v + 1);
  }, []);

  const handleSelect = React.useCallback((result: SearchResult) => {
    const q = query.trim();
    if (q) {
      addSearch(q);
      setRecentVersion((v) => v + 1);
    }
    onClose();
    if (result.route) {
      navigate(result.route);
    }
  }, [query, addSearch, onClose, navigate]);

  React.useEffect(() => {
    if (isOpen) {
      resetState();
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen, resetState]);

  React.useEffect(() => {
    let cancelled = false;
    const q = debouncedQuery.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.search.globalSearch(q)
      .then((data) => {
        if (cancelled) return;
        setResults(data);
        setSelectedIndex(-1);
        if (listRef.current) {
          listRef.current.scrollTop = 0;
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Search failed:", error);
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev < results.length - 1 ? prev + 1 : 0;
          scrollToIndex(next);
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : results.length - 1;
          scrollToIndex(next);
          return next;
        });
      } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, handleSelect]);

  const scrollToIndex = React.useCallback((index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-search-index]");
    const target = items[index] as HTMLElement | undefined;
    target?.scrollIntoView({ block: "nearest" });
  }, []);

  const handleRecentClick = React.useCallback((recentQuery: string) => {
    setQuery(recentQuery);
    addSearch(recentQuery);
    setRecentVersion((v) => v + 1);
  }, [addSearch]);

  const handleClearRecent = React.useCallback((e: React.MouseEvent, recentQuery: string) => {
    e.stopPropagation();
    removeSearch(recentQuery);
    setRecentVersion((v) => v + 1);
  }, [removeSearch]);

  const clearAllRecent = React.useCallback(() => {
    clearSearches();
    setRecentVersion((v) => v + 1);
  }, [clearSearches]);

  const groupedResults = React.useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const result of results) {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    }
    return groups;
  }, [results]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" dir={isRTL ? "rtl" : "ltr"}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative z-50 w-full max-w-xl mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t("search.openGlobalSearch", "Global search")}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-200 dark:border-gray-700">
          <SearchIcon className="h-5 w-5 text-gray-400 shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder", "Search patients or records by id, name or phone...")}
            className={cn(
               "flex-1 h-full bg-transparent text-sm text-gray-900 dark:text-white",
               "placeholder:text-gray-400 dark:placeholder:text-gray-500",
               "border-none focus:ring-0! focus:ring-offset-0!",
               isRTL ? "text-right" : "text-left",
             )}
           />
          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">
            ESC
          </span>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="p-4 space-y-4">
              {Array.from({ length: 2 }).map((_, gi) => (
                <div key={gi}>
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  {Array.from({ length: 2 }).map((_, ri) => (
                    <div key={ri} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-2.5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {!loading && showRecent && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("search.recentSearches", "Recent Searches")}
                </span>
                <button
                  onClick={clearAllRecent}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {t("search.clearAll", "Clear All")}
                </button>
              </div>
              <div className="space-y-0.5">
                {recentSearches.map((recent, index) => (
                  <div
                    key={`${recent}-${index}`}
                    onClick={() => handleRecentClick(recent)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300",
                      "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <SearchIcon className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="truncate">{recent}</span>
                    </div>
                    <button
                      onClick={(e) => handleClearRecent(e, recent)}
                      className="text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                      aria-label={`Remove ${recent}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !showRecent && results.length === 0 && (
            <div className="px-4 py-10 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("search.emptyTitle", "No results found")}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("search.emptySubtitle", "Try searching by:")}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {[
                  t("search.hints.patientName", "Patient Name"),
                  t("search.hints.phone", "Phone Number"),
                  t("search.hints.patientId", "Patient ID"),
                  t("search.hints.invoiceNumber", "Invoice Number"),
                  t("search.hints.treatmentName", "Treatment Name"),
                ].map((hint) => (
                  <span
                    key={hint}
                    className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    {hint}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="p-2 space-y-4">
              <div className="flex items-center justify-between px-2 pb-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
                </span>
              </div>
              {Object.entries(groupedResults).map(([type, typeResults]) => {
                const startIndex = results.indexOf(typeResults[0]);
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {categoryLabels[type] || type.toUpperCase()}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-medium">
                        {typeResults.length}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {typeResults.map((result, idx) => {
                        const globalIndex = startIndex + idx;
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            data-search-index={globalIndex}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={cn(
                              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all cursor-pointer",
                              isSelected
                                ? "bg-primary text-white shadow-sm"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700",
                            )}
                          >
                            <div className={cn(
                              "shrink-0",
                              !isSelected && "text-gray-500 dark:text-gray-400",
                              isSelected && "text-white",
                            )}>
                              {categoryIcons[result.type] || <SearchIcon className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm font-medium truncate",
                                isSelected ? "text-white" : "text-gray-900 dark:text-white",
                              )}>
                                {result.title}
                              </p>
                              <p className={cn(
                                "text-xs truncate mt-0.5",
                                isSelected ? "text-white/80" : "text-gray-500 dark:text-gray-400",
                              )}>
                                {result.subtitle}
                              </p>
                            </div>
                            <ChevronRightIcon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isSelected ? "text-white" : "text-gray-400",
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && showRecent && recentSearches.length === 0 && (
            <div className="px-4 py-10 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("search.placeholder", "Search patients or records by id, name or phone...")}
              </p>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {t("search.hints.patientName", "Patient Name")} &middot;{" "}
                {t("search.hints.phone", "Phone Number")} &middot;{" "}
                {t("search.hints.patientId", "Patient ID")}
              </p>
              <p className="mt-4 text-[10px] text-gray-400 dark:text-gray-500">
                Use <kbd className="px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-[10px] font-mono">↑</kbd> <kbd className="px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-[10px] font-mono">↓</kbd> to navigate &middot; <kbd className="px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-[10px] font-mono">Enter</kbd> to select &middot; <kbd className="px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-[10px] font-mono">Esc</kbd> to close
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
export type { SearchModalProps };
