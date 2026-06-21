import { useEffect } from "react";

export function useKeyboardShortcut(
  key: string,
  callback: (e: KeyboardEvent) => void,
  modifier?: "ctrl" | "meta" | "alt",
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modifier === "ctrl") {
        if (e.ctrlKey && e.key.toLowerCase() === key.toLowerCase()) {
          e.preventDefault();
          callback(e);
        }
      } else if (modifier === "meta") {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key.toLowerCase()) {
          e.preventDefault();
          callback(e);
        }
      } else if (modifier === "alt") {
        if (e.altKey && e.key.toLowerCase() === key.toLowerCase()) {
          e.preventDefault();
          callback(e);
        }
      } else {
        if (e.key.toLowerCase() === key.toLowerCase()) {
          callback(e);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, callback, modifier]);
}
