import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, TrendingDown, DollarSign, Activity, HeartPulse, UserCheck, CreditCard,
    Pill, Shield, PieChart, AlertTriangle, CheckCircle,
    Target, Award, Zap, Clock, Percent, Building2,
    LineChart, ArrowUpRight, ArrowDownRight,
    RefreshCw, Download, Layers
} from 'lucide-react';

interface Branch {
    id: number;
    name: string;
    location: string;
}

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

export const SuperAdminAnalyticsContent: React.FC = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [selectedDashboard, setSelectedDashboard] = useState('executive');

    useEffect(() => {
        // Fetch branches from API
        setBranches([
            { id: 1, name: 'Branch A', location: 'Colombo' },
            { id: 2, name: 'Branch B', location: 'Kandy' },
            { id: 3, name: 'Branch C', location: 'Galle' },
        ]);
    }, []);

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
            icon: <Activity className="w-6 h-6" />,
            color: 'from-blue-500 to-cyan-600'
        },
        {
            title: 'Bed Occupancy',
            value: '78.5%',
            change: -3.1,
            trend: 'down',
            icon: <HeartPulse className="w-6 h-6" />,
            color: 'from-purple-500 to-pink-600'
        },
        {
            title: 'Revenue per Patient',
            value: 'LKR 1,869',
            change: 5.7,
            trend: 'up',
            icon: <CreditCard className="w-6 h-6" />,
            color: 'from-orange-500 to-red-600'
        },
        {
            title: 'Cost Efficiency',
            value: '92.3%',
            change: 4.2,
            trend: 'up',
            icon: <Target className="w-6 h-6" />,
            color: 'from-teal-500 to-cyan-600'
        },
        {
            title: 'Payroll Cost Ratio',
            value: '34.6%',
            change: -1.8,
            trend: 'down',
            icon: <Percent className="w-6 h-6" />,
            color: 'from-indigo-500 to-purple-600'
        }
    ];

    const revenueBreakdown: ChartData[] = [
        { label: 'OPD Consultations', value: 45, color: 'bg-blue-500' },
        { label: 'IPD Admissions', value: 30, color: 'bg-green-500' },
        { label: 'Laboratory', value: 12, color: 'bg-purple-500' },
        { label: 'Pharmacy', value: 8, color: 'bg-orange-500' },
        { label: 'Radiology', value: 5, color: 'bg-pink-500' },
    ];

    const qualityMetrics = [
        { label: 'Patient Satisfaction', value: 94.2, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600' },
        { label: 'Readmission Rate', value: 4.1, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-yellow-600' },
        { label: 'Average Wait Time', value: 18, unit: 'min', icon: <Clock className="w-5 h-5" />, color: 'text-blue-600' },
        { label: 'Infection Rate', value: 1.2, unit: '%', icon: <Shield className="w-5 h-5" />, color: 'text-red-600' },
        { label: 'Claim Approval Rate', value: 87.5, icon: <Award className="w-5 h-5" />, color: 'text-purple-600' },
    ];

    const departmentPerformance = [
        { name: 'Cardiology', revenue: 'LKR 450K', patients: 234, margin: '24%', trend: 'up' },
        { name: 'Orthopedics', revenue: 'LKR 380K', patients: 189, margin: '22%', trend: 'up' },
        { name: 'General Medicine', revenue: 'LKR 320K', patients: 456, margin: '18%', trend: 'down' },
        { name: 'Pediatrics', revenue: 'LKR 290K', patients: 312, margin: '20%', trend: 'up' },
        { name: 'Dermatology', revenue: 'LKR 210K', patients: 278, margin: '26%', trend: 'up' },
    ];

    const doctorPerformance = [
        { name: 'Dr. Silva', specialty: 'Cardiology', patients: 89, revenue: 'LKR 145K', rating: 4.8, utilization: 92 },
        { name: 'Dr. Fernando', specialty: 'Orthopedics', patients: 76, revenue: 'LKR 128K', rating: 4.7, utilization: 88 },
        { name: 'Dr. Perera', specialty: 'General Medicine', patients: 134, revenue: 'LKR 98K', rating: 4.6, utilization: 95 },
        { name: 'Dr. Jayawardena', specialty: 'Pediatrics', patients: 112, revenue: 'LKR 87K', rating: 4.9, utilization: 91 },
    ];

    const bedUtilization = [
        { type: 'General Ward', occupancy: 85, capacity: 40, alos: 4.2 },
        { type: 'ICU', occupancy: 80, capacity: 10, alos: 6.8 },
        { type: 'Private Rooms', occupancy: 70, capacity: 15, alos: 3.5 },
        { type: 'Maternity', occupancy: 73, capacity: 12, alos: 2.8 },
    ];

    const getBranchInfo = () => {
        if (selectedBranch === 'all') return 'All Branches';
        const branch = branches.find(b => b.id.toString() === selectedBranch);
        return branch ? `${branch.name} (${branch.location})` : 'Selected Branch';
    };

    return (
        <div className="p-4 space-y-6">
            {/* Header with Branch Selector */}
            <div className="bg-gradient-to-r from-green-50 via-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-6 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <LineChart className="w-8 h-8 text-teal-600" />
                            Analytics Dashboard
                        </h1>
                        <p className="text-gray-600 mt-1">Comprehensive performance metrics and insights</p>
                    </div>
                    
                    {/* Branch Selector */}
                    <div className="flex items-center gap-3">
                        <Layers className="w-5 h-5 text-teal-600" />
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="px-4 py-2 border-2 border-teal-300 rounded-lg bg-teal-50 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        >
                            <option value="all">All Branches</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id.toString()}>
                                    {branch.name} ({branch.location})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Currently Viewing Banner */}
                {selectedBranch !== 'all' && (
                    <div className="mt-4 flex items-center gap-2 text-teal-700 bg-teal-100 px-4 py-2 rounded-lg border border-teal-300">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">Viewing: {getBranchInfo()}</span>
                    </div>
                )}
            </div>

            {/* Period Selector and Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <div className="flex gap-2">
                    {['today', 'week', 'month', 'quarter', 'year'].map(period => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                selectedPeriod === period
                                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="flex overflow-x-auto">
                    {[
                        { id: 'executive', label: 'Executive Dashboard', icon: <Target className="w-4 h-4" /> },
                        { id: 'financial', label: 'Financial', icon: <DollarSign className="w-4 h-4" /> },
                        { id: 'clinical', label: 'Clinical', icon: <HeartPulse className="w-4 h-4" /> },
                        { id: 'operations', label: 'Operations', icon: <Activity className="w-4 h-4" /> },
                        { id: 'hr', label: 'HR & Payroll', icon: <UserCheck className="w-4 h-4" /> },
                        { id: 'pharmacy', label: 'Pharmacy', icon: <Pill className="w-4 h-4" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedDashboard(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-all whitespace-nowrap ${
                                selectedDashboard === tab.id
                                    ? 'border-teal-600 text-teal-600 bg-teal-50'
                                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {keyMetrics.map((metric, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                                <p className="text-3xl font-bold text-gray-800 mb-2">{metric.value}</p>
                                <div className="flex items-center gap-2">
                                    {metric.trend === 'up' ? (
                                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                                    )}
                                    <span className={`text-sm font-semibold ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                        {Math.abs(metric.change)}%
                                    </span>
                                    <span className="text-sm text-gray-500">vs last period</span>
                                </div>
                            </div>
                            <div className={`p-3 rounded-lg bg-gradient-to-r ${metric.color} text-white`}>
                                {metric.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <PieChart className="w-6 h-6 text-teal-600" />
                        Revenue Breakdown
                    </h2>
                    <span className="text-2xl font-bold text-gray-800">LKR 2.4M</span>
                </div>
                <div className="space-y-4">
                    {revenueBreakdown.map((item, index) => (
                        <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                <span className="text-sm font-semibold text-gray-800">{item.value}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                    className={`h-full ${item.color} transition-all duration-500`}
                                    style={{ width: `${item.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quality Metrics Dashboard */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                    <Award className="w-6 h-6 text-teal-600" />
                    Quality Metrics Dashboard
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {qualityMetrics.map((metric, index) => (
                        <div key={index} className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                            <div className={`flex justify-center mb-2 ${metric.color}`}>
                                {metric.icon}
                            </div>
                            <p className="text-2xl font-bold text-gray-800 mb-1">
                                {metric.value}{metric.unit || '%'}
                            </p>
                            <p className="text-xs text-gray-600">{metric.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Department Performance */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                    <Building2 className="w-6 h-6 text-teal-600" />
                    Department Performance
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Department</th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Revenue</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Patients</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Margin</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departmentPerformance.map((dept, index) => (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-800">{dept.name}</td>
                                    <td className="px-4 py-3 text-right text-gray-700">{dept.revenue}</td>
                                    <td className="px-4 py-3 text-center text-gray-700">{dept.patients}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                            {dept.margin}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {dept.trend === 'up' ? (
                                            <TrendingUp className="w-5 h-5 text-green-600 mx-auto" />
                                        ) : (
                                            <TrendingDown className="w-5 h-5 text-red-600 mx-auto" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Doctor Performance */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                    <UserCheck className="w-6 h-6 text-teal-600" />
                    Top Performing Doctors
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {doctorPerformance.map((doctor, index) => (
                        <div key={index} className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg border-2 border-teal-200">
                            <p className="font-bold text-gray-800 mb-1">{doctor.name}</p>
                            <p className="text-xs text-gray-600 mb-3">{doctor.specialty}</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Patients:</span>
                                    <span className="font-semibold text-gray-800">{doctor.patients}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Revenue:</span>
                                    <span className="font-semibold text-gray-800">{doctor.revenue}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Rating:</span>
                                    <span className="font-semibold text-yellow-600">★ {doctor.rating}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Utilization:</span>
                                    <span className="font-semibold text-teal-600">{doctor.utilization}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bed Utilization */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                    <HeartPulse className="w-6 h-6 text-teal-600" />
                    Bed Utilization Analysis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {bedUtilization.map((bed, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="font-semibold text-gray-800 mb-3">{bed.type}</p>
                            <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Occupancy</span>
                                    <span className="font-semibold text-gray-800">{bed.occupancy}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-600 transition-all duration-500"
                                        style={{ width: `${bed.occupancy}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Capacity:</span>
                                    <span className="font-medium text-gray-800">{bed.capacity} beds</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">ALOS:</span>
                                    <span className="font-medium text-gray-800">{bed.alos} days</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md border-2 border-green-200 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-6 h-6 text-green-600" />
                        <h3 className="font-bold text-gray-800">Peak Efficiency</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-700">92.5%</p>
                    <p className="text-sm text-gray-600 mt-1">Operating at optimal capacity</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-md border-2 border-blue-200 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-6 h-6 text-blue-600" />
                        <h3 className="font-bold text-gray-800">Avg Wait Time</h3>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">18 min</p>
                    <p className="text-sm text-gray-600 mt-1">Below target of 20 minutes</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md border-2 border-purple-200 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="w-6 h-6 text-purple-600" />
                        <h3 className="font-bold text-gray-800">Claim Approval</h3>
                    </div>
                    <p className="text-3xl font-bold text-purple-700">87.5%</p>
                    <p className="text-sm text-gray-600 mt-1">Insurance claim success rate</p>
                </div>
            </div>
        </div>
    );
};
