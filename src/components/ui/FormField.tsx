import * as React from "react";
import { cn } from "../../lib/utils";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    { className, label, error, required, description, children, ...props },
    ref,
  ) => {
    const childId = React.useId();

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <label className="text-sm font-medium leading-none text-foreground">
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </label>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(
              child as React.ReactElement<Record<string, unknown>>,
              {
                id: childId,
                "aria-invalid": !!error,
                "aria-describedby": error ? `${childId}-error` : undefined,
              },
            );
          }
          return child;
        })}
        {error && (
          <p id={`${childId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);
FormField.displayName = "FormField";

export interface FormInputProps extends React.ComponentProps<typeof Input> {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
}

const FormInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  FormInputProps
>(({ label, error, required, description, className, ...props }, ref) => (
  <FormField
    label={label}
    error={error}
    required={required}
    description={description}
    className={className}
  >
    <Input
      ref={ref}
      className={cn(error && "border-destructive")}
      {...props}
      inputSize={"lg"}
    />
  </FormField>
));
FormInput.displayName = "FormInput";

export interface FormTextareaProps extends React.ComponentProps<
  typeof Textarea
> {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
}

const FormTextarea = React.forwardRef<
  React.ElementRef<typeof Textarea>,
  FormTextareaProps
>(({ label, error, required, description, className, ...props }, ref) => (
  <FormField
    label={label}
    error={error}
    required={required}
    description={description}
    className={className}
  >
    <Textarea
      ref={ref}
      className={cn(error && "border-destructive")}
      {...props}
    />
  </FormField>
));
FormTextarea.displayName = "FormTextarea";

export { FormField, FormInput, FormTextarea };
