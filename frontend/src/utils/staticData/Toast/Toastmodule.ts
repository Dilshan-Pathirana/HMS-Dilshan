export const TOAST_BASE_STYLES = "px-4 py-3 rounded-lg shadow-lg flex items-start";

export const TOAST_TYPE_STYLES = {
    success: "bg-emerald-500 text-white",
    error: "bg-rose-500 text-white",
    warning: "bg-amber-500 text-white",
    info: "bg-sky-500 text-white",
} as const;

export const TOAST_ICONS = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
} as const;
