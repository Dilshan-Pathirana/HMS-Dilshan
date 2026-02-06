import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Calendar, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const EmployeeShifts: React.FC = () => {
    const navigate = useNavigate();

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const upcomingShifts = [
        { id: 1, date: 'Tomorrow', day: 'Wednesday', time: '08:00 AM - 04:00 PM', type: 'Morning Shift', acknowledged: false },
        { id: 2, date: 'Jan 16', day: 'Thursday', time: '08:00 AM - 04:00 PM', type: 'Morning Shift', acknowledged: false },
        { id: 3, date: 'Jan 17', day: 'Friday', time: '04:00 PM - 12:00 AM', type: 'Evening Shift', acknowledged: false },
        { id: 4, date: 'Jan 18', day: 'Saturday', time: 'OFF', type: 'Day Off', acknowledged: true },
        { id: 5, date: 'Jan 19', day: 'Sunday', time: 'OFF', type: 'Day Off', acknowledged: true },
        { id: 6, date: 'Jan 20', day: 'Monday', time: '08:00 AM - 04:00 PM', type: 'Morning Shift', acknowledged: false },
    ];

    const shiftHistory = [
        { id: 1, date: 'Jan 14', time: '08:00 AM - 04:00 PM', type: 'Morning Shift', clockIn: '07:55 AM', clockOut: '04:15 PM', hours: 8.3, overtime: 0.25 },
        { id: 2, date: 'Jan 13', time: '08:00 AM - 04:00 PM', type: 'Morning Shift', clockIn: '08:02 AM', clockOut: '04:00 PM', hours: 8.0, overtime: 0 },
        { id: 3, date: 'Jan 12', time: '04:00 PM - 12:00 AM', type: 'Evening Shift', clockIn: '03:58 PM', clockOut: '12:30 AM', hours: 8.5, overtime: 0.5 },
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
                            <h1 className="text-2xl font-bold text-neutral-800">My Shifts</h1>
                            <p className="text-neutral-500">View your schedule and acknowledge shifts</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
                        <p className="text-neutral-500 text-sm">This Week</p>
                        <p className="text-2xl font-bold text-neutral-800 mt-1">5 shifts</p>
                        <p className="text-xs text-neutral-500 mt-1">40 hours scheduled</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
                        <p className="text-neutral-500 text-sm">Hours This Month</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">156 hrs</p>
                        <p className="text-xs text-neutral-500 mt-1">of 176 hrs target</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
                        <p className="text-neutral-500 text-sm">Overtime This Month</p>
                        <p className="text-2xl font-bold text-purple-600 mt-1">8.5 hrs</p>
                        <p className="text-xs text-neutral-500 mt-1">LKR 12,750 earned</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
                        <p className="text-neutral-500 text-sm">Pending Acknowledgment</p>
                        <p className="text-2xl font-bold text-orange-600 mt-1">4</p>
                        <p className="text-xs text-neutral-500 mt-1">shifts to confirm</p>
                    </div>
                </div>

                {/* Upcoming Shifts */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-neutral-800">Upcoming Schedule</h2>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-neutral-100 rounded-lg">
                                <ChevronLeft className="w-5 h-5 text-neutral-600" />
                            </button>
                            <span className="text-sm font-medium text-neutral-700">{currentMonth}</span>
                            <button className="p-2 hover:bg-neutral-100 rounded-lg">
                                <ChevronRight className="w-5 h-5 text-neutral-600" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {upcomingShifts.map((shift) => (
                            <div 
                                key={shift.id} 
                                className={`flex items-center justify-between p-4 rounded-lg border ${
                                    shift.type === 'Day Off' 
                                        ? 'bg-neutral-50 border-neutral-200' 
                                        : shift.acknowledged 
                                        ? 'bg-emerald-50 border-emerald-200' 
                                        : 'bg-orange-50 border-orange-200'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-center min-w-[60px]">
                                        <p className="text-sm font-bold text-neutral-800">{shift.date}</p>
                                        <p className="text-xs text-neutral-500">{shift.day}</p>
                                    </div>
                                    <div className="w-px h-10 bg-neutral-300"></div>
                                    <div>
                                        <p className="font-medium text-neutral-800">{shift.time}</p>
                                        <p className={`text-sm ${
                                            shift.type === 'Morning Shift' ? 'text-primary-500' :
                                            shift.type === 'Evening Shift' ? 'text-purple-600' :
                                            shift.type === 'Night Shift' ? 'text-indigo-600' :
                                            'text-neutral-500'
                                        }`}>{shift.type}</p>
                                    </div>
                                </div>
                                <div>
                                    {shift.type === 'Day Off' ? (
                                        <span className="text-neutral-500 text-sm">-</span>
                                    ) : shift.acknowledged ? (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                            <CheckCircle className="w-4 h-4" />
                                            Acknowledged
                                        </span>
                                    ) : (
                                        <button className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium">
                                            <CheckCircle className="w-4 h-4" />
                                            Acknowledge
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shift History */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-4">Recent Shift History</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Scheduled</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Type</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Clock In</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Clock Out</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Hours</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Overtime</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shiftHistory.map((shift) => (
                                    <tr key={shift.id} className="border-b border-gray-100 hover:bg-neutral-50">
                                        <td className="py-3 px-4 font-medium text-neutral-800">{shift.date}</td>
                                        <td className="py-3 px-4 text-neutral-600">{shift.time}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                shift.type === 'Morning Shift' ? 'bg-blue-100 text-blue-700' :
                                                shift.type === 'Evening Shift' ? 'bg-purple-100 text-purple-700' :
                                                'bg-indigo-100 text-indigo-700'
                                            }`}>
                                                {shift.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-neutral-600">{shift.clockIn}</td>
                                        <td className="py-3 px-4 text-neutral-600">{shift.clockOut}</td>
                                        <td className="py-3 px-4 text-neutral-600">{shift.hours} hrs</td>
                                        <td className="py-3 px-4">
                                            {shift.overtime > 0 ? (
                                                <span className="text-purple-600 font-medium">+{shift.overtime} hrs</span>
                                            ) : (
                                                <span className="text-neutral-400">-</span>
                                            )}
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

export default EmployeeShifts;
