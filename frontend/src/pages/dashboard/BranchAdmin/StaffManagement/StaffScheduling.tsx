import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import {
    Users, Calendar, Clock, Plus, Trash2, ChevronLeft, ChevronRight,
    AlertCircle, Check, X, Phone, RefreshCw, Filter, GripVertical, Edit2,
    MessageSquare, XCircle, Bell, User} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from "../../../../utils/api/axios";
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface IUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role_as: number;
    user_type?: string | null;
    center_name?: string;
    branch_id: string;
}

interface IShift {
    id: string;
    user_id: string;
    branch_id: string;
    shift_type: string;
    days_of_week: string;
    start_time: string;
    end_time: string;
    notes: string | null;
    user_first_name?: string;
    user_last_name?: string;
    user_phone?: string;
    user_role_as?: number;
    branch_center_name?: string;
    status?: 'pending' | 'acknowledged' | 'active' | 'completed' | 'cancelled';
    acknowledged_at?: string | null;
}

interface Shift {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    color: string;
    type: 'day' | 'night' | 'rotating' | 'oncall';
}

interface ScheduleEntry {
    id: string;
    staffId: string;
    staffName: string;
    staffRole: string;
    department: string;
    shiftId: string;
    date: string;
    status: 'scheduled' | 'confirmed' | 'swap_pending' | 'oncall';
}

interface OvertimeRequest {
    id: string;
    staffName: string;
    department: string;
    date: string;
    hours: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'pending_acknowledgment' | 'accepted' | 'rejected_by_user';
    assignmentType?: 'requested' | 'assigned'; // Track if overtime was requested by staff or assigned by manager
    userId?: string; // User ID for assignments
    shiftType?: string; // Shift type name
    startTime?: string; // Start time
    endTime?: string; // End time
    rejectionReason?: string; // Reason if user rejected the overtime
    assignedBy?: string; // Manager who assigned the overtime
    acknowledgedAt?: string; // Timestamp when user acknowledged
}

interface ShiftSwapRequest {
    id: string;
    requestorName: string;
    targetName: string;
    originalDate: string;
    swapDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface ScheduleChangeRequest {
    id: string;
    userId: string;
    requesterName: string;
    requesterRole: string;
    requestType: 'change' | 'interchange' | 'time_off' | 'cancellation';
    originalShiftDate: string;
    originalShiftType: string;
    requestedShiftDate?: string;
    requestedShiftType?: string;
    interchangeWith?: string;
    interchangeWithName?: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    respondedBy?: string;
    respondedAt?: string;
    rejectionReason?: string;
    createdAt: string;
}

const defaultShifts: Shift[] = [
    { id: '1', name: 'Morning Shift', startTime: '06:00', endTime: '14:00', color: 'bg-amber-500', type: 'day' },
    { id: '2', name: 'Day Shift', startTime: '08:00', endTime: '16:00', color: 'bg-blue-500', type: 'day' },
    { id: '3', name: 'Evening Shift', startTime: '14:00', endTime: '22:00', color: 'bg-purple-500', type: 'day' },
    { id: '4', name: 'Night Shift', startTime: '22:00', endTime: '06:00', color: 'bg-indigo-800', type: 'night' },
    { id: '5', name: 'On-Call', startTime: '00:00', endTime: '23:59', color: 'bg-red-500', type: 'oncall' },
];

const mockSchedule: ScheduleEntry[] = [
    { id: '1', staffId: '1', staffName: 'Dr. Sarah Wilson', staffRole: 'Doctor', department: 'Cardiology', shiftId: '2', date: '2025-12-17', status: 'confirmed' },
    { id: '2', staffId: '2', staffName: 'John Doe', staffRole: 'Nurse', department: 'Emergency', shiftId: '4', date: '2025-12-17', status: 'scheduled' },
    { id: '3', staffId: '3', staffName: 'Emily Chen', staffRole: 'Doctor', department: 'Pediatrics', shiftId: '2', date: '2025-12-17', status: 'confirmed' },
    { id: '4', staffId: '4', staffName: 'Mike Brown', staffRole: 'Nurse', department: 'ICU', shiftId: '5', date: '2025-12-17', status: 'oncall' },
];

const mockOvertimeRequests: OvertimeRequest[] = [
    { id: '1', staffName: 'John Doe', department: 'Emergency', date: '2025-12-18', hours: 4, reason: 'Staff shortage', status: 'pending' },
    { id: '2', staffName: 'Sarah Wilson', department: 'Cardiology', date: '2025-12-19', hours: 2, reason: 'Emergency surgery', status: 'pending' },
];

const mockSwapRequests: ShiftSwapRequest[] = [
    { id: '1', requestorName: 'Emily Chen', targetName: 'Mike Brown', originalDate: '2025-12-20', swapDate: '2025-12-22', reason: 'Personal appointment', status: 'pending' },
];

export const StaffScheduling: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');

    const [activeTab, setActiveTab] = useState<'schedule' | 'shifts' | 'overtime' | 'swaps' | 'oncall' | 'pending-acknowledgments' | 'schedule-requests'>('schedule');
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>(defaultShifts);
    const [schedule, setSchedule] = useState<ScheduleEntry[]>(mockSchedule);
    const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>(mockOvertimeRequests);
    const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>(mockSwapRequests);
    const [scheduleChangeRequests, setScheduleChangeRequests] = useState<ScheduleChangeRequest[]>([]);
    const [scheduleRequestsPendingCount, setScheduleRequestsPendingCount] = useState(0);
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

    // Real data states
    const [users, setUsers] = useState<IUser[]>([]);
    const [realShifts, setRealShifts] = useState<IShift[]>([]);
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState<number>(0);
    const [userBranchId, setUserBranchId] = useState<string>("");

    // Filtering states
    const [filterRole, setFilterRole] = useState<string>('');

    // Edit cell modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{ user: IUser; date: Date } | null>(null);
    const [editShiftData, setEditShiftData] = useState({ shift_type: '', start_time: '', end_time: '', recurrence: 'once' });

    // Shift type management
    const [showAddShiftTypeModal, setShowAddShiftTypeModal] = useState(false);
    const [showEditShiftTypeModal, setShowEditShiftTypeModal] = useState(false);
    const [editingShiftType, setEditingShiftType] = useState<string | null>(null);
    const [newShiftType, setNewShiftType] = useState({ name: '', start_time: '08:00', end_time: '16:00' });
    const [shiftTypeTimings, setShiftTypeTimings] = useState<{ [key: string]: { start_time: string; end_time: string } }>({});
    const [availableShiftTypes, setAvailableShiftTypes] = useState<string[]>([]);

    // Overtime assignment
    const [showAssignOvertimeModal, setShowAssignOvertimeModal] = useState(false);
    const [editingOvertimeId, setEditingOvertimeId] = useState<string | null>(null);
    const [overtimeAssignment, setOvertimeAssignment] = useState({
        userId: '',
        date: new Date().toISOString().split('T')[0],
        shiftType: '',
        startTime: '08:00',
        endTime: '16:00',
        hours: 8,
        reason: ''
    });


    // Drag and drop
    const [draggedUser, setDraggedUser] = useState<IUser | null>(null);

    // Holiday state and fetching
    const [holidays, setHolidays] = useState<Array<{ date: string; name: string }>>([]);
    const [holidaysLoading, setHolidaysLoading] = useState(false);
    const [lastHolidayFetch, setLastHolidayFetch] = useState<string | null>(null);

