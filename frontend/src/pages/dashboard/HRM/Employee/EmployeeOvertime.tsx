import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowLeft, Clock, DollarSign, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const EmployeeOvertime: React.FC = () => {
    const navigate = useNavigate();

    const overtimeSummary = {
        thisMonth: { hours: 12.5, amount: 18750 },
        lastMonth: { hours: 8, amount: 12000 },
        pending: { hours: 3, amount: 4500 },
        approved: { hours: 9.5, amount: 14250 }
    };

    const overtimeHistory = [
        { id: 1, date: 'Jan 14, 2025', hours: 2.5, rate: 1500, amount: 3750, reason: 'Emergency patient care', status: 'approved' },
        { id: 2, date: 'Jan 10, 2025', hours: 3, rate: 1500, amount: 4500, reason: 'Surgery extended', status: 'pending' },
        { id: 3, date: 'Jan 5, 2025', hours: 2, rate: 1500, amount: 3000, reason: 'Staff shortage coverage', status: 'approved' },
        { id: 4, date: 'Dec 28, 2024', hours: 3.5, rate: 1500, amount: 5250, reason: 'Holiday shift extension', status: 'approved' },
        { id: 5, date: 'Dec 20, 2024', hours: 1.5, rate: 1500, amount: 2250, reason: 'Late patient', status: 'approved' },
    ];

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard/hrm')}
                            className="p-2 hover:bg-neutral-200 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">My Overtime</h1>
                            <p className="text-neutral-500">Track your overtime hours and earnings</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-purple-200" />
                            <span className="text-purple-100 text-sm">This Month</span>
                        </div>
                        <p className="text-3xl font-bold">{overtimeSummary.thisMonth.hours} hrs</p>
                        <p className="text-purple-200 text-sm mt-1">LKR {overtimeSummary.thisMonth.amount.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-neutral-400" />
                            <span className="text-neutral-500 text-sm">Last Month</span>
                        </div>
                        <p className="text-2xl font-bold text-neutral-800">{overtimeSummary.lastMonth.hours} hrs</p>
                        <p className="text-neutral-500 text-sm mt-1">LKR {overtimeSummary.lastMonth.amount.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            <span className="text-neutral-500 text-sm">Pending Approval</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{overtimeSummary.pending.hours} hrs</p>
                        <p className="text-neutral-500 text-sm mt-1">LKR {overtimeSummary.pending.amount.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span className="text-neutral-500 text-sm">Approved</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">{overtimeSummary.approved.hours} hrs</p>
                        <p className="text-neutral-500 text-sm mt-1">LKR {overtimeSummary.approved.amount.toLocaleString()}</p>
                    </div>
                </div>

                {/* OT Rate Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-primary-500" />
                        <div>
                            <h3 className="font-semibold text-blue-800">Your Overtime Rate</h3>
                            <p className="text-sm text-blue-700">
                                Based on your basic salary, your OT rate is <strong>LKR 1,500/hour</strong> (150% of hourly rate)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overtime History */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-4">Overtime History</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Hours</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Rate</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Amount</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Reason</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overtimeHistory.map((ot) => (
                                    <tr key={ot.id} className="border-b border-gray-100 hover:bg-neutral-50">
                                        <td className="py-3 px-4 font-medium text-neutral-800">{ot.date}</td>
                                        <td className="py-3 px-4 text-neutral-600">{ot.hours} hrs</td>
                                        <td className="py-3 px-4 text-neutral-600">LKR {ot.rate}/hr</td>
                                        <td className="py-3 px-4 font-semibold text-purple-600">LKR {ot.amount.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-neutral-600 text-sm">{ot.reason}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                                                ot.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                ot.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-error-100 text-red-700'
                                            }`}>
                                                {ot.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                                {ot.status === 'pending' && <AlertCircle className="w-3 h-3" />}
                                                {ot.status.charAt(0).toUpperCase() + ot.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Year to Date Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mt-6">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-4">Year to Date Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-neutral-50 rounded-lg">
                            <p className="text-3xl font-bold text-neutral-800">145.5</p>
                            <p className="text-neutral-500 text-sm mt-1">Total OT Hours</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-3xl font-bold text-purple-600">LKR 218,250</p>
                            <p className="text-neutral-500 text-sm mt-1">Total OT Earnings</p>
                        </div>
                        <div className="text-center p-4 bg-emerald-50 rounded-lg">
                            <p className="text-3xl font-bold text-emerald-600">12.1</p>
                            <p className="text-neutral-500 text-sm mt-1">Avg Hours/Month</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeOvertime;
