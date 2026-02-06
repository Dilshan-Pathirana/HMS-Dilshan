import React from "react";
import NotDataAvailable from "../../NotDataAvailable.tsx";
import { IDoctorAllAppointmentTableProps } from "../../../../../../utils/types/users/IDoctorData.ts";
import { SadMoodIcon } from "../../../../../../utils/types/Appointment/SvgComponents.tsx";

const DoctorAllAppointmentTable: React.FC<IDoctorAllAppointmentTableProps> = ({
    filteredSchedules,
    searchTerm,
    handleModalOpen,
    setSearchTerm,
}) => {
    return (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-neutral-50 dark:bg-gray-700">
                <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-300 uppercase tracking-wider">
                        Branch
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-300 uppercase tracking-wider">
                        Day
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-300 uppercase tracking-wider">
                        Time
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-300 uppercase tracking-wider">
                        Max Patients
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-neutral-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSchedules.length > 0 ? (
                    filteredSchedules.map((schedule) => (
                        <tr
                            key={schedule.id}
                            className="hover:bg-neutral-50 dark:hover:bg-gray-700"
                        >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">
                                {schedule.branch_center_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-gray-300">
                                {schedule.schedule_day}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-gray-300">
                                {new Date(
                                    `1970-01-01T${schedule.start_time}`,
                                ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-gray-300">
                                {schedule.max_patients}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button
                                    onClick={() => handleModalOpen(schedule)}
                                    className="px-4 py-2 rounded-md bg-primary-500 hover:bg-primary-500 text-white font-medium text-sm transition-all"
                                >
                                    Appointments Details
                                </button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                {searchTerm ? (
                                    <>
                                        <div className="w-16 h-16 text-neutral-400">
                                            <SadMoodIcon />
                                        </div>
                                        <h3 className="text-lg font-medium text-neutral-700 dark:text-gray-300">
                                            No matching schedules found
                                        </h3>
                                        <p className="text-neutral-500 dark:text-neutral-400 max-w-md text-center">
                                            We couldn't find any schedules
                                            matching "{searchTerm}". Try
                                            adjusting your search or check back
                                            later.
                                        </p>
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-primary-500 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Clear Search
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <NotDataAvailable />
                                    </>
                                )}
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default DoctorAllAppointmentTable;
