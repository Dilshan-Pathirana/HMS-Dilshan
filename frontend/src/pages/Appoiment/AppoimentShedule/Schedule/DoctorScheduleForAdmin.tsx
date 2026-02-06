import React, { useState, useMemo } from "react";
import { FaUserMd } from "react-icons/fa";
import DatePicker from "react-datepicker";
import { DoctorProps } from "../../../../utils/types/Appointment/IDoctorSchedule.ts";
import {
    dayMap,
    daysOfWeek,
} from "../../../../utils/staticData/mapper/WeekDaysMaps.ts";

const SLOT_DURATION_MINUTES = 12;

const parseStartTime = (time: string): Date | null => {
    if (!time) {
        return null;
    }

    const trimmed = time.trim();

    const isoCandidate = new Date(`1970-01-01T${trimmed}`);
    if (!Number.isNaN(isoCandidate.getTime())) {
        return isoCandidate;
    }

    const fallbackCandidate = new Date(`1970-01-01 ${trimmed}`);
    if (!Number.isNaN(fallbackCandidate.getTime())) {
        return fallbackCandidate;
    }

    const ampmMatch = trimmed.match(/(AM|PM)$/i);
    const cleanTime = trimmed.replace(/\s?(AM|PM)$/i, "");
    const [hourStr, minuteStr = "0", secondStr = "0"] = cleanTime
        .split(":")
        .map((part) => part.trim());

    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    const second = Number(secondStr);

    if (Number.isNaN(hour) || Number.isNaN(minute) || Number.isNaN(second)) {
        return null;
    }

    let normalizedHour = hour;

    if (ampmMatch) {
        const meridiem = ampmMatch[1].toLowerCase();
        if (meridiem === "pm") {
            normalizedHour = (hour % 12) + 12;
        } else if (hour === 12) {
            normalizedHour = 0;
        } else {
            normalizedHour = hour % 12;
        }
    }

    const date = new Date(0);
    date.setHours(normalizedHour, minute, second, 0);

    return date;
};

