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
    Loader2,
    Download,
    Eye,
    History,
    TrendingUp
} from 'lucide-react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../../components/common/Layout/SidebarMenu';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { StatCard } from '../../../../components/ui/StatCard';

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

    const employeeHRMMenuItems = [
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
        <DashboardLayout
            userName={userName}
            userRole={userRole}
            profileImage={sessionStorage.getItem('profileImage') || ''}
            sidebarContent={<SidebarMenu items={employeeHRMMenuItems} />}
        >
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    title="HR Self-Service"
                    description="Manage your profile, leave, and attendance."
                    actions={
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-sm">
                            <User className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-neutral-700">Employee Portal</span>
                        </div>
                    }
                />

                {/* Leave Balances Grid (Replaced custom cards with StatCard for consistency) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Annual Leave"
                        value={`${stats.leaveBalance.annual} days`}
                        icon={Calendar}
                        description="Available Balance"
                    />
                    <StatCard
                        title="Casual Leave"
                        value={`${stats.leaveBalance.casual} days`}
                        icon={Calendar}
                        description="Available Balance"
                    />
                    <StatCard
                        title="Medical Leave"
                        value={`${stats.leaveBalance.medical} days`}
                        icon={Calendar}
                        description="Available Balance"
                    />
                    <StatCard
                        title="Sick Leave"
                        value={`${stats.leaveBalance.sick} days`}
                        icon={Calendar}
                        description="Available Balance"
                    />
                </div>

                {/* HR Services Navigation */}
                <div>
                    <h2 className="text-lg font-semibold text-neutral-800 mb-4">HR Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selfServiceModules.map((module) => (
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
                                            <span className="text-sm font-medium text-emerald-600 group-hover:underline">{module.action}</span>
                                            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Next Shift & Recent Payslips */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Next Shift */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-800">Next Shift</h3>
                        </div>
                        {stats.nextShift ? (
                            <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-purple-700">
                                        <Calendar className="w-5 h-5" />
                                        <span className="font-semibold text-lg">{stats.nextShift.date}</span>
                                    </div>
                                    <span className="px-3 py-1 bg-white text-purple-700 rounded-full text-sm font-medium border border-purple-100 shadow-sm w-fit">
                                        {stats.nextShift.type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-3xl font-bold text-neutral-800 mb-6">
                                    <Clock className="w-8 h-8 text-purple-400" />
                                    {stats.nextShift.time}
                                </div>
                                <button className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm shadow-purple-200">
                                    Acknowledge Awareness
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-neutral-400 bg-neutral-50 rounded-lg border border-neutral-100 border-dashed">
                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No upcoming shifts assigned</p>
                            </div>
                        )}
                        <div className="mt-4 flex items-center justify-between text-sm text-neutral-500 pt-4 border-t border-neutral-100">
                            <span className="flex items-center gap-2">
                                <History className="w-4 h-4" />
                                This month: <span className="font-semibold text-neutral-700">{stats.currentMonthOT} OT hours</span>
                            </span>
                        </div>
                    </div>

                    {/* Recent Payslips */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-neutral-800">Recent Payslips</h3>
                            </div>
                            <button
                                onClick={() => navigate('/dashboard/hrm/payslips')}
                                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                            >
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {recentPayslips.map((payslip) => (
                                <div key={payslip.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-100 hover:border-emerald-100 transition-colors">
                                    <div>
                                        <p className="font-semibold text-neutral-800">{payslip.month}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm text-neutral-500">Net Salary:</span>
                                            <span className="text-sm font-bold text-emerald-600">LKR {payslip.netSalary.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pending Leave Alert */}
                {stats.pendingLeaveRequests > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm animate-pulse-slight">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-full">
                                    <AlertCircle className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-orange-900">
                                        Action Required: {stats.pendingLeaveRequests} Pending Leave Request{stats.pendingLeaveRequests > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-sm text-orange-700 mt-0.5">Please check the status of your request.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/dashboard/hrm/leave')}
                                className="px-4 py-2 bg-white text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium shadow-sm"
                            >
                                View Status
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default EmployeeHRMDashboard;
