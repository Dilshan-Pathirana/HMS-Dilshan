import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    Calendar,
    Clock,
    Plus,
    ChevronLeft,
    Edit2,
    Edit3,
    Trash2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Loader2,
    Save,
    CalendarDays,
    CalendarX,
    Building2
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface Schedule {
    id: string;
    branch_id: string;
    branch_name: string;
    date: string;
    day: string;
    start_time: string;
    end_time: string;
    max_patients: number;
    booked_slots: number;
    available_slots: number;
    status: 'active' | 'cancelled' | 'completed';
}

interface Branch {
    id: string;
    center_name: string;
}

// Main Schedule Management Component
const DoctorScheduleManagement: React.FC = () => {
    return (
        <Routes>
            <Route index element={<ScheduleList />} />
            <Route path="create" element={<CreateSchedule />} />
            <Route path="edit/:id" element={<EditSchedule />} />
            <Route path="blocked-dates" element={<BlockedDates />} />
        </Routes>
    );
};

// Schedule Request Interface
interface ScheduleRequest {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
    branch_id: string;
    branch_name: string;
    schedule_day: string;
    start_time: string;
    end_time: string | null;
    max_patients: number;
    time_per_patient: number;
    reason: string;
    approval_notes: string | null;
    requested_at: string;
    approved_at: string | null;
}

