import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useRecentSearches(maxItems = 10) {
  const STORAGE_KEY = "dental-recent-searches";

  const getSearches = (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const addSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const current = getSearches().filter((s) => s !== trimmed);
    const updated = [trimmed, ...current].slice(0, maxItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const removeSearch = (query: string) => {
    const updated = getSearches().filter((s) => s !== query);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearSearches = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return { getSearches, addSearch, removeSearch, clearSearches };
}

export function useSearchHistory(maxItems = 10) {
  return useRecentSearches(maxItems);
}
