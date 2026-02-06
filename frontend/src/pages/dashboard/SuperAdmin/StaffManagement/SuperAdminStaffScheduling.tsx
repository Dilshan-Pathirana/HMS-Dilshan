import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, SuperAdminMenuItems } from '../../../../components/common/Layout/SidebarMenu';
import {
    Users, Calendar, Clock, Plus, Trash2, ChevronLeft, ChevronRight,
    Phone, RefreshCw, Filter, Edit2,
    Building2, ArrowLeft, UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from "../../../../utils/api/axios";

interface Branch {
    id: string;
    center_name: string;
    location?: string;
    address?: string;
}

interface IUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role_as: number;
    user_type?: string | null;
    center_name?: string;
    branch_id: string;
    phone?: string;
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
}

interface OvertimeRequest {
    id: string;
    staffName: string;
    department: string;
    date: string;
    hours: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'pending_acknowledgment' | 'accepted' | 'rejected_by_user';
    assignmentType?: 'requested' | 'assigned';
    userId?: string;
    shiftType?: string;
    startTime?: string;
    endTime?: string;
    rejectionReason?: string;
    assignedBy?: string;
    acknowledgedAt?: string;
}

export const SuperAdminStaffScheduling: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [profileImage, setProfileImage] = useState('');

    const [activeTab, setActiveTab] = useState<'schedule' | 'shifts' | 'overtime' | 'oncall'>('schedule');
    const [currentWeek, setCurrentWeek] = useState(new Date());

    // Branch selection
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [branchLoading, setBranchLoading] = useState(true);

    // Real data states
    const [users, setUsers] = useState<IUser[]>([]);
    const [realShifts, setRealShifts] = useState<IShift[]>([]);
    const [loading, setLoading] = useState(false);

    // Filtering states
    const [filterRole, setFilterRole] = useState<string>('');

    // Shift type management
    const [availableShiftTypes, setAvailableShiftTypes] = useState<string[]>([]);
    const [shiftTypeTimings, setShiftTypeTimings] = useState<{ [key: string]: { start_time: string; end_time: string } }>({});

    // Overtime
    const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
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

    // Today's shifts for On-Call tab
    const [todayShifts, setTodayShifts] = useState<IShift[]>([]);

    // Shift Assignment Modal
    const [showShiftAssignModal, setShowShiftAssignModal] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{ user: IUser; date: Date; existingShifts: IShift[] } | null>(null);
    const [shiftAssignment, setShiftAssignment] = useState({
        shift_type: '',
        start_time: '08:00',
        end_time: '16:00',
        recurrence: 'once'
    });

    // Holidays
    const [holidays, setHolidays] = useState<Array<{ date: string; name: string }>>([]);

    const fallbackHolidays2025 = [
        { date: '2025-01-14', name: 'Thai Pongal' },
        { date: '2025-01-15', name: 'Duruthu Full Moon Poya Day' },
        { date: '2025-02-04', name: 'Independence Day' },
        { date: '2025-02-12', name: 'Navam Full Moon Poya Day' },
        { date: '2025-03-14', name: 'Maha Shivarathri Day' },
        { date: '2025-04-12', name: 'Bak Full Moon Poya Day' },
        { date: '2025-04-13', name: 'Day prior to Sinhala & Tamil New Year Day' },
        { date: '2025-04-14', name: 'Sinhala & Tamil New Year Day' },
        { date: '2025-04-18', name: 'Good Friday' },
        { date: '2025-05-01', name: 'May Day' },
        { date: '2025-05-12', name: 'Vesak Full Moon Poya Day' },
        { date: '2025-05-13', name: 'Day following Vesak Full Moon Poya Day' },
        { date: '2025-06-10', name: 'Poson Full Moon Poya Day' },
        { date: '2025-07-09', name: 'Esala Full Moon Poya Day' },
        { date: '2025-08-08', name: 'Nikini Full Moon Poya Day' },
        { date: '2025-09-06', name: 'Binara Full Moon Poya Day' },
        { date: '2025-10-06', name: 'Vap Full Moon Poya Day' },
        { date: '2025-10-23', name: 'Deepavali Festival Day' },
        { date: '2025-11-04', name: 'Il Full Moon Poya Day' },
        { date: '2025-12-04', name: 'Unduvap Full Moon Poya Day' },
        { date: '2025-12-25', name: 'Christmas Day' },
    ];

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setProfileImage(userInfo.profile_picture || '');

        // Load saved branch selection
        const savedBranch = localStorage.getItem('superAdminSelectedBranch');
        if (savedBranch && savedBranch !== 'all') {
            setSelectedBranch(savedBranch);
        }

        fetchBranches();
        setHolidays(fallbackHolidays2025);
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            fetchUsers();
            fetchRealShifts();
        }
    }, [selectedBranch]);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/get-branches');
            const branchData = Array.isArray(response.data.branches) ? response.data.branches : [];
            setBranches(branchData);

            // Auto-select first branch if none selected
            if (branchData.length > 0 && !selectedBranch) {
                const savedBranch = localStorage.getItem('superAdminSelectedBranch');
                if (savedBranch && savedBranch !== 'all' && branchData.find((b: Branch) => b.id === savedBranch)) {
                    setSelectedBranch(savedBranch);
                } else {
                    setSelectedBranch(branchData[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
            toast.error('Failed to load branches');
        } finally {
            setBranchLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get("/users");
            const allUsers = response.data.users || [];
            // Filter users by selected branch and deduplicate by id
            const branchUsers = allUsers
                .filter((u: IUser) => u.branch_id === selectedBranch)
                .filter((user: IUser, index: number, self: IUser[]) =>
                    index === self.findIndex((u: IUser) => u.id === user.id)
                );
            setUsers(branchUsers);
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

            // Filter shifts by selected branch
            const branchShifts = fetchedShifts.filter((s: IShift) => s.branch_id === selectedBranch);
            setRealShifts(branchShifts);

            // Get today's shifts for On-Call tab
            const today = new Date();
            const todayDay = today.getDay(); // 0-6 (Sunday-Saturday)
            const dayMapping: { [key: number]: string } = { 0: "1", 1: "2", 2: "3", 3: "4", 4: "5", 5: "6", 6: "7" };
            const todayDayString = dayMapping[todayDay];

            const todaysShifts = branchShifts.filter((shift: IShift) => {
                try {
                    const days = JSON.parse(shift.days_of_week || '[]');
                    return days.includes(todayDayString);
                } catch {
                    return false;
                }
            });
            setTodayShifts(todaysShifts);

            // Extract unique shift types and their timings
            const typesSet = new Set<string>();
            const timingsMap: { [key: string]: { start_time: string; end_time: string } } = {};

            branchShifts.forEach((shift: IShift) => {
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

    const handleBranchChange = (branchId: string) => {
        setSelectedBranch(branchId);
        localStorage.setItem('superAdminSelectedBranch', branchId);
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
        "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6,
    };

    const getShiftsForUserAndDay = (userId: string, dayOfWeek: number): IShift[] => {
        return realShifts.filter(shift => {
            if (shift.user_id !== userId) return false;
            try {
                const daysOfWeek = JSON.parse(shift.days_of_week || "[]");
                return daysOfWeek.some((day: string) => dayMap[day] === dayOfWeek);
            } catch {
                return false;
            }
        });
    };

    const getUserColor = (roleAs: number): string => {
        switch (roleAs) {
            case 2: return 'bg-primary-500'; // Branch Admin
            case 3: return 'bg-emerald-500'; // Doctor
            case 4: return 'bg-teal-500'; // Nurse
            case 5: return 'bg-gray-400'; // Patient
            case 6: return 'bg-orange-500'; // Cashier
            case 7: return 'bg-purple-500'; // Pharmacist
            case 8: return 'bg-cyan-500'; // IT Support
            case 9: return 'bg-pink-500'; // Center Aid
            case 10: return 'bg-amber-500'; // Auditor
            default: return 'bg-slate-500';
        }
    };

    const getRoleName = (roleAs: number): string => {
        switch (roleAs) {
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

    const handleCellClick = (user: IUser, date: Date, existingShifts: IShift[]) => {
        setSelectedCell({ user, date, existingShifts });
        setShiftAssignment({
            shift_type: existingShifts.length > 0 ? existingShifts[0].shift_type : '',
            start_time: existingShifts.length > 0 ? existingShifts[0].start_time : '08:00',
            end_time: existingShifts.length > 0 ? existingShifts[0].end_time : '16:00',
            recurrence: 'once'
        });
        setShowShiftAssignModal(true);
    };

    const handleAssignShift = async () => {
        if (!selectedCell) return;

        if (!shiftAssignment.shift_type.trim()) {
            toast.error('Please select or enter a shift type');
            return;
        }

        try {
            const dayOfWeekString = (selectedCell.date.getDay() + 1).toString();
            let daysArray: string[] = [dayOfWeekString];

            // Handle recurrence patterns
            if (shiftAssignment.recurrence === 'weekly') {
                daysArray = [dayOfWeekString];
            } else if (shiftAssignment.recurrence === 'weekdays') {
                daysArray = ['2', '3', '4', '5', '6']; // Monday to Friday
            } else if (shiftAssignment.recurrence === 'weekends') {
                daysArray = ['1', '7']; // Saturday and Sunday
            } else if (shiftAssignment.recurrence === 'continuous') {
                daysArray = ['1', '2', '3', '4', '5', '6', '7']; // Every day
            }

            const shiftData = {
                user_id: selectedCell.user.id,
                branch_id: selectedBranch,
                shift_type: shiftAssignment.shift_type,
                days_of_week: JSON.stringify(daysArray),
                start_time: shiftAssignment.start_time,
                end_time: shiftAssignment.end_time,
                notes: `Assigned on ${selectedCell.date.toLocaleDateString()} (${shiftAssignment.recurrence}) by Super Admin`
            };

            const token = localStorage.getItem('token');
            await api.post("/hr/shifts", shiftData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            toast.success('Shift assigned successfully!');
            setShowShiftAssignModal(false);
            setShiftAssignment({ shift_type: '', start_time: '08:00', end_time: '16:00', recurrence: 'once' });
            fetchRealShifts();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Failed to assign shift";
            toast.error(errorMessage);
        }
    };

    const handleDeleteShift = async (shiftId: string) => {
        if (!confirm("Are you sure you want to delete this shift?")) return;

        try {
            const token = localStorage.getItem('token');
            await api.delete(`/delete-shift/${shiftId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            toast.success('Shift deleted successfully');
            fetchRealShifts();
            setShowShiftAssignModal(false);
        } catch (error: any) {
            toast.error("Failed to delete shift");
        }
    };

    const filteredUsers = users.filter((user) => {
        const roleName = getRoleName(user.role_as);
        const matchesRole = !filterRole || roleName === filterRole;
        // Exclude admin and patient roles from scheduling
        const isStaff = user.role_as >= 2 && user.role_as <= 9 && user.role_as !== 6;
        return matchesRole && isStaff;
    });

    const uniqueRoles = Array.from(
        new Set(
            users
                .filter(u => u.role_as >= 2 && u.role_as <= 9 && u.role_as !== 6)
                .map(u => getRoleName(u.role_as))
        )
    ).sort();

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentWeek(newDate);
    };

    const isHoliday = (date: Date): { isHoliday: boolean; name?: string } => {
        const dateString = date.toISOString().split('T')[0];
        const holiday = holidays.find(h => h.date === dateString);
        return { isHoliday: !!holiday, name: holiday?.name };
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

            const response = await api.post(
                '/assign-overtime',
                {
                    user_id: overtimeAssignment.userId,
                    branch_id: selectedBranch,
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
                const newOvertimeRequest: OvertimeRequest = {
                    id: response.data.id || Date.now().toString(),
                    staffName: selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : 'Unknown',
                    department: getRoleName(selectedUser?.role_as || 0),
                    date: overtimeAssignment.date,
                    hours: overtimeAssignment.hours,
                    reason: overtimeAssignment.reason,
                    status: 'pending_acknowledgment',
                    assignmentType: 'assigned',
                    userId: overtimeAssignment.userId,
                    shiftType: overtimeAssignment.shiftType,
                    startTime: overtimeAssignment.startTime,
                    endTime: overtimeAssignment.endTime,
                    assignedBy: userName
                };

                setOvertimeRequests(prev => [...prev, newOvertimeRequest]);
                toast.success(`Overtime assigned to ${newOvertimeRequest.staffName}`);

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

    const handleUpdateOvertime = async () => {
        if (!editingOvertimeId) return;

        try {
            const token = localStorage.getItem('token');
            const selectedUser = users.find(u => u.id === overtimeAssignment.userId);

            await api.put(
                `/update-overtime/${editingOvertimeId}`,
                {
                    user_id: overtimeAssignment.userId,
                    branch_id: selectedBranch,
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

            setOvertimeRequests(prev => prev.map(req =>
                req.id === editingOvertimeId ? {
                    ...req,
                    staffName: selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : req.staffName,
                    department: selectedUser ? getRoleName(selectedUser.role_as) : req.department,
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
            await api.delete(`/delete-overtime/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setOvertimeRequests(prev => prev.filter(r => r.id !== id));
            toast.success('Overtime deleted successfully');
        } catch (error: any) {
            console.error('Error deleting overtime:', error);
            toast.error(error.response?.data?.message || 'Failed to delete overtime');
        }
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

    const calculateOvertimeHours = (startTime: string, endTime: string) => {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        let hours = endHour - startHour;
        let minutes = endMin - startMin;

        if (minutes < 0) {
            hours -= 1;
            minutes += 60;
        }
        if (hours < 0) {
            hours += 24;
        }

        return Math.max(0, hours + (minutes / 60));
    };

    const getStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            'pending': 'bg-yellow-100 text-yellow-700 border border-yellow-300',
            'pending_acknowledgment': 'bg-blue-100 text-blue-700 border border-blue-300',
            'approved': 'bg-green-100 text-green-700 border border-green-300',
            'accepted': 'bg-emerald-100 text-emerald-700 border border-emerald-300',
            'rejected': 'bg-error-100 text-red-700 border border-red-300',
            'rejected_by_user': 'bg-orange-100 text-orange-700 border border-orange-300'
        };

        const labels: { [key: string]: string } = {
            'pending': 'Pending',
            'pending_acknowledgment': 'Awaiting Acknowledgment',
            'approved': 'Approved',
            'accepted': 'Accepted',
            'rejected': 'Rejected',
            'rejected_by_user': 'Rejected by User'
        };

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-neutral-100 text-neutral-700'}`}>
                {labels[status] || status}
            </span>
        );
    };

    // Check if a shift is currently active
    const isShiftActive = (startTime: string, endTime: string): boolean => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (endMinutes < startMinutes) {
            return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    };

    // Render Branch Selector
    const renderBranchSelector = () => (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/super-admin/staff')}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-neutral-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-neutral-800">Scheduling & Shift Management</h1>
                        <p className="text-sm text-neutral-500">Manage shifts, schedules, overtime, and on-call staff</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                        <select
                            value={selectedBranch}
                            onChange={(e) => handleBranchChange(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-emerald-700 font-medium cursor-pointer pr-8"
                        >
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.center_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => { fetchUsers(); fetchRealShifts(); }}
                        className="p-2 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                        title="Refresh data"
                    >
                        <RefreshCw className="w-5 h-5 text-neutral-600" />
                    </button>
                </div>
            </div>
        </div>
    );

    // Render Schedule Tab
    const renderScheduleTab = () => {
        const weekDays = getWeekDays();

        return (
            <div className="space-y-4">
                {/* Week Navigation */}
                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
                    <button
                        onClick={() => navigateWeek('prev')}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-semibold text-neutral-800">
                        {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <button
                        onClick={() => navigateWeek('next')}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-neutral-500" />
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">All Roles</option>
                        {uniqueRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>

                {/* Schedule Grid */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 sticky left-0 bg-neutral-50 min-w-[200px]">
                                        Staff Member
                                    </th>
                                    {weekDays.map((day, idx) => {
                                        const holidayInfo = isHoliday(day);
                                        const isToday = day.toDateString() === new Date().toDateString();
                                        return (
                                            <th
                                                key={idx}
                                                className={`px-2 py-3 text-center text-sm font-medium min-w-[120px] ${isToday ? 'bg-emerald-50' : ''
                                                    } ${holidayInfo.isHoliday ? 'bg-error-50' : ''}`}
                                            >
                                                <div className={`${isToday ? 'text-emerald-600' : 'text-neutral-700'}`}>
                                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                                <div className={`text-xs ${isToday ? 'text-emerald-500' : 'text-neutral-500'}`}>
                                                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                                {holidayInfo.isHoliday && (
                                                    <div className="text-xs text-error-600 font-medium mt-1 truncate" title={holidayInfo.name}>
                                                        🎉 {holidayInfo.name}
                                                    </div>
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-neutral-500">
                                            Loading shifts...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-neutral-500">
                                            No staff members found for this branch
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="border-t border-gray-100 hover:bg-neutral-50">
                                            <td className="px-4 py-3 sticky left-0 bg-white">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full ${getUserColor(user.role_as)} flex items-center justify-center text-white text-sm font-medium`}>
                                                        {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-neutral-800">
                                                            {user.first_name} {user.last_name}
                                                        </div>
                                                        <div className="text-xs text-neutral-500">{getRoleName(user.role_as)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {weekDays.map((day, dayIdx) => {
                                                const shifts = getShiftsForUserAndDay(user.id, dayIdx);
                                                const isToday = day.toDateString() === new Date().toDateString();
                                                const holidayInfo = isHoliday(day);

                                                return (
                                                    <td
                                                        key={dayIdx}
                                                        className={`px-2 py-2 text-center cursor-pointer hover:bg-blue-50 transition-colors ${isToday ? 'bg-emerald-50/50' : ''} ${holidayInfo.isHoliday ? 'bg-error-50/50' : ''}`}
                                                        onClick={() => handleCellClick(user, day, shifts)}
                                                    >
                                                        {shifts.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {shifts.map((shift, sIdx) => (
                                                                    <div
                                                                        key={sIdx}
                                                                        className={`text-xs px-2 py-1 rounded ${getUserColor(user.role_as)} text-white hover:opacity-80`}
                                                                    >
                                                                        <div className="font-medium">{shift.shift_type}</div>
                                                                        <div className="opacity-80">{shift.start_time} - {shift.end_time}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-neutral-400 hover:text-primary-500 transition-colors">
                                                                <Plus className="w-4 h-4 mx-auto" />
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // Render Shifts Tab
    const renderShiftsTab = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-neutral-800 text-lg">Shift Templates</h3>
                    <p className="text-sm text-neutral-500 mt-1">View shift type templates for the selected branch</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            ) : availableShiftTypes.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-300">
                    <Clock className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">No shift types in this branch</h3>
                    <p className="text-neutral-500">No shift templates have been created yet for this branch</p>
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
                        if (durationMinutes < 0) durationMinutes += 24 * 60;
                        const hours = Math.floor(durationMinutes / 60);
                        const minutes = durationMinutes % 60;
                        const durationText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;

                        // Determine shift icon based on time
                        const startHour = parseInt(startParts[0]);
                        const isNightShift = startHour >= 20 || startHour < 6;

                        const usageCount = realShifts.filter(s => s.shift_type === shiftType).length;

                        return (
                            <div key={shiftType} className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-lg transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-lg ${isNightShift ? 'bg-indigo-500' : 'bg-amber-500'} flex items-center justify-center text-white shadow-md`}>
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-neutral-900 text-lg">{shiftType}</h4>
                                            <p className="text-sm text-neutral-500">{durationText}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-neutral-600 font-medium">Start Time:</span>
                                        <span className="text-neutral-900 font-semibold">{timing.start_time}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-neutral-600 font-medium">End Time:</span>
                                        <span className="text-neutral-900 font-semibold">{timing.end_time}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-neutral-200">
                                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                                        <Calendar className="w-3 h-3" />
                                        <span>Used in {usageCount} schedule(s)</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // Render Overtime Tab
    const renderOvertimeTab = () => (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800">Overtime Assignments</h3>
                <button
                    onClick={() => {
                        setEditingOvertimeId(null);
                        setOvertimeAssignment({
                            userId: '',
                            date: new Date().toISOString().split('T')[0],
                            shiftType: availableShiftTypes[0] || '',
                            startTime: '08:00',
                            endTime: '16:00',
                            hours: 8,
                            reason: ''
                        });
                        setShowAssignOvertimeModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Assign Overtime
                </button>
            </div>

            {/* Overtime List */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                {overtimeRequests.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No overtime assignments yet</p>
                        <p className="text-sm text-neutral-400">Click "Assign Overtime" to add one</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-neutral-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Staff</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Role</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Date</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Shift</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Hours</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Reason</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Status</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overtimeRequests.map((request) => (
                                <tr key={request.id} className="border-t border-gray-100 hover:bg-neutral-50">
                                    <td className="px-4 py-3 font-medium text-neutral-800">{request.staffName}</td>
                                    <td className="px-4 py-3 text-neutral-600">{request.department}</td>
                                    <td className="px-4 py-3 text-neutral-600">{request.date}</td>
                                    <td className="px-4 py-3 text-neutral-600">
                                        {request.shiftType && (
                                            <div>
                                                <div className="font-medium">{request.shiftType}</div>
                                                <div className="text-xs text-neutral-400">{request.startTime} - {request.endTime}</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-600">{request.hours}h</td>
                                    <td className="px-4 py-3 text-neutral-600 max-w-[200px] truncate" title={request.reason}>
                                        {request.reason}
                                    </td>
                                    <td className="px-4 py-3">{getStatusBadge(request.status)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEditOvertime(request)}
                                                className="p-1.5 text-primary-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteOvertime(request.id)}
                                                className="p-1.5 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    // Render On-Call Tab
    const renderOnCallTab = () => {
        const now = new Date();
        const today = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // Group shifts by type
        const shiftsByType = todayShifts.reduce((acc, shift) => {
            const type = shift.shift_type || 'Unknown';
            if (!acc[type]) acc[type] = [];
            acc[type].push(shift);
            return acc;
        }, {} as { [key: string]: IShift[] });

        // Get active shifts (currently on duty)
        const activeShifts = todayShifts.filter(shift => isShiftActive(shift.start_time, shift.end_time));

        return (
            <div className="space-y-6">
                {/* Today Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-6 h-6" />
                        <h3 className="text-xl font-bold">Today's On-Call Staff</h3>
                    </div>
                    <p className="opacity-90">{today}</p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/20 rounded-lg p-3">
                            <p className="text-sm opacity-80">Total Staff</p>
                            <p className="text-2xl font-bold">{todayShifts.length}</p>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3">
                            <p className="text-sm opacity-80">Currently On Duty</p>
                            <p className="text-2xl font-bold">{activeShifts.length}</p>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3">
                            <p className="text-sm opacity-80">Shift Types</p>
                            <p className="text-2xl font-bold">{Object.keys(shiftsByType).length}</p>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3">
                            <p className="text-sm opacity-80">Branch</p>
                            <p className="text-lg font-bold truncate">{branches.find(b => b.id === selectedBranch)?.center_name || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Currently On Duty */}
                {activeShifts.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6">
                        <h4 className="text-lg font-semibold text-emerald-700 mb-4 flex items-center gap-2">
                            <UserCheck className="w-5 h-5" />
                            Currently On Duty
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeShifts.map((shift) => (
                                <div key={shift.id} className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-10 h-10 rounded-full ${getUserColor(shift.user_role_as || 0)} flex items-center justify-center text-white font-medium`}>
                                            {shift.user_first_name?.charAt(0) || '?'}{shift.user_last_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutral-800">{shift.user_first_name} {shift.user_last_name}</p>
                                            <p className="text-sm text-emerald-600">{getRoleName(shift.user_role_as || 0)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-200">
                                        <div className="text-sm text-neutral-600">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            {shift.start_time} - {shift.end_time}
                                        </div>
                                        {shift.user_phone && (
                                            <a
                                                href={`tel:${shift.user_phone}`}
                                                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                                            >
                                                <Phone className="w-4 h-4" />
                                                Call
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Staff on Shift Today */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="p-4 border-b border-neutral-200">
                        <h4 className="text-lg font-semibold text-neutral-800">All Staff Scheduled Today</h4>
                    </div>
                    {todayShifts.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No shifts scheduled for today</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Staff Member</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Role</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Shift Type</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Time</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Contact</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-700">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayShifts.map((shift) => {
                                    const isActive = isShiftActive(shift.start_time, shift.end_time);
                                    return (
                                        <tr key={shift.id} className={`border-t border-gray-100 ${isActive ? 'bg-emerald-50' : 'hover:bg-neutral-50'}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full ${getUserColor(shift.user_role_as || 0)} flex items-center justify-center text-white text-sm font-medium`}>
                                                        {shift.user_first_name?.charAt(0) || '?'}{shift.user_last_name?.charAt(0) || '?'}
                                                    </div>
                                                    <span className="font-medium text-neutral-800">
                                                        {shift.user_first_name} {shift.user_last_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">{getRoleName(shift.user_role_as || 0)}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded">
                                                    {shift.shift_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {shift.start_time} - {shift.end_time}
                                            </td>
                                            <td className="px-4 py-3">
                                                {shift.user_phone ? (
                                                    <a
                                                        href={`tel:${shift.user_phone}`}
                                                        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                        {shift.user_phone}
                                                    </a>
                                                ) : (
                                                    <span className="text-neutral-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isActive ? (
                                                    <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                                        On Duty
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full">
                                                        Scheduled
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    };

    // Render Overtime Modal
    const renderOvertimeModal = () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-800">
                        {editingOvertimeId ? 'Edit Overtime Assignment' : 'Assign Overtime'}
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    {/* User Select */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Staff Member</label>
                        <select
                            value={overtimeAssignment.userId}
                            onChange={(e) => setOvertimeAssignment(prev => ({ ...prev, userId: e.target.value }))}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Select staff member</option>
                            {filteredUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name} - {getRoleName(user.role_as)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
                        <input
                            type="date"
                            value={overtimeAssignment.date}
                            onChange={(e) => setOvertimeAssignment(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Shift Type */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Shift Type</label>
                        <select
                            value={overtimeAssignment.shiftType}
                            onChange={(e) => {
                                const type = e.target.value;
                                const timing = shiftTypeTimings[type];
                                setOvertimeAssignment(prev => ({
                                    ...prev,
                                    shiftType: type,
                                    startTime: timing?.start_time || prev.startTime,
                                    endTime: timing?.end_time || prev.endTime,
                                    hours: timing ? calculateOvertimeHours(timing.start_time, timing.end_time) : prev.hours
                                }));
                            }}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Select shift type</option>
                            {availableShiftTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                value={overtimeAssignment.startTime}
                                onChange={(e) => {
                                    const newStart = e.target.value;
                                    setOvertimeAssignment(prev => ({
                                        ...prev,
                                        startTime: newStart,
                                        hours: calculateOvertimeHours(newStart, prev.endTime)
                                    }));
                                }}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">End Time</label>
                            <input
                                type="time"
                                value={overtimeAssignment.endTime}
                                onChange={(e) => {
                                    const newEnd = e.target.value;
                                    setOvertimeAssignment(prev => ({
                                        ...prev,
                                        endTime: newEnd,
                                        hours: calculateOvertimeHours(prev.startTime, newEnd)
                                    }));
                                }}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Hours (calculated) */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Total Hours</label>
                        <input
                            type="number"
                            value={overtimeAssignment.hours}
                            onChange={(e) => setOvertimeAssignment(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50"
                            min="0"
                            step="0.5"
                        />
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Reason</label>
                        <textarea
                            value={overtimeAssignment.reason}
                            onChange={(e) => setOvertimeAssignment(prev => ({ ...prev, reason: e.target.value }))}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            rows={3}
                            placeholder="Reason for overtime assignment..."
                        />
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
                    <button
                        onClick={() => {
                            setShowAssignOvertimeModal(false);
                            setEditingOvertimeId(null);
                        }}
                        className="px-4 py-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={editingOvertimeId ? handleUpdateOvertime : handleAssignOvertime}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        {editingOvertimeId ? 'Update' : 'Assign'}
                    </button>
                </div>
            </div>
        </div>
    );

    if (branchLoading) {
        return (
            <DashboardLayout
                userName={userName}
                userRole="Super Admin"
                profileImage={profileImage}
                sidebarContent={<SidebarMenu items={SuperAdminMenuItems} />}
            >
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            userName={userName}
            userRole="Super Admin"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={SuperAdminMenuItems} />}
        >
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
                {renderBranchSelector()}

                {/* Tabs */}
                <div className="mb-6 flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-neutral-200 overflow-x-auto">
                    {[
                        { id: 'schedule', label: 'Weekly Schedule', icon: <Calendar className="w-4 h-4" /> },
                        { id: 'shifts', label: 'Manage Shifts', icon: <Clock className="w-4 h-4" /> },
                        { id: 'overtime', label: 'Overtime', icon: <Clock className="w-4 h-4" /> },
                        { id: 'oncall', label: 'On-Call Staff', icon: <Phone className="w-4 h-4" /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-neutral-600 hover:bg-neutral-100'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'schedule' && renderScheduleTab()}
                {activeTab === 'shifts' && renderShiftsTab()}
                {activeTab === 'overtime' && renderOvertimeTab()}
                {activeTab === 'oncall' && renderOnCallTab()}

                {/* Overtime Modal */}
                {showAssignOvertimeModal && renderOvertimeModal()}

                {/* Shift Assignment Modal */}
                {showShiftAssignModal && selectedCell && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-4 border-b border-neutral-200">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-neutral-800">
                                        {selectedCell.existingShifts.length > 0 ? 'Edit Shift' : 'Assign Shift'}
                                    </h3>
                                    <button
                                        onClick={() => setShowShiftAssignModal(false)}
                                        className="text-neutral-400 hover:text-neutral-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="mt-2 text-sm text-neutral-600">
                                    <p className="font-medium">{selectedCell.user.first_name} {selectedCell.user.last_name}</p>
                                    <p className="text-xs">{selectedCell.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Existing Shifts - Show at top if any */}
                                {selectedCell.existingShifts.length > 0 && (
                                    <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-semibold text-blue-900">Currently Assigned Shifts ({selectedCell.existingShifts.length})</p>
                                            <span className="text-xs text-primary-500">Click shift to edit, or delete</span>
                                        </div>
                                        <div className="space-y-2">
                                            {selectedCell.existingShifts.map((shift) => (
                                                <div
                                                    key={shift.id}
                                                    className="flex items-center justify-between bg-white p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border border-blue-200"
                                                    onClick={() => setShiftAssignment({
                                                        shift_type: shift.shift_type,
                                                        start_time: shift.start_time,
                                                        end_time: shift.end_time,
                                                        recurrence: 'once'
                                                    })}
                                                >
                                                    <div className="flex-1">
                                                        <div className="font-medium text-neutral-800 text-sm">{shift.shift_type}</div>
                                                        <div className="text-neutral-600 text-xs mt-1">
                                                            {shift.start_time} - {shift.end_time}
                                                        </div>
                                                        {shift.notes && (
                                                            <div className="text-neutral-500 text-xs mt-1 italic">{shift.notes}</div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteShift(shift.id);
                                                        }}
                                                        className="text-error-600 hover:text-red-800 p-2 hover:bg-error-50 rounded-lg transition-colors"
                                                        title="Delete this shift"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                                            💡 Click a shift above to load its details into the form below for editing
                                        </div>
                                    </div>
                                )}

                                {/* Divider if there are existing shifts */}
                                {selectedCell.existingShifts.length > 0 && (
                                    <div className="border-t border-neutral-300 pt-4">
                                        <p className="text-sm font-medium text-neutral-700 mb-3">
                                            {selectedCell.existingShifts.length > 0 ? 'Add New Shift' : 'Assign Shift'}
                                        </p>
                                    </div>
                                )}

                                {/* Shift Type */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Shift Type</label>
                                    <input
                                        type="text"
                                        value={shiftAssignment.shift_type}
                                        onChange={(e) => setShiftAssignment(prev => ({ ...prev, shift_type: e.target.value }))}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="e.g., Morning, Evening, Night"
                                        list="shift-types"
                                    />
                                    <datalist id="shift-types">
                                        {availableShiftTypes.map(type => (
                                            <option key={type} value={type} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Start Time */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={shiftAssignment.start_time}
                                        onChange={(e) => setShiftAssignment(prev => ({ ...prev, start_time: e.target.value }))}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* End Time */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={shiftAssignment.end_time}
                                        onChange={(e) => setShiftAssignment(prev => ({ ...prev, end_time: e.target.value }))}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Recurrence */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Recurrence Pattern</label>
                                    <select
                                        value={shiftAssignment.recurrence}
                                        onChange={(e) => setShiftAssignment(prev => ({ ...prev, recurrence: e.target.value }))}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="once">This day only</option>
                                        <option value="weekly">Every {selectedCell.date.toLocaleDateString('en-US', { weekday: 'long' })}</option>
                                        <option value="weekdays">All Weekdays (Mon-Fri)</option>
                                        <option value="weekends">All Weekends (Sat-Sun)</option>
                                        <option value="continuous">Every day</option>
                                    </select>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowShiftAssignModal(false)}
                                    className="px-4 py-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignShift}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    {selectedCell.existingShifts.length > 0 ? 'Update Shift' : 'Assign Shift'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SuperAdminStaffScheduling;
