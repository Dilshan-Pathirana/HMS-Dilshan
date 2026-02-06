import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../../../utils/api/axios";
import {
    Building2, Users, DollarSign, FileText, Shield,
    Settings, Calendar, Clock, BarChart3, Briefcase,
    CreditCard, FileCheck, Loader2
} from 'lucide-react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../../components/common/Layout/SidebarMenu';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { StatCard } from '../../../../components/ui/StatCard';

interface HRMStats {
    totalStaff: number;
    activeStaff: number;
    totalPayroll: number;
    pendingLeaves: number;
    overtime: {
        hours: number;
        amount: number;
    };
    epfEtf: {
        epfEmployee: number;
        epfEmployer: number;
        etfEmployer: number;
        totalContributions: number;
    };
    branchOverview: Array<{
        id: string;
        branch_name: string;
        staff_count: number;
    }>;
}

const SuperAdminHRMDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [stats, setStats] = useState<HRMStats>({
        totalStaff: 0,
        activeStaff: 0,
        totalPayroll: 0,
        pendingLeaves: 0,
        overtime: { hours: 0, amount: 0 },
        epfEtf: { epfEmployee: 0, epfEmployer: 0, etfEmployer: 0, totalContributions: 0 },
        branchOverview: []
    });

    useEffect(() => {
        fetchHRMStats();
    }, []);

    const fetchHRMStats = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get('/hrm/super-admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching HRM stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const hrmModules = [
        {
            id: 'policies',
            title: 'HR Policies',
            description: 'Define system-wide HR policies, employment rules, and compliance guidelines.',
            icon: <FileText className="w-8 h-8" />,
            path: '/super-admin/hrm/policies',
            color: 'from-blue-500 to-blue-600',
            stats: { label: 'Active Policies', value: 12 }
        },
        {
            id: 'salary-structures',
            title: 'Salary Structures',
            description: 'Configure salary grades, allowances, increments, and pay scales.',
            icon: <DollarSign className="w-8 h-8" />,
            path: '/super-admin/hrm/salary-structures',
            color: 'from-emerald-500 to-emerald-600',
            stats: { label: 'Pay Grades', value: 8 }
        },
        {
            id: 'epf-etf',
            title: 'EPF / ETF Configuration',
            description: 'Configure Sri Lanka EPF (8%/12%) and ETF (3%) statutory contributions.',
            icon: <Shield className="w-8 h-8" />,
            path: '/super-admin/hrm/epf-etf',
            color: 'from-purple-500 to-purple-600',
            stats: { label: 'Configured', value: '✓' }
        },
        {
            id: 'leave-types',
            title: 'Leave Types',
            description: 'Define leave types, annual quotas, and carry-forward rules.',
            icon: <Calendar className="w-8 h-8" />,
            path: '/super-admin/hrm/leave-types',
            color: 'from-orange-500 to-orange-600',
            stats: { label: 'Leave Types', value: 5 }
        },
        {
            id: 'shift-templates',
            title: 'Shift Templates',
            description: 'Create standard shift definitions (Morning, Night, OPD, etc.).',
            icon: <Clock className="w-8 h-8" />,
            path: '/super-admin/hrm/shift-templates',
            color: 'from-cyan-500 to-cyan-600',
            stats: { label: 'Templates', value: 6 }
        },
        {
            id: 'payroll-config',
            title: 'Payroll Configuration',
            description: 'Configure payroll components, deductions, and calculation rules.',
            icon: <CreditCard className="w-8 h-8" />,
            path: '/super-admin/hrm/payroll-config',
            color: 'from-pink-500 to-pink-600',
            stats: { label: 'Components', value: 10 }
        },
        {
            id: 'payroll-management',
            title: 'Payroll Management',
            description: 'View and manage staff payroll, generate payslips, and monitor salary payments.',
            icon: <DollarSign className="w-8 h-8" />,
            path: '/super-admin/hrm/payroll',
            color: 'from-emerald-500 to-emerald-600',
            stats: { label: 'Staff', value: 0 }
        },
        {
            id: 'reports',
            title: 'HR Analytics & Reports',
            description: 'View system-wide HR analytics, payroll costs, and compliance reports.',
            icon: <BarChart3 className="w-8 h-8" />,
            path: '/super-admin/hrm/reports',
            color: 'from-indigo-500 to-indigo-600',
            stats: { label: 'Reports', value: 15 }
        },
        {
            id: 'audit-logs',
            title: 'HR Audit Logs',
            description: 'View audit trails for salary changes, approvals, and HR actions.',
            icon: <FileCheck className="w-8 h-8" />,
            path: '/super-admin/hrm/audit-logs',
            color: 'from-red-500 to-red-600',
            stats: { label: 'This Month', value: 245 }
        }
    ];

    const hrmMenuItems = [
        { label: 'Dashboard', path: '/super-admin/hrm', icon: <Building2 className="w-5 h-5" /> },
        { label: 'HR Policies', path: '/super-admin/hrm/policies', icon: <FileText className="w-5 h-5" /> },
        { label: 'Salary Structures', path: '/super-admin/hrm/salary-structures', icon: <DollarSign className="w-5 h-5" /> },
        { label: 'EPF/ETF Config', path: '/super-admin/hrm/epf-etf', icon: <Shield className="w-5 h-5" /> },
        { label: 'Leave Types', path: '/super-admin/hrm/leave-types', icon: <Calendar className="w-5 h-5" /> },
        { label: 'Shift Templates', path: '/super-admin/hrm/shift-templates', icon: <Clock className="w-5 h-5" /> },
        { label: 'Payroll Config', path: '/super-admin/hrm/payroll-config', icon: <CreditCard className="w-5 h-5" /> },
        { label: 'Payroll Management', path: '/super-admin/hrm/payroll', icon: <DollarSign className="w-5 h-5" /> },
        { label: 'Analytics', path: '/super-admin/hrm/reports', icon: <BarChart3 className="w-5 h-5" /> },
        { label: 'Audit Logs', path: '/super-admin/hrm/audit-logs', icon: <FileCheck className="w-5 h-5" /> },
    ];

    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = `${userInfo.first_name || ''} ${userInfo.last_name || ''}`;
    const userRole = 'Super Admin';

    return (
        <DashboardLayout
            userName={userName}
            userRole={userRole}
            profileImage={userInfo.profile_picture || ''}
            sidebarContent={<SidebarMenu items={hrmMenuItems} />}
        >
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    title="HRM Dashboard"
                    description="Human Resource Management - System Wide"
                    actions={
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-sm">
                            <Briefcase className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-neutral-700">HRM Module</span>
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
                        title="Active Branches"
                        value={stats.branchOverview?.length || 0}
                        icon={Building2}
                    />
                    <StatCard
                        title="Monthly Payroll"
                        value={`LKR ${stats.totalPayroll?.toLocaleString() || 0}`}
                        icon={DollarSign}
                    />
                    <StatCard
                        title="Pending Leave Requests"
                        value={stats.pendingLeaves}
                        icon={Calendar}
                    />
                </div>

                {/* EPF/ETF Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                                <Shield className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-neutral-900">EPF Contributions (This Month)</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                                <span className="text-neutral-600 font-medium">Employee (8%)</span>
                                <span className="font-bold text-neutral-900">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `LKR ${stats.epfEtf?.epfEmployee?.toLocaleString() || 0}`}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                                <span className="text-neutral-600 font-medium">Employer (12%)</span>
                                <span className="font-bold text-neutral-900">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `LKR ${stats.epfEtf?.epfEmployer?.toLocaleString() || 0}`}
                                </span>
                            </div>
                            <div className="border-t border-neutral-100 pt-4 flex justify-between items-center">
                                <span className="font-bold text-neutral-700">Total EPF</span>
                                <span className="font-bold text-blue-600 text-lg">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `LKR ${((stats.epfEtf?.epfEmployee || 0) + (stats.epfEtf?.epfEmployer || 0)).toLocaleString()}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                                <Shield className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-neutral-900">ETF Contributions (This Month)</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                                <span className="text-neutral-600 font-medium">Employer (3%)</span>
                                <span className="font-bold text-neutral-900">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `LKR ${stats.epfEtf?.etfEmployer?.toLocaleString() || 0}`}
                                </span>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                <p className="text-sm text-yellow-800 font-medium">* ETF is employer-only contribution</p>
                                <p className="text-sm text-yellow-700 mt-1">* Applicable to all EPF-enabled employees</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HRM Configuration Modules */}
                <div>
                    <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-neutral-500" />
                        Configuration Modules
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {hrmModules.map((module) => (
                            <div
                                key={module.id}
                                onClick={() => navigate(module.path)}
                                className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className="relative z-10">
                                    <div className={`p-3 rounded-lg bg-gradient-to-br ${module.color} text-white w-fit mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                                        {module.icon}
                                    </div>
                                    <h3 className="font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                                        {module.title}
                                    </h3>
                                    <p className="text-sm text-neutral-500 mt-2 line-clamp-2 h-10">{module.description}</p>
                                    <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                            {module.stats.label}
                                        </span>
                                        <span className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs font-bold group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                                            {module.stats.value}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Branch Overview Table */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-neutral-900">Branch HR Overview</h2>
                        <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline">
                            View All Branches
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Branch</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Employees</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Payroll Cost</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">EPF/ETF</th>
                                    <th className="text-right py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-300" />
                                        </td>
                                    </tr>
                                ) : stats.branchOverview && stats.branchOverview.length > 0 ? (
                                    stats.branchOverview.map((branch, index) => {
                                        const colors = ['blue', 'purple', 'emerald', 'orange', 'pink'];
                                        const color = colors[index % colors.length];
                                        return (
                                            <tr key={branch.id} className="group hover:bg-neutral-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 bg-${color}-50 rounded-lg flex items-center justify-center border border-${color}-100`}>
                                                            <Building2 className={`w-5 h-5 text-${color}-600`} />
                                                        </div>
                                                        <span className="font-semibold text-neutral-900">{branch.branch_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-neutral-400" />
                                                        <span className="text-neutral-700 font-medium">{branch.staff_count}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-neutral-500 font-mono">-</td>
                                                <td className="py-4 px-6 text-neutral-500 font-mono">-</td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        Active
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-neutral-500">
                                            No branches found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SuperAdminHRMDashboard;
