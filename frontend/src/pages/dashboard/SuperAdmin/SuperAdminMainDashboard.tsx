import React, { useEffect, useState } from 'react';
import { 
    Users, 
    Building2, 
    Activity, 
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    AlertCircle,
    CheckCircle,
    Wallet,
    CreditCard,
    Banknote,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    UserPlus,
    ClipboardList,
    Stethoscope,
    Pill,
    BedDouble,
    Heart,
    Clock,
    Target,
    Award,
    Shield,
    BarChart3,
    LineChart
} from 'lucide-react';
import api from "../../../utils/api/axios";
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
    totalUsers: number;
    totalBranches: number;
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    activeStaff: number;
    totalDoctors: number;
    totalNurses: number;
    pendingAppointments: number;
    completedAppointments: number;
}

interface FinancialStats {
    monthlyRevenue: number;
    yearlyRevenue: number;
    totalExpenses: number;
    netProfit: number;
    outstandingPayments: number;
    insuranceClaims: number;
}

interface ManagementStats {
    operationalEfficiency: number;
    patientSatisfaction: number;
    staffUtilization: number;
    bedOccupancy: number;
    avgWaitTime: number;
    complianceRate: number;
}

const SuperAdminMainDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 156,
        totalBranches: 5,
        totalPatients: 2847,
        todayAppointments: 48,
        monthlyRevenue: 485000,
        activeStaff: 89,
        totalDoctors: 24,
        totalNurses: 36,
        pendingAppointments: 12,
        completedAppointments: 36
    });

    const [financialStats, setFinancialStats] = useState<FinancialStats>({
        monthlyRevenue: 485000,
        yearlyRevenue: 5420000,
        totalExpenses: 312000,
        netProfit: 173000,
        outstandingPayments: 45000,
        insuranceClaims: 78000
    });

    const [managementStats, setManagementStats] = useState<ManagementStats>({
        operationalEfficiency: 92.5,
        patientSatisfaction: 94.8,
        staffUtilization: 87.3,
        bedOccupancy: 76.5,
        avgWaitTime: 12,
        complianceRate: 98.2
    });

    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Admin');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('No authentication token found, redirecting to login');
                navigate('/');
                return;
            }

            // Get user info
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            setUserName(`${userInfo.first_name || 'Admin'}`);

            // Fetch dashboard statistics
            const response = await api.get('/super-admin/dashboard-stats');
            if (response.data.status === 200) {
                setStats(prev => ({ ...prev, ...response.data.data }));
            }
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            // Handle authentication errors
            if (error.response?.status === 401) {
                console.warn('Authentication failed, redirecting to login');
                localStorage.clear();
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const StatCard = ({ 
        title, 
        value, 
        icon, 
        gradient,
        trend,
        subtitle
    }: { 
        title: string; 
        value: number | string; 
        icon: React.ReactNode; 
        gradient: string;
        trend?: { value: number; positive: boolean };
        subtitle?: string;
    }) => (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{typeof value === 'number' ? value.toLocaleString() : value}</h3>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                    {trend && (
                        <div className={`flex items-center gap-1 mt-2 text-xs ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span className="font-semibold">{trend.value}%</span>
                            <span className="text-gray-400">vs last month</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    const FinancialCard = ({
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
        trend?: { value: number; positive: boolean };
    }) => (
        <div className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs ${trend.positive ? 'text-green-200' : 'text-red-200'}`}>
                        {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{trend.value}%</span>
                    </div>
                )}
            </div>
            <p className="text-white/80 text-sm mb-1">{title}</p>
            <p className="text-2xl font-bold">{formatCurrency(value)}</p>
        </div>
    );

    const MetricCard = ({
        title,
        value,
        icon,
        unit,
        status
    }: {
        title: string;
        value: number;
        icon: React.ReactNode;
        unit: string;
        status: 'excellent' | 'good' | 'warning';
    }) => {
        const statusColors = {
            excellent: 'from-emerald-500 to-teal-500',
            good: 'from-blue-500 to-cyan-500',
            warning: 'from-amber-500 to-orange-500'
        };

        return (
            <div className="bg-white rounded-xl p-4 border-2 border-gray-100 hover:border-teal-200 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${statusColors[status]} text-white`}>
                        {icon}
                    </div>
                    <span className="text-gray-600 text-sm font-medium">{title}</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-800">{value}</span>
                    <span className="text-gray-500 text-sm">{unit}</span>
                </div>
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full bg-gradient-to-r ${statusColors[status]} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(value, 100)}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
            <div className="p-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div>
                            <h1 className="text-3xl font-bold">
                                <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                    Welcome back, {userName}!
                                </span>
                            </h1>
                            <p className="text-gray-500 mt-2">Here's what's happening across your hospital network today.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Today's Date</p>
                                <p className="text-lg font-semibold text-gray-700">
                                    {new Date().toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        month: 'long', 
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                title="Total Staff"
                                value={stats.activeStaff}
                                icon={<Users className="w-6 h-6 text-white" />}
                                gradient="from-teal-500 to-teal-600"
                                trend={{ value: 8, positive: true }}
                                subtitle="Active employees"
                            />
                            <StatCard
                                title="Total Branches"
                                value={stats.totalBranches}
                                icon={<Building2 className="w-6 h-6 text-white" />}
                                gradient="from-cyan-500 to-cyan-600"
                                subtitle="Across all regions"
                            />
                            <StatCard
                                title="Total Patients"
                                value={stats.totalPatients}
                                icon={<Heart className="w-6 h-6 text-white" />}
                                gradient="from-blue-500 to-blue-600"
                                trend={{ value: 12, positive: true }}
                                subtitle="Registered patients"
                            />
                            <StatCard
                                title="Today's Appointments"
                                value={stats.todayAppointments}
                                icon={<Calendar className="w-6 h-6 text-white" />}
                                gradient="from-indigo-500 to-indigo-600"
                                subtitle={`${stats.completedAppointments} completed`}
                            />
                        </div>

                        {/* Financial Overview */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg">
                                    <Wallet className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Financial Overview</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                <FinancialCard
                                    title="Monthly Revenue"
                                    value={financialStats.monthlyRevenue}
                                    icon={<DollarSign className="w-5 h-5" />}
                                    color="from-teal-500 to-teal-600"
                                    trend={{ value: 15, positive: true }}
                                />
                                <FinancialCard
                                    title="Yearly Revenue"
                                    value={financialStats.yearlyRevenue}
                                    icon={<BarChart3 className="w-5 h-5" />}
                                    color="from-cyan-500 to-cyan-600"
                                    trend={{ value: 22, positive: true }}
                                />
                                <FinancialCard
                                    title="Total Expenses"
                                    value={financialStats.totalExpenses}
                                    icon={<CreditCard className="w-5 h-5" />}
                                    color="from-blue-500 to-blue-600"
                                    trend={{ value: 5, positive: false }}
                                />
                                <FinancialCard
                                    title="Net Profit"
                                    value={financialStats.netProfit}
                                    icon={<TrendingUp className="w-5 h-5" />}
                                    color="from-emerald-500 to-emerald-600"
                                    trend={{ value: 18, positive: true }}
                                />
                                <FinancialCard
                                    title="Outstanding"
                                    value={financialStats.outstandingPayments}
                                    icon={<Banknote className="w-5 h-5" />}
                                    color="from-amber-500 to-amber-600"
                                />
                                <FinancialCard
                                    title="Insurance Claims"
                                    value={financialStats.insuranceClaims}
                                    icon={<Shield className="w-5 h-5" />}
                                    color="from-purple-500 to-purple-600"
                                    trend={{ value: 8, positive: true }}
                                />
                            </div>
                        </div>

                        {/* Management Performance Metrics */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg">
                                    <PieChart className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Management Performance</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                <MetricCard
                                    title="Operational Efficiency"
                                    value={managementStats.operationalEfficiency}
                                    icon={<Activity className="w-4 h-4" />}
                                    unit="%"
                                    status="excellent"
                                />
                                <MetricCard
                                    title="Patient Satisfaction"
                                    value={managementStats.patientSatisfaction}
                                    icon={<Heart className="w-4 h-4" />}
                                    unit="%"
                                    status="excellent"
                                />
                                <MetricCard
                                    title="Staff Utilization"
                                    value={managementStats.staffUtilization}
                                    icon={<Users className="w-4 h-4" />}
                                    unit="%"
                                    status="good"
                                />
                                <MetricCard
                                    title="Bed Occupancy"
                                    value={managementStats.bedOccupancy}
                                    icon={<BedDouble className="w-4 h-4" />}
                                    unit="%"
                                    status="good"
                                />
                                <MetricCard
                                    title="Avg Wait Time"
                                    value={managementStats.avgWaitTime}
                                    icon={<Clock className="w-4 h-4" />}
                                    unit="min"
                                    status="excellent"
                                />
                                <MetricCard
                                    title="Compliance Rate"
                                    value={managementStats.complianceRate}
                                    icon={<Shield className="w-4 h-4" />}
                                    unit="%"
                                    status="excellent"
                                />
                            </div>
                        </div>

                        {/* Staff Overview & Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Staff Distribution */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800">Staff Distribution</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-teal-500 rounded-lg">
                                                <Stethoscope className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">Doctors</p>
                                                <p className="text-sm text-gray-500">Medical professionals</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-bold text-teal-600">{stats.totalDoctors}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-cyan-500 rounded-lg">
                                                <Heart className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">Nurses</p>
                                                <p className="text-sm text-gray-500">Nursing staff</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-bold text-cyan-600">{stats.totalNurses}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500 rounded-lg">
                                                <Pill className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">Pharmacists</p>
                                                <p className="text-sm text-gray-500">Pharmacy staff</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-bold text-blue-600">12</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-500 rounded-lg">
                                                <Users className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">Support Staff</p>
                                                <p className="text-sm text-gray-500">Administrative & IT</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-bold text-indigo-600">{stats.activeStaff - stats.totalDoctors - stats.totalNurses - 12}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800">Quick Actions</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => navigate('/dashboard/users/create')}
                                        className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border-2 border-teal-200 hover:border-teal-400 hover:shadow-md transition-all duration-300 text-left group"
                                    >
                                        <div className="p-2 bg-teal-500 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                            <UserPlus className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="font-semibold text-gray-800">Add New User</p>
                                        <p className="text-xs text-gray-500 mt-1">Create staff account</p>
                                    </button>
                                    <button 
                                        onClick={() => navigate('/dashboard/branch/management')}
                                        className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-md transition-all duration-300 text-left group"
                                    >
                                        <div className="p-2 bg-cyan-500 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                            <Building2 className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="font-semibold text-gray-800">Manage Branches</p>
                                        <p className="text-xs text-gray-500 mt-1">View all branches</p>
                                    </button>
                                    <button 
                                        onClick={() => navigate('/super-admin/staff/scheduling')}
                                        className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 text-left group"
                                    >
                                        <div className="p-2 bg-blue-500 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                            <ClipboardList className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="font-semibold text-gray-800">Staff Scheduling</p>
                                        <p className="text-xs text-gray-500 mt-1">Manage shifts</p>
                                    </button>
                                    <button 
                                        onClick={() => navigate('/dashboard/all/appointment')}
                                        className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all duration-300 text-left group"
                                    >
                                        <div className="p-2 bg-indigo-500 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                            <Calendar className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="font-semibold text-gray-800">Appointments</p>
                                        <p className="text-xs text-gray-500 mt-1">View all appointments</p>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* System Status & Alerts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* System Status */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                                        <Activity className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800">System Status</h2>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                            <span className="font-medium text-gray-700">Database Server</span>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">Online</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                            <span className="font-medium text-gray-700">API Services</span>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">Running</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                            <span className="font-medium text-gray-700">Backup System</span>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">Active</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600" />
                                            <span className="font-medium text-gray-700">Storage Usage</span>
                                        </div>
                                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">72% Used</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                                        <Clock className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                        <div className="p-2 bg-teal-100 rounded-lg">
                                            <UserPlus className="w-4 h-4 text-teal-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">New staff member added</p>
                                            <p className="text-xs text-gray-500">Dr. Sarah Johnson joined Branch A</p>
                                        </div>
                                        <span className="text-xs text-gray-400">2h ago</span>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                        <div className="p-2 bg-cyan-100 rounded-lg">
                                            <Calendar className="w-4 h-4 text-cyan-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">Schedule updated</p>
                                            <p className="text-xs text-gray-500">Weekly shifts for Branch B modified</p>
                                        </div>
                                        <span className="text-xs text-gray-400">4h ago</span>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Award className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">Performance milestone</p>
                                            <p className="text-xs text-gray-500">Patient satisfaction reached 95%</p>
                                        </div>
                                        <span className="text-xs text-gray-400">1d ago</span>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                            <DollarSign className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">Payment received</p>
                                            <p className="text-xs text-gray-500">Insurance claim $12,500 processed</p>
                                        </div>
                                        <span className="text-xs text-gray-400">1d ago</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SuperAdminMainDashboard;
