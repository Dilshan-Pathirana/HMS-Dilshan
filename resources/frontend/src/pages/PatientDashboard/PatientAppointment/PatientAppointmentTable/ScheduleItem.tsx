import React from "react";
import DatePicker from "react-datepicker";
import {
    ClockIcon,
    BranchIcon,
    UserIcon,
} from "../../../../utils/types/Appointment/SvgComponents";
import { EnhancedScheduleItemProps } from "../../../../utils/types/Appointment/IDoctorSchedule.ts";

const ScheduleItem: React.FC<EnhancedScheduleItemProps> = ({
    schedule,
    scheduleKey,
    selectedDateLocal,
    isCurrentBranchSelected,
    today,
    oneMonthLater,
    filterScheduleDays,
    handleDateChange,
    handleAvailableSlots,
    activeScheduleKey,
    isLoading = false,
    isDisabled = false,
}) => {
    const getButtonText = () => {
        if (isLoading) return "Loading...";
        if (activeScheduleKey === scheduleKey) return "Selected";
        return "Select new slot";
    };

    const getButtonTitle = () => {
        if (isLoading) return "Checking availability...";
        if (isDisabled) return "Another branch is currently being checked";

        const isAnotherBranchActive =
            activeScheduleKey !== null && activeScheduleKey !== scheduleKey;
        if (isAnotherBranchActive)
            return "Another branch is currently selected";

        if (!selectedDateLocal) return "Please select a date first";

        return "Check availability for this slot";
    };

    const isButtonDisabled =
        isLoading ||
        isDisabled ||
        !selectedDateLocal ||
        (activeScheduleKey !== null && activeScheduleKey !== scheduleKey);

    return (
        <div
            className={`mb-3 p-3 rounded-lg border transition-all ${
                isCurrentBranchSelected
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm"
            }`}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-start">
                    <div
                        className={`p-2 mr-3 rounded-full ${
                            isCurrentBranchSelected
                                ? "bg-blue-100"
                                : "bg-blue-50"
                        }`}
                    >
                        <ClockIcon
                            className={`w-5 h-5 ${
                                isCurrentBranchSelected
                                    ? "text-blue-700"
                                    : "text-blue-600"
                            }`}
                        />
                    </div>
                    <div>
                        <p
                            className={`font-medium ${
                                isCurrentBranchSelected
                                    ? "text-blue-800"
                                    : "text-gray-700"
                            }`}
                        >
                            {schedule.schedule_day}s at {schedule.start_time}
                        </p>
                        {schedule.branch && (
                            <div className="flex items-center mt-1">
                                <BranchIcon className="w-4 h-4 mr-1 text-blue-500" />
                                <span
                                    className={`text-sm font-semibold ${
                                        isCurrentBranchSelected
                                            ? "text-blue-700"
                                            : "text-blue-600"
                                    }`}
                                >
                                    {schedule.branch.center_name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <DatePicker
                        selected={selectedDateLocal}
                        onChange={(date: Date | null) =>
                            handleDateChange(date, scheduleKey)
                        }
                        placeholderText="Select Date"
                        dateFormat="yyyy/MM/dd"
                        minDate={today}
                        maxDate={oneMonthLater}
                        disabled={isDisabled}
                        className={`border border-gray-300 rounded-md shadow-sm p-2 w-full sm:w-auto ${
                            isDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                        filterDate={(date) =>
                            filterScheduleDays(date, schedule.schedule_day)
                        }
                        dayClassName={(date) =>
                            !filterScheduleDays(date, schedule.schedule_day)
                                ? "text-gray-300 cursor-not-allowed"
                                : "bg-blue-200 text-blue-800 font-semibold"
                        }
                    />

                    <div className="flex items-center bg-green-50 px-3 py-1 rounded-full">
                        <UserIcon className="w-4 h-4 mr-1 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                            {schedule.max_patients} slots
                        </span>
                    </div>

                    <button
                        onClick={() => handleAvailableSlots(schedule)}
                        disabled={isButtonDisabled}
                        className={`px-3 py-1.5 text-sm font-bold rounded transition-colors min-w-[120px] ${
                            isLoading
                                ? "bg-blue-100 text-blue-600 cursor-wait"
                                : isButtonDisabled
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : selectedDateLocal
                                    ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    : "bg-blue-50 text-blue-300 cursor-not-allowed"
                        }`}
                        title={getButtonTitle()}
                    >
                        {isLoading && (
                            <span className="inline-flex items-center">
                                <svg
                                    className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-600"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Loading...
                            </span>
                        )}
                        {!isLoading && getButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleItem;
