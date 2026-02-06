import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft, Download, Calendar, Filter, Building2 } from 'lucide-react';

const HRMReports: React.FC = () => {
    const navigate = useNavigate();

    const reportCategories = [
        {
            title: 'Payroll Reports',
            reports: [
                { name: 'Monthly Payroll Summary', description: 'Payroll costs by branch and department' },
                { name: 'EPF/ETF Statement', description: 'Monthly statutory contribution report' },
                { name: 'Salary Comparison', description: 'Year-over-year salary analysis' },
            ]
        },
        {
            title: 'Attendance Reports',
            reports: [
                { name: 'Daily Attendance', description: 'Staff attendance by branch' },
                { name: 'Late Arrivals Report', description: 'Late marks and patterns' },
                { name: 'Overtime Summary', description: 'OT hours and costs by staff' },
            ]
        },
        {
            title: 'Leave Reports',
            reports: [
                { name: 'Leave Balance', description: 'Current leave balances for all staff' },
                { name: 'Leave Utilization', description: 'Leave usage patterns and trends' },
                { name: 'Absence Report', description: 'Unplanned absences and no-shows' },
            ]
        },
        {
            title: 'Staff Reports',
            reports: [
                { name: 'Headcount Report', description: 'Staff count by branch, role, and type' },
                { name: 'Turnover Analysis', description: 'Staff exits and retention rates' },
                { name: 'Service Length Report', description: 'Staff by years of service' },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/super-admin/hrm')}
                            className="p-2 hover:bg-neutral-200 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">HR Analytics & Reports</h1>
                            <p className="text-neutral-500">Generate and download HR reports across all branches</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-neutral-400" />
                            <select className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                <option>December 2024</option>
                                <option>November 2024</option>
                                <option>October 2024</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-neutral-400" />
                            <select className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                <option>All Branches</option>
                                <option>Main Branch</option>
                                <option>Branch 2</option>
                                <option>Branch 3</option>
                            </select>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                            <Filter className="w-4 h-4" />
                            More Filters
                        </button>
                    </div>
                </div>

                {/* Report Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reportCategories.map((category, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                            <h2 className="text-lg font-semibold text-neutral-800 mb-4">{category.title}</h2>
                            <div className="space-y-3">
                                {category.reports.map((report, rIndex) => (
                                    <div 
                                        key={rIndex}
                                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer"
                                    >
                                        <div>
                                            <p className="font-medium text-neutral-800">{report.name}</p>
                                            <p className="text-sm text-neutral-500">{report.description}</p>
                                        </div>
                                        <button className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                            <Download className="w-4 h-4" />
                                            <span className="text-sm">Export</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                        <p className="text-blue-100 text-sm">Total Employees</p>
                        <p className="text-3xl font-bold mt-1">156</p>
                        <p className="text-blue-200 text-xs mt-1">Across all branches</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
                        <p className="text-emerald-100 text-sm">Monthly Payroll</p>
                        <p className="text-3xl font-bold mt-1">12.4M</p>
                        <p className="text-emerald-200 text-xs mt-1">LKR this month</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                        <p className="text-purple-100 text-sm">EPF/ETF Total</p>
                        <p className="text-3xl font-bold mt-1">2.85M</p>
                        <p className="text-purple-200 text-xs mt-1">LKR this month</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
                        <p className="text-orange-100 text-sm">Overtime Cost</p>
                        <p className="text-3xl font-bold mt-1">485K</p>
                        <p className="text-orange-200 text-xs mt-1">LKR this month</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRMReports;
