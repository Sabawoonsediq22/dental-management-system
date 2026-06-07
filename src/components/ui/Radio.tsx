import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const radioVariants = cva(
  "aspect-square h-4 w-4 rounded-full border border-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "data-[state=checked]:border-primary",
        destructive:
          "border-destructive data-[state=checked]:border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface RadioProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof radioVariants> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Radio = React.forwardRef<HTMLButtonElement, RadioProps>(
  ({ className, variant, checked = false, onCheckedChange, ...props }, ref) => {
    return (
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        className={cn(radioVariants({ variant, className }), "relative")}
        ref={ref}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        {checked && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-primary" />
          </span>
        )}
      </button>
    );
  },
);
Radio.displayName = "Radio";

export { Radio };