    // Fallback Sri Lankan Public Holidays (used if API fails)
    const getFallbackHolidays = (year: number) => {
        // 2026 Sri Lankan Public Holidays
        if (year === 2026) {
            return [
                { date: '2026-01-03', name: 'Duruthu Full Moon Poya Day' },
                { date: '2026-01-14', name: 'Thai Pongal' },
                { date: '2026-02-01', name: 'Navam Full Moon Poya Day' },
                { date: '2026-02-04', name: 'Independence Day' },
                { date: '2026-03-03', name: 'Madin Full Moon Poya Day' },
                { date: '2026-03-20', name: 'Id-Ul-Fitr (Ramazan Festival Day)' },
                { date: '2026-04-01', name: 'Bak Full Moon Poya Day' },
                { date: '2026-04-03', name: 'Good Friday' },
                { date: '2026-04-13', name: 'Day prior to Sinhala & Tamil New Year Day' },
                { date: '2026-04-14', name: 'Sinhala & Tamil New Year Day' },
                { date: '2026-05-01', name: 'May Day' },
                { date: '2026-05-01', name: 'Vesak Full Moon Poya Day' },
                { date: '2026-05-02', name: 'Day following Vesak Full Moon Poya Day' },
                { date: '2026-05-27', name: 'Id-Ul-Alha (Hadji Festival Day)' },
                { date: '2026-05-30', name: 'Poson Full Moon Poya Day' },
                { date: '2026-06-29', name: 'Esala Full Moon Poya Day' },
                { date: '2026-07-28', name: 'Nikini Full Moon Poya Day' },
                { date: '2026-08-26', name: 'Milad-Un-Nabi (Holy Prophet\'s Birthday)' },
                { date: '2026-08-27', name: 'Binara Full Moon Poya Day' },
                { date: '2026-09-25', name: 'Vap Full Moon Poya Day' },
                { date: '2026-10-25', name: 'Il Full Moon Poya Day' },
                { date: '2026-11-12', name: 'Deepavali Festival Day' },
                { date: '2026-11-24', name: 'Unduvap Full Moon Poya Day' },
                { date: '2026-12-25', name: 'Christmas Day' },
            ];
        }
        // 2025 Sri Lankan Public Holidays (fallback)
        return [
            { date: '2025-01-14', name: 'Thai Pongal' },
            { date: '2025-01-15', name: 'Duruthu Full Moon Poya Day' },
            { date: '2025-02-04', name: 'Independence Day' },
            { date: '2025-02-12', name: 'Navam Full Moon Poya Day' },
            { date: '2025-03-14', name: 'Maha Shivarathri Day' },
            { date: '2025-03-14', name: 'Madin Full Moon Poya Day' },
            { date: '2025-03-31', name: 'Id-Ul-Fitr (Ramazan Festival Day)' },
            { date: '2025-04-12', name: 'Bak Full Moon Poya Day' },
            { date: '2025-04-13', name: 'Day prior to Sinhala & Tamil New Year Day' },
            { date: '2025-04-14', name: 'Sinhala & Tamil New Year Day' },
            { date: '2025-04-18', name: 'Good Friday' },
            { date: '2025-05-01', name: 'May Day' },
            { date: '2025-05-12', name: 'Vesak Full Moon Poya Day' },
            { date: '2025-05-13', name: 'Day following Vesak Full Moon Poya Day' },
            { date: '2025-06-07', name: 'Id-Ul-Alha (Hadji Festival Day)' },
            { date: '2025-06-10', name: 'Poson Full Moon Poya Day' },
            { date: '2025-07-09', name: 'Esala Full Moon Poya Day' },
            { date: '2025-08-08', name: 'Nikini Full Moon Poya Day' },
            { date: '2025-09-06', name: 'Binara Full Moon Poya Day' },
            { date: '2025-09-06', name: 'Milad-Un-Nabi (Holy Prophet\'s Birthday)' },
            { date: '2025-10-06', name: 'Vap Full Moon Poya Day' },
            { date: '2025-10-23', name: 'Deepavali Festival Day' },
            { date: '2025-11-04', name: 'Il Full Moon Poya Day' },
            { date: '2025-12-04', name: 'Unduvap Full Moon Poya Day' },
            { date: '2025-12-25', name: 'Christmas Day' },
        ];
    };

