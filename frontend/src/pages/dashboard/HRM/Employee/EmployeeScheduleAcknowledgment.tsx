import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { 
    Calendar, Clock, CheckCircle, AlertCircle, Loader, ChevronDown, ChevronUp,
    Building2, Briefcase, DollarSign, FileText, User, TrendingUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from "../../../../utils/api/axios";
import { useNavigate, useLocation } from 'react-router-dom';

interface ShiftAssignment {
    id: string;
    shift_definition_id: string;
    shift_name: string;
    shift_code: string;
    start_time: string;
    end_time: string;
    effective_from: string;
    effective_to: string | null;
    status: 'pending' | 'acknowledged' | 'active' | 'completed' | 'cancelled';
    acknowledged_at: string | null;
    notes: string | null;
    branch_id: string;
    assigned_by: string;
    assigned_by_name?: string;
    assigned_at?: string;
}

interface BranchInfo {
    id: string;
    center_name: string;
    address?: string;
}

const EmployeeScheduleAcknowledgment: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [pendingSchedules, setPendingSchedules] = useState<ShiftAssignment[]>([]);
    const [acknowledgedSchedules, setAcknowledgedSchedules] = useState<ShiftAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [acknowledging, setAcknowledging] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [branchInfo, setBranchInfo] = useState<Map<string, BranchInfo>>(new Map());
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('Employee');
    const [userGender, setUserGender] = useState<string | undefined>(undefined);

    // Sidebar items for Employee HRM
    const sidebarItems = [
        { label: 'Dashboard', path: '/dashboard/hrm', icon: <Briefcase className="w-5 h-5" /> },
        { label: 'My Profile', path: '/dashboard/hrm/profile', icon: <User className="w-5 h-5" /> },
        { label: 'Leave', path: '/dashboard/hrm/leave', icon: <Calendar className="w-5 h-5" /> },
        { label: 'Payslips', path: '/dashboard/hrm/payslips', icon: <DollarSign className="w-5 h-5" /> },
        { label: 'My Shifts', path: '/dashboard/hrm/shifts', icon: <Clock className="w-5 h-5" /> },
        { label: 'Schedule Requests', path: '/dashboard/hrm/schedule-acknowledgment', icon: <CheckCircle className="w-5 h-5" /> },
        { label: 'Overtime', path: '/dashboard/hrm/overtime', icon: <TrendingUp className="w-5 h-5" /> },
        { label: 'Documents', path: '/dashboard/hrm/documents', icon: <FileText className="w-5 h-5" /> },
    ];

    const SidebarMenu = () => (
        <nav className="space-y-4">
            <div className="px-4 py-2">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">HR Self-Service</h2>
            </div>
            <ul className="space-y-1 px-2">
                {sidebarItems.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                location.pathname === item.path
                                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
                            }`}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className="flex-1 font-medium text-left">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );

    // Fetch user info
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setUserRole(userInfo.role || 'Employee');
        setUserGender(userInfo.gender || undefined);
    }, []);

    // Fetch employee's shifts
    useEffect(() => {
        fetchEmployeeSchedules();
    }, []);

    const fetchEmployeeSchedules = async () => {
        try {
            setLoading(true);
            
            // First try the new shift_assignments API
            try {
                const response = await api.get('/hrm/employee/shifts');
                
                if (response.data.status === 200) {
                    const data = response.data;
                    
                    // Separate pending and acknowledged schedules
                    const pending = data.upcoming?.filter((s: ShiftAssignment) => s.status === 'pending') || [];
                    const acknowledged = data.upcoming?.filter((s: ShiftAssignment) => s.status === 'acknowledged' || s.status === 'active') || [];
                    
                    setPendingSchedules(pending);
                    setAcknowledgedSchedules(acknowledged);

                    // Fetch branch info for all unique branches
                    const branchIds = new Set([...pending, ...acknowledged].map((s: ShiftAssignment) => s.branch_id));
                    await fetchBranchInfo(Array.from(branchIds));
                    return;
                }
            } catch (apiError) {
                console.log('Shift assignments API not available, trying legacy API...');
            }

            // Fallback to legacy shift_management API
            const legacyResponse = await api.get('/get-all-shifts-user');
            if (legacyResponse.data.data) {
                const shifts = legacyResponse.data.data;
                const pending = shifts.filter((s: any) => s.status === 'pending' || !s.status);
                const acknowledged = shifts.filter((s: any) => s.status === 'acknowledged' || s.status === 'active');
                
                // Map legacy format to expected format
                const mapShift = (s: any): ShiftAssignment => ({
                    id: s.id,
                    shift_definition_id: s.id,
                    shift_name: s.shift_type,
                    shift_code: s.shift_type?.charAt(0) || 'S',
                    start_time: s.start_time,
                    end_time: s.end_time,
                    effective_from: s.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                    effective_to: null,
                    status: s.status || 'pending',
                    acknowledged_at: s.acknowledged_at || null,
                    notes: s.notes,
                    branch_id: s.branch_id,
                    assigned_by: s.assigned_by || '',
                });

                setPendingSchedules(pending.map(mapShift));
                setAcknowledgedSchedules(acknowledged.map(mapShift));
            }
        } catch (error: any) {
            console.error('Error fetching schedules:', error);
            toast.error('Failed to load schedule assignments');
        } finally {
            setLoading(false);
        }
    };

    const fetchBranchInfo = async (branchIds: string[]) => {
        try {
            for (const branchId of branchIds) {
                const response = await api.get(`/branch/${branchId}`);
                if (response.data.status === 200) {
                    branchInfo.set(branchId, response.data.data);
                }
            }
            setBranchInfo(new Map(branchInfo));
        } catch (error) {
            console.error('Error fetching branch info:', error);
        }
    };

    const handleAcknowledge = async (scheduleId: string) => {
        try {
            setAcknowledging(scheduleId);
            const response = await api.put(
                `/hrm/employee/shifts/${scheduleId}/acknowledge`,
                {}
            );

            if (response.data.status === 200) {
                toast.success('Schedule acknowledged successfully!');
                
                // Move from pending to acknowledged
                const schedule = pendingSchedules.find(s => s.id === scheduleId);
                if (schedule) {
                    schedule.status = 'acknowledged';
                    schedule.acknowledged_at = new Date().toISOString();
                    setPendingSchedules(pendingSchedules.filter(s => s.id !== scheduleId));
                    setAcknowledgedSchedules([...acknowledgedSchedules, schedule]);
                }
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to acknowledge schedule';
            toast.error(errorMessage);
        } finally {
            setAcknowledging(null);
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString: string): string => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const min = parseInt(minutes);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${period}`;
    };

    const getBranchName = (branchId: string): string => {
        return branchInfo.get(branchId)?.center_name || 'Loading...';
    };

    const ScheduleCard: React.FC<{ schedule: ShiftAssignment; isPending: boolean }> = ({ schedule, isPending }) => {
        const isExpanded = expandedId === schedule.id;

        return (
            <div className={`border rounded-lg p-4 mb-3 transition-all ${
                isPending 
                    ? 'bg-yellow-50 border-yellow-300 hover:border-yellow-400' 
                    : 'bg-green-50 border-green-300 hover:border-green-400'
            }`}>
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                isPending
                                    ? 'bg-yellow-200 text-yellow-800'
                                    : 'bg-green-200 text-green-800'
                            }`}>
                                {schedule.shift_code} Shift
                            </div>
                            {isPending && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                                    Pending Acknowledgment
                                </span>
                            )}
                            {!isPending && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Acknowledged
                                </span>
                            )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {schedule.shift_name}
                        </h3>
                    </div>
                    <button
                        onClick={() => setExpandedId(isExpanded ? null : schedule.id)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>

                {/* Main Details */}
                <div className="grid grid-cols-2 gap-4 my-3">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <div>
                            <p className="text-xs text-gray-500">Time</p>
                            <p className="text-sm font-medium text-gray-900">
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <div>
                            <p className="text-xs text-gray-500">Effective From</p>
                            <p className="text-sm font-medium text-gray-900">
                                {formatDate(schedule.effective_from)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-600" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Assigned Branch</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {getBranchName(schedule.branch_id)}
                                    </p>
                                </div>
                            </div>

                            {schedule.effective_to && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-600" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Effective Until</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDate(schedule.effective_to)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {schedule.notes && (
                                <div className="mt-3 p-3 bg-gray-100 rounded border border-gray-200">
                                    <p className="text-xs text-gray-600 font-medium mb-1">Notes</p>
                                    <p className="text-sm text-gray-700">{schedule.notes}</p>
                                </div>
                            )}

                            {!isPending && schedule.acknowledged_at && (
                                <div className="text-xs text-green-700 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Acknowledged on {formatDate(schedule.acknowledged_at)}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Button */}
                {isPending && (
                    <button
                        onClick={() => handleAcknowledge(schedule.id)}
                        disabled={acknowledging === schedule.id}
                        className={`w-full mt-4 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                            acknowledging === schedule.id
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                        }`}
                    >
                        {acknowledging === schedule.id ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Acknowledge Schedule
                            </>
                        )}
                    </button>
                )}
            </div>
        );
    };

    return (
        <DashboardLayout
            userName={userName}
            userRole={userRole}
            sidebarContent={<SidebarMenu />}
            userGender={userGender}
        >
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Schedule Assignments
                        </h1>
                        <p className="text-gray-600">
                            Review and acknowledge your assigned work schedules
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div>
                            {/* Pending Schedules Section */}
                            {pendingSchedules.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                                        <h2 className="text-xl font-bold text-gray-900">
                                            Pending Acknowledgment ({pendingSchedules.length})
                                        </h2>
                                    </div>
                                    <div>
                                        {pendingSchedules.map(schedule => (
                                            <ScheduleCard
                                                key={schedule.id}
                                                schedule={schedule}
                                                isPending={true}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Acknowledged Schedules Section */}
                            {acknowledgedSchedules.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <h2 className="text-xl font-bold text-gray-900">
                                            Acknowledged Schedules ({acknowledgedSchedules.length})
                                        </h2>
                                    </div>
                                    <div>
                                        {acknowledgedSchedules.map(schedule => (
                                            <ScheduleCard
                                                key={schedule.id}
                                                schedule={schedule}
                                                isPending={false}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {pendingSchedules.length === 0 && acknowledgedSchedules.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        No Schedule Assignments
                                    </h3>
                                    <p className="text-gray-600">
                                        You don't have any assigned schedules yet. Check back later for new assignments.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeScheduleAcknowledgment;
