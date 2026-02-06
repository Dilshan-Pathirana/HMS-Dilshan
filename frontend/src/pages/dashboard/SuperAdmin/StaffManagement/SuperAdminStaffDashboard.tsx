import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, SuperAdminMenuItems } from '../../../../components/common/Layout/SidebarMenu';
import {
    Users, UserPlus, Calendar, Clock, Award, DollarSign,
    Shield, MessageSquare, FolderOpen, ClipboardList, BarChart3,
    Building2, ChevronRight, TrendingUp, AlertCircle,
    UserCheck, RefreshCw, TrendingDown, Activity, PieChart,
    ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Banknote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from "../../../../utils/api/axios";
import { toast } from 'react-toastify';

interface Branch {
    id: string;
    center_name: string;
    location?: string;
    address?: string;
}

interface StaffStats {
    totalStaff: number;
    activeOnShift: number;
    onLeave: number;
    pendingApprovals: number;
    upcomingTrainings: number;
    expiringSoonCerts: number;
}

interface FinancialStats {
    monthlyPayroll: number;
    yearlyBudget: number;
    overtimeCosts: number;
    benefitsCosts: number;
    trainingBudget: number;
    savingsRate: number;
}

interface ManagementStats {
    activeProjects: number;
    completedTasks: number;
    patientSatisfaction: number;
    staffRetention: number;
    departmentEfficiency: number;
    complianceRate: number;
}

const staffModules = [
    {
        id: 'profiles',
        title: 'Staff Profile Management',
        description: 'Create, edit, delete staff profiles. Manage roles and view staff directory.',
        icon: <UserPlus className="w-8 h-8" />,
        path: '/super-admin/staff/profiles',
        color: 'from-blue-500 to-blue-600',
        stats: { label: 'Total Staff', value: 156 }
    },
    {
        id: 'scheduling',
        title: 'Scheduling & Shift Management',
        description: 'Create shifts, manage schedules, overtime, and on-call staff.',
        icon: <Calendar className="w-8 h-8" />,
        path: '/super-admin/staff/scheduling',
        color: 'from-emerald-500 to-emerald-600',
        stats: { label: 'Active Shifts', value: 24 }
    },
    {
        id: 'leave',
        title: 'Leave Management',
        description: 'Approve/reject leave requests, track balances, monitor absences.',
        icon: <Clock className="w-8 h-8" />,
        path: '/super-admin/staff/leave',
        color: 'from-orange-500 to-orange-600',
        stats: { label: 'Pending Requests', value: 8 }
    },
    {
        id: 'attendance',
        title: 'Attendance Monitoring',
        description: 'View attendance logs, track coverage, integrate with payroll.',
        icon: <UserCheck className="w-8 h-8" />,
        path: '/super-admin/staff/attendance',
        color: 'from-purple-500 to-purple-600',
        stats: { label: 'Present Today', value: 142 }
    },
    {
        id: 'training',
        title: 'Training & Development',
        description: 'Assign training modules, track progress, manage certifications.',
        icon: <Award className="w-8 h-8" />,
        path: '/super-admin/staff/training',
        color: 'from-pink-500 to-pink-600',
        stats: { label: 'Active Programs', value: 12 }
    },
    {
        id: 'payroll',
        title: 'Payroll & Compensation',
        description: 'Salary processing, bonus calculation, tax and benefits management.',
        icon: <DollarSign className="w-8 h-8" />,
        path: '/super-admin/staff/payroll',
        color: 'from-green-500 to-green-600',
        stats: { label: 'This Month', value: '$245K' }
    },
    {
        id: 'compliance',
        title: 'Compliance & Legal',
        description: 'Track licenses, audit trails, regulatory compliance.',
        icon: <Shield className="w-8 h-8" />,
        path: '/super-admin/staff/compliance',
        color: 'from-red-500 to-red-600',
        stats: { label: 'Expiring Soon', value: 5 }
    },
    {
        id: 'communication',
        title: 'Staff Communication',
        description: 'Announcements, internal messaging, meeting scheduling.',
        icon: <MessageSquare className="w-8 h-8" />,
        path: '/super-admin/staff/communication',
        color: 'from-cyan-500 to-cyan-600',
        stats: { label: 'Unread Messages', value: 23 }
    },
    {
        id: 'records',
        title: 'Employee Records',
        description: 'Manage documents, track work history, store contracts.',
        icon: <FolderOpen className="w-8 h-8" />,
        path: '/super-admin/staff/records',
        color: 'from-amber-500 to-amber-600',
        stats: { label: 'Documents', value: 1240 }
    },
    {
        id: 'feedback',
        title: 'Staff Feedback & Surveys',
        description: 'Conduct surveys, analyze feedback, improve satisfaction.',
        icon: <ClipboardList className="w-8 h-8" />,
        path: '/super-admin/staff/feedback',
        color: 'from-indigo-500 to-indigo-600',
        stats: { label: 'Active Surveys', value: 3 }
    },
    {
        id: 'reports',
        title: 'Reporting & Analytics',
        description: 'Custom reports, staffing costs, performance analytics.',
        icon: <BarChart3 className="w-8 h-8" />,
        path: '/super-admin/staff/reports',
        color: 'from-teal-500 to-teal-600',
        stats: { label: 'Reports Generated', value: 45 }
    },
];

export const SuperAdminStaffDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [branchesLoading, setBranchesLoading] = useState(true);
    const [stats, setStats] = useState<StaffStats>({
        totalStaff: 0,
        activeOnShift: 0,
        onLeave: 0,
        pendingApprovals: 0,
        upcomingTrainings: 0,
        expiringSoonCerts: 0
    });

    const [financialStats, setFinancialStats] = useState<FinancialStats>({
        monthlyPayroll: 245000,
        yearlyBudget: 3200000,
        overtimeCosts: 18500,
        benefitsCosts: 42000,
        trainingBudget: 15000,
        savingsRate: 12.5
    });

    const [managementStats, setManagementStats] = useState<ManagementStats>({
        activeProjects: 8,
        completedTasks: 156,
        patientSatisfaction: 94.5,
        staffRetention: 89.2,
        departmentEfficiency: 91.8,
        complianceRate: 98.5
    });

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setProfileImage(userInfo.profile_picture || '');

        fetchBranches();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            fetchStaffStats();
        }
    }, [selectedBranch]);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/get-branches');
            const branchData = Array.isArray(response.data.branches) ? response.data.branches : [];
            setBranches(branchData);

            // Store selected branch in localStorage for sub-pages
            if (branchData.length > 0 && selectedBranch === 'all') {
                localStorage.setItem('superAdminSelectedBranch', 'all');
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
            toast.error('Failed to load branches');
        } finally {
            setBranchesLoading(false);
        }
    };

    const fetchStaffStats = async () => {
        try {
            // Fetch staff statistics based on selected branch
            const response = await api.get('/users');
            const users = response.data.users || [];

            let filteredUsers = users;
            if (selectedBranch !== 'all') {
                filteredUsers = users.filter((u: any) => u.branch_id === selectedBranch);
            }

            // Calculate stats from users
            const staffUsers = filteredUsers.filter((u: any) => u.role_as >= 2 && u.role_as <= 10);

            setStats({
                totalStaff: staffUsers.length,
                activeOnShift: Math.floor(staffUsers.length * 0.6), // Placeholder
                onLeave: Math.floor(staffUsers.length * 0.1), // Placeholder
                pendingApprovals: Math.floor(Math.random() * 15), // Placeholder
                upcomingTrainings: Math.floor(Math.random() * 10), // Placeholder
                expiringSoonCerts: Math.floor(Math.random() * 8) // Placeholder
            });
        } catch (error) {
            console.error('Error fetching staff stats:', error);
        }
    };

    const handleBranchChange = (branchId: string) => {
        setSelectedBranch(branchId);
        localStorage.setItem('superAdminSelectedBranch', branchId);
    };

    const handleModuleClick = (path: string) => {
        // Store selected branch before navigating
        localStorage.setItem('superAdminSelectedBranch', selectedBranch);
        navigate(path);
    };

    const StatCard = ({
        title,
        value,
        icon,
        color,
        trend
    }: {
        title: string;
        value: number;
        icon: React.ReactNode;
        color: string;
        trend?: string;
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-neutral-500 font-medium">{title}</p>
                    <p className="text-2xl font-bold text-neutral-800 mt-1">{value}</p>
                    {trend && (
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-600">{trend}</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
    if (branchesLoading) {
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
            <div className="p-6 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 min-h-screen">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                                Hospital Management Dashboard
                            </h1>
                            <p className="text-neutral-600 mt-1">Comprehensive analytics and staff management across all branches</p>
                        </div>

                        {/* Branch Selector */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border-2 border-teal-200 shadow-md hover:shadow-lg transition-all">
                                <Building2 className="w-5 h-5 text-teal-600" />
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => handleBranchChange(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-neutral-700 font-semibold cursor-pointer pr-8"
                                >
                                    <option value="all">All Branches</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.center_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => fetchStaffStats()}
                                className="p-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md"
                            >
                                <RefreshCw className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Selected Branch Indicator */}
                {selectedBranch !== 'all' && (
                    <div className="mb-6 bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <Building2 className="w-5 h-5 text-teal-600" />
                        <span className="text-teal-800 font-semibold">
                            Managing: {branches.find(b => b.id === selectedBranch)?.center_name || 'Selected Branch'}
                        </span>
                        <button
                            onClick={() => handleBranchChange('all')}
                            className="ml-auto text-sm text-teal-600 hover:text-teal-700 font-medium underline"
                        >
                            View All Branches
                        </button>
                    </div>
                )}

                {/* Financial Analytics */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                            <Wallet className="w-6 h-6 text-teal-600" />
                            Financial Overview
                        </h2>
                        <span className="text-sm text-neutral-500">Current Month</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-5 text-white shadow-lg col-span-1 md:col-span-2">
                            <div className="flex items-center justify-between mb-3">
                                <DollarSign className="w-8 h-8 opacity-80" />
                                <div className="flex items-center gap-1 text-white">
                                    <ArrowUpRight className="w-4 h-4" />
                                    <span className="text-sm font-medium">+8.5%</span>
                                </div>
                            </div>
                            <p className="text-white/80 text-sm mb-1">Monthly Payroll</p>
                            <p className="text-3xl font-bold">${(financialStats.monthlyPayroll / 1000).toFixed(0)}K</p>
                            <div className="mt-3 pt-3 border-t border-white/20">
                                <p className="text-xs text-white/70">Yearly Budget: ${(financialStats.yearlyBudget / 1000).toFixed(0)}K</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                                <Clock className="w-6 h-6 text-primary-500" />
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">+12%</span>
                            </div>
                            <p className="text-neutral-600 text-sm mb-1">Overtime Costs</p>
                            <p className="text-2xl font-bold text-neutral-800">${(financialStats.overtimeCosts / 1000).toFixed(1)}K</p>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-emerald-100">
                            <div className="flex items-center justify-between mb-2">
                                <Shield className="w-6 h-6 text-emerald-600" />
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Active</span>
                            </div>
                            <p className="text-neutral-600 text-sm mb-1">Benefits Costs</p>
                            <p className="text-2xl font-bold text-neutral-800">${(financialStats.benefitsCosts / 1000).toFixed(0)}K</p>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-purple-100">
                            <div className="flex items-center justify-between mb-2">
                                <Award className="w-6 h-6 text-purple-600" />
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Budget</span>
                            </div>
                            <p className="text-neutral-600 text-sm mb-1">Training Budget</p>
                            <p className="text-2xl font-bold text-neutral-800">${(financialStats.trainingBudget / 1000).toFixed(0)}K</p>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-green-100">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Good</span>
                            </div>
                            <p className="text-neutral-600 text-sm mb-1">Savings Rate</p>
                            <p className="text-2xl font-bold text-neutral-800">{financialStats.savingsRate}%</p>
                        </div>
                    </div>
                </div>

                {/* Management Performance */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                            <Activity className="w-6 h-6 text-primary-500" />
                            Management Performance
                        </h2>
                        <span className="text-sm text-neutral-500">Real-time Metrics</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-md">
                            <PieChart className="w-6 h-6 opacity-80 mb-2" />
                            <p className="text-xs opacity-80 mb-1">Active Projects</p>
                            <p className="text-3xl font-bold">{managementStats.activeProjects}</p>
                        </div>

                        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white shadow-md">
                            <ClipboardList className="w-6 h-6 opacity-80 mb-2" />
                            <p className="text-xs opacity-80 mb-1">Completed Tasks</p>
                            <p className="text-3xl font-bold">{managementStats.completedTasks}</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-md">
                            <Users className="w-6 h-6 opacity-80 mb-2" />
                            <p className="text-xs opacity-80 mb-1">Patient Satisfaction</p>
                            <p className="text-3xl font-bold">{managementStats.patientSatisfaction}%</p>
                        </div>

                        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-4 text-white shadow-md">
                            <UserCheck className="w-6 h-6 opacity-80 mb-2" />
                            <p className="text-xs opacity-80 mb-1">Staff Retention</p>
                            <p className="text-3xl font-bold">{managementStats.staffRetention}%</p>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-md">
                            <BarChart3 className="w-6 h-6 opacity-80 mb-2" />
                            <p className="text-xs opacity-80 mb-1">Dept. Efficiency</p>
                            <p className="text-3xl font-bold">{managementStats.departmentEfficiency}%</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-md">
                            <Shield className="w-6 h-6 opacity-80 mb-2" />
                            <p className="text-xs opacity-80 mb-1">Compliance Rate</p>
                            <p className="text-3xl font-bold">{managementStats.complianceRate}%</p>
                        </div>
                    </div>
                </div>

                {/* Staff Stats Overview */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
                        <Users className="w-6 h-6 text-teal-600" />
                        Staff Management Overview
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard
                            title="Total Staff"
                            value={stats.totalStaff}
                            icon={<Users className="w-5 h-5 text-white" />}
                            color="from-teal-500 to-cyan-600"
                            trend="+5% this month"
                        />
                        <StatCard
                            title="Active on Shift"
                            value={stats.activeOnShift}
                            icon={<UserCheck className="w-5 h-5 text-white" />}
                            color="from-emerald-500 to-teal-600"
                        />
                        <StatCard
                            title="On Leave"
                            value={stats.onLeave}
                            icon={<Clock className="w-5 h-5 text-white" />}
                            color="from-orange-400 to-orange-500"
                        />
                        <StatCard
                            title="Pending Approvals"
                            value={stats.pendingApprovals}
                            icon={<AlertCircle className="w-5 h-5 text-white" />}
                            color="from-red-400 to-red-500"
                        />
                        <StatCard
                            title="Upcoming Trainings"
                            value={stats.upcomingTrainings}
                            icon={<Award className="w-5 h-5 text-white" />}
                            color="from-purple-500 to-indigo-600"
                        />
                        <StatCard
                            title="Expiring Certs"
                            value={stats.expiringSoonCerts}
                            icon={<Shield className="w-5 h-5 text-white" />}
                            color="from-pink-400 to-pink-500"
                        />
                    </div>
                </div>

                {/* Module Cards */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-primary-500" />
                        Management Modules
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {staffModules.map((module) => (
                            <div
                                key={module.id}
                                onClick={() => handleModuleClick(module.path)}
                                className="bg-white rounded-xl shadow-md border-2 border-transparent hover:border-teal-300 p-6 cursor-pointer hover:shadow-xl transition-all group transform hover:-translate-y-1"
                            >
                                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${module.color} text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                                    {module.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-neutral-800 mb-2 group-hover:text-teal-600 transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-sm text-neutral-600 mb-4">
                                    {module.description}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                                    <div>
                                        <p className="text-xs text-neutral-500 font-medium">{module.stats.label}</p>
                                        <p className="text-lg font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">{module.stats.value}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-lg border-2 border-teal-100 p-6">
                    <h3 className="text-xl font-bold text-neutral-800 mb-5 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-teal-600" />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => handleModuleClick('/super-admin/staff/profiles')}
                            className="flex items-center gap-3 p-5 bg-gradient-to-br from-teal-50 to-cyan-100 rounded-xl hover:from-teal-100 hover:to-cyan-200 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <UserPlus className="w-7 h-7 text-teal-600" />
                            <span className="font-semibold text-teal-700">Add New Staff</span>
                        </button>
                        <button
                            onClick={() => handleModuleClick('/super-admin/staff/scheduling')}
                            className="flex items-center gap-3 p-5 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl hover:from-emerald-100 hover:to-teal-200 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <Calendar className="w-7 h-7 text-emerald-600" />
                            <span className="font-semibold text-emerald-700">View Schedules</span>
                        </button>
                        <button
                            onClick={() => handleModuleClick('/super-admin/staff/leave')}
                            className="flex items-center gap-3 p-5 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl hover:from-blue-100 hover:to-indigo-200 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <Clock className="w-7 h-7 text-primary-500" />
                            <span className="font-semibold text-blue-700">Pending Leaves</span>
                        </button>
                        <button
                            onClick={() => handleModuleClick('/super-admin/staff/reports')}
                            className="flex items-center gap-3 p-5 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl hover:from-purple-100 hover:to-indigo-200 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <BarChart3 className="w-7 h-7 text-purple-600" />
                            <span className="font-semibold text-purple-700">Generate Report</span>
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SuperAdminStaffDashboard;
