import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    BarChart3,
    ArrowLeft,
    Download,
    Calendar,
    Building2,
    Users,
    DollarSign,
    Clock,
    TrendingUp,
    RefreshCw,
    Activity,
    AlertCircle,
    Briefcase,
    UserMinus,
    UserPlus,
    CalendarDays,
    Loader2
} from 'lucide-react';

interface Branch {
    id: string;
    center_name: string;
    branch_name?: string;
}

interface DashboardData {
    workforce: {
        total_staff: number;
        total_payroll: number;
    };
    statutory: {
        epf_employee: number;
        epf_employer: number;
        etf_employer: number;
        total: number;
    };
    pending_actions: {
        leave_requests: number;
        salary_increments: number;
        letter_requests: number;
        open_complaints: number;
    };
}

interface WorkforceData {
    total_staff: number;
    by_role: Array<{ role: string; count: number }>;
    by_employment_type: Array<{ employment_type: string; count: number }>;
    by_branch: Array<{ branch_name: string; count: number }>;
    new_hires_this_month: number;
    tenure_distribution: {
        less_than_1_year: number;
        '1_to_3_years': number;
        '3_to_5_years': number;
        more_than_5_years: number;
    };
    epf_coverage: {
        enabled: number;
        percentage: number;
    };
}

interface PayrollData {
    total_monthly_payroll: number;
    statutory_contributions: {
        epf_employee: number;
        epf_employer: number;
        etf_employer: number;
        total: number;
    };
    salary_distribution: {
        below_50k: number;
        '50k_to_100k': number;
        '100k_to_150k': number;
        above_150k: number;
    };
    by_branch: Array<{ branch_name: string; total_salary: number; staff_count: number }>;
    avg_salary_by_role: Array<{ role: string; avg_salary: number; count: number }>;
}

interface LeaveData {
    year: string;
    by_type: Array<{ leave_type: string; count: number; total_days: number }>;
    by_month: Array<{ month: string; count: number }>;
    pending_count: number;
    approval_rate: number;
    avg_processing_days: number;
}

interface TurnoverData {
    year: string;
    new_hires: number;
    terminations: number;
    current_headcount: number;
    turnover_rate: number;
    hires_by_month: Array<{ month: string; count: number }>;
}

interface AttendanceData {
    month: string;
    summary: Array<{ status: string; count: number }>;
    average_work_hours: number;
    late_arrivals: number;
    total_overtime_hours: number;
    daily_trend: Array<{ day: string; total: number; present: number }>;
    message?: string;
}

interface OvertimeData {
    month: string;
    total_ot_hours: number;
    estimated_ot_cost: number;
    by_role: Array<{ role: string; total_hours: number; staff_count: number }>;
    top_earners: Array<{ id: string; first_name: string; last_name: string; employee_id: string; total_hours: number }>;
    daily_trend: Array<{ day: string; hours: number }>;
    message?: string;
}

