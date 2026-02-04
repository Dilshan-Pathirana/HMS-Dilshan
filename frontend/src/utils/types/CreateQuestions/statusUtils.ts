export interface StatusConfig {
    className: string;
    displayText: string;
}

export const getStatusConfig = (
    status: string | number | null | undefined,
): StatusConfig => {
    const statusConfigs = {
        active: {
            className: "bg-green-100 text-green-800",
            displayText: "Active",
        },
        inactive: {
            className: "bg-red-100 text-red-800",
            displayText: "Inactive",
        },
        unknown: {
            className: "bg-gray-100 text-gray-800",
            displayText: "Unknown",
        },
    } as const;

    if (status === 1 || status === "1") {
        return statusConfigs.active;
    } else if (status === 0 || status === "0") {
        return statusConfigs.inactive;
    } else {
        return statusConfigs.unknown;
    }
};

export interface StatusBadgeProps {
    status: string | number | null | undefined;
    className?: string;
}

export interface QuestionDetailCardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}
