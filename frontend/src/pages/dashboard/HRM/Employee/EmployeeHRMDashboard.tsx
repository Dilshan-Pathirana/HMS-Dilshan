import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../../../utils/api/axios";
import {
    User,
    DollarSign,
    FileText,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Briefcase,
    CreditCard,
    Loader2,
    Menu,
    X,
    LogOut,
    Bell,
    Download,
    Eye,
    Plus,
    History,
    Award,
    TrendingUp
} from 'lucide-react';

interface EmployeeHRMStats {
    leaveBalance: {
        annual: number;
        casual: number;
        medical: number;
        sick: number;
    };
    pendingLeaveRequests: number;
    currentMonthOT: number;
    overtimeHours: number;
    overtimeEarnings: number;
    lastPayslipDate: string;
    nextShift: {
        date: string;
        time: string;
        type: string;
    } | null;
    profile: {
        name: string;
        employeeId: string;
        designation: string;
        department: string;
        epfNumber: string;
    };
    attendance: {
        present: number;
        absent: number;
        late: number;
    };
}

const EmployeeHRMDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [stats, setStats] = useState<EmployeeHRMStats>({
        leaveBalance: { annual: 0, casual: 0, medical: 0, sick: 0 },
        pendingLeaveRequests: 0,
        currentMonthOT: 0,
        overtimeHours: 0,
        overtimeEarnings: 0,
        lastPayslipDate: '',
        nextShift: null,
        profile: { name: '', employeeId: '', designation: '', department: '', epfNumber: '' },
        attendance: { present: 0, absent: 0, late: 0 }
    });

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setUserRole(userInfo.role || 'Employee');
        fetchHRMStats();
    }, []);

    const fetchHRMStats = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get('/hrm/employee/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 'success') {
                const data = response.data.data;
                setStats({
                    leaveBalance: data.leaveBalance || { annual: 0, casual: 0, medical: 0, sick: 0 },
                    pendingLeaveRequests: data.pendingLeaves || 0,
                    currentMonthOT: data.overtimeHours || 0,
                    overtimeHours: data.overtimeHours || 0,
                    overtimeEarnings: data.overtimeEarnings || 0,
                    lastPayslipDate: data.lastPayslipDate || '',
                    nextShift: data.currentShift || null,
                    profile: data.profile || { name: '', employeeId: '', designation: '', department: '', epfNumber: '' },
                    attendance: data.attendance || { present: 0, absent: 0, late: 0 }
                });
            }
        } catch (error) {
            console.error('Error fetching HRM stats:', error);
            // Set demo data for now
            setStats({
                leaveBalance: { annual: 14, casual: 7, medical: 14, sick: 7 },
                pendingLeaveRequests: 1,
                currentMonthOT: 12,
                overtimeHours: 12,
                overtimeEarnings: 0,
                lastPayslipDate: '2024-12-31',
                nextShift: { date: 'Tomorrow', time: '08:00 AM - 04:00 PM', type: 'Morning Shift' },
                profile: { name: '', employeeId: '', designation: '', department: '', epfNumber: '' },
                attendance: { present: 0, absent: 0, late: 0 }
            });
        } finally {
            setIsLoading(false);
        }
    };

    const selfServiceModules = [
        {
            id: 'profile',
            title: 'My HR Profile',
            description: 'View and update your HR profile, employment details, and bank information.',
            icon: <User className="w-8 h-8" />,
            path: '/dashboard/hrm/profile',
            color: 'from-blue-500 to-blue-600',
            action: 'View Profile'
        },
        {
            id: 'leave',
            title: 'Leave Management',
            description: 'Apply for leave, view leave balance, and track leave history.',
            icon: <Calendar className="w-8 h-8" />,
            path: '/dashboard/hrm/leave',
            color: 'from-orange-500 to-orange-600',
            action: 'Apply Leave'
        },
        {
            id: 'payslips',
            title: 'Payslips',
            description: 'View, download, and print your monthly payslips.',
            icon: <DollarSign className="w-8 h-8" />,
            path: '/dashboard/hrm/payslips',
            color: 'from-emerald-500 to-emerald-600',
            action: 'View Payslips'
        },
        {
            id: 'shifts',
            title: 'My Shifts',
            description: 'View assigned shifts, acknowledge attendance, and see schedule.',
            icon: <Clock className="w-8 h-8" />,
            path: '/dashboard/hrm/shifts',
            color: 'from-purple-500 to-purple-600',
            action: 'View Schedule'
        },
        {
            id: 'schedule-acknowledgment',
            title: 'Schedule Requests',
            description: 'View and acknowledge new schedule assignments from your manager.',
            icon: <CheckCircle className="w-8 h-8" />,
            path: '/dashboard/hrm/schedule-acknowledgment',
            color: 'from-amber-500 to-amber-600',
            action: 'View Requests'
        },
        {
            id: 'overtime',
            title: 'Overtime',
            description: 'View overtime hours, claims, and approval status.',
            icon: <TrendingUp className="w-8 h-8" />,
            path: '/dashboard/hrm/overtime',
            color: 'from-cyan-500 to-cyan-600',
            action: 'View OT'
        },
        {
            id: 'documents',
            title: 'HR Documents',
            description: 'Request and download HR letters (confirmation, service period).',
            icon: <FileText className="w-8 h-8" />,
            path: '/dashboard/hrm/documents',
            color: 'from-pink-500 to-pink-600',
            action: 'Request Letter'
        }
    ];

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

    const recentPayslips = [
        { id: 1, month: 'December 2024', netSalary: 85000, status: 'paid' },
        { id: 2, month: 'November 2024', netSalary: 82500, status: 'paid' },
        { id: 3, month: 'October 2024', netSalary: 83200, status: 'paid' },
    ];

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
                                <h1 className="font-bold text-gray-800">HR Self-Service</h1>
                                <p className="text-xs text-gray-500">Employee Portal</p>
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
                        onClick={() => navigate('/dashboard')}
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
                                <h1 className="text-xl font-bold text-gray-800">HR Self-Service</h1>
                                <p className="text-sm text-gray-500">Welcome back, {userName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                                <Bell className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-medium text-gray-700 block">{userName}</span>
                                    <span className="text-xs text-gray-500">{userRole}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 space-y-6">
                    {/* Leave Balance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Annual Leave</p>
                                    {isLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin mt-2" />
                                    ) : (
                                        <p className="text-3xl font-bold mt-1">{stats.leaveBalance.annual} days</p>
                                    )}
                                    <p className="text-blue-200 text-xs mt-1">Available balance</p>
                                </div>
                                <Calendar className="w-12 h-12 text-blue-300" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm">Casual Leave</p>
                                    {isLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin mt-2" />
                                    ) : (
                                        <p className="text-3xl font-bold mt-1">{stats.leaveBalance.casual} days</p>
                                    )}
                                    <p className="text-orange-200 text-xs mt-1">Available balance</p>
                                </div>
                                <Calendar className="w-12 h-12 text-orange-300" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-sm">Medical Leave</p>
                                    {isLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin mt-2" />
                                    ) : (
                                        <p className="text-3xl font-bold mt-1">{stats.leaveBalance.medical} days</p>
                                    )}
                                    <p className="text-emerald-200 text-xs mt-1">Available balance</p>
                                </div>
                                <Calendar className="w-12 h-12 text-emerald-300" />
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={() => navigate('/dashboard/hrm/leave')}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Apply Leave
                        </button>
                        <button 
                            onClick={() => navigate('/dashboard/hrm/payslips')}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download Payslip
                        </button>
                        <button 
                            onClick={() => navigate('/dashboard/hrm/shifts')}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                        >
                            <Clock className="w-4 h-4" />
                            View Schedule
                        </button>
                        <button 
                            onClick={() => navigate('/dashboard/hrm/documents')}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Request Letter
                        </button>
                    </div>

                    {/* Self-Service Modules */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">HR Services</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {selfServiceModules.map((module) => (
                                <div
                                    key={module.id}
                                    onClick={() => navigate(module.path)}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group"
                                >
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} text-white w-fit mb-4 group-hover:scale-110 transition-transform`}>
                                        {module.icon}
                                    </div>
                                    <h3 className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">
                                        {module.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-sm font-medium text-emerald-600">{module.action}</span>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Next Shift & Recent Payslips */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Next Shift */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Next Shift</h3>
                            </div>
                            {stats.nextShift ? (
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-purple-600 font-medium">{stats.nextShift.date}</span>
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                            {stats.nextShift.type}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800">{stats.nextShift.time}</p>
                                    <button className="mt-3 w-full py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                                        Acknowledge Shift
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No upcoming shifts</p>
                                </div>
                            )}
                            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                                <History className="w-4 h-4" />
                                <span>This month: {stats.currentMonthOT} OT hours</span>
                            </div>
                        </div>

                        {/* Recent Payslips */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <DollarSign className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Recent Payslips</h3>
                                </div>
                                <button 
                                    onClick={() => navigate('/dashboard/hrm/payslips')}
                                    className="text-sm text-emerald-600 hover:text-emerald-700"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="space-y-3">
                                {recentPayslips.map((payslip) => (
                                    <div key={payslip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-800">{payslip.month}</p>
                                            <p className="text-sm text-emerald-600">LKR {payslip.netSalary.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pending Leave Requests */}
                    {stats.pendingLeaveRequests > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                <div>
                                    <p className="font-medium text-yellow-800">
                                        You have {stats.pendingLeaveRequests} pending leave request{stats.pendingLeaveRequests > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-sm text-yellow-700">Awaiting approval from your supervisor</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/dashboard/hrm/leave')}
                                    className="ml-auto px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                                >
                                    View Status
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default EmployeeHRMDashboard;
