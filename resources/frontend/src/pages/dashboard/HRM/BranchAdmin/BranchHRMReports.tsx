import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, BarChart3, PieChart, TrendingUp, Users, Calendar, 
    Clock, DollarSign, FileText, Download, Loader2, RefreshCw,
    UserCheck, UserX, AlertCircle
} from 'lucide-react';
import axios from 'axios';

interface AnalyticsData {
    workforce: {
        total: number;
        byRole: Record<string, number>;
        byStatus: Record<string, number>;
        turnoverRate: number;
        avgTenure: number;
    };
    attendance: {
        presentRate: number;
        absentRate: number;
        lateRate: number;
        monthlyTrend: { month: string; rate: number }[];
    };
    leave: {
        totalTaken: number;
        byType: Record<string, number>;
        pendingRequests: number;
        approvalRate: number;
    };
    overtime: {
        totalHours: number;
        totalCost: number;
        byDepartment: Record<string, number>;
        monthlyTrend: { month: string; hours: number }[];
    };
}

const BranchHRMReports: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'workforce' | 'attendance' | 'leave' | 'overtime' | 'payroll'>('workforce');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [branchName, setBranchName] = useState<string>('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        workforce: { total: 0, byRole: {}, byStatus: {}, turnoverRate: 0, avgTenure: 0 },
        attendance: { presentRate: 0, absentRate: 0, lateRate: 0, monthlyTrend: [] },
        leave: { totalTaken: 0, byType: {}, pendingRequests: 0, approvalRate: 0 },
        overtime: { totalHours: 0, totalCost: 0, byDepartment: {}, monthlyTrend: [] }
    });

    // Set default date range
    useEffect(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setDateRange({
            start: startOfMonth.toISOString().split('T')[0],
            end: endOfMonth.toISOString().split('T')[0]
        });
        
        // Get branch name from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setBranchName(user.branch?.name || 'Your Branch');
        }
    }, []);

    useEffect(() => {
        if (dateRange.start && dateRange.end) {
            fetchAnalytics();
        }
    }, [activeTab, dateRange]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const params = { start_date: dateRange.start, end_date: dateRange.end };
            
            let endpoint = '';
            switch (activeTab) {
                case 'workforce': endpoint = '/api/hrm/branch-admin/analytics/workforce'; break;
                case 'attendance': endpoint = '/api/hrm/branch-admin/analytics/attendance'; break;
                case 'leave': endpoint = '/api/hrm/branch-admin/analytics/leave'; break;
                case 'overtime': endpoint = '/api/hrm/branch-admin/analytics/overtime'; break;
                case 'payroll': endpoint = '/api/hrm/branch-admin/payroll'; break;
            }

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            if (response.data.status === 'success') {
                const data = response.data.data;
                setAnalytics(prev => ({
                    ...prev,
                    [activeTab]: data
                }));
            }
        } catch (err: any) {
            console.error('Error fetching analytics:', err);
            setError(err.response?.data?.message || 'Failed to fetch analytics data');
        } finally {
            setIsLoading(false);
        }
    };

    const formatRole = (role: string) => {
        if (!role) return 'N/A';
        return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const tabs = [
        { id: 'workforce', label: 'Workforce', icon: <Users className="w-4 h-4" /> },
        { id: 'attendance', label: 'Attendance', icon: <UserCheck className="w-4 h-4" /> },
        { id: 'leave', label: 'Leave', icon: <Calendar className="w-4 h-4" /> },
        { id: 'overtime', label: 'Overtime', icon: <Clock className="w-4 h-4" /> },
        { id: 'payroll', label: 'Payroll', icon: <DollarSign className="w-4 h-4" /> }
    ];

    const StatCard = ({ title, value, icon, color, subtitle }: { 
        title: string; value: string | number; icon: React.ReactNode; color: string; subtitle?: string 
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    const renderWorkforceAnalytics = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Staff" 
                    value={analytics.workforce.total} 
                    icon={<Users className="w-6 h-6 text-white" />}
                    color="from-blue-500 to-blue-600"
                />
                <StatCard 
                    title="Active" 
                    value={analytics.workforce.byStatus?.active || 0} 
                    icon={<UserCheck className="w-6 h-6 text-white" />}
                    color="from-emerald-500 to-emerald-600"
                />
                <StatCard 
                    title="On Leave" 
                    value={analytics.workforce.byStatus?.on_leave || 0} 
                    icon={<Calendar className="w-6 h-6 text-white" />}
                    color="from-orange-500 to-orange-600"
                />
                <StatCard 
                    title="Avg Tenure" 
                    value={`${analytics.workforce.avgTenure || 0} yrs`} 
                    icon={<TrendingUp className="w-6 h-6 text-white" />}
                    color="from-purple-500 to-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Staff by Role</h3>
                    <div className="space-y-3">
                        {Object.entries(analytics.workforce.byRole || {}).map(([role, count]) => (
                            <div key={role} className="flex items-center justify-between">
                                <span className="text-gray-600">{formatRole(role)}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                                            style={{ width: `${Math.min((count / Math.max(analytics.workforce.total, 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="font-medium text-gray-800 w-8 text-right">{count}</span>
                                </div>
                            </div>
                        ))}
                        {Object.keys(analytics.workforce.byRole || {}).length === 0 && (
                            <p className="text-gray-500 text-center py-4">No data available</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Status Distribution</h3>
                    <div className="space-y-3">
                        {Object.entries(analytics.workforce.byStatus || {}).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                                <span className="text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                        status === 'on_leave' ? 'bg-orange-100 text-orange-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>{count}</span>
                                </div>
                            </div>
                        ))}
                        {Object.keys(analytics.workforce.byStatus || {}).length === 0 && (
                            <p className="text-gray-500 text-center py-4">No data available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAttendanceAnalytics = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Present Rate" 
                    value={`${(analytics.attendance.presentRate || 0).toFixed(1)}%`}
                    icon={<UserCheck className="w-6 h-6 text-white" />}
                    color="from-emerald-500 to-emerald-600"
                />
                <StatCard 
                    title="Absent Rate" 
                    value={`${(analytics.attendance.absentRate || 0).toFixed(1)}%`}
                    icon={<UserX className="w-6 h-6 text-white" />}
                    color="from-red-500 to-red-600"
                />
                <StatCard 
                    title="Late Rate" 
                    value={`${(analytics.attendance.lateRate || 0).toFixed(1)}%`}
                    icon={<Clock className="w-6 h-6 text-white" />}
                    color="from-orange-500 to-orange-600"
                />
                <StatCard 
                    title="On Time" 
                    value={`${(100 - (analytics.attendance.lateRate || 0)).toFixed(1)}%`}
                    icon={<TrendingUp className="w-6 h-6 text-white" />}
                    color="from-blue-500 to-blue-600"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Monthly Attendance Trend</h3>
                <div className="h-64 flex items-end gap-2">
                    {(analytics.attendance.monthlyTrend || []).map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                            <div 
                                className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md"
                                style={{ height: `${Math.max(item.rate, 5)}%` }}
                            />
                            <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                        </div>
                    ))}
                    {(analytics.attendance.monthlyTrend || []).length === 0 && (
                        <p className="text-gray-500 w-full text-center">No trend data available</p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderLeaveAnalytics = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Leave Taken" 
                    value={analytics.leave.totalTaken || 0}
                    icon={<Calendar className="w-6 h-6 text-white" />}
                    color="from-blue-500 to-blue-600"
                    subtitle="days this period"
                />
                <StatCard 
                    title="Pending Requests" 
                    value={analytics.leave.pendingRequests || 0}
                    icon={<Clock className="w-6 h-6 text-white" />}
                    color="from-orange-500 to-orange-600"
                />
                <StatCard 
                    title="Approval Rate" 
                    value={`${(analytics.leave.approvalRate || 0).toFixed(1)}%`}
                    icon={<UserCheck className="w-6 h-6 text-white" />}
                    color="from-emerald-500 to-emerald-600"
                />
                <StatCard 
                    title="Leave Types" 
                    value={Object.keys(analytics.leave.byType || {}).length}
                    icon={<FileText className="w-6 h-6 text-white" />}
                    color="from-purple-500 to-purple-600"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Leave by Type</h3>
                <div className="space-y-3">
                    {Object.entries(analytics.leave.byType || {}).map(([type, days]) => (
                        <div key={type} className="flex items-center justify-between">
                            <span className="text-gray-600">{type}</span>
                            <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                                        style={{ width: `${Math.min((days / Math.max(analytics.leave.totalTaken, 1)) * 100, 100)}%` }}
                                    />
                                </div>
                                <span className="font-medium text-gray-800 w-12 text-right">{days} days</span>
                            </div>
                        </div>
                    ))}
                    {Object.keys(analytics.leave.byType || {}).length === 0 && (
                        <p className="text-gray-500 text-center py-4">No leave data available</p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderOvertimeAnalytics = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Total OT Hours" 
                    value={analytics.overtime.totalHours || 0}
                    icon={<Clock className="w-6 h-6 text-white" />}
                    color="from-purple-500 to-purple-600"
                />
                <StatCard 
                    title="Total OT Cost" 
                    value={`LKR ${(analytics.overtime.totalCost || 0).toLocaleString()}`}
                    icon={<DollarSign className="w-6 h-6 text-white" />}
                    color="from-emerald-500 to-emerald-600"
                />
                <StatCard 
                    title="Avg Hours/Employee" 
                    value={(analytics.overtime.totalHours / Math.max(analytics.workforce.total, 1)).toFixed(1)}
                    icon={<Users className="w-6 h-6 text-white" />}
                    color="from-blue-500 to-blue-600"
                />
                <StatCard 
                    title="Cost per Hour" 
                    value={`LKR ${((analytics.overtime.totalCost || 0) / Math.max(analytics.overtime.totalHours, 1)).toFixed(0)}`}
                    icon={<TrendingUp className="w-6 h-6 text-white" />}
                    color="from-orange-500 to-orange-600"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Monthly Overtime Trend</h3>
                <div className="h-64 flex items-end gap-2">
                    {(analytics.overtime.monthlyTrend || []).map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                            <div 
                                className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-md"
                                style={{ height: `${Math.min((item.hours / 200) * 100, 100)}%` }}
                            />
                            <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                        </div>
                    ))}
                    {(analytics.overtime.monthlyTrend || []).length === 0 && (
                        <p className="text-gray-500 w-full text-center">No trend data available</p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderPayrollAnalytics = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Payroll" 
                    value={`LKR 0`}
                    icon={<DollarSign className="w-6 h-6 text-white" />}
                    color="from-emerald-500 to-emerald-600"
                    subtitle="This month"
                />
                <StatCard 
                    title="EPF (Employee)" 
                    value="LKR 0"
                    icon={<FileText className="w-6 h-6 text-white" />}
                    color="from-blue-500 to-blue-600"
                />
                <StatCard 
                    title="EPF (Employer)" 
                    value="LKR 0"
                    icon={<FileText className="w-6 h-6 text-white" />}
                    color="from-indigo-500 to-indigo-600"
                />
                <StatCard 
                    title="ETF" 
                    value="LKR 0"
                    icon={<FileText className="w-6 h-6 text-white" />}
                    color="from-purple-500 to-purple-600"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Payroll Summary</h3>
                <p className="text-gray-500 text-center py-8">
                    Payroll summary data will be displayed here once payslips are generated.
                </p>
            </div>
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <span className="ml-3 text-gray-600">Loading analytics...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <span className="text-red-700">{error}</span>
                </div>
            );
        }

        switch (activeTab) {
            case 'workforce': return renderWorkforceAnalytics();
            case 'attendance': return renderAttendanceAnalytics();
            case 'leave': return renderLeaveAnalytics();
            case 'overtime': return renderOvertimeAnalytics();
            case 'payroll': return renderPayrollAnalytics();
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/branch-admin/hrm')}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">HR Reports & Analytics</h1>
                            <p className="text-gray-500">{branchName} - Insights and Reports</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button 
                            onClick={fetchAnalytics}
                            className="flex items-center gap-2 px-4 py-2 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:opacity-90">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-6">
                    <div className="flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {renderContent()}
            </div>
        </div>
    );
};

export default BranchHRMReports;
