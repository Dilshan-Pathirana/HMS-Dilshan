import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { 
    Users, Calendar, Clock, ChevronLeft, Download, Search, Filter,
    TrendingUp, TrendingDown, PieChart, Activity, FileText, BarChart3} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    lastGenerated: string;
    frequency: string;
}

interface DepartmentMetric {
    department: string;
    headcount: number;
    attendanceRate: number;
    turnoverRate: number;
    avgPerformance: number;
}

const mockReportTemplates: ReportTemplate[] = [
    { id: '1', name: 'Staff Attendance Summary', description: 'Monthly attendance statistics by department', category: 'Attendance', lastGenerated: '2025-12-01', frequency: 'Monthly' },
    { id: '2', name: 'Overtime Report', description: 'Overtime hours and costs breakdown', category: 'Payroll', lastGenerated: '2025-12-15', frequency: 'Bi-weekly' },
    { id: '3', name: 'Leave Balance Report', description: 'Leave balances for all staff members', category: 'Leave', lastGenerated: '2025-12-10', frequency: 'Monthly' },
    { id: '4', name: 'Performance Review Summary', description: 'Quarterly performance review results', category: 'Performance', lastGenerated: '2025-10-01', frequency: 'Quarterly' },
    { id: '5', name: 'Training Compliance Report', description: 'Training completion and certification status', category: 'Training', lastGenerated: '2025-12-05', frequency: 'Monthly' },
    { id: '6', name: 'Headcount Report', description: 'Staff headcount by department and role', category: 'HR', lastGenerated: '2025-12-18', frequency: 'Weekly' },
];

const mockDepartmentMetrics: DepartmentMetric[] = [
    { department: 'Cardiology', headcount: 12, attendanceRate: 96, turnoverRate: 5, avgPerformance: 4.5 },
    { department: 'Emergency', headcount: 18, attendanceRate: 92, turnoverRate: 12, avgPerformance: 4.2 },
    { department: 'Pediatrics', headcount: 10, attendanceRate: 98, turnoverRate: 3, avgPerformance: 4.7 },
    { department: 'Radiology', headcount: 8, attendanceRate: 95, turnoverRate: 8, avgPerformance: 4.3 },
    { department: 'Laboratory', headcount: 6, attendanceRate: 94, turnoverRate: 6, avgPerformance: 4.4 },
];

const monthlyTrends = [
    { month: 'Jul', headcount: 48, attendance: 94, turnover: 2 },
    { month: 'Aug', headcount: 50, attendance: 93, turnover: 1 },
    { month: 'Sep', headcount: 51, attendance: 95, turnover: 3 },
    { month: 'Oct', headcount: 52, attendance: 96, turnover: 1 },
    { month: 'Nov', headcount: 53, attendance: 94, turnover: 2 },
    { month: 'Dec', headcount: 54, attendance: 95, turnover: 1 },
];