const DoctorScheduleForAdmin: React.FC<DoctorProps> = ({
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

    const normalizeDayName = (dayName: string): string => {
        return dayMap[dayName.toLowerCase()] || dayName.toLowerCase();
    };

    const getDayNameFromDate = (date: Date): string => {
        return daysOfWeek[date.getDay()];
    };

    const isValidAppointmentDate = useMemo(() => {
        const doctorScheduleDay = normalizeDayName(schedule.schedule_day || "");

        return (date: Date): boolean => {
            if (!doctorScheduleDay) return false;
            const dateDay = getDayNameFromDate(date);
            return dateDay === doctorScheduleDay;
        };
    }, [schedule.schedule_day]);

    const [selectedSlot, setSelectedSlot] = useState<number | null>(
        initialSelectedSlot,
    );

    const getSlotDisplayTime = useMemo(() => {
        const baseTime = parseStartTime(schedule.start_time);

        if (!baseTime) {
            return () => "";
        }

        return (slot: number): string => {
            const slotTime = new Date(baseTime.getTime());
            slotTime.setMinutes(
                slotTime.getMinutes() + slot * SLOT_DURATION_MINUTES,
            );

            return slotTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        };
    }, [schedule.start_time]);

    const onSlotClick = (slot: number) => {
        if (!bookedSlotNumbers.includes(slot)) {
            setSelectedSlot(slot);
            handleSlotClick(slot);
        }
    };

    return (
        <div className="flex-1 bg-white shadow-md rounded-md p-6">
            <div className="flex items-center mb-6 border-b pb-4">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mr-4">
                    <FaUserMd className="text-neutral-500 text-3xl" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-neutral-800">
                        {schedule.user_first_name} {schedule.user_last_name}
                    </h1>
                    {(() => {
                        const specializations = schedule.areas_of_specialization
                            ? schedule.areas_of_specialization
                                  .split(",")
                                  .map((s) => s.trim())
                            : [];
                        const visible = specializations.slice(0, 2).join(", ");
                        const hiddenCount = specializations.length - 2;
                        return (
                            <p className="text-sm text-neutral-600">
                                {visible}
                                {hiddenCount > 0 && (
                                    <div className="relative inline-block ml-1">
                                        <span className="text-neutral-500 cursor-pointer group">
                                            +{hiddenCount} more
                                        </span>
                                        <div className="absolute left-0 mt-1 hidden group-hover:block bg-white border border-neutral-200 rounded-md shadow-lg p-2 z-10 max-w-xs">
                                            <ul className="text-xs text-neutral-700 space-y-1">
                                                {specializations
                                                    .slice(2)
                                                    .map((spec, idx) => (
                                                        <li key={idx}>
                                                            {spec}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </p>
                        );
                    })()}
                    <p className="text-sm text-neutral-500 italic">
                        Branch: {schedule.branch_center_name}
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-neutral-100 rounded-md p-4 mb-6">
                <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-neutral-500">Start Time:</p>
                    <h2 className="text-lg font-bold text-neutral-700">
                        {schedule.start_time}
                    </h2>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-neutral-500">Day:</p>
                    <h2 className="text-lg font-bold text-neutral-700">
                        {schedule.schedule_day}
                    </h2>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-neutral-500">Status:</p>
                    <h2 className="text-lg font-bold text-green-600">
                        Available
                    </h2>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-bold mb-2">
                    Select Appointment Date
                </h2>
                <DatePicker
                    selected={selectedDate}
                    onChange={setSelectedDate}
                    placeholderText={`Select ${schedule.schedule_day || "Available"} Date`}
                    dateFormat="yyyy/MM/dd"
                    minDate={new Date()}
                    maxDate={
                        new Date(new Date().setMonth(new Date().getMonth() + 1))
                    }
                    filterDate={isValidAppointmentDate}
                    className="border border-neutral-300 rounded-md shadow-sm p-2 mb-2"
                />
                {schedule.schedule_day && (
                    <p className="text-sm text-primary-500 mt-2 flex items-center">
                        <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                        Only {schedule.schedule_day}s are available for booking
                        within the next month
                    </p>
                )}
                {isLoadingSlots && (
                    <p className="text-neutral-500 mt-4">
                        Loading available slots...
                    </p>
                )}
                {error && <p className="text-error-500 mt-4">{error}</p>}
            </div>

            {allSlots.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold mb-2">Available Slots</h2>
                    <div className="overflow-y-auto max-h-60 border border-neutral-300 rounded-md p-4">
                        <div className="grid grid-cols-5 gap-4">
                            {allSlots.map((slot) => {
                                const isBooked =
                                    bookedSlotNumbers.includes(slot);
                                const slotTimeLabel = getSlotDisplayTime(slot);
                                const baseTextColor =
                                    selectedSlot === slot
                                        ? "text-white"
                                        : isBooked
                                          ? "text-neutral-600"
                                          : "text-neutral-800";

                                return (
                                    <button
                                        key={slot}
                                        onClick={() => onSlotClick(slot)}
                                        className={`flex flex-col items-center py-4 px-6 rounded-md shadow-md text-sm font-semibold transition ${
                                            isBooked
                                                ? "bg-yellow-200 text-neutral-600 cursor-not-allowed"
                                                : selectedSlot === slot
                                                  ? "bg-red-600 text-white"
                                                  : "bg-neutral-50 text-neutral-800 hover:bg-primary-500 hover:text-white"
                                        }`}
                                        disabled={isBooked}
                                    >
                                        <div className="flex items-center justify-center space-x-2 mb-2">
                                            <FaUserMd
                                                className={`text-2xl ${
                                                    isBooked
                                                        ? "text-yellow-600"
                                                        : "text-green-500"
                                                }`}
                                            />
                                            <span
                                                className={`text-sm font-medium ${baseTextColor}`}
                                            >
                                                No.{slot}
                                            </span>
                                        </div>
                                        {slotTimeLabel && (
                                            <span
                                                className={`text-xs ${selectedSlot === slot ? "text-white/90" : isBooked ? "text-neutral-500" : "text-neutral-600"}`}
                                            >
                                                {slotTimeLabel}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorScheduleForAdmin;
