import React from "react";
import { DoctorAppointmentCardProps } from "../../../../utils/types/users/Iuser.ts";
import {
    RightArrowIcon,
    pulseGlowAnimation,
    pulseGlowKeyframes,
} from "../../../../utils/types/Appointment/SvgComponents";

const DoctorAppointmentCard: React.FC<DoctorAppointmentCardProps> = ({
    handleShowMoreSchedules,
}) => {
    return (
        <div className="flex-1 flex items-center justify-center md:justify-start h-full">
            <div
                style={pulseGlowAnimation}
                className="relative rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 shadow-sm w-full max-w-md animate-[pulse-glow_3s_ease-in-out_infinite]"
            >
                <style>{pulseGlowKeyframes}</style>

                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">
                            🌟 View all available branches?
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                            Choose from all branches or change time at current
                            branch
                        </p>
                    </div>
                    <button
                        onClick={handleShowMoreSchedules}
                        className="ml-4 flex-shrink-0 bg-white border border-yellow-300 text-yellow-700 hover:bg-yellow-100 px-3 py-1.5 rounded-lg text-sm font-medium shadow-xs hover:shadow-sm transition-all flex items-center group"
                    >
                        View All
                        <RightArrowIcon className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorAppointmentCard;
