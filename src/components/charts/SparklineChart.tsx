import React from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

interface SparklineChartProps {
  data: { day: string; value: number }[];
  color?: string;
  height?: number;
}

const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color = "#0d9488",
  height = 56,
}) => {
  const allZero = data.every((d) => d.value === 0);
  if (allZero || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[10px] text-gray-400 dark:text-gray-500"
        style={{ height }}
      >
        No data this month
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sparkGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#sparkGrad-${color.replace("#", "")})`}
            dot={false}
            activeDot={{ r: 3, fill: color, stroke: "#fff", strokeWidth: 1.5 }}
            animationDuration={600}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SparklineChart;
