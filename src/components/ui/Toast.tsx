import * as React from "react";
import { Toaster as SonnerToaster } from "sonner";

export type ToasterProps = Omit<React.ComponentProps<typeof SonnerToaster>, "theme">;

export interface ToastProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  richColors?: boolean;
}

const Toaster = React.forwardRef<HTMLDivElement, ToasterProps>(({ className, ...props }, ref) => {
  return <SonnerToaster ref={ref} className={className} {...props} />;
});
Toaster.displayName = "Toaster";

export { Toaster };