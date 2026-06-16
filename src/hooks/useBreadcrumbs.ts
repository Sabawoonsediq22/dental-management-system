import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BreadcrumbItem } from "../components/ui";
import { usePatient } from "./usePatients";

export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const location = useLocation();
  const { t } = useTranslation();

  const patientId = useMemo(() => {
    const match = location.pathname.match(/^\/patients\/([^/]+)$/);
    return match?.[1] || "";
  }, [location.pathname]);

  const { data: patient, isLoading } = usePatient(patientId);

  return useMemo(() => {
    const pathnames = location.pathname.split("/").filter(Boolean);

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
      const breadcrumbs: BreadcrumbItem[] = [
        { label: t("nav.dashboard"), href: "/dashboard" },
      ];

      let currentPath = "";

      pathnames.forEach((pathname, index) => {
        currentPath += `/${pathname}`;
        const isLast = index === pathnames.length - 1;

        // Replace the ID in /patients/:id with the patient's name
        if (
          pathnames[0] === "patients" &&
          index === 1 &&
          pathname !== "new"
        ) {
          breadcrumbs.push({
            label: isLoading
              ? "Loading..."
              : patient?.full_name || pathname,
            href: isLast ? undefined : currentPath,
          });
          return;
        }

        const label =
          breadcrumbMap[pathname] ||
          pathname.charAt(0).toUpperCase() + pathname.slice(1);

        breadcrumbs.push({
          label,
          href: isLast ? undefined : currentPath,
        });
      });

      if (
        pathnames.length === 0 ||
        (pathnames.length === 1 && pathnames[0] === "dashboard")
      ) {
        return [{ label: t("nav.dashboard"), href: undefined }];
      }

      return breadcrumbs;
    };

    return buildBreadcrumbs();
  }, [location.pathname, t, patient?.full_name, isLoading]);
};