import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BreadcrumbItem } from "../../components/ui";

export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const location = useLocation();
  const params = useParams();
  const { t } = useTranslation();

  return useMemo(() => {
    const pathnames = location.pathname.split("/").filter((x) => x);

    const breadcrumbMap: Record<string, string> = {
      dashboard: t("nav.dashboard"),
      patients: t("nav.patients"),
      billing: t("nav.billings"),
      reports: t("nav.reports"),
      settings: t("nav.settings"),
      about: t("nav.about"),
      help: t("nav.help"),
      new: t("patients.new") || "New Patient",
    };

    const buildBreadcrumbs = (): BreadcrumbItem[] => {
      const breadcrumbs: BreadcrumbItem[] = [{ label: t("nav.dashboard"), href: "/dashboard" }];

      let currentPath = "";
      pathnames.forEach((pathname, index) => {
        currentPath += `/${pathname}`;
        const isLast = index === pathnames.length - 1;

        // Handle dynamic segments (e.g., :id)
        if (pathname.startsWith(":")) {
          const paramKey = pathname.slice(1);
          const paramValue = params[paramKey];
          if (paramValue) {
            breadcrumbs.push({
              label: paramValue,
              href: isLast ? undefined : currentPath,
            });
          }
          return;
        }

        const label = breadcrumbMap[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1);
        
        breadcrumbs.push({
          label,
          href: isLast ? undefined : currentPath,
        });
      });

      // If we're at root or dashboard, just show dashboard as active
      if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === "dashboard")) {
        return [{ label: t("nav.dashboard"), href: undefined }];
      }

      return breadcrumbs;
    };

    return buildBreadcrumbs();
  }, [location.pathname, params, t]);
};