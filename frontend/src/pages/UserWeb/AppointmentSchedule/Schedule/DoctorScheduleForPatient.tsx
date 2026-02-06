import React, { useState } from "react";
import {
    FaCalendarAlt,
    FaCheckCircle,
    FaClock,
    FaExclamationTriangle,
    FaUserMd,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import { DoctorProps } from "../../../../utils/types/Appointment/IDoctorSchedule.ts";
import {
    filterScheduleDays,
    getOneMonthLater,
    getToday,
} from "../../../../utils/helperFunctions/ScheduleDateArrangeInCalender.ts";

const DoctorScheduleForPatient: React.FC<DoctorProps> = ({
    schedule,
    selectedDate,
    setSelectedDate,
    isLoadingSlots,
    error,
    allSlots = [],
    bookedSlots = [],
    selectedSlot: initialSelectedSlot,
    handleSlotClick,
}) => {
    const bookedSlotNumbers = bookedSlots.map(Number);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(
        initialSelectedSlot,
    );

    const onSlotClick = (slot: number) => {
        if (!bookedSlotNumbers.includes(slot)) {
            setSelectedSlot(slot);
            handleSlotClick(slot);
        }
    };

    return (
        <div className="flex-1 bg-gradient-to-br from-white via-blue-50 to-white shadow-lg rounded-xl p-4 border border-blue-100 backdrop-blur-sm">
            <div className="flex items-center mb-4 border-b border-blue-100 pb-3">
                <div className="relative mr-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 via-blue-50 to-white rounded-xl flex items-center justify-center shadow-md border border-blue-200">
                        <FaUserMd className="text-primary-500 text-2xl" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <div className="flex-grow">
                    <h1 className="text-lg font-bold text-neutral-900 mb-1">
                        Dr. {schedule.user_first_name} {schedule.user_last_name}
                    </h1>
                    <div className="inline-block px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 text-xs font-semibold mb-2 shadow-sm">
                        {schedule.areas_of_specialization}
                    </div>
                    <p className="text-xs text-neutral-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1"></span>
                        Branch: {schedule.branch_center_name}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-3 text-center shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm group-hover:shadow-md transition-all duration-300">
                        <FaClock className="text-green-600 text-sm" />
                    </div>
                    <p className="text-xs text-neutral-500 mb-1">Start Time</p>
                    <h2 className="text-sm font-bold text-neutral-800">
                        {schedule.start_time}
                    </h2>
                </div>

                <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-3 text-center shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm group-hover:shadow-md transition-all duration-300">
                        <FaCalendarAlt className="text-purple-600 text-sm" />
                    </div>
                    <p className="text-xs text-neutral-500 mb-1">Day</p>
                    <h2 className="text-sm font-bold text-neutral-800">
                        {schedule.schedule_day}
                    </h2>
                </div>

                <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-3 text-center shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm group-hover:shadow-md transition-all duration-300">
                        <FaCheckCircle className="text-emerald-600 text-sm" />
                    </div>
                    <p className="text-xs text-neutral-500 mb-1">Status</p>
                    <h2 className="text-sm font-bold text-emerald-600">
                        Available
                    </h2>
                </div>
            </div>

            <div className="mb-4">
                <h2 className="text-sm font-bold text-neutral-900 mb-3 flex items-center">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center mr-2 shadow-sm">
                        <FaCalendarAlt className="text-primary-500 w-3 h-3" />
                    </div>
                    Select Appointment Date
                </h2>
                <div className="flex-grow">
                    <DatePicker
                        selected={selectedDate}
                        onChange={setSelectedDate}
                        placeholderText="Select Date"
                        dateFormat="yyyy/MM/dd"
                        minDate={getToday()}
                        maxDate={getOneMonthLater()}
                        filterDate={(date) => {
                            const isPastDate = date < getToday();
                            const isScheduleDay = filterScheduleDays(
                                date,
                                schedule.schedule_day,
                            );
                            return !isPastDate && isScheduleDay;
                        }}
                        dayClassName={(date) => {
                            if (
                                !filterScheduleDays(
                                    date,
                                    schedule.schedule_day,
                                )
                            ) {
                                return "text-gray-300 cursor-not-allowed";
                            } else {
                                return "bg-blue-200 text-blue-800 font-semibold";
                            }
                        }}
                        className="w-full px-2 py-2 border border-neutral-200 hover:border-blue-300 focus:border-primary-500 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-neutral-700 text-sm outline-none bg-white"
                    />
                </div>

                {isLoadingSlots && (
                    <div className="mt-3 flex items-center justify-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                        <p className="text-blue-700 text-sm font-medium">
                            Checking availability...
                        </p>
                    </div>
                )}
                {error && (
                    <div className="mt-3 p-3 bg-error-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm font-medium flex items-center">
                            <FaExclamationTriangle className="w-3 h-3 mr-1" />
                            {error}
                        </p>
                    </div>
                )}
            </div>

            {allSlots.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-neutral-900 mb-3 flex items-center">
                        <div className="w-5 h-5 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded flex items-center justify-center mr-2 shadow-sm">
                            <FaClock className="text-emerald-600 w-3 h-3" />
                        </div>
                        Available Slots
                    </h2>
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-neutral-200 shadow-inner">
                        <div className="overflow-y-auto max-h-48 p-3">
                            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
                                {allSlots.map((slot) => {
                                    const isBooked =
                                        bookedSlotNumbers.includes(slot);
                                    const isSelected = selectedSlot === slot;

                                    return (
                                        <button
                                            key={slot}
                                            onClick={() => onSlotClick(slot)}
                                            className={`group relative flex flex-col items-center py-2 px-2 rounded-lg shadow-sm text-xs font-semibold transition-all duration-300 transform hover:scale-105 border ${
                                                isBooked
                                                    ? "bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-800 cursor-not-allowed border-yellow-300"
                                                    : isSelected
                                                      ? "bg-gradient-to-br from-red-500 to-red-600 text-white border-red-400 shadow-md scale-105"
                                                      : "bg-gradient-to-br from-white to-blue-50 text-neutral-800 hover:from-blue-500 hover:to-blue-600 hover:text-white border-neutral-200 hover:border-blue-400 hover:shadow-md"
                                            }`}
                                            disabled={isBooked}
                                        >
                                            <div className="flex items-center justify-center mb-1">
                                                <FaUserMd
                                                    className={`text-sm transition-colors duration-300 ${
                                                        isBooked
                                                            ? "text-yellow-600"
                                                            : isSelected
                                                              ? "text-white"
                                                              : "text-emerald-500 group-hover:text-white"
                                                    }`}
                                                />
                                            </div>
                                            <span className="text-xs font-bold">
                                                #{slot}
                                            </span>

                                            {/* Status indicator */}
                                            <div
                                                className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${
                                                    isBooked
                                                        ? "bg-yellow-500"
                                                        : isSelected
                                                          ? "bg-white"
                                                          : "bg-emerald-500"
                                                }`}
                                            ></div>

                                            {!isBooked && !isSelected && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 transition-all duration-300 rounded-lg"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorScheduleForPatient;
