import * as React from "react";
import { cn } from "../../lib/utils";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../shared/icons/icons";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
} from "date-fns";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select a date",
  disabled,
  className,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(value || new Date());
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date) => {
    onChange?.(date);
    setIsOpen(false);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      days.push(
        <button
          key={day.toString()}
          onClick={() => handleDateSelect(cloneDay)}
          disabled={
            (minDate && cloneDay < minDate) || (maxDate && cloneDay > maxDate)
          }
          className={cn(
            "h-9 w-9 rounded-md text-sm transition-colors",
            !isSameMonth(day, monthStart) && "text-muted-foreground opacity-50",
            isSameDay(day, value || new Date()) &&
              "bg-primary text-primary-foreground",
            isToday(day) &&
              !isSameDay(day, value || new Date()) &&
              "border border-primary",
            "hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {format(day, "d")}
        </button>,
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="flex justify-center">
        {days}
      </div>,
    );
    days = [];
  }

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={value ? format(value, "PPP") : ""}
          placeholder={placeholder}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "h-9 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          )}
        />
        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 rounded-md border bg-popover p-3 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="h-7 w-7 rounded-md hover:bg-accent flex items-center justify-center"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="h-7 w-7 rounded-md hover:bg-accent flex items-center justify-center"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div
                key={d}
                className="h-9 w-9 text-xs font-medium text-center flex items-center justify-center"
              >
                {d}
              </div>
            ))}
          </div>
          <div>{rows}</div>
        </div>
      )}
    </div>
  );
};

export { DatePicker };
