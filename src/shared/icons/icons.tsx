// Global reusable SVG icons for the entire project
import React from "react";

interface IconProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

export const DeleteIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);


// Navigation icons
export const DashboardIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

export const CustomersIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

export const OrdersIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);

export const InventoryIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

export const ReportsIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export const CollapseIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
    />
  </svg>
);

export const ExpandIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 5l7 7-7 7M5 5l7 7-7 7"
    />
  </svg>
);

// --- Core dental & implant management icons ---

/** Layout / dashboard home page */
export const LayoutIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"
    />
  </svg>
);

/** Add a new patient, appointment, treatment, etc. */
export const AddIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

/** Close / dismiss a view */
export const CloseIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

/** Calendar or appointment scheduling */
export const CalendarIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} />
    <path strokeLinecap="round" strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

/** Clock / arrival / treatment time */
export const ClockIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="9" strokeWidth={2} />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6l4 2"
    />
  </svg>
);

/** Patient / contact person */
export const PatientIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

/** Dentist / doctor / provider */
export const DoctorIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18 10a6 6 0 01-12 0M12 10v4m4-4a4 4 0 00-12 0v1a4 4 0 004 4h8a4 4 0 004-4v-1z"
    />
  </svg>
);

/** Single healthy tooth */
export const ToothIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7.5 4.5C7.5 2.5 9 1 11 1s3.5 1.5 3.5 3.5.5 2-1 3.5C15 10 18 12 18 15v3a3 3 0 01-3 3c-3.5 0-6.5-2.5-7.5-5-1 1.5-2.5 2.5-2.5 4 0 2 1.5 2.5 2.5 2.5h7A2.5 2.5 0 0019 18V15c0-3-3-5-4-6.5C14.5 6.5 13 5.5 11 5.5S7.5 6.5 7.5 4.5z"
    />
  </svg>
);

/** Tooth with a warning / problem */
export const ToothWarningIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7.5 4.5C7.5 2.5 9 1 11 1s3.5 1.5 3.5 3.5.5 2-1 3.5C15 10 18 12 18 15v3a3 3 0 01-3 3c-3.5 0-6.5-2.5-7.5-5-1 1.5-2.5 2.5-2.5 4 0 2 1.5 2.5 2.5 2.5h7A2.5 2.5 0 0019 18V15c0-3-3-5-4-6.5C14.5 6.5 13 5.5 11 5.5S7.5 6.5 7.5 4.5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01"
    />
  </svg>
);

/** Dental implant */
export const ImplantIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10 3v4M10 8.5H7M10 11.5H7"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8 15.5v4.5h4v-2c0-1.5-1-3-2.5-3s-1.5 1.5-1.5 3v2zM6 21h6"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 14.5a2 2 0 100-4 2 2 0 000 4z"
    />
  </svg>
);

/** Prescription / treatment plan */
export const PrescriptionIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

/** X-ray / radiograph */
export const XRayIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <path
      strokeLinecap="round"
      strokeWidth={2}
      d="M12 7v10M7 12h10M7 7l10 10M7 17l10-10"
    />
    <circle cx="12" cy="12" r="3" strokeWidth={2} />
  </svg>
);

/** Billing / payment */
export const BillingIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={2} />
    <path strokeLinecap="round" strokeWidth={2} d="M2 10h20M7 15h3" />
  </svg>
);

/** Edit / modify a record */
export const EditIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

/** Filter results */
export const FilterIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

/** Chevron down — expandable panels / selects */
export const ChevronDownIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

/** Chevron up — collapse */
export const ChevronUpIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 15l7-7 7 7"
    />
  </svg>
);

/** Sort / reorder */
export const SortIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
    />
  </svg>
);

/** Confirm / action complete */
export const CheckCircleIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/** Cancel / not completed */
export const CrossCircleIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 9l6 6m0-6l-6 6m3 7a9 9 0 100-18 9 9 0 000 18z"
    />
  </svg>
);

/** Error / problem tooth — right-pointing warning triangle */
export const ErrorTriangleIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01" />
  </svg>
);

// Loading Spinner
export const LoadingIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className} animate-spin`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/** About / information page */
export const AboutIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/** Help / support page */
export const HelpIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/** Medical history / health record */
export const MedicalHistoryIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v8M8 12h8"
    />
  </svg>
);

/** Clipboard / visit details icon */
export const VisitDetailsIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-4M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h.01M15 12h.01"
    />
  </svg>
);


// RTL-aware directional icons
// These components automatically swap direction based on the current language

const ChevronLeftIconComponent: React.FC<IconProps> = ({ className, size = "md" }) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const ChevronRightIconComponent: React.FC<IconProps> = ({ className, size = "md" }) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);


export const DirectionalPreviousIcon: React.FC<IconProps> = (props) => {
  // For LTR: use ChevronLeft (points left/back)
  // For RTL: use ChevronRight (points right/back in RTL context)
  const rtl = typeof window !== 'undefined' && document.documentElement.dir === 'rtl';
  return rtl ? <ChevronRightIconComponent {...props} /> : <ChevronLeftIconComponent {...props} />;
};

export const DirectionalNextIcon: React.FC<IconProps> = (props) => {
  // For LTR: use ChevronRight (points right/forward)
  // For RTL: use ChevronLeft (points left/forward in RTL context)
  const rtl = typeof window !== 'undefined' && document.documentElement.dir === 'rtl';
  return rtl ? <ChevronLeftIconComponent {...props} /> : <ChevronRightIconComponent {...props} />;
};

/** Moon icon for dark mode */
export const MoonIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
    />
  </svg>
);

/** Sun icon for light mode */
export const SunIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

/** Chevron right icon for breadcrumbs - LTR */
export const ChevronRightIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 18l6-6-6-6"
    />
  </svg>
);

/** Chevron left icon for breadcrumbs - RTL */
export const ChevronLeftIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 18l-6-6 6-6"
    />
  </svg>
);

/** Search / find */
export const SearchIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

/** Horizontal ellipsis — more actions */
export const MoreHorizontalIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z"
    />
  </svg>
);

/** Home icon for breadcrumbs */
export const HomeIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

/** Arrow left icon for back navigation */
export const ArrowLeftIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

/** Image / photo icon */
export const ImageIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      ry="2"
      strokeWidth={2}
    />
    <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={2} fill="none" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 15l-5-5L5 21"
    />
  </svg>
);

/** phone icon */
export const PhoneIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.443a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 006.105 6.105l1.13-2.257a1 1 0 011.21-.502l4.443 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

/** location icon */
export const LocationIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg className={`${sizeClasses[size]} ${className}`}
   fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
  </svg>
);

/** Plus icon */
export const PlusIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg className={`${sizeClasses[size]} ${className}`} 
    fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
  </svg>
);

/** Download icon */
export const DownloadIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

/** TechMark icon */
export const TechMarkIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

export const CurrencyIcon: React.FC<IconProps> = ({
  className = "",
  size = "md",
}) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v2m0 8v2M6 12h2m8 0h2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-4-6l4-4m0 0l4-4m-4 4l-4-4m4 4l4 4"
    />
  </svg>
);