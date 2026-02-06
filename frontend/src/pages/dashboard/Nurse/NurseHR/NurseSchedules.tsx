import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, ArrowLeft, CheckCircle, AlertCircle,
    Loader2, ChevronLeft, ChevronRight, Search, RefreshCw,
    Users, MessageSquare, Check, X, Activity
} from 'lucide-react';
import api from "../../../../utils/api/axios";
import { toast } from 'react-toastify';

interface Shift {
    id: string;
    date: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: 'pending' | 'acknowledged' | 'completed' | 'missed' | 'approved_change';
    acknowledgedAt: string | null;
    notes: string | null;
    isOverridden?: boolean;
    overrideType?: string;
    overrideReason?: string;
}

interface ScheduleOverride {
    id: string;
    date: string;
    type: 'shift_change' | 'time_off' | 'cancellation' | 'interchange';
    originalShiftType: string | null;
    newShiftType: string | null;
    newStartTime: string | null;
    newEndTime: string | null;
    reason: string | null;
    status: string;
}

interface InterchangeRequest {
    id: string;
    requestedBy: string;
    requestedByName: string;
    shiftDate: string;
    shiftType: string;
    yourShiftDate: string;
    yourShiftType: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

const NurseSchedules: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);
    const [interchangeRequests, setInterchangeRequests] = useState<InterchangeRequest[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const getUpcomingDays = (days: number) => {
        const result = [];
        const today = new Date();
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            result.push(date.toISOString().split('T')[0]);
        }
        return result;
    };

    const upcomingDays = getUpcomingDays(7);
    const next2Days = getUpcomingDays(2);

    useEffect(() => {
        fetchScheduleData();
    }, [selectedMonth]);

    const applyOverridesToShifts = (rawShifts: Shift[], overrides: ScheduleOverride[]): Shift[] => {
        const overridesByDate: { [date: string]: ScheduleOverride } = {};
        overrides.forEach(o => { overridesByDate[o.date] = o; });
        
        return rawShifts.map(shift => {
            const override = overridesByDate[shift.date];
            if (!override) return shift;
            
            if (override.type === 'cancellation' || override.type === 'time_off') {
                return {
                    ...shift,
                    shiftType: override.type === 'time_off' ? 'Time Off' : 'Cancelled',
                    isOverridden: true,
                    overrideType: override.type,
                    overrideReason: override.reason || undefined,
                    status: 'approved_change' as const
                };
            } else if (override.type === 'shift_change' || override.type === 'interchange') {
                return {
                    ...shift,
                    shiftType: override.newShiftType || shift.shiftType,
                    startTime: override.newStartTime || shift.startTime,
                    endTime: override.newEndTime || shift.endTime,
                    isOverridden: true,
                    overrideType: override.type,
                    overrideReason: override.reason || undefined,
                    status: 'approved_change' as const
                };
            }
            return shift;
        });
    };

    const fetchScheduleData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const [shiftsRes, requestsRes] = await Promise.all([
                api.get('/hrm/cashier/schedules', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { month: selectedMonth }
                }),
                api.get('/hrm/cashier/interchange-requests', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (shiftsRes.data.status === 200) {
                const rawShifts = shiftsRes.data.shifts || [];
                const overrides = shiftsRes.data.overrides || [];
                setScheduleOverrides(overrides);
                const processedShifts = applyOverridesToShifts(rawShifts, overrides);
                setShifts(processedShifts);
            }
            if (requestsRes.data.status === 200) {
                setInterchangeRequests(requestsRes.data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching schedule data:', error);
            toast.error('Failed to load schedule data');
        } finally {
            setIsLoading(false);
        }
    };

    const acknowledgeShift = async (shiftId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.post(
                '/hrm/cashier/acknowledge-shift',
                { shift_id: shiftId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200) {
                toast.success('Shift acknowledged successfully!');
                fetchScheduleData();
            } else {
                toast.error(response.data.message || 'Failed to acknowledge shift');
            }
        } catch (error) {
            console.error('Error acknowledging shift:', error);
            toast.error('Failed to acknowledge shift');
        }
    };

    const respondToInterchange = async (requestId: string, action: 'approve' | 'reject') => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.post(
                '/hrm/cashier/respond-interchange',
                { request_id: requestId, action },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200) {
                toast.success(`Request ${action}d successfully!`);
                fetchScheduleData();
            } else {
                toast.error(response.data.message || `Failed to ${action} request`);
            }
        } catch (error) {
            console.error(`Error ${action}ing interchange:`, error);
            toast.error(`Failed to ${action} request`);
        }
    };

    const changeMonth = (direction: 'prev' | 'next') => {
        const date = new Date(selectedMonth + '-01');
        if (direction === 'prev') {
            date.setMonth(date.getMonth() - 1);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        setSelectedMonth(date.toISOString().slice(0, 7));
    };

    const getMonthName = (monthString: string) => {
        const date = new Date(monthString + '-01');
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const getStatusBadge = (status: string, isOverridden?: boolean, overrideType?: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
            acknowledged: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Acknowledged' },
            completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
            missed: { bg: 'bg-error-100', text: 'text-red-800', label: 'Missed' },
            approved_change: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Modified' }
        };
        
        if (isOverridden && overrideType) {
            const overrideBadges: Record<string, { bg: string; text: string; label: string }> = {
                time_off: { bg: 'bg-green-100', text: 'text-green-800', label: 'Time Off' },
                cancellation: { bg: 'bg-error-100', text: 'text-red-800', label: 'Cancelled' },
                shift_change: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Changed' },
                interchange: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Swapped' }
            };
            const overrideBadge = overrideBadges[overrideType] || badges.approved_change;
            return (
                <span className={`px-2 py-1 ${overrideBadge.bg} ${overrideBadge.text} text-xs rounded-full font-medium`}>
                    {overrideBadge.label}
                </span>
            );
        }
        
        const badge = badges[status] || badges.pending;
        return (
            <span className={`px-2 py-1 ${badge.bg} ${badge.text} text-xs rounded-full font-medium`}>
                {badge.label}
            </span>
        );
    };

    const filteredShifts = shifts.filter(shift => {
        const matchesStatus = filterStatus === 'all' || shift.status === filterStatus;
        const matchesSearch = shift.shiftType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            shift.date.includes(searchTerm);
        const matchesDate = selectedDate ? shift.date === selectedDate : true;
        return matchesStatus && matchesSearch && matchesDate;
    });

    const getShiftsForDate = (date: string) => shifts.filter(s => s.date === date);

    const pendingShifts = shifts.filter(s => s.status === 'pending').length;
    const acknowledgedShifts = shifts.filter(s => s.status === 'acknowledged').length;
    const completedShifts = shifts.filter(s => s.status === 'completed').length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center sm:ml-64 pt-20">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
                    <p className="text-neutral-600">Loading your schedules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 p-6 sm:ml-64 pt-20">
            {/* Pending Acknowledgment Banner */}
            {pendingShifts > 0 && (
                <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-lg">
                                    New Shift Schedule Assigned!
                                </h3>
                                <p className="text-white/90 text-sm">
                                    You have {pendingShifts} shift{pendingShifts > 1 ? 's' : ''} pending acknowledgment
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            className="px-4 py-2 bg-white text-amber-600 font-medium rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            View & Acknowledge
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/nurse-dashboard/hr')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 rounded-lg">
                                <Activity className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-800">My Nursing Shifts</h1>
                                <p className="text-neutral-600 text-sm mt-1">View and manage your assigned shifts</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/nurse-dashboard/hr/schedule-requests')}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Request Changes
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-900 font-semibold text-2xl">{pendingShifts}</p>
                                <p className="text-amber-700 text-sm">Pending Acknowledgment</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-amber-500" />
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-900 font-semibold text-2xl">{acknowledgedShifts}</p>
                                <p className="text-blue-700 text-sm">Acknowledged</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-primary-500" />
                        </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-900 font-semibold text-2xl">{completedShifts}</p>
                                <p className="text-green-700 text-sm">Completed</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-900 font-semibold text-2xl">{interchangeRequests.length}</p>
                                <p className="text-purple-700 text-sm">Swap Requests</p>
                            </div>
                            <Users className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Upcoming 2 Days */}
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
                    <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-teal-600" />
                        Your Next 2 Days
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {next2Days.map((date, index) => {
                            const dayShifts = getShiftsForDate(date);
                            const dateObj = new Date(date);
                            const isToday = index === 0;
                            return (
                                <div 
                                    key={date}
                                    className={`bg-white rounded-lg p-4 border-2 transition-all cursor-pointer hover:shadow-md ${
                                        isToday ? 'border-teal-400 shadow-sm' : 'border-neutral-200'
                                    } ${selectedDate === date ? 'ring-2 ring-teal-500' : ''}`}
                                    onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className={`font-bold text-lg ${isToday ? 'text-teal-600' : 'text-neutral-800'}`}>
                                                {isToday ? 'Today' : 'Tomorrow'}
                                            </p>
                                            <p className="text-sm text-neutral-500">
                                                {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            dayShifts.length > 0 ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                                        }`}>
                                            {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                    {dayShifts.length > 0 ? (
                                        <div className="space-y-2">
                                            {dayShifts.map(shift => (
                                                <div key={shift.id} className="flex items-center justify-between bg-neutral-50 rounded-lg p-2">
                                                    <div>
                                                        <p className="font-medium text-neutral-800">{shift.shiftType}</p>
                                                        <p className="text-xs text-neutral-500">{shift.startTime} - {shift.endTime}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(shift.status, shift.isOverridden, shift.overrideType)}
                                                        {shift.status === 'pending' && !shift.isOverridden && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); acknowledgeShift(shift.id); }}
                                                                className="px-2 py-1 bg-emerald-500 text-white text-xs rounded hover:bg-emerald-600"
                                                            >
                                                                Acknowledge
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-neutral-400 text-sm italic">No shifts scheduled</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Month Selector and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => changeMonth('prev')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-lg">
                            <Calendar className="w-4 h-4 text-teal-600" />
                            <span className="font-medium text-teal-900">{getMonthName(selectedMonth)}</span>
                        </div>
                        <button
                            onClick={() => changeMonth('next')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-neutral-600" />
                        </button>
                        <button
                            onClick={fetchScheduleData}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5 text-neutral-600" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search shifts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="acknowledged">Acknowledged</option>
                            <option value="completed">Completed</option>
                            <option value="missed">Missed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Shifts List */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-6">
                <div className="p-4 border-b border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-800">
                        My Shifts ({filteredShifts.length})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Date</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Shift Type</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Time</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Duration</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredShifts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-neutral-500">
                                        <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No shifts found for this period</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredShifts.map((shift, index) => (
                                    <tr key={shift.id} className={`border-b border-gray-100 hover:bg-neutral-50 ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-neutral-800">{formatDate(shift.date)}</div>
                                            <div className="text-xs text-neutral-500">{shift.date}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full font-medium">
                                                {shift.shiftType}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-neutral-700">
                                            {shift.startTime} - {shift.endTime}
                                        </td>
                                        <td className="py-3 px-4 text-neutral-700">
                                            {shift.duration} hrs
                                        </td>
                                        <td className="py-3 px-4">
                                            {getStatusBadge(shift.status, shift.isOverridden, shift.overrideType)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {shift.status === 'pending' && !shift.isOverridden && (
                                                <button
                                                    onClick={() => acknowledgeShift(shift.id)}
                                                    className="px-3 py-1 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                                                >
                                                    Acknowledge
                                                </button>
                                            )}
                                            {shift.status === 'acknowledged' && (
                                                <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Interchange Requests */}
            {interchangeRequests.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="p-4 border-b border-neutral-200">
                        <h2 className="text-lg font-semibold text-neutral-800">
                            Shift Swap Requests ({interchangeRequests.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {interchangeRequests.map((request) => (
                            <div key={request.id} className="p-4 hover:bg-neutral-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4 text-purple-500" />
                                            <span className="font-medium text-neutral-800">{request.requestedByName}</span>
                                            <span className="text-neutral-500 text-sm">wants to swap shifts</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-2">
                                            <div className="bg-teal-50 p-3 rounded-lg">
                                                <p className="text-xs text-teal-600 mb-1">Their Shift</p>
                                                <p className="font-medium text-neutral-800">{formatDate(request.shiftDate)}</p>
                                                <p className="text-sm text-neutral-600">{request.shiftType}</p>
                                            </div>
                                            <div className="bg-purple-50 p-3 rounded-lg">
                                                <p className="text-xs text-purple-600 mb-1">Your Shift</p>
                                                <p className="font-medium text-neutral-800">{formatDate(request.yourShiftDate)}</p>
                                                <p className="text-sm text-neutral-600">{request.yourShiftType}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-neutral-600">
                                            <span className="font-medium">Reason:</span> {request.reason}
                                        </p>
                                    </div>
                                    {request.status === 'pending' && (
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => respondToInterchange(request.id, 'approve')}
                                                className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => respondToInterchange(request.id, 'reject')}
                                                className="flex items-center gap-1 px-3 py-2 bg-error-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                                Decline
                                            </button>
                                        </div>
                                    )}
                                    {request.status !== 'pending' && (
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            request.status === 'approved' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-error-100 text-red-800'
                                        }`}>
                                            {request.status === 'approved' ? 'Accepted' : 'Declined'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NurseSchedules;
