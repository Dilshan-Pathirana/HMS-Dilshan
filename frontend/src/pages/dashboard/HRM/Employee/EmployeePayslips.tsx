import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ArrowLeft, Download, Eye, Printer, Calendar, Shield } from 'lucide-react';

const EmployeePayslips: React.FC = () => {
    const navigate = useNavigate();

    const payslips = [
        { id: 1, month: 'December 2024', grossSalary: 195000, deductions: 25600, netSalary: 169400, status: 'paid', paidOn: '2024-12-31' },
        { id: 2, month: 'November 2024', grossSalary: 195000, deductions: 25600, netSalary: 169400, status: 'paid', paidOn: '2024-11-30' },
        { id: 3, month: 'October 2024', grossSalary: 195000, deductions: 25600, netSalary: 169400, status: 'paid', paidOn: '2024-10-31' },
        { id: 4, month: 'September 2024', grossSalary: 195000, deductions: 25600, netSalary: 169400, status: 'paid', paidOn: '2024-09-30' },
        { id: 5, month: 'August 2024', grossSalary: 195000, deductions: 25600, netSalary: 169400, status: 'paid', paidOn: '2024-08-31' },
        { id: 6, month: 'July 2024', grossSalary: 195000, deductions: 25600, netSalary: 169400, status: 'paid', paidOn: '2024-07-31' },
    ];

    const latestPayslip = payslips[0];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard/hrm')}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">My Payslips</h1>
                            <p className="text-gray-500">View and download your monthly payslips</p>
                        </div>
                    </div>
                </div>

                {/* Latest Payslip Preview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Latest Payslip</h2>
                                <p className="text-sm text-gray-500">{latestPayslip.month}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                <Eye className="w-4 h-4" />
                                View
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    </div>

                    {/* Payslip Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Earnings */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-gray-700 mb-4">Earnings</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Basic Salary</span>
                                    <span className="font-medium">LKR 150,000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Medical Allowance</span>
                                    <span className="font-medium">LKR 15,000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Transport Allowance</span>
                                    <span className="font-medium">LKR 10,000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Housing Allowance</span>
                                    <span className="font-medium">LKR 20,000</span>
                                </div>
                                <div className="flex justify-between border-t pt-3">
                                    <span className="font-medium text-gray-700">Gross Salary</span>
                                    <span className="font-bold text-gray-800">LKR 195,000</span>
                                </div>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-gray-700 mb-4">Deductions</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">EPF (Employee 8%)</span>
                                    <span className="font-medium text-red-600">- LKR 12,000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax (PAYE)</span>
                                    <span className="font-medium text-red-600">- LKR 13,600</span>
                                </div>
                                <div className="flex justify-between border-t pt-3">
                                    <span className="font-medium text-gray-700">Total Deductions</span>
                                    <span className="font-bold text-red-600">- LKR 25,600</span>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-sm font-medium">Employer Contributions</span>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">EPF (12%): LKR 18,000 | ETF (3%): LKR 4,500</p>
                            </div>
                        </div>
                    </div>

                    {/* Net Salary */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg text-white">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-medium">Net Salary</span>
                            <span className="text-3xl font-bold">LKR {latestPayslip.netSalary.toLocaleString()}</span>
                        </div>
                        <p className="text-emerald-100 text-sm mt-1">Paid on {latestPayslip.paidOn}</p>
                    </div>
                </div>

                {/* Payslip History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Payslip History</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Month</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Gross Salary</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Deductions</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Net Salary</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payslips.map((payslip) => (
                                    <tr key={payslip.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-gray-800">{payslip.month}</td>
                                        <td className="py-3 px-4 text-gray-600">LKR {payslip.grossSalary.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-red-600">- LKR {payslip.deductions.toLocaleString()}</td>
                                        <td className="py-3 px-4 font-semibold text-emerald-600">LKR {payslip.netSalary.toLocaleString()}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                                Paid
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeePayslips;
