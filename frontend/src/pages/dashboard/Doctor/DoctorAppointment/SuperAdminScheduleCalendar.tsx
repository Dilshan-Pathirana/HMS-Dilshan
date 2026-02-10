import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Building2,
    User,
    RefreshCw,
    Loader,
    AlertTriangle,
    Plus,
    Pencil,
    Trash2,
    Ban,
    Clock,
    Users,
} from "lucide-react";

import api from "../../../../utils/api/axios";
import alert from "../../../../utils/alert";
import { appointmentSuperAdminApi, Branch, Doctor } from "../../../../services/appointmentService";
import DoctorSessionCreate from "../../DoctorSession/DoctorSessionCreate";

type SlotStatus = "available" | "full" | "blocked";

interface ScheduleCalendarSlot {
    schedule_id: string;
    doctor_id: string;
    doctor_name: string;
    branch_id: string;
    branch_name: string;
    date: string; // YYYY-MM-DD
    start_time: string; // HH:MM:SS or HH:MM
    end_time: string;
    slot_duration_minutes: number;
    max_patients: number;
    booked_count: number;
    status: SlotStatus;
}

interface SchedulesCalendarResponse {
    status: number;
    start_date: string;
    end_date: string;
    slots_by_date: Record<string, ScheduleCalendarSlot[]>;
}

interface DoctorScheduleRead {
    id: string;
    doctor_id: string;
    branch_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
    max_patients: number;
    status: string;
    recurrence_type: string;
    valid_from?: string | null;
    valid_until?: string | null;
}

interface CancellationRequest {
    id: string;
    doctor_id: string;
    schedule_id: string;
    cancel_date: string;
    cancel_end_date?: string | null;
    reason?: string | null;
    status: "pending" | "approved" | "rejected" | string;
    cancel_type: "single_day" | "range" | string;
    created_at: string;
}

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

function toIsoDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseTimeLabel(timeString: string): string {
    // Accept HH:MM, HH:MM:SS
    const parts = (timeString || "00:00").split(":");
    const hours = Number(parts[0] || 0);
    const minutes = String(parts[1] || "00").padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function weekdayFromDate(d: Date): number {
    // Backend expects 0=Monday..6=Sunday.
    // JS getDay(): 0=Sunday..6=Saturday.
    const js = d.getDay();
    return (js + 6) % 7;
}

const ModalShell: React.FC<{
    title: string;
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}> = ({ title, open, onClose, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl border border-neutral-200 shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    >
                        Close
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const SuperAdminScheduleCalendar: React.FC = () => {
    type TabKey = "management" | "cancel_requests" | "create_session";

    const [activeTab, setActiveTab] = useState<TabKey>("management");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [branches, setBranches] = useState<Branch[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);

    const [selectedBranchId, setSelectedBranchId] = useState<string>("");
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

    const [slotsByDate, setSlotsByDate] = useState<Record<string, ScheduleCalendarSlot[]>>({});

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editSchedule, setEditSchedule] = useState<DoctorScheduleRead | null>(null);

    const [formStartTime, setFormStartTime] = useState<string>("09:00");
    const [formEndTime, setFormEndTime] = useState<string>("12:00");
    const [formSlotDuration, setFormSlotDuration] = useState<number>(30);
    const [formMaxPatients, setFormMaxPatients] = useState<number>(20);
    const [formRecurrence, setFormRecurrence] = useState<string>("weekly");
    const [formStatus, setFormStatus] = useState<string>("active");
    const [formValidFrom, setFormValidFrom] = useState<string>("");
    const [formValidUntil, setFormValidUntil] = useState<string>("");

    const [cancelRequests, setCancelRequests] = useState<CancellationRequest[]>([]);
    const [cancelStatusFilter, setCancelStatusFilter] = useState<string>("");
    const [cancelRequestsLoading, setCancelRequestsLoading] = useState<boolean>(false);

    const loadBranches = useCallback(async () => {
        try {
            const res = await appointmentSuperAdminApi.getBranches();
            if (res.status === 200) {
                setBranches(res.branches || []);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const loadDoctors = useCallback(async (branchId?: string) => {
        try {
            const res = await appointmentSuperAdminApi.getAllDoctors(branchId);
            if (res.status === 200) {
                setDoctors(res.doctors || []);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        loadBranches();
        loadDoctors();
    }, [loadBranches, loadDoctors]);

    useEffect(() => {
        // Reload doctor list when branch changes; reset selected doctor.
        setSelectedDoctorId("");
        if (selectedBranchId) {
            loadDoctors(selectedBranchId);
        } else {
            loadDoctors();
        }
    }, [selectedBranchId, loadDoctors]);

    const calendarRange = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const start = new Date(firstDay);
        start.setDate(start.getDate() - firstDay.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 41);
        return { start, end };
    }, [currentDate]);

    const fetchCalendar = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const params: any = {
                start_date: toIsoDate(calendarRange.start),
                end_date: toIsoDate(calendarRange.end),
            };
            if (selectedBranchId) params.branch_id = selectedBranchId;
            if (selectedDoctorId) params.doctor_id = selectedDoctorId;

            const res = (await api.get("/schedules/calendar", { params })) as unknown as SchedulesCalendarResponse;
            const raw = (res as any)?.slots_by_date ?? (res as any)?.data?.slots_by_date ?? {};
            setSlotsByDate(raw || {});
        } catch (err: any) {
            console.error("Failed to fetch schedule calendar", err);
            setError(err?.response?.data?.detail || err?.response?.data?.message || "Failed to load schedules");
            setSlotsByDate({});
        } finally {
            setIsLoading(false);
        }
    }, [calendarRange.end, calendarRange.start, selectedBranchId, selectedDoctorId]);

    useEffect(() => {
        fetchCalendar();
    }, [fetchCalendar]);

    const fetchCancelRequests = useCallback(async () => {
        try {
            setCancelRequestsLoading(true);
            const params: any = {};
            if (cancelStatusFilter) params.status = cancelStatusFilter;
            if (selectedDoctorId) params.doctor_id = selectedDoctorId;

            const res = (await api.get("/schedules/cancel/requests", { params })) as any;
            const raw = Array.isArray(res)
                ? res
                : (res?.data ? res.data : res);

            const list = Array.isArray(raw) ? raw : [];
            setCancelRequests(
                list.map((r: any) => ({
                    id: String(r.id ?? ""),
                    doctor_id: String(r.doctor_id ?? ""),
                    schedule_id: String(r.schedule_id ?? ""),
                    cancel_date: String(r.cancel_date ?? ""),
                    cancel_end_date: r.cancel_end_date ?? null,
                    reason: r.reason ?? null,
                    status: String(r.status ?? "pending"),
                    cancel_type: String(r.cancel_type ?? "single_day"),
                    created_at: String(r.created_at ?? ""),
                }))
            );
        } catch (err) {
            console.error("Failed to fetch cancel requests", err);
            setCancelRequests([]);
        } finally {
            setCancelRequestsLoading(false);
        }
    }, [cancelStatusFilter, selectedDoctorId]);

    useEffect(() => {
        if (activeTab === "cancel_requests") {
            fetchCancelRequests();
        }
    }, [activeTab, fetchCancelRequests]);

    const calendarDates = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const today = new Date();
        const dates: Array<{
            date: Date;
            isCurrentMonth: boolean;
            isToday: boolean;
            slots: ScheduleCalendarSlot[];
        }> = [];

        for (let i = 0; i < 42; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const iso = toIsoDate(d);
            dates.push({
                date: d,
                isCurrentMonth: d.getMonth() === month,
                isToday: d.toDateString() === today.toDateString(),
                slots: slotsByDate[iso] || [],
            });
        }

        return dates;
    }, [currentDate, slotsByDate]);

    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            next.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
            return next;
        });
        setSelectedDate(null);
    };

    const handleDateClick = (d: Date, isCurrentMonth: boolean) => {
        if (!isCurrentMonth) return;
        setSelectedDate(d);
    };

    const selectedIso = selectedDate ? toIsoDate(selectedDate) : "";
    const selectedSlots = selectedIso ? (slotsByDate[selectedIso] || []) : [];

    const cancelAllForSelectedDay = async () => {
        if (!selectedDate) {
            alert.warn("Select a day first.");
            return;
        }
        if (selectedSlots.length === 0) {
            alert.warn("No schedules found for the selected day.");
            return;
        }
        const ok = window.confirm("Cancel (block) all schedules for this date?");
        if (!ok) return;

        try {
            await Promise.all(
                selectedSlots.map((slot) =>
                    api.post("/schedules/cancel/request", {
                        doctor_id: slot.doctor_id,
                        schedule_id: slot.schedule_id,
                        cancel_date: slot.date,
                        reason: "Cancelled by admin",
                        cancel_type: "single_day",
                        status: "approved",
                    })
                )
            );
            alert.success("Cancelled for the day.");
            await fetchCalendar();
        } catch (err: any) {
            console.error(err);
            alert.warn(err?.response?.data?.detail || err?.response?.data?.message || "Failed to cancel day");
        }
    };

    const resetFormDefaults = useCallback(() => {
        setFormStartTime("09:00");
        setFormEndTime("12:00");
        setFormSlotDuration(30);
        setFormMaxPatients(20);
        setFormRecurrence("weekly");
        setFormStatus("active");
        setFormValidFrom(selectedDate ? toIsoDate(selectedDate) : "");
        setFormValidUntil("");
    }, [selectedDate]);

    const openCreate = () => {
        if (!selectedDate) {
            alert.warn("Select a date first.");
            return;
        }
        if (!selectedDoctorId || !selectedBranchId) {
            alert.warn("Select both Branch and Doctor to create a schedule.");
            return;
        }
        resetFormDefaults();
        setCreateOpen(true);
    };

    const submitCreate = async () => {
        if (!selectedDate) return;
        if (!selectedDoctorId || !selectedBranchId) {
            alert.warn("Select both Branch and Doctor.");
            return;
        }
        try {
            const payload = {
                doctor_id: selectedDoctorId,
                branch_id: selectedBranchId,
                day_of_week: weekdayFromDate(selectedDate),
                start_time: formStartTime,
                end_time: formEndTime,
                slot_duration_minutes: Number(formSlotDuration),
                max_patients: Number(formMaxPatients),
                status: formStatus,
                recurrence_type: formRecurrence,
                valid_from: formValidFrom || null,
                valid_until: formValidUntil || null,
            };
            await api.post("/schedules/", payload);
            alert.success("Schedule created.");
            setCreateOpen(false);
            await fetchCalendar();
        } catch (err: any) {
            console.error(err);
            alert.warn(err?.response?.data?.detail || err?.response?.data?.message || "Failed to create schedule");
        }
    };

    const openEdit = async (scheduleId: string) => {
        try {
            const res = (await api.get(`/schedules/${scheduleId}`)) as any;
            const sched: DoctorScheduleRead = (res as any)?.data ? (res as any).data : res;
            setEditSchedule(sched);

            setFormStartTime(String(sched.start_time || "09:00").substring(0, 5));
            setFormEndTime(String(sched.end_time || "12:00").substring(0, 5));
            setFormSlotDuration(Number(sched.slot_duration_minutes ?? 30));
            setFormMaxPatients(Number(sched.max_patients ?? 20));
            setFormRecurrence(String(sched.recurrence_type ?? "weekly"));
            setFormStatus(String(sched.status ?? "active"));
            setFormValidFrom((sched.valid_from as any) || "");
            setFormValidUntil((sched.valid_until as any) || "");

            setEditOpen(true);
        } catch (err: any) {
            console.error(err);
            alert.warn(err?.response?.data?.detail || err?.response?.data?.message || "Failed to load schedule");
        }
    };

    const submitEdit = async () => {
        if (!editSchedule) return;
        try {
            const payload = {
                doctor_id: editSchedule.doctor_id,
                branch_id: editSchedule.branch_id,
                day_of_week: editSchedule.day_of_week,
                start_time: formStartTime,
                end_time: formEndTime,
                slot_duration_minutes: Number(formSlotDuration),
                max_patients: Number(formMaxPatients),
                status: formStatus,
                recurrence_type: formRecurrence,
                valid_from: formValidFrom || null,
                valid_until: formValidUntil || null,
            };
            await api.put(`/schedules/${editSchedule.id}`, payload);
            alert.success("Schedule updated.");
            setEditOpen(false);
            setEditSchedule(null);
            await fetchCalendar();
        } catch (err: any) {
            console.error(err);
            alert.warn(err?.response?.data?.detail || err?.response?.data?.message || "Failed to update schedule");
        }
    };

    const deleteSchedule = async (scheduleId: string) => {
        const ok = window.confirm("Delete this schedule? This removes the recurring schedule.");
        if (!ok) return;
        try {
            await api.delete(`/schedules/${scheduleId}`);
            alert.success("Schedule deleted.");
            await fetchCalendar();
        } catch (err: any) {
            console.error(err);
            alert.warn(err?.response?.data?.detail || err?.response?.data?.message || "Failed to delete schedule");
        }
    };

    const blockOccurrence = async (slot: ScheduleCalendarSlot) => {
        if (!selectedDate) return;
        if (slot.status === "blocked") return;

        const ok = window.confirm("Block this availability for the selected date?");
        if (!ok) return;

        try {
            await api.post("/schedules/cancel/request", {
                doctor_id: slot.doctor_id,
                schedule_id: slot.schedule_id,
                cancel_date: slot.date,
                reason: "Blocked by admin",
                cancel_type: "single_day",
                status: "approved",
            });
            alert.success("Blocked.");
            await fetchCalendar();
        } catch (err: any) {
            console.error(err);
            alert.warn(err?.response?.data?.detail || err?.response?.data?.message || "Failed to block");
        }
    };

    const approveCancelRequest = async (id: string) => {
        try {
            await api.post(`/schedules/cancel/approve/${id}`);
            alert.success("Approved.");
            await fetchCancelRequests();
            await fetchCalendar();
        } catch (err: any) {
            console.error(err);
            alert.warn(err?.response?.data?.detail || err?.response?.data?.message || "Failed to approve");
        }
    };

    const rejectCancelRequest = async (id: string) => {
        try {
            await api.post(`/schedules/cancel/reject/${id}`);
            alert.success("Rejected.");
            await fetchCancelRequests();
            await fetchCalendar();
        } catch (err: any) {
            console.error(err);
            alert.warn(err?.response?.data?.detail || err?.response?.data?.message || "Failed to reject");
        }
    };

    const statusBadge = (s: SlotStatus) => {
        if (s === "available") return "bg-emerald-100 text-emerald-800 border-emerald-200";
        if (s === "full") return "bg-amber-100 text-amber-800 border-amber-200";
        return "bg-red-100 text-red-800 border-red-200";
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
                <p className="text-neutral-500 font-medium">Loading schedules...</p>
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
                    <h3 className="text-lg font-bold text-red-900 mb-2">Unable to Load Schedules</h3>
                    <p className="text-red-700 mb-6">{error}</p>
                    <button
                        onClick={fetchCalendar}
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
            <div className="flex justify-between items-start gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-sm">
                            <Calendar className="w-6 h-6 text-emerald-600" />
                        </div>
                        Schedule Management
                    </h1>
                    <p className="text-neutral-500 mt-1 ml-14">View and manage doctor availability by branch and doctor</p>
                </div>

                <button
                    onClick={fetchCalendar}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-neutral-600 hover:text-emerald-600 hover:border-emerald-200 transition-all font-medium shadow-sm hover:shadow-md"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-3 mb-6">
                <div className="flex flex-wrap gap-2">
                        {([
                            { key: "management", label: "Schedule Management" },
                            { key: "cancel_requests", label: "Cancel Requests" },
                            { key: "create_session", label: "Create Session" },
                        ] as Array<{ key: TabKey; label: string }>).map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                                activeTab === t.key
                                    ? "bg-neutral-900 text-white border-neutral-900"
                                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Branch</label>
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-neutral-400" />
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">All Branches</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Doctor</label>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-neutral-400" />
                            <select
                                value={selectedDoctorId}
                                onChange={(e) => setSelectedDoctorId(e.target.value)}
                                className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">All Doctors</option>
                                {doctors.map((d, idx) => (
                                    <option key={`${d.doctor_id}-${d.branch_id ?? idx}`} value={d.doctor_id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-end">
                        {activeTab !== "create_session" ? (
                            <button
                                onClick={openCreate}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Create Schedule
                            </button>
                        ) : (
                            <div className="w-full text-xs text-neutral-500">Use the form below to create a session.</div>
                        )}
                    </div>
                </div>
            </div>

            {activeTab === "management" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Calendar */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-white">
                                <button
                                    onClick={() => navigateMonth("prev")}
                                    className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-600 hover:text-neutral-900"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <h2 className="text-xl font-bold text-neutral-900">
                                    {monthNames[currentDate.getMonth()]}{" "}
                                    <span className="text-neutral-400 font-normal">{currentDate.getFullYear()}</span>
                                </h2>
                                <button
                                    onClick={() => navigateMonth("next")}
                                    className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-600 hover:text-neutral-900"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-50/50">
                                {dayNames.map((day) => (
                                    <div
                                        key={day}
                                        className="py-3 text-center text-xs font-bold text-neutral-400 uppercase tracking-wider"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 bg-neutral-200 gap-px">
                                {calendarDates.map((cd, index) => {
                                    const isSelected = selectedDate?.toDateString() === cd.date.toDateString();
                                    const items = cd.slots;

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => handleDateClick(cd.date, cd.isCurrentMonth)}
                                            className={`
                                                min-h-[100px] p-3 bg-white transition-all cursor-pointer relative group
                                                ${!cd.isCurrentMonth ? "bg-neutral-50/50 text-neutral-300" : "hover:bg-neutral-50"}
                                                ${isSelected ? "ring-2 ring-inset ring-emerald-500 bg-emerald-50/30 z-10" : ""}
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span
                                                    className={`
                                                        text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                                        ${cd.isToday ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : ""}
                                                        ${isSelected && !cd.isToday ? "text-emerald-700 font-bold" : ""}
                                                    `}
                                                >
                                                    {cd.date.getDate()}
                                                </span>
                                            </div>

                                            <div className="space-y-1.5">
                                                {items.slice(0, 2).map((slot) => (
                                                    <div
                                                        key={`${slot.schedule_id}-${slot.doctor_id}-${slot.start_time}`}
                                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border ${
                                                            slot.status === "blocked"
                                                                ? "bg-red-50 text-red-700 border-red-100"
                                                                : slot.status === "full"
                                                                    ? "bg-amber-50 text-amber-700 border-amber-100"
                                                                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                        }`}
                                                    >
                                                        <Clock className="w-3 h-3" />
                                                        {parseTimeLabel(slot.start_time)}
                                                    </div>
                                                ))}

                                                {items.length > 2 && (
                                                    <div className="text-[10px] font-bold text-neutral-400 pl-1">+{items.length - 2} more</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden h-full flex flex-col">
                            <div className="p-6 border-b border-neutral-100 bg-gradient-to-br from-white to-neutral-50">
                                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-neutral-400" />
                                    Selected Date Details
                                </h3>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto min-h-[400px]">
                                {selectedDate ? (
                                    <div className="space-y-6">
                                        <div className="flex items-start justify-between gap-3">
                                            <h4 className="text-2xl font-bold text-neutral-900">
                                                {selectedDate.toLocaleDateString("en-US", { weekday: "long", day: "numeric" })}
                                                <span className="block text-sm font-medium text-neutral-500 mt-1">
                                                    {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                                </span>
                                            </h4>
                                            <button
                                                onClick={cancelAllForSelectedDay}
                                                className="px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors text-xs font-bold border border-red-100"
                                            >
                                                Cancel All
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {selectedSlots.map((slot) => (
                                                <div
                                                    key={`${slot.schedule_id}-${slot.doctor_id}-${slot.start_time}`}
                                                    className="p-4 bg-white border border-neutral-200 rounded-2xl hover:border-emerald-200 hover:shadow-sm transition-all"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-neutral-900 truncate">{slot.doctor_name}</p>
                                                            <p className="text-xs text-neutral-500 truncate">{slot.branch_name}</p>
                                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                                                                    <Clock className="w-3 h-3" />
                                                                    {parseTimeLabel(slot.start_time)} - {parseTimeLabel(slot.end_time)}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                                                                    <Users className="w-3 h-3" />
                                                                    {slot.booked_count}/{slot.max_patients}
                                                                </span>
                                                                <span
                                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${statusBadge(slot.status)}`}
                                                                >
                                                                    {slot.status.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => openEdit(slot.schedule_id)}
                                                                className="px-3 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-bold"
                                                                title="Edit schedule"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteSchedule(slot.schedule_id)}
                                                                className="px-3 py-2 rounded-xl border border-neutral-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                                                                title="Delete schedule"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => blockOccurrence(slot)}
                                                                disabled={slot.status === "blocked"}
                                                                className="px-3 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-bold disabled:opacity-50"
                                                                title="Cancel (block) this schedule"
                                                            >
                                                                <Ban className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {selectedSlots.length === 0 && (
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
                                        <p className="text-sm max-w-[220px]">Pick a date to view details and cancel schedules.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "cancel_requests" && (
                <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 bg-gradient-to-br from-white to-neutral-50 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-neutral-900">Cancel Requests</h3>
                            <p className="text-sm text-neutral-500">Requests made by doctors to cancel sessions</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={cancelStatusFilter}
                                onChange={(e) => setCancelStatusFilter(e.target.value)}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">All</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <button
                                onClick={fetchCancelRequests}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-neutral-600 hover:text-emerald-600 hover:border-emerald-200 transition-all font-medium shadow-sm hover:shadow-md"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {cancelRequestsLoading ? (
                            <div className="flex items-center gap-2 text-neutral-500">
                                <Loader className="h-4 w-4 animate-spin" />
                                Loading requests...
                            </div>
                        ) : cancelRequests.length === 0 ? (
                            <div className="text-neutral-500">No cancel requests found.</div>
                        ) : (
                            <div className="space-y-3">
                                {cancelRequests.map((r) => (
                                    <div key={r.id} className="p-4 border border-neutral-200 rounded-2xl bg-white">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-neutral-900">
                                                    Doctor: <span className="font-medium">{r.doctor_id}</span>
                                                </div>
                                                <div className="text-xs text-neutral-500 mt-1">
                                                    Schedule: {r.schedule_id} | Date: {r.cancel_date}
                                                    {r.cancel_end_date ? ` → ${r.cancel_end_date}` : ""}
                                                </div>
                                                {r.reason && <div className="text-sm text-neutral-700 mt-2 italic">“{r.reason}”</div>}
                                                <div className="mt-2">
                                                    <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                                        r.status === "approved" ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                                            : r.status === "rejected" ? "bg-red-100 text-red-800 border-red-200"
                                                                : "bg-amber-100 text-amber-800 border-amber-200"
                                                    }`}>
                                                        {String(r.status).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={r.status !== "pending"}
                                                    onClick={() => approveCancelRequest(r.id)}
                                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    disabled={r.status !== "pending"}
                                                    onClick={() => rejectCancelRequest(r.id)}
                                                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "create_session" && (
                <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 bg-gradient-to-br from-white to-neutral-50">
                        <h3 className="text-lg font-bold text-neutral-900">Create Session</h3>
                        <p className="text-sm text-neutral-500">Create a session for a doctor</p>
                    </div>
                    <div className="p-6">
                        <DoctorSessionCreate />
                    </div>
                </div>
            )}

            <ModalShell
                title="Create Schedule"
                open={createOpen}
                onClose={() => setCreateOpen(false)}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Start time</label>
                            <input
                                type="time"
                                value={formStartTime}
                                onChange={(e) => setFormStartTime(e.target.value)}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">End time</label>
                            <input
                                type="time"
                                value={formEndTime}
                                onChange={(e) => setFormEndTime(e.target.value)}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Slot duration (min)</label>
                            <input
                                type="number"
                                value={formSlotDuration}
                                onChange={(e) => setFormSlotDuration(Number(e.target.value))}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                min={5}
                                max={240}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Max patients</label>
                            <input
                                type="number"
                                value={formMaxPatients}
                                onChange={(e) => setFormMaxPatients(Number(e.target.value))}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                min={1}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Recurrence</label>
                            <select
                                value={formRecurrence}
                                onChange={(e) => setFormRecurrence(e.target.value)}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Biweekly</option>
                                <option value="once">Once</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Status</label>
                            <select
                                value={formStatus}
                                onChange={(e) => setFormStatus(e.target.value)}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Valid from</label>
                            <input
                                type="date"
                                value={formValidFrom}
                                onChange={(e) => setFormValidFrom(e.target.value)}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Valid until</label>
                            <input
                                type="date"
                                value={formValidUntil}
                                onChange={(e) => setFormValidUntil(e.target.value)}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={submitCreate}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Create
                    </button>
                </div>
            </ModalShell>

            <ModalShell
                title="Edit Schedule"
                open={editOpen}
                onClose={() => {
                    setEditOpen(false);
                    setEditSchedule(null);
                }}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Start time</label>
                            <input
                                type="time"
                                value={formStartTime}
                                onChange={(e) => setFormStartTime(e.target.value)}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">End time</label>
                            <input
                                type="time"
                                value={formEndTime}
                                onChange={(e) => setFormEndTime(e.target.value)}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Slot duration (min)</label>
                            <input
                                type="number"
                                value={formSlotDuration}
                                onChange={(e) => setFormSlotDuration(Number(e.target.value))}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                min={5}
                                max={240}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Max patients</label>
                            <input
                                type="number"
                                value={formMaxPatients}
                                onChange={(e) => setFormMaxPatients(Number(e.target.value))}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                min={1}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Recurrence</label>
                            <select
                                value={formRecurrence}
                                onChange={(e) => setFormRecurrence(e.target.value)}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Biweekly</option>
                                <option value="once">Once</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Status</label>
                            <select
                                value={formStatus}
                                onChange={(e) => setFormStatus(e.target.value)}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Valid from</label>
                            <input
                                type="date"
                                value={formValidFrom}
                                onChange={(e) => setFormValidFrom(e.target.value)}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Valid until</label>
                            <input
                                type="date"
                                value={formValidUntil}
                                onChange={(e) => setFormValidUntil(e.target.value)}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={submitEdit}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium"
                    >
                        <Pencil className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </ModalShell>
        </div>
    );
};

export default SuperAdminScheduleCalendar;
