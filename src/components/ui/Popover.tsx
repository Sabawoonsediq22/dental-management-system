import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontalIcon } from "../../shared/icons/icons";
export interface PopoverAction {
  label: string;
  onClick: () => void;
  className?: string;
}

interface ActionPopoverProps {
  actions: PopoverAction[];
}

export const Popover: React.FC<ActionPopoverProps> = ({
  actions,
}) => {
  const [open, setOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    setPosition({
      top: rect.bottom + 8,
      left: rect.right - 180,
    });
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
      >
        <MoreHorizontalIcon />
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              top: position.top,
              left: position.left,
            }}
            className="fixed z-[9999] w-44 rounded-xl border bg-white p-1 shadow-lg dark:bg-zinc-900"
          >
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 ${action.className ?? ""}`}
              >
                {action.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};