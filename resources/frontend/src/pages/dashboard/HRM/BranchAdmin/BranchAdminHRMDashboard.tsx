import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
    Menu,
    X,
    LogOut,
    User,
    Bell,
    UserCheck,
    ClipboardList,
    AlertCircle,
    TrendingUp,
    History,
    Mail
} from 'lucide-react';

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
            const response = await axios.get('/api/hrm/branch-admin/stats', {
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

    const sidebarItems = [
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

    const QuickStatCard = ({ title, value, icon, color, trend, trendUp, isLoading }: {
        title: string;
        value: string | number;
        icon: React.ReactNode;
        color: string;
        trend?: string;
        trendUp?: boolean;
        isLoading?: boolean;
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mt-2" />
                    ) : (
                        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                    )}
                    {trend && !isLoading && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                            <TrendingUp className={`w-3 h-3 ${!trendUp && 'rotate-180'}`} />
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        {isSidebarOpen && (
                            <div>
                                <h1 className="font-bold text-gray-800">HRM Module</h1>
                                <p className="text-xs text-gray-500">{branchName}</p>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 py-4">
                    <ul className="space-y-1 px-2">
                        {sidebarItems.map((item, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => navigate(item.path)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                        window.location.pathname === item.path
                                            ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
                                    }`}
                                >
                                    {item.icon}
                                    {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={() => navigate('/branch-admin/dashboard')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        {isSidebarOpen && <span>Back to Dashboard</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Top Navbar */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">HRM Dashboard</h1>
                                <p className="text-sm text-gray-500">Human Resource Management - {branchName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                                <Bell className="w-5 h-5 text-gray-600" />
                                {stats.pendingLeaveRequests > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {stats.pendingLeaveRequests}
                                    </span>
                                )}
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Branch Admin</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickStatCard
                            title="Total Staff"
                            value={stats.totalStaff}
                            icon={<Users className="w-6 h-6 text-white" />}
                            color="from-blue-500 to-blue-600"
                            isLoading={isLoading}
                        />
                        <QuickStatCard
                            title="On Duty Today"
                            value={stats.onDutyToday}
                            icon={<UserCheck className="w-6 h-6 text-white" />}
                            color="from-emerald-500 to-emerald-600"
                            isLoading={isLoading}
                        />
                        <QuickStatCard
                            title="On Leave Today"
                            value={stats.onLeaveToday}
                            icon={<Calendar className="w-6 h-6 text-white" />}
                            color="from-orange-500 to-orange-600"
                            isLoading={isLoading}
                        />
                        <QuickStatCard
                            title="Monthly Payroll"
                            value={`LKR ${stats.monthlyPayroll.toLocaleString()}`}
                            icon={<DollarSign className="w-6 h-6 text-white" />}
                            color="from-purple-500 to-purple-600"
                            isLoading={isLoading}
                        />
                    </div>

                    {/* HRM Modules Grid */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">HRM Modules</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hrmModules.map((module) => (
                                <div
                                    key={module.id}
                                    onClick={() => navigate(module.path)}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} text-white group-hover:scale-110 transition-transform`}>
                                            {module.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">
                                                {module.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {module.stats.label}: <span className="text-emerald-600">{module.stats.value}</span>
                                                </span>
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Leave Requests */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Calendar className="w-5 h-5 text-orange-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">Pending Leave Requests</h2>
                            </div>
                            <button 
                                onClick={() => navigate('/branch-admin/hrm/leave-approvals')}
                                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {pendingLeaveRequests.map((request) => (
                                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{request.name}</p>
                                            <p className="text-sm text-gray-500">{request.type} • {request.dates} ({request.days} day{request.days > 1 ? 's' : ''})</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors">
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {pendingLeaveRequests.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No pending leave requests</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Today's Attendance Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <UserCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Attendance Today</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Present</span>
                                    <span className="font-semibold text-emerald-600">{stats.onDutyToday}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">On Leave</span>
                                    <span className="font-semibold text-orange-600">{stats.onLeaveToday}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Absent</span>
                                    <span className="font-semibold text-red-600">{Math.max(0, stats.totalStaff - stats.onDutyToday - stats.onLeaveToday)}</span>
                                </div>
                                <div className="pt-3 border-t">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-emerald-500 h-2 rounded-full" 
                                            style={{ width: `${stats.totalStaff > 0 ? (stats.onDutyToday / stats.totalStaff) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">
                                        {stats.totalStaff > 0 ? Math.round((stats.onDutyToday / stats.totalStaff) * 100) : 0}% attendance rate
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Overtime This Month</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total OT Hours</span>
                                    <span className="font-semibold text-gray-800">156 hrs</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">OT Cost</span>
                                    <span className="font-semibold text-purple-600">LKR {stats.overtimeCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Pending Approvals</span>
                                    <span className="font-semibold text-orange-600">{stats.pendingOvertimeApprovals}</span>
                                </div>
                                <button 
                                    onClick={() => navigate('/branch-admin/hrm/overtime')}
                                    className="w-full mt-2 py-2 text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                                >
                                    Review Overtime
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BranchAdminHRMDashboard;
