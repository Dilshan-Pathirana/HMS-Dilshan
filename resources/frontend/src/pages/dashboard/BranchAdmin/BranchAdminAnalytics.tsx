import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../components/common/Layout/BranchAdminSidebar';
import { 
    TrendingUp, TrendingDown, BarChart3, Users,
    DollarSign, Activity, HeartPulse, UserCheck, CreditCard,
    Pill, Wrench, Shield, PieChart, AlertTriangle, CheckCircle,
    Target, Award, Zap, Clock, Percent, Package, Building2,
    FileSpreadsheet, LineChart, ArrowUpRight, ArrowDownRight,
    RefreshCw, Filter, Download, Calendar as CalendarIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AnalyticsCard {
    title: string;
    value: string | number;
    change: number;
    trend: 'up' | 'down';
    icon: React.ReactNode;
    color: string;
}

interface ChartData {
    label: string;
    value: number;
    color?: string;
}

export const BranchAdminAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [selectedDashboard, setSelectedDashboard] = useState('executive');

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_center_name || userInfo.branch_name || 'Branch');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    // Sample data - Replace with actual API calls
    const keyMetrics: AnalyticsCard[] = [
        {
            title: 'Total Revenue',
            value: 'LKR 2.4M',
            change: 12.5,
            trend: 'up',
            icon: <DollarSign className="w-6 h-6" />,
            color: 'from-green-500 to-emerald-600'
        },
        {
            title: 'Patient Footfall',
            value: '1,284',
            change: 8.2,
            trend: 'up',
            icon: <HeartPulse className="w-6 h-6" />,
            color: 'from-blue-500 to-cyan-600'
        },
        {
            title: 'Bed Occupancy',
            value: '78.5%',
            change: -3.1,
            trend: 'down',
            icon: <Activity className="w-6 h-6" />,
            color: 'from-purple-500 to-violet-600'
        },
        {
            title: 'Revenue per Patient',
            value: 'LKR 1,869',
            change: 5.7,
            trend: 'up',
            icon: <TrendingUp className="w-6 h-6" />,
            color: 'from-teal-500 to-cyan-600'
        },
        {
            title: 'Cost Efficiency',
            value: '92.3%',
            change: 4.2,
            trend: 'up',
            icon: <Target className="w-6 h-6" />,
            color: 'from-emerald-500 to-green-600'
        },
        {
            title: 'Payroll Cost Ratio',
            value: '34.6%',
            change: -1.8,
            trend: 'down',
            icon: <CreditCard className="w-6 h-6" />,
            color: 'from-amber-500 to-orange-600'
        },
    ];

    const revenueBreakdown: ChartData[] = [
        { label: 'OPD', value: 45, color: 'bg-blue-500' },
        { label: 'IPD', value: 30, color: 'bg-green-500' },
        { label: 'Lab', value: 12, color: 'bg-purple-500' },
        { label: 'Pharmacy', value: 8, color: 'bg-amber-500' },
        { label: 'Radiology', value: 5, color: 'bg-pink-500' },
    ];

    const departmentPerformance = [
        { dept: 'Cardiology', revenue: 'LKR 425K', patients: 145, margin: 18.5, trend: 'up' },
        { dept: 'Orthopedics', revenue: 'LKR 380K', patients: 128, margin: 16.2, trend: 'up' },
        { dept: 'General Medicine', revenue: 'LKR 350K', patients: 234, margin: 15.8, trend: 'down' },
        { dept: 'Pediatrics', revenue: 'LKR 280K', patients: 189, margin: 14.1, trend: 'up' },
        { dept: 'Dermatology', revenue: 'LKR 195K', patients: 98, margin: 12.3, trend: 'down' },
    ];

    const doctorPerformance = [
        { name: 'Dr. Silva', patients: 48, revenue: 'LKR 125K', rating: 4.8, utilization: 96 },
        { name: 'Dr. Fernando', patients: 42, revenue: 'LKR 118K', rating: 4.7, utilization: 92 },
        { name: 'Dr. Perera', patients: 39, revenue: 'LKR 102K', rating: 4.6, utilization: 88 },
        { name: 'Dr. Mendis', patients: 35, revenue: 'LKR 95K', rating: 4.5, utilization: 85 },
    ];

    const bedUtilization = [
        { ward: 'General Ward', capacity: 40, occupied: 34, occupancy: 85, alos: 4.2 },
        { ward: 'ICU', capacity: 10, occupied: 8, occupancy: 80, alos: 6.8 },
        { ward: 'Private Rooms', capacity: 20, occupied: 14, occupancy: 70, alos: 3.5 },
        { ward: 'Maternity', capacity: 15, occupied: 11, occupancy: 73, alos: 2.8 },
    ];

    const qualityMetrics = [
        { metric: 'Patient Satisfaction', value: 94.2, target: 90, status: 'good' },
        { metric: 'Readmission Rate', value: 4.1, target: 5, status: 'good' },
        { metric: 'Avg Wait Time (min)', value: 18, target: 20, status: 'good' },
        { metric: 'Infection Rate (%)', value: 1.2, target: 2, status: 'good' },
        { metric: 'Claim Approval Rate', value: 87.5, target: 85, status: 'good' },
    ];

    const renderProgressBar = (percentage: number, color: string) => (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
                className={`h-full ${color} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );

    return (
        <DashboardLayout
            userName={userName}
            userRole="Branch Admin"
            branchName={branchName}
            userGender={userGender}
            profileImage={profileImage}
            sidebarContent={<BranchAdminSidebar />}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                            <p className="text-emerald-100 mt-1">Track performance metrics, revenue insights, and operational efficiency</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white border-0 focus:ring-2 focus:ring-white/50"
                            >
                                <option value="today" className="text-gray-800">Today</option>
                                <option value="week" className="text-gray-800">This Week</option>
                                <option value="month" className="text-gray-800">This Month</option>
                                <option value="quarter" className="text-gray-800">This Quarter</option>
                                <option value="year" className="text-gray-800">This Year</option>
                            </select>
                            <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                                <RefreshCw className="w-5 h-5" />
                            </button>
                            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all flex items-center gap-2">
                                <Download className="w-5 h-5" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard Tabs */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex gap-2 overflow-x-auto">
                        {[
                            { id: 'executive', label: 'Executive Dashboard', icon: <Award /> },
                            { id: 'financial', label: 'Financial', icon: <DollarSign /> },
                            { id: 'clinical', label: 'Clinical', icon: <HeartPulse /> },
                            { id: 'operations', label: 'Operations', icon: <Activity /> },
                            { id: 'hr', label: 'HR & Payroll', icon: <Users /> },
                            { id: 'pharmacy', label: 'Pharmacy', icon: <Pill /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedDashboard(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                                    selectedDashboard === tab.id
                                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {React.cloneElement(tab.icon as React.ReactElement, { className: 'w-4 h-4' })}
                                <span className="text-sm font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {keyMetrics.map((metric, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} text-white`}>
                                    {metric.icon}
                                </div>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                                    metric.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {metric.trend === 'up' ? (
                                        <ArrowUpRight className="w-4 h-4" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4" />
                                    )}
                                    {Math.abs(metric.change)}%
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm mb-1">{metric.title}</h3>
                            <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
                            <p className="text-xs text-gray-400 mt-2">vs previous period</p>
                        </div>
                    ))}
                </div>

                {/* Revenue Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800">Revenue Breakdown</h2>
                            <PieChart className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="space-y-4">
                            {revenueBreakdown.map((item, index) => (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                            <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-800">{item.value}%</span>
                                    </div>
                                    {renderProgressBar(item.value, item.color || 'bg-blue-500')}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quality Metrics */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800">Quality Metrics</h2>
                            <Target className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="space-y-4">
                            {qualityMetrics.map((metric, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-cyan-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">{metric.metric}</p>
                                        <p className="text-xs text-gray-500">Target: {metric.target}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-gray-800">{metric.value}</span>
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Department Performance */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800">Department Performance</h2>
                        <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Patients</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Margin</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Trend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departmentPerformance.map((dept, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-green-50 hover:to-cyan-50 transition-colors">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-800">{dept.dept}</td>
                                        <td className="py-3 px-4 text-sm text-gray-700">{dept.revenue}</td>
                                        <td className="py-3 px-4 text-sm text-gray-700">{dept.patients}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                {dept.margin}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {dept.trend === 'up' ? (
                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <TrendingDown className="w-5 h-5 text-red-600" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Doctor Performance & Bed Utilization */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Doctor Performance */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800">Top Performing Doctors</h2>
                            <UserCheck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="space-y-4">
                            {doctorPerformance.map((doctor, index) => (
                                <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-cyan-50 rounded-lg border border-emerald-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-800">{doctor.name}</h3>
                                        <span className="px-2 py-1 bg-white border border-emerald-300 text-emerald-700 text-xs font-medium rounded-full">
                                            ★ {doctor.rating}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <p className="text-gray-500 text-xs">Patients</p>
                                            <p className="font-bold text-gray-800">{doctor.patients}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Revenue</p>
                                            <p className="font-bold text-gray-800">{doctor.revenue}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Utilization</p>
                                            <p className="font-bold text-gray-800">{doctor.utilization}%</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bed Utilization */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800">Bed Utilization</h2>
                            <Activity className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="space-y-4">
                            {bedUtilization.map((ward, index) => (
                                <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-cyan-50 rounded-lg border border-emerald-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-800">{ward.ward}</h3>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            ward.occupancy >= 80 ? 'bg-green-100 text-green-700' : 
                                            ward.occupancy >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {ward.occupancy}%
                                        </span>
                                    </div>
                                    {renderProgressBar(ward.occupancy, ward.occupancy >= 80 ? 'bg-green-500' : ward.occupancy >= 60 ? 'bg-yellow-500' : 'bg-red-500')}
                                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-600">
                                        <div>
                                            <span className="text-gray-500">Capacity:</span> {ward.capacity}
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Occupied:</span> {ward.occupied}
                                        </div>
                                        <div>
                                            <span className="text-gray-500">ALOS:</span> {ward.alos}d
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                        <Zap className="w-8 h-8 mb-3 opacity-80" />
                        <h3 className="text-lg font-bold mb-1">Peak Efficiency</h3>
                        <p className="text-3xl font-bold mb-2">92.5%</p>
                        <p className="text-sm opacity-90">Operational efficiency this month</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                        <Clock className="w-8 h-8 mb-3 opacity-80" />
                        <h3 className="text-lg font-bold mb-1">Avg Wait Time</h3>
                        <p className="text-3xl font-bold mb-2">18 min</p>
                        <p className="text-sm opacity-90">Below target of 20 minutes</p>
                    </div>
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
                        <Percent className="w-8 h-8 mb-3 opacity-80" />
                        <h3 className="text-lg font-bold mb-1">Claim Approval</h3>
                        <p className="text-3xl font-bold mb-2">87.5%</p>
                        <p className="text-sm opacity-90">Insurance claim success rate</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
