import React from "react";
import { CancelScheduleButtonProps } from "../../../utils/types/Appointment/IAppointment.ts";

const CancelScheduleButton: React.FC<CancelScheduleButtonProps> = ({
    onClick,
    isLoading,
    disabled,
    allCancelled,
}) => {
    const getButtonText = () => {
        if (isLoading) return "Cancelling...";
        if (allCancelled) return "All Cancelled";
        return "Cancel Schedule";
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="inline-flex items-center text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-100 focus:outline-none px-2 py-1 rounded mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {getButtonText()}
        </button>
    );
};

export default CancelScheduleButton;
