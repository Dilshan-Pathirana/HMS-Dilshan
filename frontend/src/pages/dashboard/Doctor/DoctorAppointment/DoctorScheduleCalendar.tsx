import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Clock,
    Users,
    MapPin,
    AlertTriangle,
    RefreshCw,
    Loader,
    X,
    CheckCircle,
    XCircle,
    Clock3,
} from "lucide-react";
import api from "../../../../utils/api/axios";
import alert from "../../../../utils/alert.ts";
import {
    DoctorSchedule,
    DoctorScheduleCancellation,
    EnhancedCalendarDate,
} from "../../../../utils/types/DoctorScheduleCalendar/IDoctorScheduleCalendar.ts";
import CancelModal from "./CancelModal.tsx";

const DoctorScheduleCalendar: React.FC = () => {
    const currentUserId = useSelector((state: any) => state.auth.userId);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
    const [cancellations, setCancellations] = useState<
        DoctorScheduleCancellation[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [scheduleToCancel, setScheduleToCancel] =
        useState<DoctorSchedule | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [isCancelingEntireDay, setIsCancelingEntireDay] = useState(false);

    const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const fetchSchedules = async () => {
        if (!currentUserId) {
            setIsLoading(false);
            setError("User not authenticated");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await api.get(
                `/get-all-doctor-schedule/${currentUserId}`,
            );

            if (response.data && response.data.doctorSchedule) {
                setSchedules(response.data.doctorSchedule);
            } else {
                setSchedules([]);
            }
        } catch (err: any) {
            console.error("Error fetching schedules:", err);
            setError(
                err.response?.data?.message || "Failed to fetch schedules",
            );
            setSchedules([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCancellations = async () => {
        if (!currentUserId) return;

        try {
            const response = await api.get(
                `/get-doctor-schedule-cancel/${currentUserId}`,
            );

            if (response.data && response.data.doctor_schedule_cancellations) {
                setCancellations(response.data.doctor_schedule_cancellations);
            } else {
                setCancellations([]);
            }
        } catch (err: any) {
            console.error("Error fetching cancellations:", err);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchSchedules(), fetchCancellations()]);
        };
        loadData();
    }, [currentUserId]);

    const getDateFromScheduleDay = (
        dayName: string,
        baseDate: Date,
    ): Date[] => {
        const dayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const targetDayIndex = dayNames.indexOf(dayName);

        if (targetDayIndex === -1) return [];

        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();

        const dates: Date[] = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (date.getDay() === targetDayIndex) {
                dates.push(date);
            }
        }

        return dates;
    };

    const calendarDates = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const dates: EnhancedCalendarDate[] = [];
        const today = new Date();

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.toDateString() === today.toDateString();

            const dateSchedules: DoctorSchedule[] = [];
            const dateCancellations: DoctorScheduleCancellation[] = [];

            schedules.forEach((schedule) => {
                const scheduleDates = getDateFromScheduleDay(
                    schedule.schedule_day,
                    currentDate,
                );
                if (
                    scheduleDates.some(
                        (scheduleDate) =>
                            scheduleDate.toDateString() === date.toDateString(),
                    )
                ) {
                    dateSchedules.push(schedule);
                }
            });

            cancellations.forEach((cancellation) => {
                const cancellationDate = new Date(cancellation.date);
                if (cancellationDate.toDateString() === date.toDateString()) {
                    dateCancellations.push(cancellation);
                }
            });

            dates.push({
                date,
                schedules: dateSchedules,
                cancellations: dateCancellations,
                isCurrentMonth,
                isToday,
            });
        }

        return dates;
    }, [currentDate, schedules, cancellations]);

    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
            return newDate;
        });
        setSelectedDate(null);
    };

    const handleDateClick = (calendarDate: EnhancedCalendarDate) => {
        if (calendarDate.isCurrentMonth) {
            setSelectedDate(calendarDate.date);
        }
    };

    const canCancelBasedOnDate = (date: Date | null): boolean => {
        if (!date) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selectedDateStart = new Date(date);
        selectedDateStart.setHours(0, 0, 0, 0);

        return selectedDateStart > today;
    };

    const handleCancelSchedule = (schedule: DoctorSchedule) => {
        if (!canCancelBasedOnDate(selectedDate)) {
            alert.warn(
                "You can only cancel future dates.",
            );
            return;
        }
        setScheduleToCancel(schedule);
        setShowCancelModal(true);
    };

    const confirmCancelSchedule = async (reason: string) => {
        if (!scheduleToCancel || !selectedDate || !currentUserId) return;

        try {
            setCancelLoading(true);

            const formattedDate = formatDateForAPI(selectedDate);

            const response = await api.post(
                "/request-cancel-doctor-appointment",
                {
                    doctor_id: currentUserId,
                    branch_id: scheduleToCancel.branch_id,
                    schedule_id: scheduleToCancel.id,
                    date: formattedDate,
                    reason: reason,
                },
            );

            if (response.data.status === 200) {
                alert.success(
                    response.data.message || "Schedule cancelled successfully!",
                );

                await Promise.all([fetchSchedules(), fetchCancellations()]);

                setShowCancelModal(false);
                setScheduleToCancel(null);
                setSelectedDate(null);
            } else {
                throw new Error(
                    response.data.message || "Failed to cancel schedule",
                );
            }
        } catch (err: any) {
            console.error("Error cancelling schedule:", err);
            const errorMessage =
                err.response?.data?.message || "Failed to cancel schedule";
            alert.warn(`Failed to cancel schedule: ${errorMessage}`);
        } finally {
            setCancelLoading(false);
        }
    };

    const handleCancelEntireDay = () => {
        if (!canCancelBasedOnDate(selectedDate)) {
            alert.warn("You can only cancel future dates.");
            return;
        }
        setIsCancelingEntireDay(true);
        setShowCancelModal(true);
    };

    const confirmCancelEntireDay = async (reason: string) => {
        if (!selectedDate || !currentUserId) return;

        try {
            setCancelLoading(true);

            const formattedDate = formatDateForAPI(selectedDate);

            const response = await api.post(
                "/cancel-doctor-entire-day",
                {
                    doctor_id: currentUserId,
                    date: formattedDate,
                    reason: reason,
                },
            );

            if (response.data.status === 200) {
                alert.success(
                    response.data.message || "Day cancelled successfully!",
                );

                await Promise.all([fetchSchedules(), fetchCancellations()]);

                setShowCancelModal(false);
                setIsCancelingEntireDay(false);
                setSelectedDate(null);
            } else {
                throw new Error(
                    response.data.message || "Failed to cancel day",
                );
            }
        } catch (err: any) {
            console.error("Error cancelling day:", err);
            const errorMessage =
                err.response?.data?.message || "Failed to cancel day";
            alert.warn(`Failed to cancel day: ${errorMessage}`);
        } finally {
            setCancelLoading(false);
        }
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getCancellationStatusInfo = (status: number) => {
        switch (status) {
            case 0:
                return {
                    text: "Pending",
                    color: "bg-yellow-500",
                    textColor: "text-yellow-700",
                    icon: Clock3,
                };
            case 1:
                return {
                    text: "Approved",
                    color: "bg-green-500",
                    textColor: "text-green-700",
                    icon: CheckCircle,
                };
            case 2:
                return {
                    text: "Rejected",
                    color: "bg-error-500",
                    textColor: "text-red-700",
                    icon: XCircle,
                };
            default:
                return {
                    text: "Unknown",
                    color: "bg-gray-500",
                    textColor: "text-neutral-700",
                    icon: AlertTriangle,
                };
        }
    };

    const refreshData = async () => {
        await Promise.all([fetchSchedules(), fetchCancellations()]);
    };

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Loader className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
                        <p className="text-neutral-600">
                            Loading doctor schedules...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-error-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-error-600 mr-2" />
                        <h3 className="text-lg font-medium text-red-800">
                            Error Loading Schedules
                        </h3>
                    </div>
                    <p className="text-red-700 mt-2">{error}</p>
                    <button
                        onClick={refreshData}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                            Doctor Schedule Calendar
                        </h1>
                        <p className="text-neutral-600">
                            Manage your medical appointments and schedules
                        </p>
                    </div>
                    <button
                        onClick={refreshData}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw
                            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                            <button
                                onClick={() => navigateMonth("prev")}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>

                            <h2 className="text-lg font-semibold text-neutral-900">
                                {monthNames[currentDate.getMonth()]}{" "}
                                {currentDate.getFullYear()}
                            </h2>

                            <button
                                onClick={() => navigateMonth("next")}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 border-b border-neutral-200">
                            {dayNames.map((day) => (
                                <div
                                    key={day}
                                    className="p-3 text-center text-sm font-medium text-neutral-700 bg-neutral-50"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7">
                            {calendarDates.map((calendarDate, index) => (
                                <div
                                    key={index}
                                    className={`
                                        min-h-[80px] p-2 border-r border-b border-gray-100 transition-colors
                                        ${
                                            !calendarDate.isCurrentMonth
                                                ? "bg-neutral-50 text-neutral-400"
                                                : "hover:bg-blue-50 cursor-pointer"
                                        }
                                        ${calendarDate.isToday ? "bg-blue-100" : ""}
                                        ${
                                            selectedDate?.toDateString() ===
                                            calendarDate.date.toDateString()
                                                ? "ring-2 ring-blue-500"
                                                : ""
                                        }
                                    `}
                                    onClick={() =>
                                        handleDateClick(calendarDate)
                                    }
                                >
                                    <div
                                        className={`
                                            text-sm font-medium mb-1
                                            ${calendarDate.isToday ? "text-primary-500" : ""}
                                        `}
                                    >
                                        {calendarDate.date.getDate()}
                                    </div>

                                    <div className="space-y-1">
                                        {calendarDate.schedules
                                            .slice(0, 2)
                                            .map((schedule) => (
                                                <div
                                                    key={schedule.id}
                                                    className="text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded truncate"
                                                >
                                                    {formatTime(
                                                        schedule.start_time,
                                                    )}
                                                </div>
                                            ))}

                                        {calendarDate.cancellations
                                            .slice(
                                                0,
                                                2 -
                                                    calendarDate.schedules
                                                        .length,
                                            )
                                            .map((cancellation) => {
                                                const statusInfo =
                                                    getCancellationStatusInfo(
                                                        cancellation.status,
                                                    );
                                                return (
                                                    <div
                                                        key={`cancel-${cancellation.id}`}
                                                        className={`text-xs ${statusInfo.color} text-white px-1.5 py-0.5 rounded truncate flex items-center`}
                                                    >
                                                        <X className="h-2 w-2 mr-1" />
                                                        {formatTime(
                                                            cancellation.start_time,
                                                        )}
                                                    </div>
                                                );
                                            })}

                                        {calendarDate.schedules.length +
                                            calendarDate.cancellations.length >
                                            2 && (
                                            <div className="text-xs text-primary-500 font-medium">
                                                +
                                                {calendarDate.schedules.length +
                                                    calendarDate.cancellations
                                                        .length -
                                                    2}{" "}
                                                more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm">
                        <div className="p-4 border-b border-neutral-200">
                            <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                                <Calendar className="h-5 w-5 mr-2" />
                                Schedule Details
                            </h3>
                        </div>

                        <div className="p-4">
                            {selectedDate ? (
                                <div>
                                    <div className="mb-4">
                                        <h4 className="font-medium text-neutral-900 mb-2">
                                            {selectedDate.toLocaleDateString(
                                                "en-US",
                                                {
                                                    weekday: "long",
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                },
                                            )}
                                        </h4>
                                        {canCancelBasedOnDate(selectedDate) && (
                                            <button
                                                onClick={handleCancelEntireDay}
                                                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Cancel Entire Day
                                            </button>
                                        )}
                                    </div>

                                    {calendarDates
                                        .find(
                                            (cd) =>
                                                cd.date.toDateString() ===
                                                selectedDate.toDateString(),
                                        )
                                        ?.schedules.map((schedule) => {
                                            const selectedDateFormatted =
                                                formatDateForAPI(selectedDate);
                                            const existingCancellation =
                                                cancellations.find(
                                                    (cancellation) =>
                                                        cancellation.schedule_id ===
                                                            schedule.id &&
                                                        cancellation.date ===
                                                            selectedDateFormatted,
                                                );

                                            const hasExistingCancellation =
                                                !!existingCancellation;
                                            const isDateTooSoon =
                                                !canCancelBasedOnDate(
                                                    selectedDate,
                                                );
                                            const canCancel =
                                                !hasExistingCancellation &&
                                                !isDateTooSoon;
                                            const cancellationStatus =
                                                existingCancellation
                                                    ? getCancellationStatusInfo(
                                                          existingCancellation.status,
                                                      )
                                                    : null;

                                            return (
                                                <div
                                                    key={schedule.id}
                                                    className="mb-4 p-3 bg-neutral-50 rounded-lg"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center text-sm text-neutral-600">
                                                            <Clock className="h-4 w-4 mr-1" />
                                                            {formatTime(
                                                                schedule.start_time,
                                                            )}
                                                        </div>
                                                        {canCancel ? (
                                                            <button
                                                                onClick={() =>
                                                                    handleCancelSchedule(
                                                                        schedule,
                                                                    )
                                                                }
                                                                className="text-xs text-error-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-error-50 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        ) : hasExistingCancellation ? (
                                                            <div className="flex items-center">
                                                                <span
                                                                    className={`text-xs ${cancellationStatus?.textColor} px-2 py-1 rounded border bg-white flex items-center`}
                                                                >
                                                                    {cancellationStatus && (
                                                                        <cancellationStatus.icon className="h-3 w-3 mr-1" />
                                                                    )}
                                                                    {
                                                                        cancellationStatus?.text
                                                                    }
                                                                </span>
                                                            </div>
                                                        ) : isDateTooSoon ? (
                                                            <div className="flex items-center">
                                                                <span
                                                                    className="text-xs text-neutral-500 px-2 py-1 rounded border bg-neutral-100 flex items-center cursor-not-allowed"
                                                                    title="Cancellation must be requested at least one day in advance"
                                                                >
                                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                                    Too Late
                                                                </span>
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex items-center text-neutral-700">
                                                            <MapPin className="h-4 w-4 mr-1" />
                                                            {
                                                                schedule.branch_center_name
                                                            }
                                                        </div>
                                                        <div className="flex items-center text-neutral-700">
                                                            <Users className="h-4 w-4 mr-1" />
                                                            Max{" "}
                                                            {
                                                                schedule.max_patients
                                                            }{" "}
                                                            patients
                                                        </div>
                                                        {existingCancellation && (
                                                            <div className="text-neutral-600 text-xs mt-2 p-2 bg-neutral-100 rounded">
                                                                <strong>
                                                                    Cancellation
                                                                    Status:
                                                                </strong>{" "}
                                                                {
                                                                    cancellationStatus?.text
                                                                }
                                                                <br />
                                                                <strong>
                                                                    Reason:
                                                                </strong>{" "}
                                                                {
                                                                    existingCancellation.reason
                                                                }
                                                            </div>
                                                        )}
                                                        {isDateTooSoon &&
                                                            !hasExistingCancellation && (
                                                                <div className="text-neutral-500 text-xs mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                                                    <strong>
                                                                        Notice:
                                                                    </strong>{" "}
                                                                    You can only
                                                                    cancel future
                                                                    dates.
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    {calendarDates
                                        .find(
                                            (cd) =>
                                                cd.date.toDateString() ===
                                                selectedDate.toDateString(),
                                        )
                                        ?.cancellations.map((cancellation) => {
                                            const statusInfo =
                                                getCancellationStatusInfo(
                                                    cancellation.status,
                                                );
                                            const StatusIcon = statusInfo.icon;

                                            return (
                                                <div
                                                    key={`cancel-detail-${cancellation.id}`}
                                                    className="mb-4 p-3 bg-error-50 border border-red-200 rounded-lg"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center text-sm text-neutral-600">
                                                            <Clock className="h-4 w-4 mr-1" />
                                                            {formatTime(
                                                                cancellation.start_time,
                                                            )}{" "}
                                                            (Cancelled)
                                                        </div>
                                                        <div
                                                            className={`flex items-center text-xs ${statusInfo.textColor} px-2 py-1 rounded-full bg-white border`}
                                                        >
                                                            <StatusIcon className="h-3 w-3 mr-1" />
                                                            {statusInfo.text}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex items-center text-neutral-700">
                                                            <MapPin className="h-4 w-4 mr-1" />
                                                            {
                                                                cancellation.center_name
                                                            }
                                                        </div>
                                                        <div className="flex items-center text-neutral-700">
                                                            <Users className="h-4 w-4 mr-1" />
                                                            Max{" "}
                                                            {
                                                                cancellation.max_patients
                                                            }{" "}
                                                            patients
                                                        </div>
                                                        {cancellation.status ===
                                                            2 &&
                                                            cancellation.reject_reason && (
                                                                <div className="text-error-600">
                                                                    <strong>
                                                                        Reject
                                                                        Reason:
                                                                    </strong>{" "}
                                                                    {
                                                                        cancellation.reject_reason
                                                                    }
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-neutral-500 text-sm">
                                        {schedules.length > 0 ||
                                        cancellations.length > 0
                                            ? "Select a date with schedules to view details"
                                            : "No schedules found for this doctor"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4">
                        <h4 className="font-medium text-neutral-900 mb-3">
                            Schedule Summary
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Total Schedules:</span>
                                <span className="font-medium">
                                    {schedules.length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Cancellations:</span>
                                <span className="font-medium">
                                    {cancellations.length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Pending Cancellations:</span>
                                <span className="font-medium text-yellow-600">
                                    {
                                        cancellations.filter(
                                            (c) => c.status === 0,
                                        ).length
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Approved Cancellations:</span>
                                <span className="font-medium text-green-600">
                                    {
                                        cancellations.filter(
                                            (c) => c.status === 1,
                                        ).length
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Rejected Cancellations:</span>
                                <span className="font-medium text-error-600">
                                    {
                                        cancellations.filter(
                                            (c) => c.status === 2,
                                        ).length
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>This Month:</span>
                                <span className="font-medium">
                                    {
                                        calendarDates.filter(
                                            (cd) =>
                                                cd.isCurrentMonth &&
                                                (cd.schedules.length > 0 ||
                                                    cd.cancellations.length >
                                                        0),
                                        ).length
                                    }{" "}
                                    days
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Branches:</span>
                                <span className="font-medium">
                                    {
                                        new Set([
                                            ...schedules.map(
                                                (s) => s.branch_center_name,
                                            ),
                                            ...cancellations.map(
                                                (c) => c.center_name,
                                            ),
                                        ]).size
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4">
                        <h4 className="font-medium text-neutral-900 mb-3">
                            Legend
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-100 rounded mr-2"></div>
                                <span>Today</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-primary-500 rounded mr-2"></div>
                                <span>Active appointment</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                                <span>Pending cancellation</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                                <span>Approved cancellation</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-error-500 rounded mr-2"></div>
                                <span>Rejected cancellation</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-neutral-300 rounded mr-2"></div>
                                <span>Past date (cannot cancel)</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 ring-2 ring-blue-500 rounded mr-2"></div>
                                <span>Selected date</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CancelModal
                isOpen={showCancelModal}
                onClose={() => {
                    setShowCancelModal(false);
                    setScheduleToCancel(null);
                    setIsCancelingEntireDay(false);
                }}
                onConfirm={
                    isCancelingEntireDay
                        ? confirmCancelEntireDay
                        : confirmCancelSchedule
                }
                schedule={scheduleToCancel}
                selectedDate={selectedDate}
                isLoading={cancelLoading}
                isCancelingEntireDay={isCancelingEntireDay}
                schedulesCount={
                    selectedDate
                        ? calendarDates.find(
                              (cd) =>
                                  cd.date.toDateString() ===
                                  selectedDate.toDateString(),
                          )?.schedules.length || 0
                        : 0
                }
            />
        </div>
    );
};

export default DoctorScheduleCalendar;
