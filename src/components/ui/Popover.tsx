import React, {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Placement = "top" | "bottom" | "left" | "right";

interface Position {
  top: number;
  left: number;
  placement: Placement;
}

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;

  /**
   * Preferred placement
   * @default "bottom"
   */
  placement?: Placement;

  /**
   * Gap between trigger and popover
   * @default 12
   */
  offset?: number;

  /**
   * Close when clicking outside
   * @default true
   */
  closeOnOutsideClick?: boolean;

  /**
   * Custom class names
   */
  className?: string;
}

const VIEWPORT_PADDING = 12;

const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  placement = "bottom",
  offset = 12,
  closeOnOutsideClick = true,
  className = "",
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  const [position, setPosition] = useState<Position | null>(
    null,
  );

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect =
      triggerRef.current.getBoundingClientRect();

    const popoverRect =
      popoverRef.current.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const placements: Placement[] = [
      placement,
      "bottom",
      "top",
      "right",
      "left",
    ];

    const fits = (p: Placement) => {
      switch (p) {
        case "bottom":
          return (
            triggerRect.bottom +
              offset +
              popoverRect.height +
              VIEWPORT_PADDING <
            viewportHeight
          );

        case "top":
          return (
            triggerRect.top -
              offset -
              popoverRect.height -
              VIEWPORT_PADDING >
            0
          );

        case "right":
          return (
            triggerRect.right +
              offset +
              popoverRect.width +
              VIEWPORT_PADDING <
            viewportWidth
          );

        case "left":
          return (
            triggerRect.left -
              offset -
              popoverRect.width -
              VIEWPORT_PADDING >
            0
          );

        default:
          return false;
      }
    };

    const bestPlacement =
      placements.find((p) => fits(p)) ?? placement;

    let top = 0;
    let left = 0;

    switch (bestPlacement) {
      case "bottom":
        top = triggerRect.bottom + offset;
        left =
          triggerRect.left +
          triggerRect.width / 2 -
          popoverRect.width / 2;
        break;

      case "top":
        top =
          triggerRect.top -
          popoverRect.height -
          offset;

        left =
          triggerRect.left +
          triggerRect.width / 2 -
          popoverRect.width / 2;
        break;

      case "right":
        top =
          triggerRect.top +
          triggerRect.height / 2 -
          popoverRect.height / 2;

        left = triggerRect.right + offset;
        break;

      case "left":
        top =
          triggerRect.top +
          triggerRect.height / 2 -
          popoverRect.height / 2;

        left =
          triggerRect.left -
          popoverRect.width -
          offset;
        break;
    }

    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        left,
        viewportWidth -
          popoverRect.width -
          VIEWPORT_PADDING,
      ),
    );

    top = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        top,
        viewportHeight -
          popoverRect.height -
          VIEWPORT_PADDING,
      ),
    );

    setPosition({
      top,
      left,
      placement: bestPlacement,
    });
  }, [placement, offset]);

  useEffect(() => {
    if (open) {
      setPosition(null);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      calculatePosition();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, calculatePosition]);

  useEffect(() => {
    if (!open) return;

    const handleResize = () => {
      calculatePosition();
    };

    const handleScroll = () => {
      calculatePosition();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener(
      "scroll",
      handleScroll,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );

      window.removeEventListener(
        "scroll",
        handleScroll,
        true,
      );
    };
  }, [open, calculatePosition]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () =>
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
  }, [open]);

  useEffect(() => {
    if (!open || !closeOnOutsideClick) return;

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        !popoverRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutside,
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutside,
      );
  }, [open, closeOnOutsideClick]);

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex"
      >
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="cursor-pointer"
        >
          {trigger}
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              visibility: position
                ? "visible"
                : "hidden",
            }}
            className={`
              fixed
              z-[9999]
              min-w-[260px]
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-xl
              dark:bg-slate-900
              dark:border-slate-800
              ${className}
            `}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
};

export default Popover;