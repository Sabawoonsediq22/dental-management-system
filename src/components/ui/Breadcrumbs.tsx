import * as React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeBreadcrumbIcon,
} from "../../shared/icons/icons";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  separatorClassName?: string;
  isRTL?: boolean;
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ items, className, separatorClassName, isRTL = false }, ref) => {
    if (!items || items.length === 0) return null;

    const handleClick = (item: BreadcrumbItem, e: React.MouseEvent) => {
      if (item.onClick) {
        e.preventDefault();
        item.onClick();
      }
    };

    const iconMargin = isRTL ? "ml-1" : "mr-1";
    const SeparatorIcon = isRTL ? ChevronLeftIcon : ChevronRightIcon;

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex items-center flex-wrap gap-1 text-sm", className)}
      >
        <ol className="flex items-center flex-wrap gap-1">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isFirst = index === 0;

            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <SeparatorIcon
                    className={cn(
                      "h-4 w-4 text-muted-foreground/60 mx-1 transition-transform duration-200",
                      separatorClassName,
                    )}
                  />
                )}
                <div className="relative">
                  {isLast ? (
                    <span
                      className={cn(
                        "font-medium text-foreground",
                        "px-2 py-1 rounded-md bg-accent/30",
                      )}
                      aria-current="page"
                    >
                      {isFirst && (
                        <HomeBreadcrumbIcon
                          className={cn(
                            "h-4 w-4 inline-block",
                            iconMargin,
                            "-mt-0.5",
                          )}
                        />
                      )}
                      {item.label}
                    </span>
                  ) : (
                    <NavLink
                      to={item.href || "#"}
                      onClick={(e) => handleClick(item, e)}
                      className={cn(
                        "text-muted-foreground hover:text-foreground",
                        "px-2 py-1 rounded-md transition-all duration-200 ease-out",
                        "hover:bg-accent/50 hover:shadow-sm",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        "group relative overflow-hidden inline-flex items-center",
                      )}
                    >
                      {isFirst && (
                        <HomeBreadcrumbIcon
                          className={cn("h-4 w-4", iconMargin, "-mt-0.5")}
                        />
                      )}
                      <span className="relative z-10">{item.label}</span>
                      <span
                        className={cn(
                          "absolute inset-0 opacity-0 group-hover:opacity-100",
                          "transition-opacity duration-500",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute inset-0 bg-linear-to-r from-transparent via-primary/10 to-transparent",
                            "-translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out",
                            isRTL &&
                              "!bg-gradient-to-l !-translate-x-full group-hover:translate-x-0",
                          )}
                        />
                      </span>
                    </NavLink>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  },
);

Breadcrumbs.displayName = "Breadcrumbs";

export { Breadcrumbs };
