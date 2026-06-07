import { ToothData } from "./types";
import { ToothSvg } from "./ToothSvg";

interface ToothProps {
  tooth: ToothData;
  isUpper: boolean;
  onClick: (tooth: ToothData) => void;
  onMeasurementChange?: (surface: string, value: number) => void;
  selected?: boolean;
}

export function Tooth({
  tooth,
  onClick,
  selected = false,
}: Omit<ToothProps, 'isUpper'> & { isUpper?: boolean }) {

  return (
    <div
      onClick={() => onClick(tooth)}
      className={[
        "relative flex flex-col items-center cursor-pointer select-none transition-transform",
        selected ? "scale-105" : "",
      ].join(" ")}
      role="button"
      tabIndex={0}
      aria-selected={selected}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick(tooth);
        }
      }}
    >
      <ToothSvg tooth={tooth} size={32} selected={selected} />

      <div className={[
        "mt-1 text-[10px] font-medium transition-colors",
        selected ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white",
      ].join(" ")}>
        {tooth.number}
      </div>
    </div>
  );
}