    // Fetch holidays from Nager.Date API (trusted public holiday API)
    const fetchHolidays = async (forceRefresh: boolean = false) => {
        const currentYear = new Date().getFullYear();
        const cacheKey = `holidays_lk_${currentYear}`;
        const lastFetchKey = `holidays_lk_last_fetch`;

        // Check if we have cached data from today
        const cachedHolidays = localStorage.getItem(cacheKey);
        const lastFetch = localStorage.getItem(lastFetchKey);
        const today = new Date().toISOString().split('T')[0];

        // Use cached data if available and not forcing refresh
        if (!forceRefresh && cachedHolidays && lastFetch === today) {
            try {
                const parsedHolidays = JSON.parse(cachedHolidays);
                setHolidays(parsedHolidays);
                setLastHolidayFetch(lastFetch);
                console.log('Holidays loaded from cache (last updated:', lastFetch + ')');
                return;
            } catch (e) {
                console.error('Error parsing cached holidays:', e);
            }
        }

        // On normal page load (not force refresh), just use fallback holidays
        if (!forceRefresh) {
            const fallbackHolidays = getFallbackHolidays(currentYear);
            setHolidays(fallbackHolidays);
            setLastHolidayFetch(today);
            localStorage.setItem(cacheKey, JSON.stringify(fallbackHolidays));
            localStorage.setItem(lastFetchKey, today);
            console.log(`Holidays loaded from local data (${fallbackHolidays.length} Sri Lankan holidays for ${currentYear})`);
            return;
        }

        // Only fetch from API when manually refreshing
        setHolidaysLoading(true);
        try {
            // Fetch holidays from our backend API (avoids CORS issues)
            const token = localStorage.getItem('authToken');
            const response = await api.get(`/hrm/branch-admin/holidays/${currentYear}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000
            });

            console.log('Holiday API response:', response.data);

            if (response.data.status === 200 && response.data.holidays && response.data.holidays.length > 0) {
                const formattedHolidays = response.data.holidays;

                setHolidays(formattedHolidays);
                setLastHolidayFetch(today);

                // Cache the data
                localStorage.setItem(cacheKey, JSON.stringify(formattedHolidays));
                localStorage.setItem(lastFetchKey, today);

                const source = response.data.source === 'api' ? 'online source' : 'local database';
                toast.success(`Holidays updated from ${source} (${formattedHolidays.length} holidays loaded)`);
            } else {
                // API returned empty or invalid data - use fallback
                console.log('API returned empty/invalid data, using fallback holidays');
                throw new Error('No holiday data available for this year');
            }
        } catch (error: any) {
            console.error('Error fetching holidays from API:', error);

            // Use fallback holidays
            const fallbackHolidays = getFallbackHolidays(currentYear);
            setHolidays(fallbackHolidays);
            setLastHolidayFetch(today);

            // Save fallback to cache so we don't keep trying
            localStorage.setItem(cacheKey, JSON.stringify(fallbackHolidays));
            localStorage.setItem(lastFetchKey, today);

            // Only show message if user manually refreshed (not on automatic page load)
            if (forceRefresh) {
                const errorMessage = error.code === 'ECONNABORTED'
                    ? 'Connection timeout. Using local holiday data.'
                    : error.message?.includes('Network Error') || error.message?.includes('ERR_FAILED')
                    ? 'Cannot connect to holiday service. Using local data for Sri Lankan holidays.'
                    : 'Holiday service unavailable. Using local data.';

                toast.warning(errorMessage + ` (${fallbackHolidays.length} holidays loaded)`);
            } else {
                // Silent fallback on page load - holidays are still loaded
                console.log('Using fallback holidays (online service unavailable)');
            }
        } finally {
            setHolidaysLoading(false);
        }
    };

    // Check if a date is a Sri Lankan holiday
    const isHoliday = (date: Date): { isHoliday: boolean; name?: string } => {
        const dateString = date.toISOString().split('T')[0];
        const holiday = holidays.find(h => h.date === dateString);
        return {
            isHoliday: !!holiday,
            name: holiday?.name
        };
    };

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
        setUserRole(userInfo.role_as || 0);
        setUserBranchId(userInfo.branch_id || "");

        fetchUsers();
        fetchRealShifts();
        fetchHolidays(); // Fetch holidays from online source
        fetchScheduleChangeRequests(); // Fetch employee schedule change requests
    }, []);

    const fetchScheduleChangeRequests = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get('/hrm/branch-admin/schedule-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                setScheduleChangeRequests(response.data.requests || []);
                setScheduleRequestsPendingCount(response.data.pendingCount || 0);
            }
        } catch (error) {
            console.error('Error fetching schedule change requests:', error);
        }
    };

    const handleRespondToScheduleRequest = async (requestId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.post(
                `/hrm/branch-admin/schedule-requests/${requestId}/respond`,
                { action, rejection_reason: rejectionReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200) {
                toast.success(response.data.message);
                fetchScheduleChangeRequests();
            } else {
                toast.error(response.data.message || 'Failed to respond to request');
            }
        } catch (error) {
            console.error('Error responding to request:', error);
            toast.error('Failed to respond to request');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get("/api/v1/users");
            const allUsers = response.data.users || [];
            // Deduplicate users by id to prevent React key warnings
            const uniqueUsers = allUsers.filter((user: IUser, index: number, self: IUser[]) =>
                index === self.findIndex((u: IUser) => u.id === user.id)
            );
            setUsers(uniqueUsers);
        } catch (error: any) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        }
    };

    const fetchRealShifts = async () => {
        try {
            setLoading(true);
            const response = await api.get("/hr/shifts");
            const fetchedShifts = response.data.data?.shifts || response.data.data || response.data.shifts || [];
            setRealShifts(fetchedShifts);

            // Extract unique shift types and their timings
            const typesSet = new Set<string>();
            const timingsMap: { [key: string]: { start_time: string; end_time: string } } = {};

            fetchedShifts.forEach((shift: IShift) => {
                if (shift.shift_type) {
                    typesSet.add(shift.shift_type);
                    if (!timingsMap[shift.shift_type]) {
                        timingsMap[shift.shift_type] = {
                            start_time: shift.start_time,
                            end_time: shift.end_time
                        };
                    }
                }
            });

            setAvailableShiftTypes(Array.from(typesSet).sort());
            setShiftTypeTimings(timingsMap);
        } catch (error: any) {
            console.error("Error fetching shifts:", error);
            toast.error("Failed to load shifts");
        } finally {
            setLoading(false);
        }
    };

    const getWeekDays = () => {
        const days = [];
        const startOfWeek = new Date(currentWeek);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            days.push(day);
        }
        return days;
    };

    const dayMap: { [key: string]: number } = {
        "1": 0, // Sunday
        "2": 1, // Monday
        "3": 2, // Tuesday
        "4": 3, // Wednesday
        "5": 4, // Thursday
        "6": 5, // Friday
        "7": 6, // Saturday
    };

    const getShiftsForUserAndDay = (userId: string, dayOfWeek: number): IShift[] => {
        return realShifts.filter(shift => {
            if (shift.user_id !== userId) return false;
            try {
                const daysOfWeek = JSON.parse(shift.days_of_week || "[]");
                // Check if this day number is in the shift's days
                return daysOfWeek.some((day: string) => dayMap[day] === dayOfWeek);
            } catch {
                return false;
            }
        });
    };

    // Get color based on acknowledgment status
    const getShiftStatusColor = (shift: IShift): string => {
        // Check if shift has status field
        if (shift.status) {
            if (shift.status === 'acknowledged' || shift.status === 'active' || shift.status === 'completed') {
                return 'bg-green-500'; // Green for acknowledged shifts
            }
            if (shift.status === 'pending') {
                return 'bg-amber-500'; // Yellow/Amber for pending acknowledgment
            }
            if (shift.status === 'cancelled') {
                return 'bg-red-500'; // Red for cancelled
            }
        }

        // Check notes for legacy acknowledgment tracking
        if (shift.notes) {
            try {
                const notes = JSON.parse(shift.notes);
                if (notes.acknowledged) {
                    return 'bg-green-500'; // Green for acknowledged
                }
            } catch {
                // Not JSON, ignore
            }
        }

        // Default to amber (pending) for shifts without status
        return 'bg-amber-500';
    };

    const getUserColor = (user: IUser): string => {
        const roleName = getRoleName(user).toLowerCase();

        // "It's Luck" Color Scheme - Inspired palette for professional medical scheduling
        // Using vibrant, distinguishable colors for better visibility
        if (roleName.includes('doctor')) return 'bg-[#00A86B]'; // Jade Green
        if (roleName.includes('nurse')) return 'bg-[#50C878]'; // Emerald Green
        if (roleName.includes('pharmacist')) return 'bg-[#9966CC]'; // Amethyst Purple
        if (roleName.includes('cashier')) return 'bg-[#FFD700]'; // Gold
        if (roleName.includes('receptionist')) return 'bg-[#FF6B9D]'; // Raspberry Pink
        if (roleName.includes('it support') || roleName.includes('it assistant')) return 'bg-[#4169E1]'; // Royal Blue
        if (roleName.includes('center aid')) return 'bg-[#40E0D0]'; // Turquoise
        if (roleName.includes('auditor')) return 'bg-[#FF8C00]'; // Dark Orange
        if (roleName.includes('therapist')) return 'bg-[#20B2AA]'; // Light Sea Green
        if (roleName.includes('counselor')) return 'bg-[#DA70D6]'; // Orchid
        if (roleName.includes('audiologist')) return 'bg-[#8A2BE2]'; // Blue Violet

        return 'bg-[#708090]'; // Slate Gray - Default color
    };

    // Helper function to get role name
    const getRoleName = (user: IUser): string => {
        if (user.user_type) return user.user_type;

        switch (user.role_as) {
            case 1: return 'Super Admin';
            case 2: return 'Branch Admin';
            case 3: return 'Doctor';
            case 4: return 'Nurse';
            case 5: return 'Patient';
            case 6: return 'Cashier';
            case 7: return 'Pharmacist';
            case 8: return 'IT Support';
            case 9: return 'Center Aid';
            case 10: return 'Auditor';
            default: return 'Staff';
        }
    };

    const filteredUsers = users.filter((user) => {
        const matchesBranch = userRole === 1 || user.branch_id === userBranchId;
        const roleName = getRoleName(user);
        const matchesRole = !filterRole || roleName === filterRole;
        return matchesBranch && matchesRole;
    });

    // Get unique roles excluding admin types and supplier
    const uniqueRoles = Array.from(
        new Set(
            users
                .map(u => getRoleName(u))
                .filter(role => {
                    const lowerRole = role.toLowerCase();
                    return !lowerRole.includes('admin') &&
                           !lowerRole.includes('super') &&
                           !lowerRole.includes('supplier') &&
                           role !== 'Patient';
                })
        )
    ).sort();

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentWeek(newDate);
    };

    const handleApproveOvertime = (id: string) => {
        setOvertimeRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
        toast.success('Overtime request approved');
    };

    const handleRejectOvertime = (id: string) => {
        setOvertimeRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
        toast.success('Overtime request rejected');
    };

    const handleAssignOvertime = async () => {
        if (!overtimeAssignment.userId) {
            toast.error('Please select a user');
            return;
        }
        if (!overtimeAssignment.date) {
            toast.error('Please select a date');
            return;
        }
        if (!overtimeAssignment.shiftType) {
            toast.error('Please select a shift type');
            return;
        }
        if (overtimeAssignment.hours <= 0) {
            toast.error('Please enter valid hours');
            return;
        }
        if (!overtimeAssignment.reason.trim()) {
            toast.error('Please provide a reason');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const selectedUser = users.find(u => u.id === overtimeAssignment.userId);

            // Create overtime assignment via API
            const response = await api.post(
                'http://127.0.0.1:8000/api/assign-overtime',
                {
                    user_id: overtimeAssignment.userId,
                    branch_id: userBranchId,
                    date: overtimeAssignment.date,
                    shift_type: overtimeAssignment.shiftType,
                    start_time: overtimeAssignment.startTime,
                    end_time: overtimeAssignment.endTime,
                    hours: overtimeAssignment.hours,
                    reason: overtimeAssignment.reason,
                    assignment_type: 'assigned'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                // Add to local state
                const newOvertimeRequest: OvertimeRequest = {
                    id: response.data.id || Date.now().toString(),
                    staffName: selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : 'Unknown',
                    department: getRoleName(selectedUser!),
                    date: overtimeAssignment.date,
                    hours: overtimeAssignment.hours,
                    reason: overtimeAssignment.reason,
                    status: 'pending_acknowledgment', // User must acknowledge the assignment
                    assignmentType: 'assigned',
                    userId: overtimeAssignment.userId,
                    shiftType: overtimeAssignment.shiftType,
                    startTime: overtimeAssignment.startTime,
                    endTime: overtimeAssignment.endTime,
                    assignedBy: userName
                };

                setOvertimeRequests(prev => [...prev, newOvertimeRequest]);

                toast.success(`Overtime assigned to ${newOvertimeRequest.staffName}`);

                // Reset form and close modal
                setOvertimeAssignment({
                    userId: '',
                    date: new Date().toISOString().split('T')[0],
                    shiftType: '',
                    startTime: '08:00',
                    endTime: '16:00',
                    hours: 8,
                    reason: ''
                });
                setShowAssignOvertimeModal(false);
            }
        } catch (error: any) {
            console.error('Error assigning overtime:', error);
            toast.error(error.response?.data?.message || 'Failed to assign overtime');
        }
    };

    const calculateOvertimeHours = (startTime: string, endTime: string) => {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        let hours = endHour - startHour;
        let minutes = endMin - startMin;

        if (minutes < 0) {
            hours -= 1;
            minutes += 60;
        }

        // Handle overnight shifts
        if (hours < 0) {
            hours += 24;
        }

        return Math.max(0, hours + (minutes / 60));
    };

    const handleEditOvertime = (request: OvertimeRequest) => {
        setEditingOvertimeId(request.id);
        setOvertimeAssignment({
            userId: request.userId || '',
            date: request.date,
            shiftType: request.shiftType || '',
            startTime: request.startTime || '08:00',
            endTime: request.endTime || '16:00',
            hours: request.hours,
            reason: request.reason
        });
        setShowAssignOvertimeModal(true);
    };

    const handleUpdateOvertime = async () => {
        if (!editingOvertimeId) return;

        if (!overtimeAssignment.userId) {
            toast.error('Please select a user');
            return;
        }
        if (!overtimeAssignment.date) {
            toast.error('Please select a date');
            return;
        }
        if (!overtimeAssignment.shiftType) {
            toast.error('Please select a shift type');
            return;
        }
        if (overtimeAssignment.hours <= 0) {
            toast.error('Please enter valid hours');
            return;
        }
        if (!overtimeAssignment.reason.trim()) {
            toast.error('Please provide a reason');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const selectedUser = users.find(u => u.id === overtimeAssignment.userId);

            const response = await api.put(
                `http://127.0.0.1:8000/api/update-overtime/${editingOvertimeId}`,
                {
                    user_id: overtimeAssignment.userId,
                    branch_id: userBranchId,
                    date: overtimeAssignment.date,
                    shift_type: overtimeAssignment.shiftType,
                    start_time: overtimeAssignment.startTime,
                    end_time: overtimeAssignment.endTime,
                    hours: overtimeAssignment.hours,
                    reason: overtimeAssignment.reason
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                // Update local state
                setOvertimeRequests(prev => prev.map(req =>
                    req.id === editingOvertimeId ? {
                        ...req,
                        staffName: selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : req.staffName,
                        department: selectedUser ? getRoleName(selectedUser) : req.department,
                        date: overtimeAssignment.date,
                        hours: overtimeAssignment.hours,
                        reason: overtimeAssignment.reason,
                        userId: overtimeAssignment.userId,
                        shiftType: overtimeAssignment.shiftType,
                        startTime: overtimeAssignment.startTime,
                        endTime: overtimeAssignment.endTime
                    } : req
                ));

                toast.success('Overtime updated successfully');

                // Reset form and close modal
                setOvertimeAssignment({
                    userId: '',
                    date: new Date().toISOString().split('T')[0],
                    shiftType: '',
                    startTime: '08:00',
                    endTime: '16:00',
                    hours: 8,
                    reason: ''
                });
                setEditingOvertimeId(null);
                setShowAssignOvertimeModal(false);
            }
        } catch (error: any) {
            console.error('Error updating overtime:', error);
            toast.error(error.response?.data?.message || 'Failed to update overtime');
        }
    };

    const handleDeleteOvertime = async (id: string) => {
        if (!confirm('Are you sure you want to delete this overtime assignment?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            await api.delete(
                `http://127.0.0.1:8000/api/delete-overtime/${id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setOvertimeRequests(prev => prev.filter(req => req.id !== id));
            toast.success('Overtime deleted successfully');
        } catch (error: any) {
            console.error('Error deleting overtime:', error);
            toast.error(error.response?.data?.message || 'Failed to delete overtime');
        }
    };

    const handleApproveSwap = (id: string) => {
        setSwapRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
        toast.success('Shift swap approved');
    };

    const handleRejectSwap = (id: string) => {
        setSwapRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
        toast.success('Shift swap rejected');
    };

    const handleCellClick = (user: IUser, date: Date, existingShift?: IShift) => {
        setSelectedCell({ user, date });

        if (existingShift) {
            setEditShiftData({
                shift_type: existingShift.shift_type,
                start_time: existingShift.start_time,
                end_time: existingShift.end_time,
                recurrence: 'once'
            });
        } else {
            setEditShiftData({ shift_type: '', start_time: '08:00', end_time: '16:00', recurrence: 'once' });
        }
        setShowEditModal(true);
    };

    const handleSaveShift = async () => {
        if (!selectedCell) return;

        try {
            // Calculate the effective date based on recurrence
            let effectiveFrom = selectedCell.date;
            let notes = `Assigned on ${selectedCell.date.toLocaleDateString()} (${editShiftData.recurrence})`;

            // Try to use the new shift_assignments API
            try {
                // First, try to create using the new acknowledgment-based API
                const shiftAssignmentData = {
                    user_id: selectedCell.user.id,
                    shift_definition_id: editShiftData.shift_type, // Will be shift name for now
                    effective_from: effectiveFrom.toISOString().split('T')[0],
                    effective_to: null,
                    notes: notes
                };

                // For now, fall back to legacy API since shift_definition_id needs to be a UUID
                const dayOfWeekNumber = selectedCell.date.getDay();
                const dayOfWeekString = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeekNumber) || "1";

                let daysArray = [dayOfWeekString];

                // Handle recurrence
                if (editShiftData.recurrence === 'weekly') {
                    daysArray = [dayOfWeekString];
                } else if (editShiftData.recurrence === 'monthly') {
                    daysArray = [dayOfWeekString];
                } else if (editShiftData.recurrence === 'weekdays') {
                    daysArray = ['2', '3', '4', '5', '6'];
                } else if (editShiftData.recurrence === 'weekends') {
                    daysArray = ['1', '7'];
                } else if (editShiftData.recurrence === 'continuous') {
                    daysArray = ['1', '2', '3', '4', '5', '6', '7'];
                }

                const shiftData = {
                    user_id: selectedCell.user.id,
                    branch_id: selectedCell.user.branch_id,
                    shift_type: editShiftData.shift_type,
                    days_of_week: JSON.stringify(daysArray),
                    start_time: editShiftData.start_time,
                    end_time: editShiftData.end_time,
                    notes: notes,
                    // Add status field to track acknowledgment
                    requires_acknowledgment: true
                };

                await api.post("/hr/shifts", shiftData);
                toast.success('Shift assigned successfully! Employee will need to acknowledge the schedule.');
                setShowEditModal(false);
                setEditShiftData({ shift_type: '', start_time: '08:00', end_time: '16:00', recurrence: 'once' });
                fetchRealShifts();
            } catch (error: any) {
                // If new API fails, try legacy
                throw error;
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Failed to assign shift";
            toast.error(errorMessage);
        }
    };

    const handleDragStart = (user: IUser) => {
        setDraggedUser(user);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (date: Date) => {
        if (!draggedUser) return;
        handleCellClick(draggedUser, date, undefined);
        setDraggedUser(null);
    };

    const handleDeleteShift = async (shiftId: string) => {
        if (!confirm("Are you sure you want to delete this shift?")) return;

        try {
            await api.delete(`/delete-shift/${shiftId}`);
            toast.success('Shift deleted successfully');
            fetchRealShifts();
            setShowEditModal(false);
        } catch (error: any) {
            toast.error("Failed to delete shift");
        }
    };

    const handleAddNewShiftType = () => {
        if (!newShiftType.name.trim()) {
            toast.error('Please enter a shift type name');
            return;
        }

        // Add to available shift types
        setAvailableShiftTypes(prev => [...prev, newShiftType.name].sort());
        setShiftTypeTimings(prev => ({
            ...prev,
            [newShiftType.name]: {
                start_time: newShiftType.start_time,
                end_time: newShiftType.end_time
            }
        }));

        // Set it as selected in the edit form if coming from edit modal
        if (showEditModal) {
            setEditShiftData(prev => ({
                ...prev,
                shift_type: newShiftType.name,
                start_time: newShiftType.start_time,
                end_time: newShiftType.end_time
            }));
        }

        toast.success('Shift type created successfully!');
        setShowAddShiftTypeModal(false);
        setNewShiftType({ name: '', start_time: '08:00', end_time: '16:00' });
    };

    const handleEditShiftType = async () => {
        if (!newShiftType.name.trim()) {
            toast.error('Please enter a shift type name');
            return;
        }

        if (!editingShiftType) return;

        try {
            // Update all shifts with this shift type
            const shiftsToUpdate = realShifts.filter(s => s.shift_type === editingShiftType);

            for (const shift of shiftsToUpdate) {
                await api.put(`/update-shift/${shift.id}`, {
                    shift_type: newShiftType.name,
                    start_time: newShiftType.start_time,
                    end_time: newShiftType.end_time,
                    days_of_week: shift.days_of_week,
                    notes: shift.notes
                });
            }

            // Update local state
            const updatedShiftTypes = availableShiftTypes.map(type =>
                type === editingShiftType ? newShiftType.name : type
            ).sort();
            setAvailableShiftTypes(updatedShiftTypes);

            const updatedTimings = { ...shiftTypeTimings };
            delete updatedTimings[editingShiftType];
            updatedTimings[newShiftType.name] = {
                start_time: newShiftType.start_time,
                end_time: newShiftType.end_time
            };
            setShiftTypeTimings(updatedTimings);

            toast.success('Shift type updated successfully!');
            setShowEditShiftTypeModal(false);
            setEditingShiftType(null);
            setNewShiftType({ name: '', start_time: '08:00', end_time: '16:00' });
            fetchRealShifts();
        } catch (error: any) {
            toast.error('Failed to update shift type');
            console.error('Error updating shift type:', error);
        }
    };

    const handleShiftTypeChange = (shiftType: string) => {
        if (shiftType === 'add_new') {
            setShowAddShiftTypeModal(true);
            return;
        }

        const timings = shiftTypeTimings[shiftType];
        if (timings) {
            setEditShiftData({
                ...editShiftData,
                shift_type: shiftType,
                start_time: timings.start_time,
                end_time: timings.end_time
            });
        } else {
            setEditShiftData({
                ...editShiftData,
                shift_type: shiftType
            });
        }
    };

    const SidebarMenu = () => (
        <nav className="py-4">
            <div className="px-4 mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</h2>
            </div>
            <ul className="space-y-1 px-2">
                {BranchAdminMenuItems.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                item.path === '/branch-admin/hrm' || item.path === '/branch-admin/hrm/scheduling'
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

    const weekDays = getWeekDays();

    const tabs = [
        { id: 'schedule', label: 'Weekly Schedule', icon: <Calendar className="w-4 h-4" /> },
        { id: 'shifts', label: 'Manage Shifts', icon: <Clock className="w-4 h-4" /> },
        { id: 'pending-acknowledgments', label: 'Pending Acknowledgments', icon: <AlertCircle className="w-4 h-4" />, count: 0 },
        { id: 'schedule-requests', label: 'Schedule Requests', icon: <MessageSquare className="w-4 h-4" />, count: scheduleRequestsPendingCount },
        { id: 'overtime', label: 'Overtime Requests', icon: <AlertCircle className="w-4 h-4" />, count: overtimeRequests.filter(r => r.status === 'pending').length },
        { id: 'swaps', label: 'Shift Swaps', icon: <RefreshCw className="w-4 h-4" />, count: swapRequests.filter(r => r.status === 'pending').length },
        { id: 'oncall', label: 'On-Call Staff', icon: <Phone className="w-4 h-4" /> },
    ];

    return (
        <DashboardLayout
            userName={userName}
            userRole="Branch Admin"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu />}
            branchName={branchName}
            branchLogo={branchLogo}
            userGender={userGender}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/branch-admin/hrm')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Scheduling & Shift Management</h1>
                            <p className="text-gray-500">Manage staff schedules, shifts, and overtime</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/shift-management')}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Add Schedule
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <div className="flex overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{tab.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Weekly Schedule Tab */}
                        {activeTab === 'schedule' && (
                            <div className="space-y-4">
                                {/* Filters */}
                                <div className="flex gap-4 items-center mb-4 p-4 bg-gray-50 rounded-lg flex-wrap">
                                    <Filter className="w-5 h-5 text-gray-600" />
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
                                        <select
                                            value={filterRole}
                                            onChange={(e) => setFilterRole(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">All Staff Roles</option>
                                            {uniqueRoles.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {filterRole && (
                                        <button
                                            onClick={() => setFilterRole('')}
                                            className="mt-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg"
                                        >
                                            Clear Filter
                                        </button>
                                    )}
                                    <div className="ml-auto">
                                        <button
                                            onClick={() => fetchHolidays(true)}
                                            disabled={holidaysLoading}
                                            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                                            title="Force refresh holidays from online source"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${holidaysLoading ? 'animate-spin' : ''}`} />
                                            {holidaysLoading ? 'Updating...' : 'Refresh Holidays'}
                                        </button>
                                        {lastHolidayFetch && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Last updated: {lastHolidayFetch}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Week Navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => navigateWeek('prev')}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <h3 className="font-semibold text-gray-800">
                                        Week of {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </h3>
                                    <button
                                        onClick={() => navigateWeek('next')}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Acknowledgment Status Legend */}
                                <div className="flex items-center gap-6 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-sm font-medium text-gray-700">Status Legend:</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-amber-500 rounded"></div>
                                        <span className="text-sm text-gray-600">Pending Acknowledgment</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                                        <span className="text-sm text-gray-600">Acknowledged</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                                        <span className="text-sm text-gray-600">Cancelled</span>
                                    </div>
                                </div>

                                {/* Schedule Grid */}
                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                                        <p className="text-gray-600 mt-4">Loading schedule...</p>
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No staff members found. Try adjusting your filters.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[800px]">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 w-48">Staff Member</th>
                                                    {weekDays.map((day, i) => {
                                                        const holidayInfo = isHoliday(day);
                                                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                                        const bgColor = holidayInfo.isHoliday
                                                            ? 'bg-green-100 text-green-800'
                                                            : isWeekend
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'text-gray-600';
                                                        const textColor = holidayInfo.isHoliday
                                                            ? 'text-green-700'
                                                            : isWeekend
                                                                ? 'text-blue-700'
                                                                : 'text-gray-400';
                                                        return (
                                                            <th
                                                                key={i}
                                                                className={`px-2 py-3 text-center text-sm font-semibold ${bgColor}`}
                                                                title={holidayInfo.name || (isWeekend ? 'Weekend' : '')}
                                                            >
                                                                <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                                <div className={`text-xs ${textColor}`}>
                                                                    {day.getDate()}
                                                                </div>
                                                                {holidayInfo.isHoliday && (
                                                                    <div className="text-[10px] text-green-700 mt-1 font-normal leading-tight">
                                                                        {holidayInfo.name}
                                                                    </div>
                                                                )}
                                                                {isWeekend && !holidayInfo.isHoliday && (
                                                                    <div className="text-[10px] text-blue-700 mt-1 font-normal leading-tight">
                                                                        Weekend
                                                                    </div>
                                                                )}
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredUsers.map((user) => (
                                                    <tr
                                                        key={user.id}
                                                        className="border-b border-gray-100 hover:bg-gray-50"
                                                        draggable
                                                        onDragStart={() => handleDragStart(user)}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                                                <div>
                                                                    <div className="font-medium text-gray-800">
                                                                        {user.first_name} {user.last_name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {getRoleName(user)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {weekDays.map((day, dayIndex) => {
                                                            const dayOfWeek = day.getDay();
                                                            const shifts = getShiftsForUserAndDay(user.id, dayOfWeek);
                                                            const holidayInfo = isHoliday(day);
                                                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                                            const cellBg = holidayInfo.isHoliday
                                                                ? 'bg-green-50'
                                                                : isWeekend
                                                                    ? 'bg-blue-50'
                                                                    : '';
                                                            const hoverBg = holidayInfo.isHoliday
                                                                ? 'hover:bg-green-100'
                                                                : isWeekend
                                                                    ? 'hover:bg-blue-100'
                                                                    : 'hover:bg-gray-100';
                                                            return (
                                                                <td
                                                                    key={dayIndex}
                                                                    className={`px-2 py-2 ${cellBg}`}
                                                                    onDragOver={handleDragOver}
                                                                    onDrop={() => handleDrop(day)}
                                                                    title={holidayInfo.name || (isWeekend ? 'Weekend' : '')}
                                                                >
                                                                    <div className={`min-h-[60px] flex flex-col gap-1 items-center justify-center cursor-pointer rounded transition-colors p-1 ${hoverBg}`}>
                                                                        {shifts.length > 0 ? (
                                                                            <>
                                                                                {shifts.map((shift, idx) => (
                                                                                    <div
                                                                                        key={`${shift.id}-${dayIndex}-${idx}`}
                                                                                        onClick={() => handleCellClick(user, day, shift)}
                                                                                        className={`${getShiftStatusColor(shift)} text-white text-xs px-2 py-1.5 rounded text-center w-full hover:opacity-90 transition-opacity relative`}
                                                                                        title={shift.status === 'acknowledged' ? 'Acknowledged' : 'Pending Acknowledgment'}
                                                                                    >
                                                                                        <div className="font-medium">{shift.shift_type}</div>
                                                                                        <div className="text-[10px] opacity-90 mt-0.5">
                                                                                            {shift.start_time} - {shift.end_time}
                                                                                        </div>
                                                                                        {shift.status === 'pending' && (
                                                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" title="Pending Acknowledgment"></div>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                                <div
                                                                                    onClick={() => handleCellClick(user, day, undefined)}
                                                                                    className="text-blue-600 text-xs hover:text-blue-800 font-medium mt-1"
                                                                                >
                                                                                    + Add Another
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <div
                                                                                onClick={() => handleCellClick(user, day, undefined)}
                                                                                className="text-gray-400 text-xs"
                                                                            >
                                                                                + Add
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Instructions */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-start gap-2 text-sm text-gray-600">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <strong>How to use:</strong> Click any cell to assign/edit a shift, or drag a staff member to a day cell.
                                            Shifts created here will appear based on the days of the week they're assigned to.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Manage Shifts Tab */}
                        {activeTab === 'shifts' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-lg">Shift Templates</h3>
                                        <p className="text-sm text-gray-500 mt-1">Create and manage shift type templates</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setNewShiftType({ name: '', start_time: '08:00', end_time: '16:00' });
                                            setShowAddShiftTypeModal(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Shift Type
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                    </div>
                                ) : availableShiftTypes.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">No shift types created yet</h3>
                                        <p className="text-gray-500 mb-4">Create your first shift type template to get started</p>
                                        <button
                                            onClick={() => {
                                                setNewShiftType({ name: '', start_time: '08:00', end_time: '16:00' });
                                                setShowAddShiftTypeModal(true);
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Create First Shift Type
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {availableShiftTypes.map(shiftType => {
                                            const timing = shiftTypeTimings[shiftType];
                                            if (!timing) return null;

                                            // Calculate duration
                                            const startParts = timing.start_time.split(':');
                                            const endParts = timing.end_time.split(':');
                                            const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                                            const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                                            let durationMinutes = endMinutes - startMinutes;
                                            if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight shifts
                                            const hours = Math.floor(durationMinutes / 60);
                                            const minutes = durationMinutes % 60;
                                            const durationText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;

                                            // Determine shift icon based on time
                                            const startHour = parseInt(startParts[0]);
                                            const isNightShift = startHour >= 20 || startHour < 6;

                                            return (
                                                <div key={shiftType} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-emerald-300">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-12 h-12 rounded-lg ${isNightShift ? 'bg-indigo-500' : 'bg-amber-500'} flex items-center justify-center text-white shadow-md`}>
                                                                <Clock className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-lg">{shiftType}</h4>
                                                                <p className="text-sm text-gray-500">{durationText}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    setNewShiftType({
                                                                        name: shiftType,
                                                                        start_time: timing.start_time,
                                                                        end_time: timing.end_time
                                                                    });
                                                                    setEditingShiftType(shiftType);
                                                                    setShowEditShiftTypeModal(true);
                                                                }}
                                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                                title="Edit shift type"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-gray-600" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-600 font-medium">Start Time:</span>
                                                            <span className="text-gray-900 font-semibold">{timing.start_time}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-600 font-medium">End Time:</span>
                                                            <span className="text-gray-900 font-semibold">{timing.end_time}</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>Used in {realShifts.filter(s => s.shift_type === shiftType).length} schedule(s)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Overtime Requests Tab */}
                        {activeTab === 'overtime' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-lg">Overtime Management</h3>
                                        <p className="text-sm text-gray-500 mt-1">Review requests and assign overtime to staff</p>
                                    </div>
                                    <button
                                        onClick={() => setShowAssignOvertimeModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Assign Overtime
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {overtimeRequests.map(request => (
                                        <div key={request.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={`w-10 h-10 ${request.assignmentType === 'assigned' ? 'bg-amber-100' : 'bg-orange-100'} rounded-full flex items-center justify-center`}>
                                                    <Clock className={`w-5 h-5 ${request.assignmentType === 'assigned' ? 'text-amber-600' : 'text-orange-600'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-gray-800">{request.staffName}</h4>
                                                        {request.assignmentType === 'assigned' && (
                                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                                                Manager Assigned
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        {request.department} • {request.date}
                                                        {request.shiftType && ` • ${request.shiftType}`}
                                                        {request.startTime && request.endTime && ` (${request.startTime} - ${request.endTime})`}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <strong>{request.hours} hours</strong> - {request.reason}
                                                    </p>
                                                    {request.rejectionReason && (
                                                        <p className="text-sm text-red-600 mt-1 bg-red-50 p-2 rounded">
                                                            <strong>Rejection Reason:</strong> {request.rejectionReason}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {request.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleApproveOvertime(request.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                                                        >
                                                            <Check className="w-4 h-4" /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectOvertime(request.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                                                        >
                                                            <X className="w-4 h-4" /> Reject
                                                        </button>
                                                    </>
                                                ) : request.status === 'pending_acknowledgment' ? (
                                                    <>
                                                        <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> Awaiting User Response
                                                        </span>
                                                        {request.assignmentType === 'assigned' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEditOvertime(request)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Edit overtime"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteOvertime(request.id)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Delete overtime"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                ) : request.status === 'accepted' ? (
                                                    <>
                                                        <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                                                            ✓ Accepted by User
                                                        </span>
                                                        {request.assignmentType === 'assigned' && (
                                                            <button
                                                                onClick={() => handleDeleteOvertime(request.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete overtime"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : request.status === 'rejected_by_user' ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
                                                            ✗ Rejected by User
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                setEditingOvertimeId(null);
                                                                setOvertimeAssignment({
                                                                    userId: request.userId || '',
                                                                    date: request.date,
                                                                    shiftType: request.shiftType || '',
                                                                    startTime: request.startTime || '08:00',
                                                                    endTime: request.endTime || '16:00',
                                                                    hours: request.hours,
                                                                    reason: request.reason
                                                                });
                                                                setShowAssignOvertimeModal(true);
                                                            }}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                                                            title="Reassign to another user"
                                                        >
                                                            Reassign
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteOvertime(request.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete overtime"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`px-3 py-1 rounded-full text-sm ${
                                                        request.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {overtimeRequests.length === 0 && (
                                        <p className="text-center text-gray-500 py-8">No overtime requests</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Shift Swaps Tab */}
                        {activeTab === 'swaps' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800">Shift Swap Requests</h3>
                                <div className="space-y-3">
                                    {swapRequests.map(request => (
                                        <div key={request.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <RefreshCw className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-800">
                                                        {request.requestorName} <span className="text-gray-400">↔</span> {request.targetName}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">
                                                        {request.originalDate} → {request.swapDate}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {request.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleApproveSwap(request.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                                                        >
                                                            <Check className="w-4 h-4" /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectSwap(request.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                                                        >
                                                            <X className="w-4 h-4" /> Reject
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`px-3 py-1 rounded-full text-sm ${
                                                        request.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {swapRequests.length === 0 && (
                                        <p className="text-center text-gray-500 py-8">No shift swap requests</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* On-Call Staff Tab - Shows all shifts for today */}
                        {activeTab === 'oncall' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Today's Staff on Duty</h3>
                                        <p className="text-sm text-gray-500">
                                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => fetchRealShifts()}
                                        className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh
                                    </button>
                                </div>

                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {(() => {
                                        const today = new Date();
                                        const todayDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
                                        const dayNumStr = String(todayDayOfWeek === 0 ? 7 : todayDayOfWeek); // Convert to 1-7 format

                                        const todaysShifts = realShifts.filter(shift => {
                                            try {
                                                const daysOfWeek = JSON.parse(shift.days_of_week || "[]");
                                                return daysOfWeek.some((day: string) => {
                                                    const dayNum = parseInt(day);
                                                    // Map backend format (1-7 where 1=Monday) to JS format
                                                    const mappedDay = dayNum === 7 ? 0 : dayNum;
                                                    return mappedDay === todayDayOfWeek;
                                                });
                                            } catch {
                                                return false;
                                            }
                                        });

                                        const uniqueUsers = new Set(todaysShifts.map(s => s.user_id));
                                        const shiftTypeCount = todaysShifts.reduce((acc, shift) => {
                                            acc[shift.shift_type] = (acc[shift.shift_type] || 0) + 1;
                                            return acc;
                                        }, {} as Record<string, number>);

                                        return (
                                            <>
                                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                                        <Users className="w-5 h-5" />
                                                        <span className="text-sm font-medium">Total Staff</span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-emerald-700">{uniqueUsers.size}</p>
                                                </div>
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                                                        <Calendar className="w-5 h-5" />
                                                        <span className="text-sm font-medium">Total Shifts</span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-blue-700">{todaysShifts.length}</p>
                                                </div>
                                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                                                        <Clock className="w-5 h-5" />
                                                        <span className="text-sm font-medium">Shift Types</span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-purple-700">{Object.keys(shiftTypeCount).length}</p>
                                                </div>
                                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 text-orange-600 mb-1">
                                                        <Phone className="w-5 h-5" />
                                                        <span className="text-sm font-medium">On-Call</span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-orange-700">
                                                        {todaysShifts.filter(s => s.shift_type?.toLowerCase().includes('on-call') || s.shift_type?.toLowerCase().includes('oncall')).length}
                                                    </p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Staff List */}
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Shift Type</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {(() => {
                                                    const today = new Date();
                                                    const todayDayOfWeek = today.getDay();

                                                    const todaysShifts = realShifts.filter(shift => {
                                                        try {
                                                            const daysOfWeek = JSON.parse(shift.days_of_week || "[]");
                                                            return daysOfWeek.some((day: string) => {
                                                                const dayNum = parseInt(day);
                                                                const mappedDay = dayNum === 7 ? 0 : dayNum;
                                                                return mappedDay === todayDayOfWeek;
                                                            });
                                                        } catch {
                                                            return false;
                                                        }
                                                    }).sort((a, b) => {
                                                        // Sort by start time
                                                        return a.start_time.localeCompare(b.start_time);
                                                    });

                                                    if (todaysShifts.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        <Calendar className="w-12 h-12 text-gray-300" />
                                                                        <p>No shifts scheduled for today</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return todaysShifts.map((shift, index) => {
                                                        const staffName = `${shift.user_first_name || ''} ${shift.user_last_name || ''}`.trim() || 'Unknown';
                                                        const roleAs = shift.user_role_as;
                                                        const roleName = roleAs === 2 ? 'Doctor' :
                                                                        roleAs === 3 ? 'Nurse' :
                                                                        roleAs === 4 ? 'Pharmacist' :
                                                                        roleAs === 5 ? 'Cashier' :
                                                                        roleAs === 6 ? 'Receptionist' :
                                                                        roleAs === 7 ? 'IT Support' :
                                                                        roleAs === 8 ? 'Center Aid' :
                                                                        roleAs === 9 ? 'Auditor' :
                                                                        roleAs === 10 ? 'Branch Admin' : 'Staff';

                                                        const formatTime = (time: string) => {
                                                            if (!time) return '-';
                                                            const [hours, minutes] = time.split(':');
                                                            const h = parseInt(hours);
                                                            const ampm = h >= 12 ? 'PM' : 'AM';
                                                            const hour12 = h % 12 || 12;
                                                            return `${hour12}:${minutes} ${ampm}`;
                                                        };

                                                        const phone = shift.user_phone || 'N/A';

                                                        // Check if shift is currently active
                                                        const now = new Date();
                                                        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                                                        const isActive = shift.start_time <= currentTime && shift.end_time >= currentTime;

                                                        return (
                                                            <tr key={shift.id || index} className={`hover:bg-gray-50 ${isActive ? 'bg-green-50' : ''}`}>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                                            <User className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-600'}`} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium text-gray-800">{staffName}</p>
                                                                            {isActive && (
                                                                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                                                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                                                    Currently on duty
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                        roleAs === 2 ? 'bg-blue-100 text-blue-700' :
                                                                        roleAs === 3 ? 'bg-pink-100 text-pink-700' :
                                                                        roleAs === 4 ? 'bg-purple-100 text-purple-700' :
                                                                        roleAs === 10 ? 'bg-orange-100 text-orange-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                        {roleName}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="text-gray-700">{shift.shift_type}</span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-1 text-gray-600">
                                                                        <Clock className="w-4 h-4" />
                                                                        <span>{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-1 text-gray-600">
                                                                        <Phone className="w-4 h-4" />
                                                                        <span>{phone}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {phone !== 'N/A' ? (
                                                                        <a
                                                                            href={`tel:${phone}`}
                                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                                                                        >
                                                                            <Phone className="w-4 h-4" />
                                                                            Call
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-sm">No contact</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Quick Contact Cards - Currently Active Staff */}
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-3">Currently On Duty</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(() => {
                                            const today = new Date();
                                            const todayDayOfWeek = today.getDay();
                                            const now = new Date();
                                            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                                            const activeShifts = realShifts.filter(shift => {
                                                try {
                                                    const daysOfWeek = JSON.parse(shift.days_of_week || "[]");
                                                    const isToday = daysOfWeek.some((day: string) => {
                                                        const dayNum = parseInt(day);
                                                        const mappedDay = dayNum === 7 ? 0 : dayNum;
                                                        return mappedDay === todayDayOfWeek;
                                                    });
                                                    if (!isToday) return false;

                                                    // Check if currently active
                                                    return shift.start_time <= currentTime && shift.end_time >= currentTime;
                                                } catch {
                                                    return false;
                                                }
                                            });

                                            if (activeShifts.length === 0) {
                                                return (
                                                    <div className="col-span-full text-center py-8 text-gray-500">
                                                        <Clock className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                                        <p>No staff currently on active shift</p>
                                                    </div>
                                                );
                                            }

                                            return activeShifts.map((shift, index) => {
                                                const staffName = `${shift.user_first_name || ''} ${shift.user_last_name || ''}`.trim() || 'Unknown';
                                                const roleAs = shift.user_role_as;
                                                const roleName = roleAs === 2 ? 'Doctor' :
                                                                roleAs === 3 ? 'Nurse' :
                                                                roleAs === 4 ? 'Pharmacist' :
                                                                roleAs === 5 ? 'Cashier' :
                                                                roleAs === 6 ? 'Receptionist' :
                                                                roleAs === 7 ? 'IT Support' :
                                                                roleAs === 8 ? 'Center Aid' :
                                                                roleAs === 9 ? 'Auditor' :
                                                                roleAs === 10 ? 'Branch Admin' : 'Staff';
                                                const phone = shift.user_phone || 'N/A';

                                                return (
                                                    <div key={shift.id || index} className="border border-green-200 bg-green-50 rounded-lg p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                                    <User className="w-5 h-5 text-green-600" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-medium text-gray-800">{staffName}</h4>
                                                                    <p className="text-sm text-gray-500">{roleName}</p>
                                                                </div>
                                                            </div>
                                                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                                Active
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2 text-sm text-gray-600">
                                                            <p><strong>Shift:</strong> {shift.shift_type}</p>
                                                            <p><strong>Time:</strong> {shift.start_time} - {shift.end_time}</p>
                                                            <p><strong>Contact:</strong> {phone}</p>
                                                        </div>
                                                        {phone !== 'N/A' && (
                                                            <a
                                                                href={`tel:${phone}`}
                                                                className="w-full mt-3 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center justify-center gap-2"
                                                            >
                                                                <Phone className="w-4 h-4" />
                                                                Contact Now
                                                            </a>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pending Acknowledgments Tab */}
                        {activeTab === 'pending-acknowledgments' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Pending Schedule Acknowledgments</h3>
                                        <p className="text-sm text-gray-500">
                                            Track which staff members have acknowledged their assigned schedules
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => fetchRealShifts()}
                                        className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh
                                    </button>
                                </div>

                                {/* Info Alert */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-blue-800">About Schedule Acknowledgments</h4>
                                            <p className="text-sm text-blue-700 mt-1">
                                                When you assign a shift to an employee, they will receive a notification to acknowledge the schedule.
                                                Only after they acknowledge it, the schedule becomes active and visible in the main schedule view.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Staff Acknowledgment Status */}
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {realShifts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                        No shift assignments found. Assign shifts from the Weekly Schedule tab.
                                                    </td>
                                                </tr>
                                            ) : (
                                                realShifts.map((shift, index) => {
                                                    const staffName = `${shift.user_first_name || ''} ${shift.user_last_name || ''}`.trim() || 'Unknown';
                                                    let daysStr = 'N/A';
                                                    try {
                                                        const days = JSON.parse(shift.days_of_week || "[]");
                                                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                                        const dayMap: { [key: string]: number } = { "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6 };
                                                        daysStr = days.map((d: string) => dayNames[dayMap[d] || 0]).join(', ');
                                                    } catch {}

                                                    return (
                                                        <tr key={shift.id || index} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                                        <Users className="w-4 h-4 text-gray-600" />
                                                                    </div>
                                                                    <span className="font-medium text-gray-800">{staffName}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                                                                    {shift.shift_type}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{daysStr}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                                                    <Check className="w-3 h-3" />
                                                                    Active
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                                {new Date().toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Schedule Requests Tab - Employee Requests for Time Off, Cancellation, Shift Swap */}
                        {activeTab === 'schedule-requests' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                            Employee Schedule Requests
                                            {scheduleRequestsPendingCount > 0 && (
                                                <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium animate-pulse">
                                                    <Bell className="w-3 h-3" />
                                                    {scheduleRequestsPendingCount} new
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Review and respond to employee requests for schedule changes, time off, and shift cancellations
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => fetchScheduleChangeRequests()}
                                        className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh
                                    </button>
                                </div>

                                {/* Request Type Legend */}
                                <div className="flex items-center gap-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-sm font-medium text-gray-700">Request Types:</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                        <span className="text-sm text-gray-600">Schedule Change</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-purple-500 rounded"></div>
                                        <span className="text-sm text-gray-600">Shift Swap</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-amber-500 rounded"></div>
                                        <span className="text-sm text-gray-600">Time Off</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                                        <span className="text-sm text-gray-600">Cancellation</span>
                                    </div>
                                </div>

                                {/* Requests List */}
                                <div className="space-y-3">
                                    {scheduleChangeRequests.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                                            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                            <p className="text-gray-500 text-lg">No schedule requests</p>
                                            <p className="text-gray-400 text-sm">Employee requests will appear here</p>
                                        </div>
                                    ) : (
                                        scheduleChangeRequests.map(request => {
                                            const typeColors = {
                                                change: 'bg-blue-100 text-blue-700 border-blue-200',
                                                interchange: 'bg-purple-100 text-purple-700 border-purple-200',
                                                time_off: 'bg-amber-100 text-amber-700 border-amber-200',
                                                cancellation: 'bg-red-100 text-red-700 border-red-200'
                                            };
                                            const typeLabels = {
                                                change: 'Schedule Change',
                                                interchange: 'Shift Swap',
                                                time_off: 'Time Off',
                                                cancellation: 'Shift Cancellation'
                                            };
                                            const typeIcons = {
                                                change: <Calendar className="w-5 h-5" />,
                                                interchange: <Users className="w-5 h-5" />,
                                                time_off: <Clock className="w-5 h-5" />,
                                                cancellation: <XCircle className="w-5 h-5" />
                                            };

                                            return (
                                                <div key={request.id} className={`border-2 rounded-lg p-4 ${request.status === 'pending' ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${typeColors[request.requestType] || typeColors.change}`}>
                                                                {typeIcons[request.requestType] || typeIcons.change}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800">{request.requesterName}</h4>
                                                                <p className="text-xs text-gray-500">{request.requesterRole}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeColors[request.requestType] || typeColors.change}`}>
                                                                {typeLabels[request.requestType] || 'Request'}
                                                            </span>
                                                            {request.status === 'pending' ? (
                                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Pending</span>
                                                            ) : request.status === 'approved' ? (
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Approved</span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Rejected</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                        <div className="bg-gray-50 p-3 rounded-lg">
                                                            <p className="text-xs text-gray-500 mb-1">Original Shift</p>
                                                            <p className="font-medium text-gray-800">
                                                                {new Date(request.originalShiftDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </p>
                                                            {request.originalShiftType && (
                                                                <p className="text-sm text-gray-600">{request.originalShiftType}</p>
                                                            )}
                                                        </div>
                                                        {request.requestType === 'change' && request.requestedShiftDate && (
                                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                                <p className="text-xs text-blue-600 mb-1">Requested Shift</p>
                                                                <p className="font-medium text-gray-800">
                                                                    {new Date(request.requestedShiftDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                                </p>
                                                                {request.requestedShiftType && (
                                                                    <p className="text-sm text-gray-600">{request.requestedShiftType}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                        {request.requestType === 'interchange' && request.interchangeWithName && (
                                                            <div className="bg-purple-50 p-3 rounded-lg">
                                                                <p className="text-xs text-purple-600 mb-1">Swap With</p>
                                                                <p className="font-medium text-gray-800">{request.interchangeWithName}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mb-3">
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-medium">Reason:</span> {request.reason}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Submitted on {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>

                                                    {request.status === 'pending' && (
                                                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                                                            <button
                                                                onClick={() => handleRespondToScheduleRequest(request.id, 'approve')}
                                                                className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const reason = prompt('Enter rejection reason (optional):');
                                                                    handleRespondToScheduleRequest(request.id, 'reject', reason || undefined);
                                                                }}
                                                                className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
                                                            >
                                                                <X className="w-4 h-4" />
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}

                                                    {request.status !== 'pending' && request.respondedBy && (
                                                        <div className="pt-3 border-t border-gray-200">
                                                            <p className="text-xs text-gray-500">
                                                                {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.respondedBy}
                                                                {request.respondedAt && ` on ${new Date(request.respondedAt).toLocaleDateString()}`}
                                                            </p>
                                                            {request.rejectionReason && (
                                                                <p className="text-xs text-red-600 mt-1">Reason: {request.rejectionReason}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Shift Modal */}
            {showShiftModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShiftModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            {selectedShift ? 'Edit Shift' : 'Create New Shift'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name</label>
                                <input
                                    type="text"
                                    defaultValue={selectedShift?.name || ''}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g., Morning Shift"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        defaultValue={selectedShift?.startTime || '08:00'}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        defaultValue={selectedShift?.endTime || '16:00'}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                    <option value="day">Day Shift</option>
                                    <option value="night">Night Shift</option>
                                    <option value="rotating">Rotating</option>
                                    <option value="oncall">On-Call</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowShiftModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setShowShiftModal(false); toast.success('Shift saved successfully'); }}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg"
                            >
                                Save Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Cell Modal */}
            {showEditModal && selectedCell && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                Assign Shift
                            </h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <strong>Staff:</strong> {selectedCell.user.first_name} {selectedCell.user.last_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Date:</strong> {selectedCell.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type *</label>
                                <select
                                    value={editShiftData.shift_type}
                                    onChange={(e) => handleShiftTypeChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select shift type</option>
                                    {availableShiftTypes.map(type => (
                                        <option key={type} value={type}>
                                            {type} {shiftTypeTimings[type] && `(${shiftTypeTimings[type].start_time} - ${shiftTypeTimings[type].end_time})`}
                                        </option>
                                    ))}
                                    <option value="add_new" className="text-blue-600 font-medium">+ Add New Shift Type</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                                    <input
                                        type="time"
                                        value={editShiftData.start_time}
                                        onChange={(e) => setEditShiftData({ ...editShiftData, start_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                                    <input
                                        type="time"
                                        value={editShiftData.end_time}
                                        onChange={(e) => setEditShiftData({ ...editShiftData, end_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Repeat Schedule</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="recurrence"
                                            value="once"
                                            checked={editShiftData.recurrence === 'once'}
                                            onChange={(e) => setEditShiftData({ ...editShiftData, recurrence: e.target.value })}
                                            className="w-4 h-4 text-emerald-600"
                                        />
                                        <span className="text-sm text-gray-700">One time only (selected day)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="recurrence"
                                            value="weekly"
                                            checked={editShiftData.recurrence === 'weekly'}
                                            onChange={(e) => setEditShiftData({ ...editShiftData, recurrence: e.target.value })}
                                            className="w-4 h-4 text-emerald-600"
                                        />
                                        <span className="text-sm text-gray-700">Weekly (every {selectedCell.date.toLocaleDateString('en-US', { weekday: 'long' })})</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="recurrence"
                                            value="weekdays"
                                            checked={editShiftData.recurrence === 'weekdays'}
                                            onChange={(e) => setEditShiftData({ ...editShiftData, recurrence: e.target.value })}
                                            className="w-4 h-4 text-emerald-600"
                                        />
                                        <span className="text-sm text-gray-700">Weekdays only (Monday - Friday)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="recurrence"
                                            value="weekends"
                                            checked={editShiftData.recurrence === 'weekends'}
                                            onChange={(e) => setEditShiftData({ ...editShiftData, recurrence: e.target.value })}
                                            className="w-4 h-4 text-emerald-600"
                                        />
                                        <span className="text-sm text-gray-700">Weekends only (Saturday - Sunday)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="recurrence"
                                            value="continuous"
                                            checked={editShiftData.recurrence === 'continuous'}
                                            onChange={(e) => setEditShiftData({ ...editShiftData, recurrence: e.target.value })}
                                            className="w-4 h-4 text-emerald-600"
                                        />
                                        <span className="text-sm text-gray-700">Continuous (every day including weekends)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-800">
                                    <strong>Note:</strong> You can add multiple shifts to the same day. Each shift will be saved separately and displayed in the calendar.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between gap-3 mt-6">
                            {editShiftData.shift_type && getShiftsForUserAndDay(selectedCell.user.id, selectedCell.date.getDay()).length > 0 && (
                                <button
                                    onClick={() => {
                                        const shifts = getShiftsForUserAndDay(selectedCell.user.id, selectedCell.date.getDay());
                                        const matchingShift = shifts.find(s =>
                                            s.shift_type === editShiftData.shift_type &&
                                            s.start_time === editShiftData.start_time
                                        );
                                        if (matchingShift) handleDeleteShift(matchingShift.id);
                                    }}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-300"
                                >
                                    Delete This Shift
                                </button>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveShift}
                                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600"
                                >
                                    Save Shift
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Shift Type Modal */}
            {showAddShiftTypeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowAddShiftTypeModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                Create New Shift Type
                            </h3>
                            <button onClick={() => setShowAddShiftTypeModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type Name *</label>
                                <input
                                    type="text"
                                    value={newShiftType.name}
                                    onChange={(e) => setNewShiftType({ ...newShiftType, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g., Evening Shift, Weekend Shift"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                                    <input
                                        type="time"
                                        value={newShiftType.start_time}
                                        onChange={(e) => setNewShiftType({ ...newShiftType, start_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                                    <input
                                        type="time"
                                        value={newShiftType.end_time}
                                        onChange={(e) => setNewShiftType({ ...newShiftType, end_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-xs text-amber-800">
                                    This shift type will be available for all future shift assignments.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowAddShiftTypeModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddNewShiftType}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600"
                            >
                                Create Shift Type
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Shift Type Modal */}
            {showEditShiftTypeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowEditShiftTypeModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                Edit Shift Type
                            </h3>
                            <button onClick={() => {
                                setShowEditShiftTypeModal(false);
                                setEditingShiftType(null);
                            }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type Name *</label>
                                <input
                                    type="text"
                                    value={newShiftType.name}
                                    onChange={(e) => setNewShiftType({ ...newShiftType, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g., Evening Shift, Weekend Shift"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                                    <input
                                        type="time"
                                        value={newShiftType.start_time}
                                        onChange={(e) => setNewShiftType({ ...newShiftType, start_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                                    <input
                                        type="time"
                                        value={newShiftType.end_time}
                                        onChange={(e) => setNewShiftType({ ...newShiftType, end_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-800">
                                    <strong>Note:</strong> This will update all existing shifts using this shift type template with the new name and times.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowEditShiftTypeModal(false);
                                    setEditingShiftType(null);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditShiftType}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600"
                            >
                                Update Shift Type
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Overtime Modal */}
            {showAssignOvertimeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAssignOvertimeModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingOvertimeId ? 'Edit Overtime' : 'Assign Overtime'}
                            </h3>
                            <button onClick={() => setShowAssignOvertimeModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                <p className="text-xs text-amber-800">
                                    <strong>Note:</strong> Assign overtime to users in your branch. The assigned user will be notified and must accept or reject the overtime with a reason.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select User *</label>
                                <select
                                    value={overtimeAssignment.userId}
                                    onChange={(e) => setOvertimeAssignment({ ...overtimeAssignment, userId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Choose a user...</option>
                                    {users
                                        .filter(user => user.branch_id === userBranchId)
                                        .map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.first_name} {user.last_name} - {getRoleName(user)}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                <input
                                    type="date"
                                    value={overtimeAssignment.date}
                                    onChange={(e) => setOvertimeAssignment({ ...overtimeAssignment, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type *</label>
                                <select
                                    value={overtimeAssignment.shiftType}
                                    onChange={(e) => {
                                        const shiftType = e.target.value;
                                        const timings = shiftTypeTimings[shiftType];
                                        if (timings) {
                                            const hours = calculateOvertimeHours(timings.start_time, timings.end_time);
                                            setOvertimeAssignment({
                                                ...overtimeAssignment,
                                                shiftType,
                                                startTime: timings.start_time,
                                                endTime: timings.end_time,
                                                hours: parseFloat(hours.toFixed(2))
                                            });
                                        } else {
                                            setOvertimeAssignment({ ...overtimeAssignment, shiftType });
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select shift type</option>
                                    {availableShiftTypes.map(type => (
                                        <option key={type} value={type}>
                                            {type} {shiftTypeTimings[type] && `(${shiftTypeTimings[type].start_time} - ${shiftTypeTimings[type].end_time})`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                                    <input
                                        type="time"
                                        value={overtimeAssignment.startTime}
                                        onChange={(e) => {
                                            const hours = calculateOvertimeHours(e.target.value, overtimeAssignment.endTime);
                                            setOvertimeAssignment({
                                                ...overtimeAssignment,
                                                startTime: e.target.value,
                                                hours: parseFloat(hours.toFixed(2))
                                            });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                                    <input
                                        type="time"
                                        value={overtimeAssignment.endTime}
                                        onChange={(e) => {
                                            const hours = calculateOvertimeHours(overtimeAssignment.startTime, e.target.value);
                                            setOvertimeAssignment({
                                                ...overtimeAssignment,
                                                endTime: e.target.value,
                                                hours: parseFloat(hours.toFixed(2))
                                            });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours *</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="24"
                                    value={overtimeAssignment.hours}
                                    onChange={(e) => setOvertimeAssignment({ ...overtimeAssignment, hours: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                                <textarea
                                    value={overtimeAssignment.reason}
                                    onChange={(e) => setOvertimeAssignment({ ...overtimeAssignment, reason: e.target.value })}
                                    rows={3}
                                    placeholder="Enter reason for overtime assignment..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAssignOvertimeModal(false);
                                    setEditingOvertimeId(null);
                                    setOvertimeAssignment({
                                        userId: '',
                                        date: new Date().toISOString().split('T')[0],
                                        shiftType: '',
                                        startTime: '08:00',
                                        endTime: '16:00',
                                        hours: 8,
                                        reason: ''
                                    });
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={editingOvertimeId ? handleUpdateOvertime : handleAssignOvertime}
                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600"
                            >
                                {editingOvertimeId ? 'Update Overtime' : 'Assign Overtime'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};
