import React from "react";
import { FiSearch } from "react-icons/fi";
import { IDoctorAppointmentFilterProps } from "../../../../../utils/types/users/IDoctorData.ts";

const DoctorAllAppointmentFilter: React.FC<IDoctorAppointmentFilterProps> = ({
    searchTerm,
    setSearchTerm,
}) => {
    return (
        <div className="mb-6 relative max-w-full mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-blue-400 dark:text-blue-300" />
            </div>
            <input
                type="text"
                placeholder="Search by branch, day or time..."
                className="pl-10 pr-4 py-3 w-full border-2 border-blue-100 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-primary-500 outline-none transition-all duration-200 dark:bg-neutral-800 dark:border-blue-900 dark:focus:ring-blue-800 dark:focus:border-primary-500 dark:placeholder-blue-300 dark:text-white shadow-sm hover:border-blue-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
    );
};

export default DoctorAllAppointmentFilter;