const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
        return `Rs. ${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
        return `Rs. ${(amount / 1000).toFixed(1)}K`;
    }
    return `Rs. ${amount.toLocaleString()}`;
};

const formatRole = (role: string | null | undefined): string => {
    if (!role || typeof role !== 'string') return 'N/A';
    return role
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const getMonthName = (monthNum: string): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[parseInt(monthNum) - 1] || monthNum;
};

const HRMReports: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>(
        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    );
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [workforceData, setWorkforceData] = useState<WorkforceData | null>(null);
    const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
    const [leaveData, setLeaveData] = useState<LeaveData | null>(null);
    const [turnoverData, setTurnoverData] = useState<TurnoverData | null>(null);
    const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
    const [, setOvertimeData] = useState<OvertimeData | null>(null);

    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchBranches();
        fetchAllData();
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [selectedBranch, selectedYear, selectedMonth]);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/hrm/super-admin/salary-structures/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                setBranches(response.data.branches || []);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchAllData = async () => {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const branchParam = selectedBranch ? `branch_id=${selectedBranch}` : '';

        try {
            const [dashboard, workforce, payroll, leave, turnover, attendance, overtime] = await Promise.all([
                axios.get(`/api/hrm/super-admin/analytics/dashboard?${branchParam}`, { headers }).catch(() => null),
                axios.get(`/api/hrm/super-admin/analytics/workforce?${branchParam}`, { headers }).catch(() => null),
                axios.get(`/api/hrm/super-admin/analytics/payroll?year=${selectedYear}&${branchParam}`, { headers }).catch(() => null),
                axios.get(`/api/hrm/super-admin/analytics/leave?year=${selectedYear}&${branchParam}`, { headers }).catch(() => null),
                axios.get(`/api/hrm/super-admin/analytics/turnover?year=${selectedYear}&${branchParam}`, { headers }).catch(() => null),
                axios.get(`/api/hrm/super-admin/analytics/attendance?month=${selectedMonth}&${branchParam}`, { headers }).catch(() => null),
                axios.get(`/api/hrm/super-admin/analytics/overtime?month=${selectedMonth}&${branchParam}`, { headers }).catch(() => null)
            ]);

            if (dashboard?.data?.data) setDashboardData(dashboard.data.data);
            if (workforce?.data?.data) setWorkforceData(workforce.data.data);
            if (payroll?.data?.data) setPayrollData(payroll.data.data);
            if (leave?.data?.data) setLeaveData(leave.data.data);
            if (turnover?.data?.data) setTurnoverData(turnover.data.data);
            if (attendance?.data?.data) setAttendanceData(attendance.data.data);
            if (overtime?.data?.data) setOvertimeData(overtime.data.data);
        } catch (err) {
            setError('Failed to fetch some analytics data');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const exportToCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const exportPayrollReport = () => {
        if (!payrollData) return;
        const data = payrollData.by_branch.map(b => ({
            Branch: b.branch_name,
            'Staff Count': b.staff_count,
            'Total Salary': b.total_salary,
            'Avg Salary': Math.round(b.total_salary / b.staff_count)
        }));
        exportToCSV(data, 'payroll_by_branch');
    };

    const exportWorkforceReport = () => {
        if (!workforceData) return;
        const data = workforceData.by_role.map(r => ({
            Role: formatRole(r.role),
            Count: r.count
        }));
        exportToCSV(data, 'workforce_by_role');
    };

    const exportLeaveReport = () => {
        if (!leaveData) return;
        const data = leaveData.by_type.map(l => ({
            'Leave Type': l.leave_type,
            'Request Count': l.count,
            'Total Days': l.total_days
        }));
        exportToCSV(data, 'leave_summary');
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'workforce', label: 'Workforce', icon: Users },
        { id: 'payroll', label: 'Payroll', icon: DollarSign },
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'leave', label: 'Leave', icon: CalendarDays },
        { id: 'turnover', label: 'Turnover', icon: TrendingUp }
    ];

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
    const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(parseInt(selectedYear), i, 1);
        return {
            value: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
            label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/super-admin/hrm')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">HR Analytics & Reports</h1>
                                <p className="text-sm text-gray-500">Comprehensive HR insights and export capabilities</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={fetchAllData}
                                disabled={isLoading}
                                className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Branches</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.center_name || branch.branch_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {months.map(month => (
                                    <option key={month.value} value={month.value}>{month.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-1 bg-white rounded-xl shadow-sm border p-1 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                        <span className="text-red-700">{error}</span>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" ref={reportRef}>
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Quick Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                                        <div className="flex items-center justify-between">
                                            <Users className="w-8 h-8 opacity-80" />
                                            <span className="text-blue-200 text-xs">Total Staff</span>
                                        </div>
                                        <p className="text-3xl font-bold mt-2">{dashboardData?.workforce?.total_staff || 0}</p>
                                        <p className="text-blue-200 text-xs mt-1">Across all branches</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
                                        <div className="flex items-center justify-between">
                                            <DollarSign className="w-8 h-8 opacity-80" />
                                            <span className="text-emerald-200 text-xs">Monthly Payroll</span>
                                        </div>
                                        <p className="text-3xl font-bold mt-2">
                                            {formatCurrency(dashboardData?.workforce?.total_payroll || 0)}
                                        </p>
                                        <p className="text-emerald-200 text-xs mt-1">This month</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                                        <div className="flex items-center justify-between">
                                            <Briefcase className="w-8 h-8 opacity-80" />
                                            <span className="text-purple-200 text-xs">EPF/ETF</span>
                                        </div>
                                        <p className="text-3xl font-bold mt-2">
                                            {formatCurrency(dashboardData?.statutory?.total || 0)}
                                        </p>
                                        <p className="text-purple-200 text-xs mt-1">Total contributions</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
                                        <div className="flex items-center justify-between">
                                            <Activity className="w-8 h-8 opacity-80" />
                                            <span className="text-orange-200 text-xs">Pending Actions</span>
                                        </div>
                                        <p className="text-3xl font-bold mt-2">
                                            {(dashboardData?.pending_actions?.leave_requests || 0) +
                                             (dashboardData?.pending_actions?.salary_increments || 0) +
                                             (dashboardData?.pending_actions?.letter_requests || 0)}
                                        </p>
                                        <p className="text-orange-200 text-xs mt-1">Requires attention</p>
                                    </div>
                                </div>

                                {/* Pending Actions Breakdown */}
                                {dashboardData?.pending_actions && (
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Actions</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-4 bg-yellow-50 rounded-lg">
                                                <p className="text-yellow-600 text-sm">Leave Requests</p>
                                                <p className="text-2xl font-bold text-yellow-700">{dashboardData.pending_actions.leave_requests}</p>
                                            </div>
                                            <div className="p-4 bg-blue-50 rounded-lg">
                                                <p className="text-blue-600 text-sm">Salary Increments</p>
                                                <p className="text-2xl font-bold text-blue-700">{dashboardData.pending_actions.salary_increments}</p>
                                            </div>
                                            <div className="p-4 bg-purple-50 rounded-lg">
                                                <p className="text-purple-600 text-sm">Letter Requests</p>
                                                <p className="text-2xl font-bold text-purple-700">{dashboardData.pending_actions.letter_requests}</p>
                                            </div>
                                            <div className="p-4 bg-red-50 rounded-lg">
                                                <p className="text-red-600 text-sm">Open Complaints</p>
                                                <p className="text-2xl font-bold text-red-700">{dashboardData.pending_actions.open_complaints}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Quick Reports Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Workforce by Role */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Staff by Role</h3>
                                            <button
                                                onClick={exportWorkforceReport}
                                                className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm flex items-center"
                                            >
                                                <Download className="w-4 h-4 mr-1" /> Export
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {workforceData?.by_role?.slice(0, 6).map((item, index) => (
                                                <div key={index} className="flex items-center justify-between">
                                                    <span className="text-gray-600">{formatRole(item.role)}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500 rounded-full"
                                                                style={{ width: `${(item.count / (workforceData?.total_staff || 1)) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-gray-900 font-medium w-8 text-right">{item.count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payroll by Branch */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Payroll by Branch</h3>
                                            <button
                                                onClick={exportPayrollReport}
                                                className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm flex items-center"
                                            >
                                                <Download className="w-4 h-4 mr-1" /> Export
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {payrollData?.by_branch?.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{item.branch_name}</p>
                                                        <p className="text-sm text-gray-500">{item.staff_count} staff</p>
                                                    </div>
                                                    <p className="font-semibold text-emerald-600">{formatCurrency(item.total_salary)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Workforce Tab */}
                        {activeTab === 'workforce' && workforceData && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">Total Employees</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{workforceData.total_staff}</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">New Hires (This Month)</p>
                                        <p className="text-3xl font-bold text-green-600 mt-1">{workforceData.new_hires_this_month}</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">EPF Coverage</p>
                                        <p className="text-3xl font-bold text-blue-600 mt-1">{workforceData.epf_coverage?.percentage}%</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">5+ Years Service</p>
                                        <p className="text-3xl font-bold text-purple-600 mt-1">{workforceData.tenure_distribution?.more_than_5_years || 0}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* By Role */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Headcount by Role</h3>
                                            <button onClick={exportWorkforceReport} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm flex items-center">
                                                <Download className="w-4 h-4 mr-1" /> Export
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {workforceData.by_role?.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                                                    <span className="text-gray-700">{formatRole(item.role)}</span>
                                                    <span className="font-medium">{item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tenure Distribution */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenure Distribution</h3>
                                        <div className="space-y-4">
                                            {[
                                                { label: '< 1 Year', value: workforceData.tenure_distribution?.less_than_1_year || 0, color: 'bg-blue-500' },
                                                { label: '1-3 Years', value: workforceData.tenure_distribution?.['1_to_3_years'] || 0, color: 'bg-green-500' },
                                                { label: '3-5 Years', value: workforceData.tenure_distribution?.['3_to_5_years'] || 0, color: 'bg-yellow-500' },
                                                { label: '5+ Years', value: workforceData.tenure_distribution?.more_than_5_years || 0, color: 'bg-purple-500' }
                                            ].map((item, idx) => (
                                                <div key={idx}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-gray-600">{item.label}</span>
                                                        <span className="font-medium">{item.value}</span>
                                                    </div>
                                                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${item.color} rounded-full`}
                                                            style={{ width: `${(item.value / (workforceData.total_staff || 1)) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* By Branch */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Headcount by Branch</h3>
                                        <div className="space-y-2">
                                            {workforceData.by_branch?.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                                                    <span className="text-gray-700">{item.branch_name}</span>
                                                    <span className="font-medium">{item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* By Employment Type */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Type</h3>
                                        <div className="space-y-2">
                                            {workforceData.by_employment_type?.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                                                    <span className="text-gray-700">{formatRole(item.employment_type || 'Not Specified')}</span>
                                                    <span className="font-medium">{item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payroll Tab */}
                        {activeTab === 'payroll' && payrollData && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">Total Monthly Payroll</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(payrollData.total_monthly_payroll)}</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">EPF (Employee 8%)</p>
                                        <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(payrollData.statutory_contributions?.epf_employee || 0)}</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">EPF (Employer 12%)</p>
                                        <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(payrollData.statutory_contributions?.epf_employer || 0)}</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">ETF (Employer 3%)</p>
                                        <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(payrollData.statutory_contributions?.etf_employer || 0)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Salary Distribution */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Distribution</h3>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Below Rs. 50K', value: payrollData.salary_distribution?.below_50k || 0, color: 'bg-red-500' },
                                                { label: 'Rs. 50K - 100K', value: payrollData.salary_distribution?.['50k_to_100k'] || 0, color: 'bg-yellow-500' },
                                                { label: 'Rs. 100K - 150K', value: payrollData.salary_distribution?.['100k_to_150k'] || 0, color: 'bg-blue-500' },
                                                { label: 'Above Rs. 150K', value: payrollData.salary_distribution?.above_150k || 0, color: 'bg-green-500' }
                                            ].map((item, idx) => {
                                                const total = Object.values(payrollData.salary_distribution || {}).reduce((a, b) => a + b, 0);
                                                return (
                                                    <div key={idx}>
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-gray-600">{item.label}</span>
                                                            <span className="font-medium">{item.value} staff</span>
                                                        </div>
                                                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${item.color} rounded-full`}
                                                                style={{ width: `${(item.value / (total || 1)) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Average Salary by Role */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Average Salary by Role</h3>
                                        </div>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {payrollData.avg_salary_by_role?.sort((a, b) => b.avg_salary - a.avg_salary).map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                                                    <div>
                                                        <span className="text-gray-700">{formatRole(item.role)}</span>
                                                        <span className="text-gray-400 text-sm ml-2">({item.count})</span>
                                                    </div>
                                                    <span className="font-medium text-green-600">{formatCurrency(Math.round(item.avg_salary))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* By Branch */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6 md:col-span-2">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Payroll by Branch</h3>
                                            <button onClick={exportPayrollReport} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm flex items-center">
                                                <Download className="w-4 h-4 mr-1" /> Export CSV
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="text-left py-3 px-4 text-gray-600 font-medium">Branch</th>
                                                        <th className="text-right py-3 px-4 text-gray-600 font-medium">Staff Count</th>
                                                        <th className="text-right py-3 px-4 text-gray-600 font-medium">Total Salary</th>
                                                        <th className="text-right py-3 px-4 text-gray-600 font-medium">Avg Salary</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {payrollData.by_branch?.map((item, idx) => (
                                                        <tr key={idx} className="border-t">
                                                            <td className="py-3 px-4 font-medium">{item.branch_name}</td>
                                                            <td className="py-3 px-4 text-right">{item.staff_count}</td>
                                                            <td className="py-3 px-4 text-right text-green-600 font-medium">{formatCurrency(item.total_salary)}</td>
                                                            <td className="py-3 px-4 text-right">{formatCurrency(Math.round(item.total_salary / item.staff_count))}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Attendance Tab */}
                        {activeTab === 'attendance' && (
                            <div className="space-y-6">
                                {attendanceData?.message ? (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                                        <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                                        <p className="text-yellow-700">{attendanceData.message}</p>
                                        <p className="text-yellow-600 text-sm mt-2">Attendance tracking module needs to be set up first</p>
                                    </div>
                                ) : attendanceData ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="bg-white rounded-xl shadow-sm border p-5">
                                                <p className="text-gray-500 text-sm">Average Work Hours</p>
                                                <p className="text-3xl font-bold text-gray-900 mt-1">{attendanceData.average_work_hours}h</p>
                                            </div>
                                            <div className="bg-white rounded-xl shadow-sm border p-5">
                                                <p className="text-gray-500 text-sm">Late Arrivals</p>
                                                <p className="text-3xl font-bold text-orange-600 mt-1">{attendanceData.late_arrivals}</p>
                                            </div>
                                            <div className="bg-white rounded-xl shadow-sm border p-5">
                                                <p className="text-gray-500 text-sm">Total OT Hours</p>
                                                <p className="text-3xl font-bold text-blue-600 mt-1">{attendanceData.total_overtime_hours}h</p>
                                            </div>
                                            <div className="bg-white rounded-xl shadow-sm border p-5">
                                                <p className="text-gray-500 text-sm">Month</p>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">{attendanceData.month}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl shadow-sm border p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {attendanceData.summary?.map((item, idx) => (
                                                    <div key={idx} className="p-4 bg-gray-50 rounded-lg text-center">
                                                        <p className="text-gray-600 capitalize">{item.status}</p>
                                                        <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                                        <p className="text-gray-500">No attendance data available</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Leave Tab */}
                        {activeTab === 'leave' && leaveData && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">Pending Requests</p>
                                        <p className="text-3xl font-bold text-yellow-600 mt-1">{leaveData.pending_count}</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">Approval Rate</p>
                                        <p className="text-3xl font-bold text-green-600 mt-1">{leaveData.approval_rate}%</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">Avg Processing Time</p>
                                        <p className="text-3xl font-bold text-blue-600 mt-1">{leaveData.avg_processing_days} days</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">Year</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{leaveData.year}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Leave by Type */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Leave by Type</h3>
                                            <button onClick={exportLeaveReport} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm flex items-center">
                                                <Download className="w-4 h-4 mr-1" /> Export
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {leaveData.by_type?.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                                                    <span className="text-gray-700 capitalize">{item.leave_type}</span>
                                                    <div className="text-right">
                                                        <span className="font-medium">{item.count} requests</span>
                                                        <span className="text-gray-400 text-sm ml-2">({item.total_days} days)</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Leave by Month */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Requests by Month</h3>
                                        <div className="space-y-3">
                                            {leaveData.by_month?.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <span className="text-gray-600">{getMonthName(item.month)}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500 rounded-full"
                                                                style={{ width: `${Math.min((item.count / 20) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-gray-900 font-medium w-8 text-right">{item.count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Turnover Tab */}
                        {activeTab === 'turnover' && turnoverData && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <div className="flex items-center gap-2">
                                            <UserPlus className="w-5 h-5 text-green-500" />
                                            <p className="text-gray-500 text-sm">New Hires</p>
                                        </div>
                                        <p className="text-3xl font-bold text-green-600 mt-1">{turnoverData.new_hires}</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <div className="flex items-center gap-2">
                                            <UserMinus className="w-5 h-5 text-red-500" />
                                            <p className="text-gray-500 text-sm">Terminations</p>
                                        </div>
                                        <p className="text-3xl font-bold text-red-600 mt-1">{turnoverData.terminations}</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">Current Headcount</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{turnoverData.current_headcount}</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border p-5">
                                        <p className="text-gray-500 text-sm">Turnover Rate</p>
                                        <p className={`text-3xl font-bold mt-1 ${turnoverData.turnover_rate > 15 ? 'text-red-600' : 'text-green-600'}`}>
                                            {turnoverData.turnover_rate}%
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiring Trend ({turnoverData.year})</h3>
                                    <div className="space-y-3">
                                        {turnoverData.hires_by_month?.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <span className="text-gray-600">{getMonthName(item.month)}</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded-full"
                                                            style={{ width: `${Math.min((item.count / 10) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-gray-900 font-medium w-8 text-right">{item.count}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default HRMReports;
