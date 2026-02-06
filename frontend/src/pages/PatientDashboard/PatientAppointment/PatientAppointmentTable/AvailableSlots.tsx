import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../../../../utils/api/axios";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { AvailableSlotsProps } from "../../../../utils/types/Appointment/IDoctorSchedule.ts";
import { daysOfWeek } from "../../../../utils/types/Website/dateUtils.ts";
import { getCorrectFormattedDate } from "../../../../utils/helperFunctions/PatientAppointment.ts";
import { LocationIcon } from "../../../../utils/types/Appointment/SvgComponents";
import ScheduleItem from "./ScheduleItem";
import { CheckDoctorAvailability } from "../../../../utils/api/Appointment/GetAvailablitySlots.ts";

const getDateRange = (): { today: Date; oneMonthLater: Date } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    if (oneMonthLater.getDate() !== today.getDate()) {
        oneMonthLater.setDate(0);
    }

    return { today, oneMonthLater };
};

const createDateFilter =
    (today: Date, oneMonthLater: Date) =>
    (date: Date, day: string): boolean => {
        if (!day) return false;
        const dateDay = daysOfWeek[date.getDay()];
        return dateDay === day && date >= today && date <= oneMonthLater;
    };

const AvailableSlots: React.FC<AvailableSlotsProps> = ({
    schedulesWithBranches,
    setAllSlotsChild,
    setIsUpdateSlots,
    setBookingSlotNumbers,
    activeScheduleKey,
    setActiveScheduleKey,
    selectedDates,
    setSelectedDates,
}) => {
    const { state } = useLocation();
    const appointment = state?.appointment;
    const [bookedSlotsChild, setBookedSlotsChild] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingScheduleKey, setLoadingScheduleKey] = useState<string | null>(
        null,
    );

    const { today, oneMonthLater } = useMemo(getDateRange, []);

    useEffect(() => {
        const bookedSlotNumbersChild = bookedSlotsChild.map(Number);
        setBookingSlotNumbers(bookedSlotNumbersChild);
    }, [bookedSlotsChild, setBookingSlotNumbers]);

    const filterScheduleDays = useMemo(
        () => createDateFilter(today, oneMonthLater),
        [today, oneMonthLater],
    );

    const resetSelection = useCallback(() => {
        setAllSlotsChild([]);
        setBookedSlotsChild([]);
        setBookingSlotNumbers([]);
        setIsUpdateSlots(false);
        setActiveScheduleKey(null);
        setError(null);
        setLoadingScheduleKey(null);
    }, [
        setAllSlotsChild,
        setBookedSlotsChild,
        setBookingSlotNumbers,
        setIsUpdateSlots,
        setActiveScheduleKey,
    ]);

    const handleDateChange = useCallback(
        (date: Date | null, scheduleKey: string) => {
            setSelectedDates((prev: Record<string, Date | null>) => {
                const newDates = { ...prev, [scheduleKey]: date };
                if (activeScheduleKey && activeScheduleKey !== scheduleKey) {
                    newDates[activeScheduleKey] = null;
                    resetSelection();
                }
                return newDates;
            });
            setError(null);
        },
        [activeScheduleKey, resetSelection, setSelectedDates],
    );

    const handleAvailableSlots = useCallback(
        async (schedule: (typeof schedulesWithBranches)[0]) => {
            const scheduleKey = `${schedule.branch_id}-${schedule.schedule_day}`;

            if (activeScheduleKey === scheduleKey) {
                resetSelection();
                return;
            }

            const dateForSchedule = selectedDates[scheduleKey];
            if (!dateForSchedule) {
                setError("Please select a date first");
                return;
            }

            setIsLoading(true);
            setLoadingScheduleKey(scheduleKey);
            setError(null);
            setActiveScheduleKey(scheduleKey);

            try {
                const appointmentDateString =
                    getCorrectFormattedDate(dateForSchedule);

                const response = await CheckDoctorAvailability({
                    doctor_id: appointment?.doctor_id,
                    appointment_date: appointmentDateString,
                    schedule_day: schedule.schedule_day,
                    branch_id: schedule.branch_id,
                });

                if (response.data.status === 200) {
                    const { all_slots = [], booked_slots = [] } =
                        response.data.data || {};

                    if (all_slots.length === 0) {
                        setError("No slots available for the selected date");
                        resetSelection();
                        return;
                    }

                    setAllSlotsChild(all_slots);
                    setBookedSlotsChild(booked_slots);
                    setIsUpdateSlots(true);
                } else {
                    setError(
                        response.data.message || "Failed to fetch availability",
                    );
                    resetSelection();
                }
            } catch (error) {
                console.error("Error checking availability:", error);
                if (axios.isAxiosError(error)) {
                    const errorMessage =
                        error.response?.data?.message ||
                        error.response?.data?.error ||
                        "Failed to check availability";
                    setError(errorMessage);
                } else {
                    setError("An unexpected error occurred");
                }
                resetSelection();
            } finally {
                setIsLoading(false);
                setLoadingScheduleKey(null);
            }
        },
        [
            activeScheduleKey,
            appointment?.doctor_id,
            resetSelection,
            selectedDates,
            setActiveScheduleKey,
            setAllSlotsChild,
            setIsUpdateSlots,
        ],
    );

    const scheduleItems = useMemo(
        () =>
            schedulesWithBranches.map((schedule) => {
                const scheduleKey = `${schedule.branch_id}-${schedule.schedule_day}`;
                const selectedDateLocal = selectedDates[scheduleKey] || null;
                const isCurrentBranchSelected =
                    activeScheduleKey === scheduleKey;
                const isCurrentlyLoading = loadingScheduleKey === scheduleKey;

                return (
                    <ScheduleItem
                        key={scheduleKey}
                        schedule={schedule}
                        scheduleKey={scheduleKey}
                        selectedDateLocal={selectedDateLocal}
                        isCurrentBranchSelected={isCurrentBranchSelected}
                        today={today}
                        oneMonthLater={oneMonthLater}
                        filterScheduleDays={filterScheduleDays}
                        handleDateChange={handleDateChange}
                        handleAvailableSlots={handleAvailableSlots}
                        activeScheduleKey={activeScheduleKey}
                        isLoading={isCurrentlyLoading}
                        isDisabled={isLoading && !isCurrentlyLoading}
                    />
                );
            }),
        [
            schedulesWithBranches,
            selectedDates,
            activeScheduleKey,
            loadingScheduleKey,
            isLoading,
            today,
            oneMonthLater,
            filterScheduleDays,
            handleDateChange,
            handleAvailableSlots,
        ],
    );

    return (
        <div className="mb-6">
            <h4 className="flex items-center text-lg font-semibold m-2 text-neutral-800">
                <LocationIcon className="w-5 h-5 mr-2 text-primary-500" />
                Doctor's Other Availability
            </h4>

            {error && (
                <div className="mx-2 mb-4 p-3 bg-error-50 border border-red-200 rounded-md">
                    <p className="text-error-600 text-sm">{error}</p>
                </div>
            )}

            <div className="overflow-y-auto max-h-60 border border-neutral-300 rounded-md p-4">
                {scheduleItems.length > 0 ? (
                    scheduleItems
                ) : (
                    <div className="text-center py-8 text-neutral-500">
                        <LocationIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No other branch schedules available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AvailableSlots;
