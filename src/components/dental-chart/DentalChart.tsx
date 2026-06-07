import { DentalArch } from "./DentalArch";
import { ToothData } from "./types";

interface DentalChartProps {
  onToothSelect?: (tooth: ToothData | undefined) => void;
  onMeasurementChange?: (toothId: string, surface: string, value: number) => void;
  selectedToothIds?: string[];
  teethData?: ToothData[];
}

export default function DentalChart({ onToothSelect, onMeasurementChange, selectedToothIds = [], teethData }: DentalChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      {/* Upper Arch */}
      <div className="mb-4">
        <DentalArch
          position="upper"
          onToothSelect={onToothSelect}
          onMeasurementChange={onMeasurementChange}
          selectedToothIds={selectedToothIds}
          teethData={teethData}
        />
      </div>

      {/* Numbers */}
      <div className="flex justify-center gap-2 md:gap-4 py-2 text-lg font-bold text-gray-900 dark:text-white">
        {[7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7].map((n) => (
          <span key={n} className="w-6 text-center">{n}</span>
        ))}
      </div>

      {/* Lower Arch */}
      <div className="mt-4">
        <DentalArch
          position="lower"
          onToothSelect={onToothSelect}
          onMeasurementChange={onMeasurementChange}
          selectedToothIds={selectedToothIds}
          teethData={teethData}
        />
      </div>
    </div>
  );
}
