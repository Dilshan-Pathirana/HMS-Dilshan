import { toast, ToastOptions, Id } from "react-toastify";

interface AlertOptions extends ToastOptions {
    position?: ToastOptions["position"];
    autoClose?: number;
    hideProgressBar?: boolean;
    closeOnClick?: boolean;
    pauseOnHover?: boolean;
    draggable?: boolean;
    progress?: undefined;
    theme?: ToastOptions["theme"];
    pauseOnFocusLoss?: boolean;
}

const defaultOptions: AlertOptions = {
    position: "top-right",
    autoClose: 1000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
    pauseOnFocusLoss: false,
};

const inputValidationOptions: AlertOptions = {
    ...defaultOptions,
    position: "bottom-right",
    hideProgressBar: true,
    pauseOnHover: false,
};

const error = (msg: string, options?: Partial<AlertOptions>): Id => {
    return toast.error(msg, { ...defaultOptions, ...options });
};

const loading = (msg: string, options?: Partial<AlertOptions>): Id => {
    return toast.loading(msg, { ...defaultOptions, ...options });
};

const dismiss = (toastId: Id): void => {
    toast.dismiss(toastId);
};

const warn = (msg: string, options?: Partial<AlertOptions>): Id => {
    return toast.warn(msg, { ...defaultOptions, ...options });
};

const success = (msg: string, options?: Partial<AlertOptions>): Id => {
    return toast.success(msg, { ...defaultOptions, ...options });
};

const inputValidation = (msg: string, options?: Partial<AlertOptions>): Id => {
    return toast.info(msg, { ...inputValidationOptions, ...options });
};

const confirm = (
    title: string,
    message: string,
    type: 'warning' | 'info' | 'danger' = 'warning'
): Promise<boolean> => {
    return new Promise((resolve) => {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        resolve(confirmed);
    });
};

const warning = (msg: string, options?: Partial<AlertOptions>): Id => {
    return toast.warning(msg, { ...defaultOptions, ...options });
};

const alert = {
    error,
    warn,
    warning,
    success,
    inputValidation,
    loading,
    dismiss,
    confirm,
};

export default alert;
