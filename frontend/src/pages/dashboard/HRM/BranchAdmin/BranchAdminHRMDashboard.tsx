import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../../../utils/api/axios";
import {
    Users,
    DollarSign,
    FileText,
    Calendar,
    CalendarDays,
    Clock,
    CheckCircle,
    XCircle,
    ChevronRight,
    BarChart3,
    Briefcase,
    CreditCard,
    Loader2,
    UserCheck,
    AlertCircle,
    History,
    Mail,
    User
} from 'lucide-react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../../components/common/Layout/SidebarMenu';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { StatCard } from '../../../../components/ui/StatCard';

interface BranchHRMStats {
    totalStaff: number;
    activeStaff: number;
    onDutyToday: number;
    onLeaveToday: number;
    pendingLeaves: number;
    pendingLeaveRequests: number;
    pendingOvertimeApprovals: number;
    monthlyPayroll: number;
    totalPayroll: number;
    overtimeCost: number;
    overtime: {
        hours: number;
        cost: number;
    };
    epfEtf: {
        epfEmployee: number;
        epfEmployer: number;
        etfEmployer: number;
        total: number;
    };
    todayAttendance: {
        present: number;
        absent: number;
        late: number;
        onLeave: number;
    };
    recentLeaves: Array<{
        id: string;
        employeeName: string;
        leaveType: string;
        startDate: string;
        endDate: string;
        status: string;
    }>;
}

const BranchAdminHRMDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [branchName, setBranchName] = useState('');
    const [stats, setStats] = useState<BranchHRMStats>({
        totalStaff: 0,
        activeStaff: 0,
        onDutyToday: 0,
        onLeaveToday: 0,
        pendingLeaves: 0,
        pendingLeaveRequests: 0,
        pendingOvertimeApprovals: 0,
        monthlyPayroll: 0,
        totalPayroll: 0,
        overtimeCost: 0,
        overtime: { hours: 0, cost: 0 },
        epfEtf: { epfEmployee: 0, epfEmployer: 0, etfEmployer: 0, total: 0 },
        todayAttendance: { present: 0, absent: 0, late: 0, onLeave: 0 },
        recentLeaves: []
    });

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setBranchName(userInfo.branch_name || 'Branch');
        fetchHRMStats();
    }, []);

    const fetchHRMStats = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get('/hrm/branch-admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 'success') {
                const data = response.data.data;
                setStats({
                    ...stats,
                    totalStaff: data.totalStaff || 0,
                    activeStaff: data.activeStaff || 0,
                    onDutyToday: data.todayAttendance?.present || 0,
                    onLeaveToday: data.todayAttendance?.onLeave || 0,
                    pendingLeaves: data.pendingLeaves || 0,
                    pendingLeaveRequests: data.pendingLeaves || 0,
                    pendingOvertimeApprovals: 0,
                    monthlyPayroll: data.totalPayroll || 0,
                    totalPayroll: data.totalPayroll || 0,
                    overtimeCost: data.overtime?.cost || 0,
                    overtime: data.overtime || { hours: 0, cost: 0 },
                    epfEtf: data.epfEtf || { epfEmployee: 0, epfEmployer: 0, etfEmployer: 0, total: 0 },
                    todayAttendance: data.todayAttendance || { present: 0, absent: 0, late: 0, onLeave: 0 },
                    recentLeaves: data.recentLeaves || []
                });
            }
        } catch (error) {
            console.error('Error fetching HRM stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const hrmModules = [
        {
            id: 'staff',
            title: 'Staff Management',
            description: 'View and manage HR profiles of staff in your branch.',
            icon: <Users className="w-8 h-8" />,
            path: '/branch-admin/hrm/staff',
            color: 'from-blue-500 to-blue-600',
            stats: { label: 'Total Staff', value: stats.totalStaff }
        },
        {
            id: 'scheduling',
            title: 'Staff Scheduling',
            description: 'Manage staff shifts, schedules, and work assignments.',
            icon: <CalendarDays className="w-8 h-8" />,
            path: '/branch-admin/hrm/scheduling',
            color: 'from-cyan-500 to-cyan-600',
            stats: { label: 'Schedule', value: 'Planner' }
        },
        {
            id: 'attendance',
            title: 'Attendance & Shifts',
            description: 'Track daily attendance, assign shifts, and monitor coverage.',
            icon: <UserCheck className="w-8 h-8" />,
            path: '/branch-admin/hrm/attendance',
            color: 'from-emerald-500 to-emerald-600',
            stats: { label: 'On Duty', value: stats.onDutyToday }
        },
        {
            id: 'leave-approvals',
            title: 'Leave Approvals',
            description: 'Review and approve/reject leave requests from staff.',
            icon: <Calendar className="w-8 h-8" />,
            path: '/branch-admin/hrm/leave-approvals',
            color: 'from-orange-500 to-orange-600',
            stats: { label: 'Pending', value: stats.pendingLeaveRequests }
        },
        {
            id: 'overtime',
            title: 'Overtime Management',
            description: 'Review overtime hours and approve overtime claims.',
            icon: <Clock className="w-8 h-8" />,
            path: '/branch-admin/hrm/overtime',
            color: 'from-purple-500 to-purple-600',
            stats: { label: 'Pending', value: stats.pendingOvertimeApprovals }
        },
        {
            id: 'payroll',
            title: 'Payroll Summary',
            description: 'View monthly payroll summaries and salary reports.',
            icon: <DollarSign className="w-8 h-8" />,
            path: '/branch-admin/hrm/payroll',
            color: 'from-green-500 to-green-600',
            stats: { label: 'This Month', value: `LKR ${stats.monthlyPayroll.toLocaleString()}` }
        },
        {
            id: 'reports',
            title: 'HR Reports',
            description: 'Generate attendance, leave, and payroll reports.',
            icon: <BarChart3 className="w-8 h-8" />,
            path: '/branch-admin/hrm/reports',
            color: 'from-indigo-500 to-indigo-600',
            stats: { label: 'Available', value: 8 }
        },
        {
            id: 'audit-logs',
            title: 'Audit Logs',
            description: 'Track all HR activities and changes in your branch.',
            icon: <History className="w-8 h-8" />,
            path: '/branch-admin/hrm/audit-logs',
            color: 'from-slate-500 to-slate-600',
            stats: { label: 'Activity', value: 'Trail' }
        },
        {
            id: 'service-letters',
            title: 'Service Letters',
            description: 'Review and process service letter requests from staff.',
            icon: <Mail className="w-8 h-8" />,
            path: '/branch-admin/hrm/service-letters',
            color: 'from-pink-500 to-pink-600',
            stats: { label: 'Pending', value: 0 }
        }
    ];

    const branchHRMMenuItems = [
        { label: 'Dashboard', path: '/branch-admin/hrm', icon: <Briefcase className="w-5 h-5" /> },
        { label: 'Staff', path: '/branch-admin/hrm/staff', icon: <Users className="w-5 h-5" /> },
        { label: 'Scheduling', path: '/branch-admin/hrm/scheduling', icon: <CalendarDays className="w-5 h-5" /> },
        { label: 'Attendance', path: '/branch-admin/hrm/attendance', icon: <UserCheck className="w-5 h-5" /> },
        { label: 'Leave Approvals', path: '/branch-admin/hrm/leave-approvals', icon: <Calendar className="w-5 h-5" /> },
        { label: 'Overtime', path: '/branch-admin/hrm/overtime', icon: <Clock className="w-5 h-5" /> },
        { label: 'Payroll', path: '/branch-admin/hrm/payroll', icon: <DollarSign className="w-5 h-5" /> },
        { label: 'Service Letters', path: '/branch-admin/hrm/service-letters', icon: <Mail className="w-5 h-5" /> },
        { label: 'Reports', path: '/branch-admin/hrm/reports', icon: <BarChart3 className="w-5 h-5" /> },
        { label: 'Audit Logs', path: '/branch-admin/hrm/audit-logs', icon: <History className="w-5 h-5" /> },
    ];

    const pendingLeaveRequests = [
        { id: 1, name: 'Dr. John Smith', type: 'Annual Leave', dates: 'Jan 15 - Jan 18', days: 4, status: 'pending' },
        { id: 2, name: 'Nurse Mary Johnson', type: 'Medical Leave', dates: 'Jan 16 - Jan 17', days: 2, status: 'pending' },
        { id: 3, name: 'Cashier Tom Wilson', type: 'Casual Leave', dates: 'Jan 20', days: 1, status: 'pending' },
    ];

    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = `${userInfo.first_name || ''} ${userInfo.last_name || ''}`;
    const userRole = 'Branch Admin';

    return (
        <DashboardLayout
            userName={userName}
            userRole={userRole}
            profileImage={userInfo.profile_picture || ''}
            sidebarContent={<SidebarMenu items={branchHRMMenuItems} />}
        >
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    title="HRM Dashboard"
                    description={`Human Resource Management - ${branchName}`}
                    actions={
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-sm">
                            <Briefcase className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-neutral-700">Branch Mode</span>
                        </div>
                    }
                />

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Staff"
                        value={stats.totalStaff}
                        icon={Users}
                    />
                    <StatCard
                        title="On Duty Today"
                        value={stats.onDutyToday}
                        icon={UserCheck}
                    />
                    <StatCard
                        title="On Leave Today"
                        value={stats.onLeaveToday}
                        icon={Calendar}
                    />
                    <StatCard
                        title="Monthly Payroll"
                        value={`LKR ${stats.monthlyPayroll.toLocaleString()}`}
                        icon={DollarSign}
                    />
                </div>

                {/* HRM Modules Navigation */}
                <div>
                    <h2 className="text-lg font-semibold text-neutral-800 mb-4">HRM Modules</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hrmModules.map((module) => (
                            <div
                                key={module.id}
                                onClick={() => navigate(module.path)}
                                className="group bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg hover:border-emerald-500/30 transition-all cursor-pointer"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg bg-gradient-to-br ${module.color} text-white group-hover:scale-110 transition-transform shadow-sm`}>
                                        {module.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-neutral-800 group-hover:text-emerald-600 transition-colors">
                                            {module.title}
                                        </h3>
                                        <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{module.description}</p>
                                        <div className="mt-4 flex items-center justify-between pt-4 border-t border-neutral-100">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                                {module.stats.label}
                                            </span>
                                            <span className="text-sm font-bold text-neutral-700 group-hover:text-emerald-600 transition-colors">
                                                {module.stats.value}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Leave & Attendance Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Leave Requests */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <Calendar className="w-5 h-5 text-orange-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-neutral-800">Pending Leave Requests</h2>
                            </div>
                            <button
                                onClick={() => navigate('/branch-admin/hrm/leave-approvals')}
                                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                            >
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {pendingLeaveRequests.map((request) => (
                                <div key={request.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-neutral-500">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutral-800">{request.name}</p>
                                            <p className="text-sm text-neutral-500">{request.type} • {request.dates}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {pendingLeaveRequests.length === 0 && (
                                <div className="text-center py-12 text-neutral-400 bg-neutral-50 rounded-lg border border-neutral-100 border-dashed">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No pending leave requests</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Attendance Overview */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <UserCheck className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-800">Attendance Today</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <span className="block text-2xl font-bold text-emerald-700">{stats.onDutyToday}</span>
                                    <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Present</span>
                                </div>
                                <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <span className="block text-2xl font-bold text-orange-700">{stats.onLeaveToday}</span>
                                    <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">On Leave</span>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                                    <span className="block text-2xl font-bold text-red-700">{Math.max(0, stats.totalStaff - stats.onDutyToday - stats.onLeaveToday)}</span>
                                    <span className="text-xs font-medium text-red-600 uppercase tracking-wide">Absent</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-neutral-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-neutral-700">Attendance Rate</span>
                                    <span className="text-sm font-bold text-emerald-600">
                                        {stats.totalStaff > 0 ? Math.round((stats.onDutyToday / stats.totalStaff) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${stats.totalStaff > 0 ? (stats.onDutyToday / stats.totalStaff) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/branch-admin/hrm/attendance')}
                                className="w-full py-2.5 text-sm font-medium text-neutral-600 bg-neutral-50 hover:bg-neutral-100 hover:text-neutral-900 rounded-lg border border-neutral-200 transition-all border-dashed"
                            >
                                View Detailed Attendance
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default BranchAdminHRMDashboard;
