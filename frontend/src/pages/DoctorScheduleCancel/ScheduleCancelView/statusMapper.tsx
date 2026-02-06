import { FiCheck, FiClock, FiXCircle } from "react-icons/fi";

export const statusMap: {
    [key: number]: {
        icon: JSX.Element;
        label: string;
        bgClass: string;
        textClass: string;
    };
} = {
    0: {
        icon: <FiClock className="mr-1" size={12} />,
        label: "Pending",
        bgClass: "bg-yellow-100",
        textClass: "text-yellow-800",
    },
    1: {
        icon: <FiCheck className="mr-1" size={12} />,
        label: "Approved",
        bgClass: "bg-green-100",
        textClass: "text-green-800",
    },
    2: {
        icon: <FiXCircle className="mr-1" size={12} />,
        label: "Rejected",
        bgClass: "bg-error-100",
        textClass: "text-red-800",
    },
};

export const getStatusBadge = (status: number) => {
    const config = statusMap[status];
    if (!config) {
        return <span>Unknown</span>;
    }
    return (
        <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}
        >
            {config.icon}
            {config.label}
        </span>
    );
};
