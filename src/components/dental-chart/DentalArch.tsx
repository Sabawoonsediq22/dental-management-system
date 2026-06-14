import { Tooth } from "./Tooth";
import { ToothData } from "./types";

interface DentalArchProps {
   position: "upper" | "lower";
   onToothSelect?: (tooth: ToothData | undefined) => void;
   onMeasurementChange?: (toothId: string, surface: string, value: number) => void;
   selectedToothIds?: string[];
   teethData?: ToothData[];
}

export function DentalArch({
   position,
   onToothSelect,
   onMeasurementChange,
   selectedToothIds = [],
   teethData,
}: DentalArchProps) {
   const leftTeeth: number[] = position === "upper" ? [27, 26, 25, 24, 23, 22, 21] : [37, 36, 35, 34, 33, 32, 31];
   const rightTeeth: number[] = position === "upper" ? [11, 12, 13, 14, 15, 16, 17] : [41, 42, 43, 44, 45, 46, 47];

   const teethingOrder = [...leftTeeth, ...rightTeeth].map((fdi) => {
      const existing = teethData?.find((t) => parseInt(t.id, 10) === fdi);
      const side = fdi >= 11 && fdi <= 17 ? "Right" : "Left";
      const quadrant = position === "upper" 
         ? `Upper ${side}` 
         : `Lower ${side}`;
      if (existing) return existing;
      return { id: fdi.toString(), number: fdi % 10, missing: false, quadrant };
   });

  return (
    <div className="flex justify-center">
      <div className="flex items-end gap-1 md:gap-2">
        {teethingOrder.map((tooth) => (
          <Tooth
            key={tooth.id}
            tooth={tooth}
            isUpper={position === "upper"}
            onClick={() => onToothSelect?.(tooth)}
            onMeasurementChange={(surface, value) =>
              onMeasurementChange?.(tooth.id, surface, value)
            }
            selected={selectedToothIds.includes(tooth.id)}
          />
        ))}
      </div>
    </div>
  );
}
