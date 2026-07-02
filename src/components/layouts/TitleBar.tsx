import { useState, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { cn } from "../../lib/utils";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { CloseIcon, MaximizeIcon, MinimizeIcon, RestoreIcon } from "../../shared/icons/icons";
import { useKeyboardShortcut } from "../../hooks/useKeyboardShortcut";
import SearchModal from "../search/SearchModal";
import TopHeaderSearch from "../search/SearchHeader";

const appWindow = getCurrentWindow();
const buttonBase =
  "flex items-center justify-center w-[46px] h-full transition-colors duration-150";

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const isRTL = i18n.language === "ps";

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  useKeyboardShortcut("k", openSearch, "ctrl");
  useKeyboardShortcut("k", openSearch, "meta");

  useEffect(() => {
    const checkMaximized = async () => {
      try {
        setIsMaximized(await appWindow.isMaximized());
      } catch {
        // not in Tauri context
      }
    };
    checkMaximized();

    let unlistenResize: (() => void) | undefined;
    let unlistenFocus: (() => void) | undefined;

    const setup = async () => {
      try {
        unlistenResize = await appWindow.onResized(checkMaximized);
        unlistenFocus = await appWindow.onFocusChanged(({ payload: focused }) => {
          setIsFocused(focused);
        });
      } catch {
        // not in Tauri context
      }
    };
    setup();

    return () => {
      unlistenResize?.();
      unlistenFocus?.();
    };
  }, []);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!contextMenuOpen) return;
    const close = () => setContextMenuOpen(false);
    window.addEventListener("click", close);
    window.addEventListener("blur", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("blur", close);
    };
  }, [contextMenuOpen]);

  const handleMinimize = async () => {
    try { await appWindow.minimize(); } catch {}
  };

  const handleMaximizeToggle = async () => {
    try { await appWindow.toggleMaximize(); } catch {}
  };

  const handleClose = async () => {
    try { await appWindow.close(); } catch {}
  };

  const handleDoubleClick = () => {
    handleMaximizeToggle();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  };

  const contextMenuItems = [
    { label: "Restore", disabled: !isMaximized, action: async () => { await appWindow.toggleMaximize(); setContextMenuOpen(false); } },
    { label: "Move", disabled: true, action: () => {} },
    { label: "Size", disabled: true, action: () => {} },
    { label: "Minimize", disabled: false, action: async () => { await appWindow.minimize(); setContextMenuOpen(false); } },
    { label: "Maximize", disabled: isMaximized, action: async () => { await appWindow.toggleMaximize(); setContextMenuOpen(false); } },
    { type: "separator" as const },
    { label: "Close", disabled: false, action: async () => { await appWindow.close(); }, danger: true },
  ];

  return (
    <>
      <div
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className={cn(
          "flex h-9 w-full select-none items-center",
          "border-b",
          isDark
            ? "bg-gray-800 border-[#3c3c3c] text-white"
            : "bg-[#f3f3f3] border-[#d4d4d4] text-black",
          !isFocused && (isDark ? "opacity-70" : "opacity-60"),
          isRTL ? "pr-4" : "pr-2",
        )}
      >
        <div
          data-tauri-drag-region
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          className="flex items-center h-full min-w-0 flex-1"
        >
          <span className="ml-2 text-[13px] font-semibold leading-none tracking-tight select-none shrink-0">
            {t("product.name")}
          </span>
        </div>

        <div className="flex items-center justify-center px-4 shrink-0">
          <TopHeaderSearch onClick={openSearch} className="h-7 w-96 lg:w-lg text-xs" />
        </div>

        <div
          data-tauri-drag-region
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          className="flex h-full items-stretch -mr-2 shrink-0"
        >
          <button
            onClick={handleMinimize}
            aria-label="Minimize"
            className={cn(
              buttonBase,
              isDark
                ? "hover:bg-[#3c3c3c] active:bg-[#505050]"
                : "hover:bg-[#e0e0e0] active:bg-[#cccccc]",
            )}
          >
            <MinimizeIcon size="sm"/>
          </button>

          <button
            onClick={handleMaximizeToggle}
            aria-label={isMaximized ? "Restore" : "Maximize"}
            className={cn(
              buttonBase,
              isDark
                ? "hover:bg-[#3c3c3c] active:bg-[#505050]"
                : "hover:bg-[#e0e0e0] active:bg-[#cccccc]",
            )}
          >
            {isMaximized ? <RestoreIcon size="sm"/> : <MaximizeIcon size="sm"/>}
          </button>

          <button
            onClick={handleClose}
            aria-label="Close"
            className={cn(
              buttonBase,
              "hover:bg-[#e81123] hover:text-white active:bg-[#bf0f1d]",
            )}
          >
            <CloseIcon size="sm"/>
          </button>
        </div>
      </div>

      {contextMenuOpen && (
        <div
          ref={menuRef}
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          className={cn(
            "fixed z-[9999] min-w-50 rounded-md border py-1 shadow-lg bg-white border-[#d4d4d4] text-black",
          )}
        >
          {contextMenuItems.map((item, i) => {
            if ("type" in item && item.type === "separator") {
              return (
                <div
                  key={i}
                  className={cn("mx-2 my-1 h-px bg-whit")}
                />
              );
            }
            return (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => item.action()}
                className={cn(
                  "flex w-full items-center px-4 py-1.5 text-[13px] text-left cursor-pointer",
                  item.danger ? "text-[#e81123]" : "",
                  item.disabled
                    ? "opacity-40 cursor-default"
                    : "hover:bg-gray-100",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  );
}
