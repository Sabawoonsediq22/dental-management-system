import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { CloseIcon } from "../../shared/icons/icons";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  className?: string;
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  className,
}) => {
  const { t } = useTranslation();
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-50 w-full mx-4 bg-background rounded-lg shadow-lg border",
          sizeClasses[size],
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
      >
        <div className="flex flex-col max-h-[90vh]">
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                {title && (
                  <h2
                    id="dialog-title"
                    className="text-lg font-semibold text-foreground"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="rounded-md p-1 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  aria-label={t("common.closeDialog")}
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <div className="p-6 overflow-y-auto">{children}</div>
          {footer && <div className="p-6 pt-0 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

export interface ConfirmDialogProps extends Omit<
  DialogProps,
  "footer" | "showCloseButton" | "children"
> {
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  confirmVariant?: "default" | "destructive";
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  confirmText,
  cancelText,
  onConfirm,
  confirmVariant = "default",
  isLoading,
  children,
  ...props
}) => {
  const { t } = useTranslation();
  const displayConfirm = confirmText || t("common.confirm", "Confirm");
  const displayCancel = cancelText || t("common.cancel");
  return (
    <Dialog
      showCloseButton={false}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={props.onClose}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {displayCancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2",
              confirmVariant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50",
            )}
          >
            {displayConfirm}
          </button>
        </div>
      }
      {...props}
    >
      {children}
    </Dialog>
  );
};

export { Dialog, ConfirmDialog };
