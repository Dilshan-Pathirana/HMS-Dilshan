import { useSelector } from "react-redux";
import { RootState } from "../../../../store.tsx";
import { useEffect, useMemo, useState } from "react";
import api from "../../../../utils/api/axios";
import { DoctorSchedule } from "../../../../utils/types/users/IDoctorData.ts";
import DoctorAppointments from "./DoctorAppointmentDetails/DoctorAppointments.tsx";
import {
    Calendar,
    Search,
    Filter,
    Clock,
    MapPin,
    Users,
    MoreHorizontal,
    ChevronRight,
    Stethoscope,
    RefreshCw,
    X
} from "lucide-react";
import { PageHeader } from "../../../../components/ui/PageHeader";

const AllDoctorRelatedAppointments = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | null>(null);
    const [filteredSchedules, setFilteredSchedules] = useState<DoctorSchedule[]>([]);

    useEffect(() => {
        if (userId) {
            refreshSchedules().then();
        }
    }, [userId]);

    useMemo(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const afterFilteringScheduleDetails = (schedules || []).filter(
            (schedule) =>
                schedule.branch_center_name.toLowerCase().includes(lowerTerm) ||
                schedule.schedule_day.toLowerCase().includes(lowerTerm) ||
                schedule.start_time.includes(lowerTerm)
        );

        setFilteredSchedules(afterFilteringScheduleDetails);
    }, [schedules, searchTerm]);

    const refreshSchedules = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/get-doctor-all-schedule/${userId}`);
            setSchedules(response.data?.doctorSchedule || []);
        } catch (err) {
            console.error("Error fetching schedules:", err);
            setSchedules([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalOpen = (schedule: DoctorSchedule) => {
        setSelectedSchedule(schedule);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Your Appointment Schedules"
                description="Manage all your upcoming sessions across different branches."
                actions={
                    <button
                        onClick={() => refreshSchedules()}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-neutral-600 hover:text-primary-600 hover:border-primary-200 transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh Data
                    </button>
                }
            />

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search by branch, day, or time..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 text-neutral-600 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors font-medium text-sm">
                        <Filter className="h-4 w-4" />
                        Filters
                    </button>
                    <span className="text-sm font-medium text-neutral-500">
                        Showing {filteredSchedules.length} schedules
                    </span>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-neutral-500 font-medium">Loading schedules...</p>
                </div>
            ) : filteredSchedules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSchedules.map((schedule) => (
                        <div
                            key={schedule.id}
                            onClick={() => handleModalOpen(schedule)}
                            className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer group flex flex-col overflow-hidden"
                        >
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">
                                                {schedule.schedule_day}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium bg-neutral-100 px-2 py-0.5 rounded-full w-fit mt-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(schedule.start_time)}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-neutral-300 group-hover:text-primary-500 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                                        <MapPin className="w-4 h-4 text-neutral-400" />
                                        <span className="line-clamp-1">{schedule.branch_center_name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                                        <Users className="w-4 h-4 text-neutral-400" />
                                        <span>Original Patient Limit: {schedule.max_patients}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                                        <Stethoscope className="w-4 h-4 text-neutral-400" />
                                        <span>General Session</span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Status</span>
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                                    Active
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-neutral-200 shadow-sm text-center">
                    <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-10 h-10 text-neutral-300" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">No Schedules Found</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                        We couldn't find any appointment schedules matching your search. Try adjusting your filters or check back later.
                    </p>
                    <button
                        onClick={() => { setSearchTerm(""); refreshSchedules(); }}
                        className="mt-6 px-6 py-2 bg-white border border-neutral-200 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors shadow-sm"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {isModalOpen && selectedSchedule && (
                <DoctorAppointments
                    handleModalClose={handleModalClose}
                    schedule={selectedSchedule}
                />
            )}
        </div>
    );
};

export default AllDoctorRelatedAppointments;
