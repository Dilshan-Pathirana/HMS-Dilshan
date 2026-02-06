import React from "react";
import {
    CalendarIcon,
    CloseIcon,
} from "../../../../../../utils/types/Appointment/SvgComponents.tsx";
import { IAppointmentModalHeaderProps } from "../../../../../../utils/types/users/IDoctorData.ts";
const AppointmentModalHeader: React.FC<IAppointmentModalHeaderProps> = ({
    schedule,
    handleModalClose,
}) => {
    return (
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-100 to-blue-50 p-4 rounded-t-2xl border-b border-blue-200">
                    <div className="p-3 bg-primary-500 text-white rounded-full shadow-md">
                        <CalendarIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900">
                            Appointment Details
                        </h2>
                        <p className="text-sm text-neutral-700">
                            <span className="font-semibold">
                                {schedule?.branch_center_name} Branch
                            </span>
                        </p>
                        <p className="inline-flex items-center bg-green-100 text-green-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                            <span>{schedule?.schedule_day}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleModalClose}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded-full hover:bg-neutral-100"
                >
                    <CloseIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default AppointmentModalHeader;
