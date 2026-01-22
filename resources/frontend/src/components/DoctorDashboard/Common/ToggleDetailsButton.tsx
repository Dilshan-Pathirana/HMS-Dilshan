import React from "react";
import { ToggleDetailsButtonProps } from "../../../utils/types/Appointment/IAppointment";

const ToggleDetailsButton: React.FC<ToggleDetailsButtonProps> = ({
    onClick,
    isExpanded,
}) => {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-100 focus:outline-none px-2 py-1 rounded"
        >
            {isExpanded ? "Close Details" : "View Slot Details"}
        </button>
    );
};

export default ToggleDetailsButton;
