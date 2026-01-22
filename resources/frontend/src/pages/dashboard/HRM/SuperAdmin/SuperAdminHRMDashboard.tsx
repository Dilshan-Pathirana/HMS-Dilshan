import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Building2,
    Users,
    DollarSign,
    FileText,
    Shield,
    Settings,
    TrendingUp,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    BarChart3,
    Briefcase,
    CreditCard,
    FileCheck,
    Loader2,
    Menu,
    X,
    LogOut,
    User,
    Bell
} from 'lucide-react';

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
            const response = await axios.get('/api/hrm/super-admin/stats', {
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

    const sidebarItems = [
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

    const QuickStatCard = ({ title, value, icon, color, isLoading }: {
        title: string;
        value: string | number;
        icon: React.ReactNode;
        color: string;
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
                                <p className="text-xs text-gray-500">Super Admin</p>
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
                                <h1 className="text-xl font-bold text-gray-800">HRM Dashboard</h1>
                                <p className="text-sm text-gray-500">Human Resource Management - System Wide</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                                <Bell className="w-5 h-5 text-gray-600" />
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Super Admin</span>
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
                            title="Active Branches"
                            value={stats.branchOverview?.length || 0}
                            icon={<Building2 className="w-6 h-6 text-white" />}
                            color="from-emerald-500 to-emerald-600"
                            isLoading={isLoading}
                        />
                        <QuickStatCard
                            title="Monthly Payroll"
                            value={`LKR ${stats.totalPayroll?.toLocaleString() || 0}`}
                            icon={<DollarSign className="w-6 h-6 text-white" />}
                            color="from-purple-500 to-purple-600"
                            isLoading={isLoading}
                        />
                        <QuickStatCard
                            title="Pending Leave Requests"
                            value={stats.pendingLeaves}
                            icon={<Calendar className="w-6 h-6 text-white" />}
                            color="from-orange-500 to-orange-600"
                            isLoading={isLoading}
                        />
                    </div>

                    {/* EPF/ETF Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">EPF Contributions (This Month)</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Employee (8%)</span>
                                    <span className="font-semibold text-gray-800">
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `LKR ${stats.epfEtf?.epfEmployee?.toLocaleString() || 0}`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Employer (12%)</span>
                                    <span className="font-semibold text-gray-800">
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `LKR ${stats.epfEtf?.epfEmployer?.toLocaleString() || 0}`}
                                    </span>
                                </div>
                                <div className="border-t pt-3 flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Total EPF</span>
                                    <span className="font-bold text-blue-600">
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `LKR ${((stats.epfEtf?.epfEmployee || 0) + (stats.epfEtf?.epfEmployer || 0)).toLocaleString()}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <Shield className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">ETF Contributions (This Month)</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Employer (3%)</span>
                                    <span className="font-semibold text-gray-800">
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `LKR ${stats.epfEtf?.etfEmployer?.toLocaleString() || 0}`}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 mt-2">
                                    <p>* ETF is employer-only contribution</p>
                                    <p>* Applicable to EPF-enabled employees</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HRM Modules Grid */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">HRM Configuration Modules</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {hrmModules.map((module) => (
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
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{module.description}</p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">
                                            {module.stats.label}: <span className="text-emerald-600">{module.stats.value}</span>
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Branch Overview Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Branch HR Overview</h2>
                            <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                View All Branches
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Branch</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employees</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Payroll Cost</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">EPF/ETF</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                                            </td>
                                        </tr>
                                    ) : stats.branchOverview && stats.branchOverview.length > 0 ? (
                                        stats.branchOverview.map((branch, index) => {
                                            const colors = ['blue', 'purple', 'emerald', 'orange', 'pink'];
                                            const color = colors[index % colors.length];
                                            return (
                                                <tr key={branch.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                                                                <Building2 className={`w-4 h-4 text-${color}-600`} />
                                                            </div>
                                                            <span className="font-medium text-gray-800">{branch.branch_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-600">{branch.staff_count}</td>
                                                    <td className="py-3 px-4 text-gray-600">-</td>
                                                    <td className="py-3 px-4 text-gray-600">-</td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                                            Active
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">
                                                No branches found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SuperAdminHRMDashboard;
