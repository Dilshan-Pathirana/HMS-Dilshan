import React from "react";
import {
    DoctorSchedule,
    IDoctorDetailsCardProp,
} from "../../../../utils/types/Website/IDoctorSchedule.ts";
import { FaStethoscope, FaUser, FaUserMd } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedSchedule } from "../../../../utils/slices/doctorSchedule/doctorScheduleSlice.ts";
import {
    groupDoctorSchedulesByTimeSlots,
    splitAndLimitItems,
} from "../../../../utils/helpers/doctorUtils";
import ShowMoreTooltip from "../../../../utils/components/ShowMoreTooltip";
import ShowMoreInline from "../../../../utils/components/ShowMoreInline";
const DoctorDetailsCard: React.FC<IDoctorDetailsCardProp> = ({
    doctorSchedules,
}) => {
    const { isAuthenticated } = useSelector((state: any) => state.auth);
    const dispatch = useDispatch();

    const handleChannelClick = (schedule: DoctorSchedule) => {
        dispatch(setSelectedSchedule(schedule));
    };

    const uniqueDoctors = groupDoctorSchedulesByTimeSlots(doctorSchedules);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {uniqueDoctors.map((schedule: DoctorSchedule, index: number) => (
                <div
                    key={`${schedule.user_first_name}-${schedule.user_last_name}-${schedule.branch_center_name}-${schedule.schedule_day}-${schedule.start_time}-${index}`}
                    className="group flex items-center bg-gradient-to-br from-white via-white to-gray-50 border border-gray-100 hover:border-blue-200 shadow-lg hover:shadow-xl p-6 mt-7 rounded-2xl transition-all duration-300 backdrop-blur-sm"
                >
                    <div className="flex items-center space-x-5 flex-grow">
                        <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 via-blue-50 to-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-all duration-300 border border-blue-100">
                                <FaUserMd className="text-primary-500 w-9 h-9 group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>

                        <div className="text-left flex-grow">
                            <h3 className="text-lg font-bold text-neutral-900 mb-1 group-hover:text-blue-700 transition-colors duration-300">
                                Dr. {schedule.user_first_name}{" "}
                                {schedule.user_last_name}
                            </h3>
                            <div className="flex mb-2 overflow-hidden">
                                {(() => {
                                    const {
                                        visible,
                                        hiddenItems,
                                        hiddenCount,
                                    } = splitAndLimitItems(
                                        schedule.areas_of_specialization || "",
                                        2,
                                    );
                                    return (
                                        <ShowMoreTooltip
                                            visibleText={visible}
                                            hiddenItems={hiddenItems}
                                            hiddenCount={hiddenCount}
                                            uniqueKey={`spec-${schedule.user_first_name}-${schedule.user_last_name}`}
                                        />
                                    );
                                })()}
                            </div>
                            <p className="text-sm text-neutral-600 font-medium mb-1 flex items-center">
                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 flex-shrink-0"></span>
                                {(() => {
                                    const {
                                        visible,
                                        hiddenItems,
                                        hiddenCount,
                                    } = splitAndLimitItems(
                                        schedule.branch_center_name || "",
                                        1,
                                    );
                                    return (
                                        <ShowMoreInline
                                            visibleText={visible}
                                            hiddenItems={hiddenItems}
                                            hiddenCount={hiddenCount}
                                            uniqueKey={`branch-${schedule.user_first_name}-${schedule.user_last_name}`}
                                        />
                                    );
                                })()}
                            </p>
                            <p className="text-sm text-neutral-500 flex items-center">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                {schedule.schedule_day} at {schedule.start_time}
                            </p>
                        </div>
                    </div>

                    <div className="ml-auto">
                        {isAuthenticated ? (
                            <Link
                                to="/doctor-schedule/doctor-schedule-details"
                                onClick={() => handleChannelClick(schedule)}
                            >
                                <button className="relative overflow-hidden bg-gradient-to-r from-primary-500 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 group/btn border border-primary-500 hover:border-blue-400">
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300"></div>
                                    <FaStethoscope className="h-4 w-4 relative z-10 group-hover/btn:rotate-12 transition-transform duration-300" />
                                    <span className="relative z-10">
                                        Channel
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover/btn:opacity-20 transform -skew-x-12 group-hover/btn:animate-pulse"></div>
                                </button>
                            </Link>
                        ) : (
                            <Link to="/login">
                                <button className="relative overflow-hidden bg-gradient-to-r from-primary-500 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 group/btn border border-primary-500 hover:border-blue-400">
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300"></div>
                                    <FaUser className="h-4 w-4 relative z-10 group-hover/btn:scale-110 transition-transform duration-300" />
                                    <span className="relative z-10">Login</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover/btn:opacity-20 transform -skew-x-12 group-hover/btn:animate-pulse"></div>
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DoctorDetailsCard;
