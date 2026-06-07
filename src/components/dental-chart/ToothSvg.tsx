import { ToothData } from "./types";

interface ToothSvgProps {
  tooth: ToothData;
  size: number;
  selected?: boolean;
}

export function ToothSvg({ tooth, size, selected = false }: ToothSvgProps) {
  const isUpper = tooth.number >= 1 && tooth.number <= 7;
  const isAnterior = tooth.number <= 3;
  const isPremolar = tooth.number === 4 || tooth.number === 5;

  const toothColor = tooth.missing
    ? "#d1d5db"
    : tooth.implant
      ? "#3b82f6"
      : tooth.crown
        ? "#10b981"
        : tooth.rootCanal
          ? "#8b5cf6"
          : "#ffffff";

  const borderColor = selected
    ? "#3b82f6"
    : tooth.missing
      ? "#ef4444"
      : tooth.rootCanal
        ? "#8b5cf6"
        : "#374151";

  const strokeWidth = selected ? 2.5 : 1.5;

  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 24 32"
      className="transition-all"
    >
      {/* Crown outline - anatomically inspired shape */}
      <g transform={isUpper ? "" : "translate(0, 2)"}>
        <path
          d={
            isAnterior
              ? // Anterior tooth: narrower, more rectangular crown with single root
                `M7 8
                 C5 8, 3.5 9.5, 3.5 11.5
                 L4 18
                 C4 19, 5 20, 6 20
                 L18 20
                 C19 20, 20 19, 20 18
                 L20.5 11.5
                 C20.5 9.5, 19 8, 17 8
                 Z`
              : isPremolar
                ? // Premolar: moderate crown with 2 roots
                  `M6 6
                   C4.5 6, 3 7, 3 9
                   L3.5 16
                   C3.5 17.5, 4.5 19, 6 19
                   L10 19
                   L14 19
                   L18 19
                   C19.5 19, 20.5 17.5, 20.5 16
                   L21 9
                   C21 7, 19.5 6, 18 6
                   Z`
                : // Molar: wider crown with 3 roots (or 2 for lower)
                  `M4 4
                   C2.5 4, 1 5, 1 7
                   L1.5 14
                   C1.5 16, 2.5 18, 4 18
                   L5 18
                   L19 18
                   L20 18
                   C21.5 18, 22.5 16, 22.5 14
                   L23 7
                   C23 5, 21.5 4, 20 4
                   Z`
          }
          fill={toothColor}
          stroke={borderColor}
          strokeWidth={strokeWidth}
        />

        {/* Buccal developmental groove or fissure (posterior) */}
        {!isAnterior && !tooth.missing && (
          <line
            x1="12"
            y1={isPremolar ? 7 : 5}
            x2="12"
            y2="15"
            stroke={borderColor}
            strokeWidth="0.75"
            opacity="0.4"
          />
        )}

        {/* Surface indicators: small diamonds at surface positions */}
        {!tooth.missing && (
          <>
            {/* MB - Mesio-Buccal */}
            <circle cx="7" cy="11" r="1" fill="#f59e0b" opacity="0.8" />
            {/* B - Buccal */}
            <circle cx="12" cy="9" r="1" fill="#f59e0b" opacity="0.8" />
            {/* DB - Disto-Buccal */}
            <circle cx="17" cy="11" r="1" fill="#f59e0b" opacity="0.8" />
            {/* ML - Mesio-Lingual */}
            <circle cx="7" cy="16" r="1" fill="#3b82f6" opacity="0.8" />
            {/* L - Lingual */}
            <circle cx="12" cy="18" r="1" fill="#3b82f6" opacity="0.8" />
            {/* DL - Disto-Lingual */}
            <circle cx="17" cy="16" r="1" fill="#3b82f6" opacity="0.8" />
          </>
        )}
      </g>

      {/* Roots */}
      {!isAnterior && !tooth.missing && (
        <g>
          {isPremolar ? (
            <>
              {/* Mesial root */}
              <path
                d="M8 19 L7 28 C7 30, 6.5 31, 8 31 C9.5 31, 10 30, 10 28 L10 19"
                fill={toothColor}
                stroke={borderColor}
                strokeWidth={strokeWidth}
              />
              {/* Distal root */}
              <path
                d="M16 19 L16 28 C16 30, 15.5 31, 17 31 C18.5 31, 19 30, 19 28 L18 19"
                fill={toothColor}
                stroke={borderColor}
                strokeWidth={strokeWidth}
              />
            </>
          ) : (
            <>
              {/* Mesial root */}
              <path
                d="M7 19 L6 28 C6 30, 5.5 31, 7 31 C8.5 31, 9 30, 9 28 L9 19"
                fill={toothColor}
                stroke={borderColor}
                strokeWidth={1.2}
              />
              {/* Distal root */}
              <path
                d="M15 19 L15 28 C15 30, 14.5 31, 16 31 C17.5 31, 18 30, 18 28 L17 19"
                fill={toothColor}
                stroke={borderColor}
                strokeWidth={1.2}
              />
              {/* Third root (for molars - small behind) */}
              <path
                d="M12 19 L12 28 C12 30, 11.5 31, 13 31 C14.5 31, 14 30, 14 28 L13 19"
                fill={toothColor}
                stroke={borderColor}
                strokeWidth={1}
              />
            </>
          )}
        </g>
      )}

      {/* Single root for anterior teeth */}
      {isAnterior && !tooth.missing && (
        <path
          d="M10 20 L10 28 C10 30, 9.5 31, 11 31 C12.5 31, 13 30, 13 28 L14 20"
          fill={toothColor}
          stroke={borderColor}
          strokeWidth={strokeWidth}
        />
      )}

      {/* Condition indicators */}
      {tooth.implant && (
        <rect x="9" y="26" width="6" height="3" fill="#1e40af" rx="1" />
      )}
      {tooth.crown && (
        <rect x="8" y="5" width="8" height="3" fill="#059669" rx="1" />
      )}
      {tooth.rootCanal && !isAnterior && (
        <line
          x1="12"
          y1="8"
          x2="12"
          y2="24"
          stroke="#7c3aed"
          strokeWidth="2"
          strokeDasharray="2 1"
        />
      )}
    </svg>
  );
}
