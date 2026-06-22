import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SearchIcon, ChevronRightIcon } from "../../shared/icons/icons";
import { cn } from "../../lib/utils";
import { useDebounce } from "../../hooks/useDebounce";
import { api } from "../../lib/api";
import type { SearchResult } from "../../types/SearchTypes";
import { useRecentSearches } from "../../hooks/useDebounce";
import { Input } from "../ui";

const categoryIcons: Record<string, React.ReactNode> = {
  patient: <span className="text-lg">👤</span>,
  invoice: <span className="text-lg">📄</span>,
  receipt: <span className="text-lg">🧾</span>,
  visit: <span className="text-lg">📋</span>,
  treatment: <span className="text-lg">🦷</span>,
  payment: <span className="text-lg">💰</span>,
};

const categoryLabels: Record<string, string> = {
  patient: "PATIENTS",
  invoice: "INVOICES",
  receipt: "RECEIPTS",
  visit: "VISITS",
  treatment: "TREATMENTS",
  payment: "PAYMENTS",
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
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const { getSearches, addSearch, removeSearch } = useRecentSearches();
  const recentSearches = getSearches();
  const isRTL = i18n.language === "ps";

  const showRecent = debouncedQuery.length === 0;
  const flatResults = React.useMemo(() => results, [results]);

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await api.search.globalSearch(debouncedQuery.trim());
        setResults(data);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (flatResults.length > 0) {
          setSelectedIndex((prev) => {
            const next = prev < flatResults.length - 1 ? prev + 1 : 0;
            scrollToIndex(next);
            return next;
          });
        }
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (flatResults.length > 0) {
          setSelectedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : flatResults.length - 1;
            scrollToIndex(next);
            return next;
          });
        }
      }
      if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < flatResults.length) {
        e.preventDefault();
        handleSelect(flatResults[selectedIndex]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatResults, selectedIndex, onClose]);

  const scrollToIndex = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-search-index]");
    const target = items[index] as HTMLElement | undefined;
    target?.scrollIntoView({ block: "nearest" });
  };

  const handleSelect = (result: SearchResult) => {
    addSearch(query.trim());
    onClose();
    if (result.route) {
      navigate(result.route);
    }
  };

  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery);
    addSearch(recentQuery);
  };

  const handleClearRecent = (e: React.MouseEvent, recentQuery: string) => {
    e.stopPropagation();
    removeSearch(recentQuery);
  };

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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative z-50 w-full max-w-xl mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden",
          isRTL && "direction-rtl",
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input */}
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
          {query && (
            <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              ESC
            </span>
          )}
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className={cn(
            "max-h-[60vh] overflow-y-auto",
            isRTL && "text-right",
          )}
        >
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {!loading && showRecent && recentSearches.length > 0 && (
            <div className="p-2">
              <div className={cn(
                "flex items-center justify-between px-2 py-2",
                isRTL && "flex-row-reverse",
              )}>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("search.recentSearches", "Recent Searches")}
                </span>
                <button
                  onClick={() => {
                    localStorage.removeItem("dental-recent-searches");
                    setResults([]);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {t("search.clearAll", "Clear All")}
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((recent, index) => (
                  <div
                    key={`${recent}-${index}`}
                    onClick={() => handleRecentClick(recent)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300",
                      "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer",
                      isRTL && "flex-row-reverse text-right",
                    )}
                  >
                    <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                      <SearchIcon className="h-4 w-4 text-gray-400 shrink-0" />
                      <span>{recent}</span>
                    </div>
                    <button
                      onClick={(e) => handleClearRecent(e, recent)}
                      className={cn(
                        "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded cursor-pointer",
                        isRTL && "order-first",
                      )}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !showRecent && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("search.emptyTitle", "No results found")}
              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {t("search.emptySubtitle", "Try searching by:")}
                <ul className="mt-1 space-y-0.5">
                  <li>• {t("search.hints.patientName", "Patient Name")}</li>
                  <li>• {t("search.hints.phone", "Phone Number")}</li>
                  <li>• {t("search.hints.patientId", "Patient ID")}</li>
                  <li>• {t("search.hints.invoiceNumber", "Invoice Number")}</li>
                  <li>• {t("search.hints.treatmentName", "Treatment Name")}</li>
                </ul>
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="p-2 space-y-3">
              {Object.entries(groupedResults).map(([type, typeResults]) => {
                const startIndex = flatResults.indexOf(typeResults[0]);
                return (
                  <div key={type}>
                    <div className={cn(
                      "px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                      isRTL && "text-right",
                    )}>
                      {categoryLabels[type] || type.toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      {typeResults.map((result, idx) => {
                        const globalIndex = startIndex + idx;
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            data-search-index={globalIndex}
                            onClick={() => handleSelect(result)}
                            className={cn(
                              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer",
                              isRTL && "flex-row-reverse text-right",
                              isSelected
                                ? "bg-primary text-white"
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
                                "text-xs truncate",
                                isSelected ? "text-white/80" : "text-gray-500 dark:text-gray-400",
                              )}>
                                {result.subtitle}
                              </p>
                            </div>
                            <ChevronRightIcon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isSelected ? "text-white" : "text-gray-400",
                                isRTL && "transform rotate-180",
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
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
export type { SearchModalProps };