export const StaffReports: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    
    const [activeTab, setActiveTab] = useState<'reports' | 'analytics' | 'custom'>('reports');
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    const filteredTemplates = mockReportTemplates.filter(t => 
        filterCategory === 'all' || t.category === filterCategory
    );

    const categories = [...new Set(mockReportTemplates.map(t => t.category))];

    const SidebarMenu = () => (
        <nav className="py-4">
            <div className="px-4 mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</h2>
            </div>
            <ul className="space-y-1 px-2">
                {BranchAdminMenuItems.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                item.path === '/branch-admin/hrm'
                                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
                            }`}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className="flex-1 font-medium text-left">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );

    const tabs = [
        { id: 'reports', label: 'Report Templates', icon: <FileText className="w-4 h-4" /> },
        { id: 'analytics', label: 'Analytics Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'custom', label: 'Custom Reports', icon: <Filter className="w-4 h-4" /> },
    ];

    // Calculate max height for chart visualization
    const maxHeadcount = Math.max(...monthlyTrends.map(t => t.headcount));

    return (
        <DashboardLayout 
            userName={userName}
            userRole="Branch Admin" 
            profileImage={profileImage}
            sidebarContent={<SidebarMenu />}
            branchName={branchName}
            branchLogo={branchLogo}
            userGender={userGender}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/branch-admin/hrm')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Reporting & Analytics</h1>
                            <p className="text-gray-500">Generate reports and view staff analytics</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Staff</p>
                                <p className="text-2xl font-bold text-gray-800">54</p>
                                <p className="text-xs text-green-600 flex items-center mt-1">
                                    <TrendingUp className="w-3 h-3 mr-1" /> +2 from last month
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Avg Attendance</p>
                                <p className="text-2xl font-bold text-emerald-600">95%</p>
                                <p className="text-xs text-green-600 flex items-center mt-1">
                                    <TrendingUp className="w-3 h-3 mr-1" /> +1% from last month
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <Activity className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Turnover Rate</p>
                                <p className="text-2xl font-bold text-orange-600">6.8%</p>
                                <p className="text-xs text-red-600 flex items-center mt-1">
                                    <TrendingDown className="w-3 h-3 mr-1" /> -0.5% from last month
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <TrendingDown className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Avg Performance</p>
                                <p className="text-2xl font-bold text-purple-600">4.4/5</p>
                                <p className="text-xs text-green-600 flex items-center mt-1">
                                    <TrendingUp className="w-3 h-3 mr-1" /> +0.2 from last quarter
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <PieChart className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <div className="flex overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Report Templates Tab */}
                        {activeTab === 'reports' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredTemplates.map(template => (
                                        <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                    {template.frequency}
                                                </span>
                                            </div>
                                            <h4 className="font-semibold text-gray-800">{template.name}</h4>
                                            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                                <span className="text-xs text-gray-400">Last: {template.lastGenerated}</span>
                                                <button className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600">
                                                    <Download className="w-4 h-4" /> Generate
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Analytics Dashboard Tab */}
                        {activeTab === 'analytics' && (
                            <div className="space-y-6">
                                {/* Headcount Trend Chart */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-800 mb-4">Headcount Trend (6 Months)</h4>
                                    <div className="h-48 flex items-end justify-around gap-4">
                                        {monthlyTrends.map((data, index) => (
                                            <div key={index} className="flex flex-col items-center">
                                                <div 
                                                    className="w-12 bg-gradient-to-t from-emerald-500 to-blue-500 rounded-t"
                                                    style={{ height: `${(data.headcount / maxHeadcount) * 150}px` }}
                                                ></div>
                                                <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                                                <span className="text-xs font-medium">{data.headcount}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Department Metrics */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-800 mb-4">Department Performance Metrics</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Headcount</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Attendance</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Turnover</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Performance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {mockDepartmentMetrics.map((metric, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-800">{metric.department}</td>
                                                        <td className="px-4 py-3 text-center">{metric.headcount}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                                                                metric.attendanceRate >= 95 ? 'bg-green-100 text-green-700' :
                                                                metric.attendanceRate >= 90 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                                {metric.attendanceRate}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                                                                metric.turnoverRate <= 5 ? 'bg-green-100 text-green-700' :
                                                                metric.turnoverRate <= 10 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                                {metric.turnoverRate}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <span className="font-medium">{metric.avgPerformance}</span>
                                                                <span className="text-yellow-500">★</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Key Insights */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-800 mb-3">Key Insights</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-2 text-sm">
                                                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                                                <span>Headcount increased by <strong>12.5%</strong> over 6 months</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm">
                                                <Activity className="w-4 h-4 text-blue-500 mt-0.5" />
                                                <span>Pediatrics has the highest attendance rate at <strong>98%</strong></span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm">
                                                <TrendingDown className="w-4 h-4 text-orange-500 mt-0.5" />
                                                <span>Emergency department shows elevated turnover at <strong>12%</strong></span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-800 mb-3">Recommendations</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-2 text-sm text-gray-600">
                                                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                                <span>Investigate high turnover in Emergency department</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm text-gray-600">
                                                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                                <span>Replicate Pediatrics' attendance strategies across departments</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm text-gray-600">
                                                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                                <span>Consider additional hiring for Radiology (understaffed)</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Custom Reports Tab */}
                        {activeTab === 'custom' && (
                            <div className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h4 className="font-semibold text-gray-800 mb-4">Build Custom Report</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                                            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                                <option>Staff List</option>
                                                <option>Attendance Report</option>
                                                <option>Leave Summary</option>
                                                <option>Training Status</option>
                                                <option>Performance Summary</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                                <option>All Departments</option>
                                                <option>Cardiology</option>
                                                <option>Emergency</option>
                                                <option>Pediatrics</option>
                                                <option>Radiology</option>
                                                <option>Laboratory</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                                            <div className="flex gap-2">
                                                <input type="date" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                                <span className="py-2">to</span>
                                                <input type="date" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Output Format</label>
                                            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                                <option>PDF</option>
                                                <option>Excel (XLSX)</option>
                                                <option>CSV</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Include Columns</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Name', 'Department', 'Position', 'Hire Date', 'Attendance', 'Leave Balance', 'Performance Score'].map(col => (
                                                <label key={col} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                                                    <input type="checkbox" defaultChecked className="rounded text-emerald-500" />
                                                    <span className="text-sm">{col}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                                        <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:opacity-90">
                                            <Download className="w-4 h-4" />
                                            Generate Report
                                        </button>
                                    </div>
                                </div>

                                {/* Recent Custom Reports */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-800 mb-3">Recent Custom Reports</h4>
                                    <div className="space-y-2">
                                        {[
                                            { name: 'Staff_Attendance_Dec2025.pdf', date: '2025-12-18', size: '245 KB' },
                                            { name: 'Leave_Balance_Q4_2025.xlsx', date: '2025-12-15', size: '156 KB' },
                                            { name: 'Emergency_Performance_Nov2025.pdf', date: '2025-12-10', size: '312 KB' },
                                        ].map((report, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-blue-500" />
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-800">{report.name}</p>
                                                        <p className="text-xs text-gray-500">{report.date} • {report.size}</p>
                                                    </div>
                                                </div>
                                                <button className="p-2 hover:bg-gray-200 rounded-lg">
                                                    <Download className="w-4 h-4 text-gray-600" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
