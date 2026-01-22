import React from "react";
import { SlotBadgeProps } from "../../../../../../utils/types/Appointment/IAppointment";

const SlotBadge: React.FC<SlotBadgeProps> = ({ count, type }) => {
    const isBooked = type === "booked";
    const bgColor = isBooked ? "bg-indigo-100" : "bg-green-100";
    const textColor = isBooked ? "text-indigo-800" : "text-green-800";
    const label = isBooked ? "Already booked" : "Now available";

    return (
        <span
            className={`inline-flex items-center ${bgColor} ${textColor} text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full`}
        >
            {label} {count} slots
        </span>
    );
};

export default SlotBadge;