// Schedule List View
const ScheduleList: React.FC = () => {
    const navigate = useNavigate();
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [scheduleRequests, setScheduleRequests] = useState<ScheduleRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'past' | 'cancelled' | 'rejected' | 'revision_requested'>('pending');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetchData();
        }
    }, [userId]);

    const fetchData = async () => {
        if (!userId) {
            console.warn('No userId available, skipping fetch');
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            console.log('Fetching data for userId:', userId);
            
            // Fetch both schedules and schedule requests in parallel
            const [schedulesResponse, requestsResponse] = await Promise.all([
                api.get(`/get-all-doctor-schedule/${userId}`),
                api.get(`/get-doctor-schedule-requests/${userId}`)
            ]);

            console.log('Schedules Response:', schedulesResponse.data);
            console.log('Requests Response:', requestsResponse.data);

            if (schedulesResponse.data.status === 200) {
                setSchedules(schedulesResponse.data.doctorSchedules || []);
            }

            if (requestsResponse.data.status === 200) {
                console.log('Setting schedule requests:', requestsResponse.data.scheduleRequests);
                setScheduleRequests(requestsResponse.data.scheduleRequests || []);
            } else {
                console.warn('Schedule requests API returned non-200 status:', requestsResponse.data);
            }
        } catch (error: any) {
            console.error('Failed to fetch data:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
        } finally {
            setLoading(false);
        }
    };

    const cancelSchedule = async (scheduleId: string, reason: string) => {
        try {
            await api.post('/request-cancel-doctor-appointment', {
                schedule_id: scheduleId,
                reason: reason
            });
            fetchData();
        } catch (error) {
            console.error('Failed to cancel schedule:', error);
            alert('Failed to cancel schedule. Please try again.');
        }
    };

    const cancelScheduleRequest = async (requestId: string) => {
        if (!confirm('Are you sure you want to cancel this schedule request?')) return;
        
        setCancellingId(requestId);
        try {
            const response = await api.delete(`/cancel-doctor-schedule-request/${userId}/${requestId}`);
            if (response.data.status === 200) {
                alert('Schedule request cancelled successfully');
                fetchData();
            } else {
                alert(response.data.message || 'Failed to cancel request');
            }
        } catch (error) {
            console.error('Failed to cancel request:', error);
            alert('Failed to cancel schedule request. Please try again.');
        } finally {
            setCancellingId(null);
        }
    };

    const editScheduleRequest = (request: ScheduleRequest) => {
        // Navigate to create page with request data for editing
        navigate('create', { 
            state: { 
                editMode: true,
                requestId: request.id,
                formData: {
                    branch_id: request.branch_id,
                    schedule_day: request.schedule_day,
                    start_time: request.start_time,
                    max_patients: request.max_patients,
                    time_per_patient: request.time_per_patient
                }
            }
        });
    };

    // Separate counts for tabs
    const pendingRequests = scheduleRequests.filter(r => r.status === 'pending');
    const approvedRequests = scheduleRequests.filter(r => r.status === 'approved');
    const rejectedRequests = scheduleRequests.filter(r => r.status === 'rejected');
    const revisionRequests = scheduleRequests.filter(r => r.status === 'revision_requested');

    // Delete schedule request
    const deleteScheduleRequest = async (requestId: string) => {
        if (!confirm('Are you sure you want to delete this schedule request?')) return;
        
        setDeletingId(requestId);
        try {
            const response = await api.delete(`/doctor-delete-schedule/${requestId}`);
            if (response.data.status === 200) {
                alert('Schedule request deleted successfully');
                fetchData();
            } else {
                alert(response.data.message || 'Failed to delete request');
            }
        } catch (error) {
            console.error('Failed to delete request:', error);
            alert('Failed to delete schedule request. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredSchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (filter) {
            case 'past':
                return scheduleDate < today;
            case 'cancelled':
                return schedule.status === 'cancelled';
            default:
                return true;
        }
    });

    const getStatusBadge = (schedule: Schedule) => {
        const scheduleDate = new Date(schedule.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (schedule.status === 'cancelled') {
            return <span className="px-2 py-1 text-xs font-medium bg-error-100 text-red-700 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
        }
        if (scheduleDate < today) {
            return <span className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
        }
        if (schedule.booked_slots >= schedule.max_patients) {
            return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">Fully Booked</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    // Calculate stats
    // const upcomingCount = schedules.filter(s => new Date(s.date) >= new Date() && s.status !== 'cancelled').length;
    const pastCount = schedules.filter(s => new Date(s.date) < new Date()).length;
    const cancelledCount = schedules.filter(s => s.status === 'cancelled').length;
    const pendingCount = pendingRequests.length;
    const approvedCount = approvedRequests.length;
    const rejectedCount = rejectedRequests.length;
    const revisionCount = revisionRequests.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Schedule Management</h1>
                    <p className="text-neutral-500">Manage your consultation schedules and availability</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="blocked-dates"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                        <CalendarX className="w-5 h-5" />
                        Blocked Dates
                    </Link>
                    <Link
                        to="create"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Schedule
                    </Link>
                </div>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <button 
                    onClick={() => setFilter('pending')}
                    className={`p-4 rounded-xl border transition-all hover:shadow-md ${filter === 'pending' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200' : pendingCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-neutral-200'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${filter === 'pending' || pendingCount > 0 ? 'bg-amber-100' : 'bg-amber-50'}`}>
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-neutral-800">{pendingCount}</p>
                            <p className="text-xs text-neutral-500">Pending</p>
                        </div>
                    </div>
                </button>

                <button 
                    onClick={() => setFilter('approved')}
                    className={`p-4 rounded-xl border transition-all hover:shadow-md ${filter === 'approved' ? 'bg-green-50 border-green-300 ring-2 ring-green-200' : approvedCount > 0 ? 'bg-green-50 border-green-200' : 'bg-white border-neutral-200'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${filter === 'approved' || approvedCount > 0 ? 'bg-green-100' : 'bg-green-50'}`}>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-neutral-800">{approvedCount}</p>
                            <p className="text-xs text-neutral-500">Approved</p>
                        </div>
                    </div>
                </button>
                
                <button 
                    onClick={() => setFilter('past')}
                    className={`p-4 rounded-xl border transition-all hover:shadow-md ${filter === 'past' ? 'bg-neutral-100 border-gray-400 ring-2 ring-gray-200' : 'bg-white border-neutral-200'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${filter === 'past' ? 'bg-neutral-200' : 'bg-neutral-100'}`}>
                            <CalendarDays className="w-5 h-5 text-neutral-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-neutral-800">{pastCount}</p>
                            <p className="text-xs text-neutral-500">Past</p>
                        </div>
                    </div>
                </button>
                
                <button 
                    onClick={() => setFilter('cancelled')}
                    className={`p-4 rounded-xl border transition-all hover:shadow-md ${filter === 'cancelled' ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200' : 'bg-white border-neutral-200'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${filter === 'cancelled' ? 'bg-orange-100' : 'bg-orange-50'}`}>
                            <XCircle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-neutral-800">{cancelledCount}</p>
                            <p className="text-xs text-neutral-500">Cancelled</p>
                        </div>
                    </div>
                </button>
                
                <button 
                    onClick={() => setFilter('rejected')}
                    className={`p-4 rounded-xl border transition-all hover:shadow-md ${filter === 'rejected' ? 'bg-error-50 border-red-300 ring-2 ring-red-200' : rejectedCount > 0 ? 'bg-error-50 border-red-200' : 'bg-white border-neutral-200'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${filter === 'rejected' || rejectedCount > 0 ? 'bg-error-100' : 'bg-error-50'}`}>
                            <AlertCircle className="w-5 h-5 text-error-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-neutral-800">{rejectedCount}</p>
                            <p className="text-xs text-neutral-500">Rejected</p>
                        </div>
                    </div>
                </button>
                
                <button 
                    onClick={() => setFilter('revision_requested')}
                    className={`p-4 rounded-xl border transition-all hover:shadow-md ${filter === 'revision_requested' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200' : revisionCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-neutral-200'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${filter === 'revision_requested' || revisionCount > 0 ? 'bg-amber-100' : 'bg-amber-50'}`}>
                            <Edit3 className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-neutral-800">{revisionCount}</p>
                            <p className="text-xs text-neutral-500">Needs Revision</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Schedules List - For schedule-based filters */}
            {(filter === 'past' || filter === 'cancelled') && (
                <>
                    {filteredSchedules.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-neutral-800 mb-2">No schedules found</h3>
                            <p className="text-neutral-500 mb-4">
                                No schedules match your criteria
                            </p>
                            <Link
                                to="create"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Schedule
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredSchedules.map((schedule) => (
                                <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Date Info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-16 h-16 bg-blue-100 rounded-xl flex flex-col items-center justify-center text-primary-500">
                                                <span className="text-xs font-medium uppercase">{schedule.day?.substring(0, 3)}</span>
                                                <span className="text-2xl font-bold">{new Date(schedule.date).getDate()}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutral-800">
                                                    {new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {schedule.start_time} - {schedule.end_time}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {schedule.branch_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Slots Info */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-neutral-800">{schedule.booked_slots}</p>
                                                <p className="text-xs text-neutral-500">Booked</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-green-600">{schedule.available_slots}</p>
                                                <p className="text-xs text-neutral-500">Available</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-primary-500">{schedule.max_patients}</p>
                                                <p className="text-xs text-neutral-500">Max</p>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(schedule)}
                                            
                                            {schedule.status !== 'cancelled' && new Date(schedule.date) >= new Date() && (
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Please provide a reason for cancellation:');
                                                        if (reason) {
                                                            cancelSchedule(schedule.id, reason);
                                                        }
                                                    }}
                                                    className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                                    title="Cancel Schedule"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Pending Approval Requests */}
            {filter === 'pending' && (
                <>
                    {pendingRequests.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-neutral-800 mb-2">No pending requests</h3>
                            <p className="text-neutral-500 mb-4">
                                All your schedule requests have been processed
                            </p>
                            <Link
                                to="create"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Schedule
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 text-amber-700">
                                    <AlertCircle className="w-5 h-5" />
                                    <p className="text-sm">These schedule requests are awaiting approval from your branch manager. You can edit or cancel them before they are approved.</p>
                                </div>
                            </div>
                            {pendingRequests.map((request) => (
                                <div key={request.id} className="bg-white rounded-xl shadow-sm border border-amber-200 p-5 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Day Info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-16 h-16 bg-amber-100 rounded-xl flex flex-col items-center justify-center text-amber-600">
                                                <CalendarDays className="w-6 h-6" />
                                                <span className="text-xs font-medium uppercase mt-1">{request.schedule_day?.substring(0, 3)}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutral-800">
                                                    Every {request.schedule_day}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {request.start_time} - {request.end_time || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {request.branch_name}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-neutral-400 mt-1">
                                                    Requested: {new Date(request.requested_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Schedule Info */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-primary-500">{request.max_patients}</p>
                                                <p className="text-xs text-neutral-500">Max Patients</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-purple-600">{request.time_per_patient}</p>
                                                <p className="text-xs text-neutral-500">Min/Patient</p>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Pending Approval
                                            </span>
                                            <button
                                                onClick={() => editScheduleRequest(request)}
                                                className="p-2 text-primary-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Request"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => cancelScheduleRequest(request.id)}
                                                disabled={cancellingId === request.id}
                                                className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Cancel Request"
                                            >
                                                {cancellingId === request.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <XCircle className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Approved Requests */}
            {filter === 'approved' && (
                <>
                    {approvedRequests.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-neutral-800 mb-2">No approved requests</h3>
                            <p className="text-neutral-500 mb-4">
                                You don't have any approved schedule requests yet
                            </p>
                            <Link
                                to="create"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Schedule
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="w-5 h-5" />
                                    <p className="text-sm">These schedule requests have been approved by your branch manager and are now active.</p>
                                </div>
                            </div>
                            {approvedRequests.map((request) => (
                                <div key={request.id} className="bg-white rounded-xl shadow-sm border border-green-200 p-5 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Day Info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-16 h-16 bg-green-100 rounded-xl flex flex-col items-center justify-center text-green-600">
                                                <CheckCircle className="w-6 h-6" />
                                                <span className="text-xs font-medium uppercase mt-1">{request.schedule_day?.substring(0, 3)}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutral-800">
                                                    Every {request.schedule_day}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {request.start_time} - {request.end_time || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {request.branch_name}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-neutral-400 mt-1">
                                                    Approved: {request.approved_at ? new Date(request.approved_at).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Schedule Info */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-primary-500">{request.max_patients}</p>
                                                <p className="text-xs text-neutral-500">Max Patients</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-purple-600">{request.time_per_patient}</p>
                                                <p className="text-xs text-neutral-500">Min/Patient</p>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Approved
                                            </span>
                                            <button
                                                onClick={() => editScheduleRequest(request)}
                                                className="p-2 text-primary-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Schedule"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteScheduleRequest(request.id)}
                                                disabled={deletingId === request.id}
                                                className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete Schedule"
                                            >
                                                {deletingId === request.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Rejected Requests */}
            {filter === 'rejected' && (
                <>
                    {rejectedRequests.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-neutral-800 mb-2">No rejected requests</h3>
                            <p className="text-neutral-500 mb-4">
                                None of your schedule requests have been rejected
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rejectedRequests.map((request) => (
                                <div key={request.id} className="bg-white rounded-xl shadow-sm border border-red-200 p-5 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Day Info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-16 h-16 bg-error-100 rounded-xl flex flex-col items-center justify-center text-error-600">
                                                <XCircle className="w-6 h-6" />
                                                <span className="text-xs font-medium uppercase mt-1">{request.schedule_day?.substring(0, 3)}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutral-800">
                                                    Every {request.schedule_day}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {request.start_time} - {request.end_time || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {request.branch_name}
                                                    </span>
                                                </div>
                                                {request.approval_notes && (
                                                    <p className="text-sm text-error-600 mt-2">
                                                        <span className="font-medium">Reason: </span>{request.approval_notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Schedule Info */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-neutral-400">{request.max_patients}</p>
                                                <p className="text-xs text-neutral-500">Max Patients</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-neutral-400">{request.time_per_patient}</p>
                                                <p className="text-xs text-neutral-500">Min/Patient</p>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 text-xs font-medium bg-error-100 text-red-700 rounded-full flex items-center gap-1">
                                                <XCircle className="w-3 h-3" /> Rejected
                                            </span>
                                            <button
                                                onClick={() => deleteScheduleRequest(request.id)}
                                                disabled={deletingId === request.id}
                                                className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete Request"
                                            >
                                                {deletingId === request.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Revision Requested */}
            {filter === 'revision_requested' && (
                <>
                    {revisionRequests.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-neutral-800 mb-2">No revision requests</h3>
                            <p className="text-neutral-500 mb-4">
                                None of your schedule requests need revision
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {revisionRequests.map((request) => (
                                <div key={request.id} className="bg-white rounded-xl shadow-sm border border-amber-200 p-5 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Day Info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-16 h-16 bg-amber-100 rounded-xl flex flex-col items-center justify-center text-amber-600">
                                                <Edit3 className="w-6 h-6" />
                                                <span className="text-xs font-medium uppercase mt-1">{request.schedule_day?.substring(0, 3)}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutral-800">
                                                    Every {request.schedule_day}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {request.start_time} - {request.end_time || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {request.branch_name}
                                                    </span>
                                                </div>
                                                {request.approval_notes && (
                                                    <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                                                        <p className="text-sm text-amber-700">
                                                            <span className="font-medium">Branch Admin's Notes: </span>{request.approval_notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Schedule Info */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-neutral-400">{request.max_patients}</p>
                                                <p className="text-xs text-neutral-500">Max Patients</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-neutral-400">{request.time_per_patient}</p>
                                                <p className="text-xs text-neutral-500">Min/Patient</p>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                                                <Edit3 className="w-3 h-3" /> Needs Revision
                                            </span>
                                            <Link
                                                to={`edit/${request.id}`}
                                                className="p-2 text-primary-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit & Resubmit"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </Link>
                                            <button
                                                onClick={() => deleteScheduleRequest(request.id)}
                                                disabled={deletingId === request.id}
                                                className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete Request"
                                            >
                                                {deletingId === request.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// Create Schedule Component
interface ScheduleConflict {
    schedule_id: string;
    branch_name: string;
    day: string;
    start_time: string;
    end_time: string;
    conflict_type: string;
    message: string;
}

const CreateSchedule: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
    const [showConflictWarning, setShowConflictWarning] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Check if we're in edit mode (editing a pending request)
    const editState = location.state as { editMode?: boolean; requestId?: string; formData?: any } | null;
    const isEditMode = editState?.editMode || false;
    const editRequestId = editState?.requestId || null;
    
    const [formData, setFormData] = useState({
        branch_id: editState?.formData?.branch_id || '',
        schedule_day: editState?.formData?.schedule_day || '',
        start_time: editState?.formData?.start_time || '09:00',
        max_patients: editState?.formData?.max_patients || 20,
        time_per_patient: editState?.formData?.time_per_patient || 15
    });

    // Calculate end time based on start time, max patients, and time per patient
    const calculateEndTime = () => {
        if (!formData.start_time || !formData.max_patients || !formData.time_per_patient) {
            return '';
        }
        
        const [hours, minutes] = formData.start_time.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + (formData.max_patients * formData.time_per_patient);
        
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    };

    const endTime = calculateEndTime();

    const daysOfWeek = [
        { value: 'Sunday', label: 'Sunday' },
        { value: 'Monday', label: 'Monday' },
        { value: 'Tuesday', label: 'Tuesday' },
        { value: 'Wednesday', label: 'Wednesday' },
        { value: 'Thursday', label: 'Thursday' },
        { value: 'Friday', label: 'Friday' },
        { value: 'Saturday', label: 'Saturday' }
    ];

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/get-branches');
            if (response.data.status === 200) {
                setBranches(response.data.branches || []);
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setConflicts([]);
        setShowConflictWarning(false);
        setSuccessMessage('');

        try {
            let response;
            const requestData = {
                ...formData,
                doctor_id: userId,
                end_time: endTime
            };

            if (isEditMode && editRequestId) {
                // Update existing pending request
                response = await api.put(`/update-doctor-schedule-request/${editRequestId}`, requestData);
            } else {
                // Create new schedule request
                response = await api.post('/doctor-create-schedule', requestData);
            }

            if (response.data.status === 200 || response.data.status === 201) {
                setSuccessMessage(response.data.message || (isEditMode ? 'Schedule request updated successfully!' : 'Schedule request submitted successfully! Awaiting branch manager approval.'));
                // Navigate after a short delay to show success message
                setTimeout(() => {
                    navigate('/doctor-dashboard-new/schedule');
                }, 2000);
            } else if (response.data.status === 409 && response.data.warning) {
                // Schedule conflict detected
                setConflicts(response.data.conflicts || []);
                setShowConflictWarning(true);
            } else {
                alert(response.data.message || 'Failed to create schedule');
            }
        } catch (error: any) {
            console.error('Failed to create schedule:', error);
            if (error.response?.data?.status === 409) {
                setConflicts(error.response.data.conflicts || []);
                setShowConflictWarning(true);
            } else {
                alert(error.response?.data?.message || 'Failed to create schedule. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link to="/doctor-dashboard-new/schedule" className="text-primary-500 hover:text-blue-700 text-sm flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-4 h-4" /> Back to Schedules
                </Link>
                <h1 className="text-2xl font-bold text-neutral-800">
                    {isEditMode ? 'Edit Schedule Request' : 'Create New Schedule'}
                </h1>
                <p className="text-neutral-500">
                    {isEditMode 
                        ? 'Update your pending schedule request and resubmit for approval'
                        : 'Request a recurring weekly consultation session (requires branch manager approval)'
                    }
                </p>
            </div>

            {/* Edit Mode Banner */}
            {isEditMode && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Edit2 className="w-5 h-5 text-primary-500" />
                        <p className="text-blue-700">You are editing a pending schedule request. Your changes will be resubmitted for approval.</p>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-green-800">Success!</h3>
                            <p className="text-green-700">{successMessage}</p>
                            <p className="text-sm text-green-600 mt-1">Redirecting to schedules...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Conflict Warning */}
            {showConflictWarning && conflicts.length > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-amber-800 mb-2">Schedule Conflict Detected</h3>
                            <p className="text-amber-700 mb-3">
                                The proposed schedule conflicts with existing schedules within 30 minutes. Please adjust the time or day.
                            </p>
                            <div className="space-y-2">
                                {conflicts.map((conflict, index) => (
                                    <div key={index} className="bg-white border border-amber-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium text-amber-800">{conflict.branch_name}</span>
                                            <span className="text-amber-600">•</span>
                                            <span className="text-amber-700">{conflict.day}</span>
                                        </div>
                                        <div className="text-sm text-amber-600 mt-1">
                                            {conflict.start_time} - {conflict.end_time}
                                        </div>
                                        <div className="text-xs text-amber-500 mt-1">
                                            {conflict.conflict_type}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowConflictWarning(false)}
                                className="mt-3 text-sm text-amber-700 hover:text-amber-800 underline"
                            >
                                Dismiss and edit schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-700">
                        Your schedule request will be sent to the branch manager for approval. You will be notified once it's approved or rejected.
                    </p>
                </div>

                {/* Branch Selection */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Select Branch <span className="text-error-500">*</span>
                    </label>
                    <select
                        required
                        value={formData.branch_id}
                        onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">Select a branch</option>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                        ))}
                    </select>
                </div>

                {/* Day Selection */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Day of Week <span className="text-error-500">*</span>
                    </label>
                    <select
                        required
                        value={formData.schedule_day}
                        onChange={(e) => setFormData({ ...formData, schedule_day: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">Select a day</option>
                        {daysOfWeek.map((day) => (
                            <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                    </select>
                    <p className="text-sm text-neutral-500 mt-1">
                        This schedule will repeat every {formData.schedule_day ? daysOfWeek.find(d => d.value === formData.schedule_day)?.label : 'selected day'}
                    </p>
                </div>

                {/* Start Time */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Start Time <span className="text-error-500">*</span>
                    </label>
                    <input
                        type="time"
                        required
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>

                {/* Max Patients */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Maximum Patients <span className="text-error-500">*</span>
                    </label>
                    <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={formData.max_patients}
                        onChange={(e) => setFormData({ ...formData, max_patients: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-sm text-neutral-500 mt-1">
                        Maximum number of patients that can book appointments for this schedule
                    </p>
                </div>

                {/* Time Per Patient */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Time Per Patient (minutes) <span className="text-error-500">*</span>
                    </label>
                    <input
                        type="number"
                        required
                        min="5"
                        max="120"
                        value={formData.time_per_patient}
                        onChange={(e) => setFormData({ ...formData, time_per_patient: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-sm text-neutral-500 mt-1">
                        Average consultation duration per patient in minutes
                    </p>
                </div>

                {/* Calculated End Time */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                        Calculated End Time
                    </label>
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-blue-800">
                            {endTime || '--:--'}
                        </div>
                        <div className="text-sm text-primary-500">
                            {formData.start_time && endTime && (
                                <span>
                                    ({formData.max_patients} patients × {formData.time_per_patient} min = {formData.max_patients * formData.time_per_patient} min total)
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-primary-500 mt-2">
                        Session duration: {formData.start_time} - {endTime || '--:--'}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate('/doctor-dashboard-new/schedule')}
                        className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {isEditMode ? 'Updating...' : 'Submitting...'}
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                {isEditMode ? 'Update & Resubmit' : 'Submit Schedule Request'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Edit Schedule Component
const EditSchedule: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
    const [showConflictWarning, setShowConflictWarning] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const [originalData, setOriginalData] = useState<any>(null);
    
    const [formData, setFormData] = useState({
        branch_id: '',
        schedule_day: '',
        start_time: '09:00',
        max_patients: 20,
        time_per_patient: 15
    });

    // Calculate end time based on start time, max patients, and time per patient
    const calculateEndTime = () => {
        if (!formData.start_time || !formData.max_patients || !formData.time_per_patient) {
            return '';
        }
        
        const [hours, minutes] = formData.start_time.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + (formData.max_patients * formData.time_per_patient);
        
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    };

    const endTime = calculateEndTime();

    const daysOfWeek = [
        { value: 'Sunday', label: 'Sunday' },
        { value: 'Monday', label: 'Monday' },
        { value: 'Tuesday', label: 'Tuesday' },
        { value: 'Wednesday', label: 'Wednesday' },
        { value: 'Thursday', label: 'Thursday' },
        { value: 'Friday', label: 'Friday' },
        { value: 'Saturday', label: 'Saturday' }
    ];

    useEffect(() => {
        fetchBranches();
        if (id) {
            fetchScheduleRequest();
        }
    }, [id]);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/get-branches');
            if (response.data.status === 200) {
                setBranches(response.data.branches || []);
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
        }
    };

    const fetchScheduleRequest = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/get-schedule-request/${id}`);
            
            if (response.data.status === 200) {
                const request = response.data.request;
                setOriginalData(request);
                setFormData({
                    branch_id: request.branch_id || '',
                    schedule_day: request.schedule_day || '',
                    start_time: request.start_time || '09:00',
                    max_patients: request.max_patients || 20,
                    time_per_patient: request.time_per_patient || 15
                });
                
                // Check if the request can be edited
                if (!['pending', 'revision_requested'].includes(request.status)) {
                    setError(`This schedule request cannot be edited because it has been ${request.status}.`);
                }
            } else {
                setError('Schedule request not found');
            }
        } catch (error) {
            console.error('Failed to fetch schedule request:', error);
            setError('Failed to load schedule request');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setConflicts([]);
        setShowConflictWarning(false);
        setSuccessMessage('');

        try {
            const requestData = {
                ...formData,
                doctor_id: userId,
                end_time: endTime
            };

            const response = await api.put(`/update-doctor-schedule-request/${id}`, requestData);

            if (response.data.status === 200 || response.data.status === 201) {
                setSuccessMessage(response.data.message || 'Schedule request updated and resubmitted for approval!');
                setTimeout(() => {
                    navigate('/doctor-dashboard-new/schedule');
                }, 2000);
            } else if (response.data.status === 409 && response.data.warning) {
                setConflicts(response.data.conflicts || []);
                setShowConflictWarning(true);
            } else {
                alert(response.data.message || 'Failed to update schedule');
            }
        } catch (error: any) {
            console.error('Failed to update schedule:', error);
            if (error.response?.data?.status === 409) {
                setConflicts(error.response.data.conflicts || []);
                setShowConflictWarning(true);
            } else {
                alert(error.response?.data?.message || 'Failed to update schedule. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Link to="/doctor-dashboard-new/schedule" className="text-primary-500 hover:text-blue-700 text-sm flex items-center gap-1 mb-2">
                        <ChevronLeft className="w-4 h-4" /> Back to Schedules
                    </Link>
                </div>
                <div className="bg-error-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-red-800 mb-2">Unable to Edit</h2>
                    <p className="text-error-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link to="/doctor-dashboard-new/schedule" className="text-primary-500 hover:text-blue-700 text-sm flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-4 h-4" /> Back to Schedules
                </Link>
                <h1 className="text-2xl font-bold text-neutral-800">Edit Schedule Request</h1>
                <p className="text-neutral-500">Update your schedule request and resubmit for approval</p>
            </div>

            {/* Revision Notes Banner */}
            {originalData?.status === 'revision_requested' && originalData?.approval_notes && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Edit3 className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-amber-800">Revision Requested</h3>
                            <p className="text-amber-700 mt-1">{originalData.approval_notes}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <div>
                            <h3 className="font-semibold text-green-800">Success!</h3>
                            <p className="text-green-700">{successMessage}</p>
                            <p className="text-sm text-green-600 mt-1">Redirecting to schedules...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Conflict Warning */}
            {showConflictWarning && conflicts.length > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-amber-500" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-amber-800 mb-2">Schedule Conflict Detected</h3>
                            <p className="text-amber-700 mb-3">
                                The proposed schedule conflicts with existing schedules. Please adjust the time or day.
                            </p>
                            <div className="space-y-2">
                                {conflicts.map((conflict, index) => (
                                    <div key={index} className="bg-white border border-amber-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium text-amber-800">{conflict.branch_name}</span>
                                            <span className="text-amber-600">•</span>
                                            <span className="text-amber-700">{conflict.day}</span>
                                        </div>
                                        <div className="text-sm text-amber-600 mt-1">
                                            {conflict.start_time} - {conflict.end_time}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowConflictWarning(false)}
                                className="mt-3 text-sm text-amber-700 hover:text-amber-800 underline"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                {/* Branch Selection */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Branch / Medical Center
                    </label>
                    <select
                        value={formData.branch_id}
                        onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                    >
                        <option value="">Select a branch</option>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {branch.center_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Day Selection */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Day of Week
                    </label>
                    <select
                        value={formData.schedule_day}
                        onChange={(e) => setFormData({ ...formData, schedule_day: e.target.value })}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                    >
                        <option value="">Select a day</option>
                        {daysOfWeek.map((day) => (
                            <option key={day.value} value={day.value}>
                                {day.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Start Time */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Start Time
                    </label>
                    <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                    />
                </div>

                {/* Max Patients */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Maximum Patients
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.max_patients}
                        onChange={(e) => setFormData({ ...formData, max_patients: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                    />
                </div>

                {/* Time Per Patient */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Time Per Patient (minutes)
                    </label>
                    <input
                        type="number"
                        min="5"
                        max="120"
                        value={formData.time_per_patient}
                        onChange={(e) => setFormData({ ...formData, time_per_patient: parseInt(e.target.value) || 15 })}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                    />
                </div>

                {/* Calculated End Time Display */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-600">Calculated End Time:</span>
                        <span className="text-lg font-semibold text-primary-500">{endTime || '--:--'}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                        Based on {formData.max_patients} patients × {formData.time_per_patient} minutes each
                    </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                    <Link
                        to="/doctor-dashboard-new/schedule"
                        className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 text-center"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving || !!successMessage}
                        className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Update & Resubmit
                            </>
                        )}
                    </button>
                </div>

                <p className="text-sm text-neutral-500 text-center">
                    Your updated schedule will be resubmitted for branch manager approval.
                </p>
            </form>
        </div>
    );
};

// Modification Request Interface
interface ModificationRequest {
    id: string;
    doctor_id: string;
    branch_id: string;
    branch_name: string;
    schedule_id: string | null;
    schedule_day: string | null;
    schedule_start_time: string | null;
    schedule_end_time: string | null;
    request_type: 'block_date' | 'block_schedule' | 'delay_start' | 'limit_appointments' | 'early_end' | 'cancel_block';
    start_date: string;
    end_date: string | null;
    new_start_time: string | null;
    new_end_time: string | null;
    new_max_patients: number | null;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'pending_cancellation' | 'cancelled';
    approver_name: string | null;
    approval_notes: string | null;
    approved_at: string | null;
    created_at: string;
}

// Blocked Dates / Schedule Modifications Component
const BlockedDates: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [modificationRequests, setModificationRequests] = useState<ModificationRequest[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('all');
    const [editingRequest, setEditingRequest] = useState<ModificationRequest | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    
    const [formData, setFormData] = useState({
        branch_id: '',
        schedule_id: '',
        request_type: 'block_date' as ModificationRequest['request_type'],
        start_date: '',
        end_date: '',
        new_start_time: '',
        new_end_time: '',
        new_max_patients: '',
        reason: '',
        parent_request_id: '' // For cancellation/modification of approved requests
    });

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellingRequest, setCancellingRequest] = useState<ModificationRequest | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    const requestTypeLabels: Record<string, string> = {
        'block_date': 'Block Date(s)',
        'block_schedule': 'Block Recurring Schedule',
        'delay_start': 'Delay Start Time',
        'limit_appointments': 'Limit Appointments',
        'early_end': 'End Early',
        'cancel_block': 'Cancel Blocked Date'
    };

    const requestTypeDescriptions: Record<string, string> = {
        'block_date': 'Block specific date(s) - you will not be available on these dates',
        'block_schedule': 'Permanently disable a recurring weekly schedule',
        'delay_start': 'Temporarily change the start time for a specific date',
        'limit_appointments': 'Reduce the maximum number of patients for a specific date',
        'early_end': 'End your schedule early on a specific date',
        'cancel_block': 'Request to cancel a previously approved blocked date'
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [requestsRes, schedulesRes, branchesRes] = await Promise.all([
                api.get(`/schedule-modifications/${userId}`),
                api.get(`/get-all-doctor-schedule/${userId}`),
                api.get('/get-branches')
            ]);
            
            if (requestsRes.data.status === 200) {
                setModificationRequests(requestsRes.data.requests || []);
            }
            if (schedulesRes.data.status === 200) {
                setSchedules(schedulesRes.data.schedules || []);
            }
            if (branchesRes.data.status === 200) {
                setBranches(branchesRes.data.branches || []);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            branch_id: '',
            schedule_id: '',
            request_type: 'block_date',
            start_date: '',
            end_date: '',
            new_start_time: '',
            new_end_time: '',
            new_max_patients: '',
            reason: '',
            parent_request_id: ''
        });
        setEditingRequest(null);
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                doctor_id: userId,
                branch_id: formData.branch_id,
                schedule_id: formData.schedule_id || null,
                request_type: formData.request_type,
                start_date: formData.start_date,
                end_date: formData.end_date || null,
                new_start_time: formData.new_start_time || null,
                new_end_time: formData.new_end_time || null,
                new_max_patients: formData.new_max_patients ? parseInt(formData.new_max_patients) : null,
                reason: formData.reason,
                parent_request_id: formData.parent_request_id || null
            };

            if (editingRequest) {
                await api.put(`/schedule-modifications/${editingRequest.id}`, payload);
            } else {
                await api.post('/schedule-modifications', payload);
            }
            
            setShowAddModal(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            console.error('Failed to submit request:', error);
            alert(error.response?.data?.message || 'Failed to submit request. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/schedule-modifications/${id}`);
            setDeleteConfirm(null);
            fetchData();
        } catch (error) {
            console.error('Failed to delete request:', error);
            alert('Failed to delete request. Please try again.');
        }
    };

    const openEditModal = (request: ModificationRequest) => {
        setEditingRequest(request);
        setFormData({
            branch_id: request.branch_id,
            schedule_id: request.schedule_id || '',
            request_type: request.request_type,
            start_date: request.start_date,
            end_date: request.end_date || '',
            new_start_time: request.new_start_time || '',
            new_end_time: request.new_end_time || '',
            new_max_patients: request.new_max_patients?.toString() || '',
            reason: request.reason,
            parent_request_id: ''
        });
        setShowAddModal(true);
    };

    const openCancelModal = (request: ModificationRequest) => {
        setCancellingRequest(request);
        setCancelReason('');
        setShowCancelModal(true);
    };

    const handleCancellationRequest = async () => {
        if (!cancellingRequest) return;
        
        try {
            const payload = {
                doctor_id: userId,
                branch_id: cancellingRequest.branch_id,
                schedule_id: cancellingRequest.schedule_id || null,
                request_type: 'cancel_block',
                start_date: cancellingRequest.start_date,
                end_date: cancellingRequest.end_date || null,
                reason: cancelReason,
                parent_request_id: cancellingRequest.id
            };

            await api.post('/schedule-modifications', payload);
            setShowCancelModal(false);
            setCancellingRequest(null);
            setCancelReason('');
            fetchData();
            alert('Cancellation request submitted successfully!');
        } catch (error: any) {
            console.error('Failed to submit cancellation request:', error);
            alert(error.response?.data?.message || 'Failed to submit cancellation request. Please try again.');
        }
    };

    // Check if a date has passed
    const isDatePassed = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);
        return targetDate < today;
    };

    // Check if request can be modified/cancelled (approved and date not passed, and not already pending cancellation)
    const canRequestCancellation = (request: ModificationRequest) => {
        return request.status === 'approved' && 
               !isDatePassed(request.end_date || request.start_date);
    };

    // Check if request already has a pending cancellation
    const hasPendingCancellation = (request: ModificationRequest) => {
        return request.status === 'pending_cancellation';
    };

    const filteredRequests = activeTab === 'all' 
        ? modificationRequests 
        : modificationRequests.filter(r => r.status === activeTab);

    const counts = {
        all: modificationRequests.length,
        pending: modificationRequests.filter(r => r.status === 'pending').length,
        approved: modificationRequests.filter(r => r.status === 'approved').length,
        rejected: modificationRequests.filter(r => r.status === 'rejected').length
    };

    const filteredSchedules = formData.branch_id 
        ? schedules.filter(s => s.branch_id === formData.branch_id)
        : schedules;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Pending</span>;
            case 'approved':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-error-100 text-red-700 text-xs rounded-full">Rejected</span>;
            case 'pending_cancellation':
                return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Pending Cancellation</span>;
            case 'cancelled':
                return <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-full">Cancelled</span>;
            default:
                return null;
        }
    };

    const getRequestTypeIcon = (type: string) => {
        switch (type) {
            case 'block_date':
                return <CalendarX className="w-5 h-5 text-error-500" />;
            case 'block_schedule':
                return <XCircle className="w-5 h-5 text-error-500" />;
            case 'delay_start':
                return <Clock className="w-5 h-5 text-orange-500" />;
            case 'limit_appointments':
                return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case 'early_end':
                return <Clock className="w-5 h-5 text-purple-500" />;
            default:
                return <Calendar className="w-5 h-5 text-neutral-500" />;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link to="/doctor-dashboard-new/schedule" className="text-primary-500 hover:text-blue-700 text-sm flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-4 h-4" /> Back to Schedules
                </Link>
                <h1 className="text-2xl font-bold text-neutral-800">Schedule Modifications</h1>
                <p className="text-neutral-500">Request to block dates, delay schedules, limit appointments, and more</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`p-4 rounded-xl border transition-all ${
                            activeTab === tab
                                ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500'
                                : 'bg-white border-gray-100 hover:bg-neutral-50'
                        }`}
                    >
                        <p className="text-2xl font-bold text-neutral-800">{counts[tab]}</p>
                        <p className="text-sm text-neutral-500 capitalize">{tab === 'all' ? 'All Requests' : tab}</p>
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-neutral-800">
                        {activeTab === 'all' ? 'All Requests' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Requests`}
                    </h2>
                    <button
                        onClick={() => { resetForm(); setShowAddModal(true); }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                        <Plus className="w-5 h-5" />
                        New Request
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-12 text-center">
                        <CalendarX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-800 mb-2">No requests found</h3>
                        <p className="text-neutral-500">
                            {activeTab === 'all' 
                                ? "You haven't made any modification requests yet"
                                : `No ${activeTab} requests`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredRequests.map((request) => {
                            const isPast = isDatePassed(request.end_date || request.start_date);
                            const canCancel = canRequestCancellation(request);
                            
                            return (
                            <div key={request.id} className={`p-4 ${isPast ? 'bg-neutral-50 opacity-70' : 'hover:bg-neutral-50'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg ${isPast ? 'bg-neutral-200' : 'bg-neutral-100'}`}>
                                            {getRequestTypeIcon(request.request_type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-medium ${isPast ? 'text-neutral-500' : 'text-neutral-800'}`}>
                                                    {requestTypeLabels[request.request_type]}
                                                </span>
                                                {getStatusBadge(request.status)}
                                                {isPast && (
                                                    <span className="px-2 py-1 bg-neutral-200 text-neutral-600 text-xs rounded-full">Past</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-neutral-600 mb-1">
                                                {request.branch_name}
                                                {request.schedule_day && ` • ${request.schedule_day}`}
                                                {request.schedule_start_time && ` (${formatTime(request.schedule_start_time)} - ${formatTime(request.schedule_end_time || '')})`}
                                            </p>
                                            <p className="text-sm text-neutral-500">
                                                <span className="font-medium">Date:</span> {formatDate(request.start_date)}
                                                {request.end_date && request.end_date !== request.start_date && ` to ${formatDate(request.end_date)}`}
                                            </p>
                                            {request.new_start_time && (
                                                <p className="text-sm text-neutral-500">
                                                    <span className="font-medium">New Start:</span> {formatTime(request.new_start_time)}
                                                </p>
                                            )}
                                            {request.new_end_time && (
                                                <p className="text-sm text-neutral-500">
                                                    <span className="font-medium">New End:</span> {formatTime(request.new_end_time)}
                                                </p>
                                            )}
                                            {request.new_max_patients && (
                                                <p className="text-sm text-neutral-500">
                                                    <span className="font-medium">Max Patients:</span> {request.new_max_patients}
                                                </p>
                                            )}
                                            <p className="text-sm text-neutral-500 mt-1">
                                                <span className="font-medium">Reason:</span> {request.reason}
                                            </p>
                                            {request.approval_notes && (
                                                <p className="text-sm text-primary-500 mt-1">
                                                    <span className="font-medium">Admin Notes:</span> {request.approval_notes}
                                                </p>
                                            )}
                                            <p className="text-xs text-neutral-400 mt-2">
                                                Submitted: {formatDate(request.created_at)}
                                                {request.approved_at && ` • Processed: ${formatDate(request.approved_at)}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Pending requests - can edit/delete */}
                                        {request.status === 'pending' && !isPast && (
                                            <>
                                                <button
                                                    onClick={() => openEditModal(request)}
                                                    className="p-2 text-primary-500 hover:bg-blue-50 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(request.id)}
                                                    className="p-2 text-error-600 hover:bg-error-50 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {/* Approved requests - can request cancellation if not past */}
                                        {canCancel && (
                                            <button
                                                onClick={() => openCancelModal(request)}
                                                className="px-3 py-1.5 text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200"
                                                title="Request Cancellation"
                                            >
                                                Request Cancel
                                            </button>
                                        )}
                                        {/* Show pending cancellation message */}
                                        {hasPendingCancellation(request) && (
                                            <span className="px-3 py-1.5 text-sm text-purple-600 bg-purple-50 rounded-lg border border-purple-200">
                                                Awaiting Cancellation Approval
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-neutral-800">
                                {editingRequest ? 'Edit Modification Request' : 'New Modification Request'}
                            </h3>
                            <p className="text-sm text-neutral-500 mt-1">
                                All requests require branch manager approval
                            </p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Request Type */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Request Type</label>
                                <select
                                    value={formData.request_type}
                                    onChange={(e) => setFormData({ ...formData, request_type: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    {Object.entries(requestTypeLabels).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-neutral-500 mt-1">
                                    {requestTypeDescriptions[formData.request_type]}
                                </p>
                            </div>

                            {/* Branch Selection */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Branch</label>
                                <select
                                    value={formData.branch_id}
                                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value, schedule_id: '' })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">Select a branch</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Schedule Selection (for certain request types) */}
                            {['block_schedule', 'delay_start', 'limit_appointments', 'early_end'].includes(formData.request_type) && (
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Schedule (Optional)</label>
                                    <select
                                        value={formData.schedule_id}
                                        onChange={(e) => setFormData({ ...formData, schedule_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select a schedule</option>
                                        {filteredSchedules.map((schedule) => (
                                            <option key={schedule.id} value={schedule.id}>
                                                {schedule.day} ({formatTime(schedule.start_time)} - {formatTime(schedule.end_time)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Date Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        {formData.request_type === 'block_date' ? 'Start Date' : 'Date'}
                                    </label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                {formData.request_type === 'block_date' && (
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">End Date (Optional)</label>
                                        <input
                                            type="date"
                                            min={formData.start_date || new Date().toISOString().split('T')[0]}
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Time fields for delay_start and early_end */}
                            {formData.request_type === 'delay_start' && (
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">New Start Time</label>
                                    <input
                                        type="time"
                                        value={formData.new_start_time}
                                        onChange={(e) => setFormData({ ...formData, new_start_time: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                            )}

                            {formData.request_type === 'early_end' && (
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">New End Time</label>
                                    <input
                                        type="time"
                                        value={formData.new_end_time}
                                        onChange={(e) => setFormData({ ...formData, new_end_time: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                            )}

                            {/* Max patients for limit_appointments */}
                            {formData.request_type === 'limit_appointments' && (
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Maximum Patients</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={formData.new_max_patients}
                                        onChange={(e) => setFormData({ ...formData, new_max_patients: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Enter new maximum"
                                        required
                                    />
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Reason</label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    rows={3}
                                    placeholder="Please provide a reason for this request..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => { setShowAddModal(false); resetForm(); }}
                                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.branch_id || !formData.start_date || !formData.reason}
                                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                            >
                                {editingRequest ? 'Update Request' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">Delete Request?</h3>
                        <p className="text-neutral-600 mb-6">
                            Are you sure you want to delete this modification request? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancellation Request Modal */}
            {showCancelModal && cancellingRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">Request Cancellation</h3>
                        <p className="text-neutral-600 mb-4">
                            You are requesting to cancel the following approved modification:
                        </p>
                        <div className="bg-neutral-50 rounded-lg p-4 mb-4">
                            <p className="font-medium text-neutral-800">
                                {requestTypeLabels[cancellingRequest.request_type]}
                            </p>
                            <p className="text-sm text-neutral-600">
                                {cancellingRequest.branch_name} • {formatDate(cancellingRequest.start_date)}
                                {cancellingRequest.end_date && cancellingRequest.end_date !== cancellingRequest.start_date && 
                                    ` to ${formatDate(cancellingRequest.end_date)}`
                                }
                            </p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Reason for cancellation <span className="text-error-500">*</span>
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                rows={3}
                                placeholder="Please explain why you need to cancel this..."
                            />
                        </div>
                        <p className="text-xs text-neutral-500 mb-4">
                            This request will be sent to your branch manager for approval. You will be notified once it's processed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowCancelModal(false); setCancellingRequest(null); setCancelReason(''); }}
                                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCancellationRequest}
                                disabled={!cancelReason.trim()}
                                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                            >
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorScheduleManagement;
