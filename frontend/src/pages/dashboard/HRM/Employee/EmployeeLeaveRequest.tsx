import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const EmployeeLeaveRequest: React.FC = () => {
    const navigate = useNavigate();
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [leaveForm, setLeaveForm] = useState({
        type: 'annual',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const leaveBalance = {
        annual: { total: 21, used: 7, balance: 14 },
        casual: { total: 7, used: 0, balance: 7 },
        medical: { total: 14, used: 0, balance: 14 }
    };

    const leaveHistory = [
        { id: 1, type: 'Annual Leave', dates: 'Dec 24 - Dec 26, 2024', days: 3, status: 'approved', appliedOn: 'Dec 15, 2024' },
        { id: 2, type: 'Casual Leave', dates: 'Nov 15, 2024', days: 1, status: 'approved', appliedOn: 'Nov 10, 2024' },
        { id: 3, type: 'Medical Leave', dates: 'Oct 5 - Oct 6, 2024', days: 2, status: 'approved', appliedOn: 'Oct 5, 2024' },
        { id: 4, type: 'Annual Leave', dates: 'Jan 20, 2025', days: 1, status: 'pending', appliedOn: 'Jan 5, 2025' },
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
                            <h1 className="text-2xl font-bold text-neutral-800">Leave Management</h1>
                            <p className="text-neutral-500">Apply for leave and track your balance</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowApplyModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                        <Plus className="w-4 h-4" />
                        Apply Leave
                    </button>
                </div>

                {/* Leave Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                        <h3 className="text-blue-100 text-sm">Annual Leave</h3>
                        <div className="flex items-end justify-between mt-2">
                            <div>
                                <p className="text-3xl font-bold">{leaveBalance.annual.balance}</p>
                                <p className="text-blue-200 text-xs">days remaining</p>
                            </div>
                            <div className="text-right text-sm text-blue-200">
                                <p>Total: {leaveBalance.annual.total}</p>
                                <p>Used: {leaveBalance.annual.used}</p>
                            </div>
                        </div>
                        <div className="mt-3 w-full bg-blue-400 rounded-full h-2">
                            <div 
                                className="bg-white h-2 rounded-full" 
                                style={{ width: `${(leaveBalance.annual.balance / leaveBalance.annual.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
                        <h3 className="text-orange-100 text-sm">Casual Leave</h3>
                        <div className="flex items-end justify-between mt-2">
                            <div>
                                <p className="text-3xl font-bold">{leaveBalance.casual.balance}</p>
                                <p className="text-orange-200 text-xs">days remaining</p>
                            </div>
                            <div className="text-right text-sm text-orange-200">
                                <p>Total: {leaveBalance.casual.total}</p>
                                <p>Used: {leaveBalance.casual.used}</p>
                            </div>
                        </div>
                        <div className="mt-3 w-full bg-orange-400 rounded-full h-2">
                            <div 
                                className="bg-white h-2 rounded-full" 
                                style={{ width: `${(leaveBalance.casual.balance / leaveBalance.casual.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
                        <h3 className="text-emerald-100 text-sm">Medical Leave</h3>
                        <div className="flex items-end justify-between mt-2">
                            <div>
                                <p className="text-3xl font-bold">{leaveBalance.medical.balance}</p>
                                <p className="text-emerald-200 text-xs">days remaining</p>
                            </div>
                            <div className="text-right text-sm text-emerald-200">
                                <p>Total: {leaveBalance.medical.total}</p>
                                <p>Used: {leaveBalance.medical.used}</p>
                            </div>
                        </div>
                        <div className="mt-3 w-full bg-emerald-400 rounded-full h-2">
                            <div 
                                className="bg-white h-2 rounded-full" 
                                style={{ width: `${(leaveBalance.medical.balance / leaveBalance.medical.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Leave History */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-4">Leave History</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Leave Type</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Dates</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Days</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Applied On</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveHistory.map((leave) => (
                                    <tr key={leave.id} className="border-b border-gray-100 hover:bg-neutral-50">
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                leave.type === 'Annual Leave' ? 'bg-blue-100 text-blue-700' :
                                                leave.type === 'Medical Leave' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {leave.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-neutral-600">{leave.dates}</td>
                                        <td className="py-3 px-4 text-neutral-600">{leave.days} day{leave.days > 1 ? 's' : ''}</td>
                                        <td className="py-3 px-4 text-neutral-500 text-sm">{leave.appliedOn}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                                                leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-error-100 text-red-700'
                                            }`}>
                                                {leave.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                                {leave.status === 'pending' && <Clock className="w-3 h-3" />}
                                                {leave.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Apply Leave Modal */}
                {showApplyModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold text-neutral-800 mb-4">Apply for Leave</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Leave Type</label>
                                    <select 
                                        value={leaveForm.type}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="annual">Annual Leave ({leaveBalance.annual.balance} days available)</option>
                                        <option value="casual">Casual Leave ({leaveBalance.casual.balance} days available)</option>
                                        <option value="medical">Medical Leave ({leaveBalance.medical.balance} days available)</option>
                                        <option value="nopay">No-Pay Leave</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
                                        <input 
                                            type="date" 
                                            value={leaveForm.startDate}
                                            onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">End Date</label>
                                        <input 
                                            type="date" 
                                            value={leaveForm.endDate}
                                            onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Reason</label>
                                    <textarea 
                                        value={leaveForm.reason}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        placeholder="Enter reason for leave..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button 
                                    onClick={() => setShowApplyModal(false)}
                                    className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>
                                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeLeaveRequest;
