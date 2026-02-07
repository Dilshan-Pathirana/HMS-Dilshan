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
    Filter,
    MoreHorizontal
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
    const [cancellations, setCancellations] = useState<DoctorScheduleCancellation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [scheduleToCancel, setScheduleToCancel] = useState<DoctorSchedule | null>(null);
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
            const response = await api.get(`/get-all-doctor-schedule/${currentUserId}`);
            if (response.data && response.data.doctorSchedule) {
                setSchedules(response.data.doctorSchedule);
            } else {
                setSchedules([]);
            }
        } catch (err: any) {
            console.error("Error fetching schedules:", err);
            setError(err.response?.data?.message || "Failed to fetch schedules");
            setSchedules([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCancellations = async () => {
        if (!currentUserId) return;
        try {
            const response = await api.get(`/get-doctor-schedule-cancel/${currentUserId}`);
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

    const getDateFromScheduleDay = (dayName: string, baseDate: Date): Date[] => {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
                const scheduleDates = getDateFromScheduleDay(schedule.schedule_day, currentDate);
                if (scheduleDates.some((scheduleDate) => scheduleDate.toDateString() === date.toDateString())) {
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
            alert.warn("You can only cancel future dates.");
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
            const response = await api.post("/request-cancel-doctor-appointment", {
                doctor_id: currentUserId,
                branch_id: scheduleToCancel.branch_id,
                schedule_id: scheduleToCancel.id,
                date: formattedDate,
                reason: reason,
            });

            if (response.data.status === 200) {
                alert.success(response.data.message || "Schedule cancelled successfully!");
                await Promise.all([fetchSchedules(), fetchCancellations()]);
                setShowCancelModal(false);
                setScheduleToCancel(null);
                setSelectedDate(null);
            } else {
                throw new Error(response.data.message || "Failed to cancel schedule");
            }
        } catch (err: any) {
            console.error("Error cancelling schedule:", err);
            const errorMessage = err.response?.data?.message || "Failed to cancel schedule";
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
            const response = await api.post("/cancel-doctor-entire-day", {
                doctor_id: currentUserId,
                date: formattedDate,
                reason: reason,
            });

            if (response.data.status === 200) {
                alert.success(response.data.message || "Day cancelled successfully!");
                await Promise.all([fetchSchedules(), fetchCancellations()]);
                setShowCancelModal(false);
                setIsCancelingEntireDay(false);
                setSelectedDate(null);
            } else {
                throw new Error(response.data.message || "Failed to cancel day");
            }
        } catch (err: any) {
            console.error("Error cancelling day:", err);
            const errorMessage = err.response?.data?.message || "Failed to cancel day";
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
            case 0: return { text: "Pending", color: "bg-amber-500", textColor: "text-amber-700", icon: Clock3, badgeClass: "bg-amber-100 text-amber-800" };
            case 1: return { text: "Approved", color: "bg-emerald-500", textColor: "text-emerald-700", icon: CheckCircle, badgeClass: "bg-emerald-100 text-emerald-800" };
            case 2: return { text: "Rejected", color: "bg-red-500", textColor: "text-red-700", icon: XCircle, badgeClass: "bg-red-100 text-red-800" };
            default: return { text: "Unknown", color: "bg-neutral-500", textColor: "text-neutral-700", icon: AlertTriangle, badgeClass: "bg-neutral-100 text-neutral-800" };
        }
    };

    const refreshData = async () => {
        await Promise.all([fetchSchedules(), fetchCancellations()]);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
                <p className="text-neutral-500 font-medium">Loading your schedule...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-red-900 mb-2">Unable to Load Schedule</h3>
                    <p className="text-red-700 mb-6">{error}</p>
                    <button
                        onClick={refreshData}
                        className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-all shadow-lg shadow-red-200"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-neutral-50/50 min-h-screen font-sans p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-sm">
                            <Calendar className="w-6 h-6 text-emerald-600" />
                        </div>
                        Schedule Management
                    </h1>
                    <p className="text-neutral-500 mt-1 ml-14">View and manage your availability slots</p>
                </div>
                <button
                    onClick={refreshData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-neutral-600 hover:text-emerald-600 hover:border-emerald-200 transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-white">
                            <button onClick={() => navigateMonth("prev")} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-600 hover:text-neutral-900">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <h2 className="text-xl font-bold text-neutral-900">
                                {monthNames[currentDate.getMonth()]} <span className="text-neutral-400 font-normal">{currentDate.getFullYear()}</span>
                            </h2>
                            <button onClick={() => navigateMonth("next")} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-600 hover:text-neutral-900">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-50/50">
                            {dayNames.map((day) => (
                                <div key={day} className="py-3 text-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 bg-neutral-200 gap-px">
                            {calendarDates.map((calendarDate, index) => {
                                const hasSchedules = calendarDate.schedules.length > 0;
                                const hasCancellations = calendarDate.cancellations.length > 0;
                                const isSelected = selectedDate?.toDateString() === calendarDate.date.toDateString();

                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleDateClick(calendarDate)}
                                        className={`
                                            min-h-[100px] p-3 bg-white transition-all cursor-pointer relative group
                                            ${!calendarDate.isCurrentMonth ? "bg-neutral-50/50 text-neutral-300" : "hover:bg-neutral-50"}
                                            ${isSelected ? "ring-2 ring-inset ring-emerald-500 bg-emerald-50/30 z-10" : ""}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`
                                                text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                                ${calendarDate.isToday ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : ""}
                                                ${isSelected && !calendarDate.isToday ? "text-emerald-700 font-bold" : ""}
                                            `}>
                                                {calendarDate.date.getDate()}
                                            </span>
                                        </div>

                                        <div className="space-y-1.5">
                                            {calendarDate.schedules.slice(0, 2).map((schedule) => (
                                                <div key={schedule.id} className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-100">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(schedule.start_time)}
                                                </div>
                                            ))}

                                            {calendarDate.cancellations.slice(0, Math.max(0, 2 - calendarDate.schedules.length)).map((cancel) => {
                                                const status = getCancellationStatusInfo(cancel.status);
                                                return (
                                                    <div key={`c-${cancel.id}`} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border ${status.badgeClass.replace('text-', 'border-').replace('bg-', 'bg-opacity-20 ')}`}>
                                                        <X className="w-3 h-3" />
                                                        {formatTime(cancel.start_time)}
                                                    </div>
                                                );
                                            })}

                                            {(calendarDate.schedules.length + calendarDate.cancellations.length) > 2 && (
                                                <div className="text-[10px] font-bold text-neutral-400 pl-1">
                                                    +{calendarDate.schedules.length + calendarDate.cancellations.length - 2} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Details Column */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-neutral-100 bg-gradient-to-br from-white to-neutral-50">
                            <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                <Filter className="h-5 w-5 text-neutral-400" />
                                Selected Date Details
                            </h3>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto min-h-[400px]">
                            {selectedDate ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-2xl font-bold text-neutral-900">
                                            {selectedDate.toLocaleDateString("en-US", { weekday: "long", day: "numeric" })}
                                            <span className="block text-sm font-medium text-neutral-500 mt-1">
                                                {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                            </span>
                                        </h4>
                                        {canCancelBasedOnDate(selectedDate) && (
                                            <button
                                                onClick={handleCancelEntireDay}
                                                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-bold border border-red-100"
                                            >
                                                Cancel All
                                            </button>
                                        )}
                                    </div>

                                    {/* Slots List */}
                                    <div className="space-y-4">
                                        {calendarDates.find(cd => cd.date.toDateString() === selectedDate.toDateString())?.schedules.map((schedule) => {
                                            const formattedDate = formatDateForAPI(selectedDate);
                                            const cancellation = cancellations.find(c => c.schedule_id === schedule.id && c.date === formattedDate);
                                            const status = cancellation ? getCancellationStatusInfo(cancellation.status) : null;
                                            const isCancellable = !cancellation && canCancelBasedOnDate(selectedDate);

                                            return (
                                                <div key={schedule.id} className="group p-4 bg-white border border-neutral-200 rounded-2xl hover:border-emerald-200 hover:shadow-sm transition-all relative">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs border border-emerald-100">
                                                                {schedule.start_time.substring(0, 5)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-neutral-900">{schedule.branch_center_name}</p>
                                                                <p className="text-xs text-neutral-500">Max {schedule.max_patients} Patients</p>
                                                            </div>
                                                        </div>

                                                        {status && (
                                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${status.badgeClass}`}>
                                                                <status.icon className="w-3 h-3" />
                                                                {status.text}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {!cancellation && (
                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                                                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                                <MapPin className="w-3 h-3" />
                                                                Clinic Room 204
                                                            </div>
                                                            {isCancellable && (
                                                                <button
                                                                    onClick={() => handleCancelSchedule(schedule)}
                                                                    className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                                                >
                                                                    Request Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {cancellation && (
                                                        <div className="mt-3 p-3 bg-neutral-50 rounded-xl text-xs space-y-1">
                                                            <p className="font-bold text-neutral-700">Cancellation Request:</p>
                                                            <p className="text-neutral-500 italic">"{cancellation.reason}"</p>
                                                            {cancellation.reject_reason && (
                                                                <p className="text-red-600 mt-1">Admin Note: {cancellation.reject_reason}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {calendarDates.find(cd => cd.date.toDateString() === selectedDate.toDateString())?.schedules.length === 0 && (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-300">
                                                    <Calendar className="w-8 h-8" />
                                                </div>
                                                <p className="text-neutral-900 font-medium">No schedules</p>
                                                <p className="text-neutral-500 text-sm">No slots found for this date.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                        <Calendar className="w-10 h-10 text-emerald-300" />
                                    </div>
                                    <h4 className="text-lg font-bold text-neutral-900 mb-2">Select a Date</h4>
                                    <p className="text-sm max-w-[200px]">Click on any date in the calendar to view or manage schedule details.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Modal Integration */}
            {showCancelModal && (
                <CancelModal
                    isOpen={showCancelModal}
                    onClose={() => {
                        setShowCancelModal(false);
                        setScheduleToCancel(null);
                        setIsCancelingEntireDay(false);
                    }}
                    onConfirm={isCancelingEntireDay ? confirmCancelEntireDay : confirmCancelSchedule}
                    isLoading={cancelLoading}
                    schedule={scheduleToCancel}
                    selectedDate={selectedDate}
                />
            )}
        </div>
    );
};

export default DoctorScheduleCalendar;
