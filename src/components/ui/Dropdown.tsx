import * as React from "react";
import { cn } from "../../lib/utils";

export interface DropdownProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  content,
  align = "start",
  sideOffset = 8,
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const actualIsOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : isOpen;

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (controlledIsOpen === undefined) {
        setIsOpen(open);
      }
      onOpenChange?.(open);
    },
    [controlledIsOpen, onOpenChange],
  );

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      handleOpenChange(false);
    };

    if (actualIsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") handleOpenChange(false);
      });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actualIsOpen, handleOpenChange]);

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  return (
    <div className={cn("relative inline-block", className)} ref={triggerRef}>
      <div onClick={() => handleOpenChange(!actualIsOpen)}>{trigger}</div>
      {actualIsOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 mt-2 min-w-32 rounded-md bg-popover border border-border p-1 shadow-md",
            alignClasses[align],
          )}
          style={{ marginTop: sideOffset }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
}

const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, destructive, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "hover:bg-accent",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
DropdownItem.displayName = "DropdownItem";

export { Dropdown, DropdownItem };
