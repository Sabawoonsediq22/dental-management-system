import { toast as sonnerToast } from "sonner";

type ToastAction = { label: string; onClick: () => void };

interface ToastProps {
  title: string;
  description?: string;
  duration?: number;
  action?: ToastAction;
}

const toastSuccess = (props?: Omit<ToastProps, "duration"> & { duration?: number }) => {
  return sonnerToast.success(props?.title ?? '', {
    description: props?.description,
    duration: props?.duration ?? 4000,
    action: props?.action ? { label: props.action.label, onClick: props.action.onClick } : undefined,
  });
};

const toastError = (props?: Omit<ToastProps, "duration"> & { duration?: number }) => {
  return sonnerToast.error(props?.title ?? '', {
    description: props?.description,
    duration: props?.duration ?? 5000,
    action: props?.action ? { label: props.action.label, onClick: props.action.onClick } : undefined,
  });
};

const toastWarning = (props?: Omit<ToastProps, "duration"> & { duration?: number }) => {
  return sonnerToast.warning(props?.title ?? '', {
    description: props?.description,
    duration: props?.duration ?? 4500,
    action: props?.action ? { label: props.action.label, onClick: props.action.onClick } : undefined,
  });
};

const toastInfo = (props?: Omit<ToastProps, "duration"> & { duration?: number }) => {
  return sonnerToast.info(props?.title ?? '', {
    description: props?.description,
    duration: props?.duration ?? 4000,
    action: props?.action ? { label: props.action.label, onClick: props.action.onClick } : undefined,
  });
};

const toastMessage = (props?: Omit<ToastProps, "duration"> & { duration?: number }) => {
  return sonnerToast.message(props?.title ?? '', {
    description: props?.description,
    duration: props?.duration ?? 4000,
    action: props?.action ? { label: props.action.label, onClick: props.action.onClick } : undefined,
  });
};

const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) => {
  return sonnerToast.promise(promise, messages);
};

const toastDismiss = (id?: string | number) => {
  sonnerToast.dismiss(id);
};

const toastLoading = (title: string) => {
  return sonnerToast.loading(title);
};

export const toast = {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  message: toastMessage,
  promise: toastPromise,
  dismiss: toastDismiss,
  loading: toastLoading,
};