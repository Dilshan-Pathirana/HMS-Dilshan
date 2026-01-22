import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const BranchAttendance: React.FC = () => {
    const navigate = useNavigate();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const attendanceData = [
        { id: 1, name: 'Dr. John Smith', role: 'Doctor', clockIn: '08:05 AM', clockOut: '04:30 PM', status: 'present', hours: 8.4 },
        { id: 2, name: 'Nurse Mary Johnson', role: 'Nurse', clockIn: '07:58 AM', clockOut: '-', status: 'present', hours: 6.2 },
        { id: 3, name: 'Tom Wilson', role: 'Cashier', clockIn: '09:15 AM', clockOut: '-', status: 'late', hours: 5.0 },
        { id: 4, name: 'Dr. Sarah Brown', role: 'Doctor', clockIn: '-', clockOut: '-', status: 'leave', hours: 0 },
        { id: 5, name: 'Pharmacist David Lee', role: 'Pharmacist', clockIn: '-', clockOut: '-', status: 'absent', hours: 0 },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
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
                            <h1 className="text-2xl font-bold text-gray-800">Attendance & Shifts</h1>
                            <p className="text-gray-500">{today}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="date" className="px-4 py-2 border border-gray-300 rounded-lg" />
                        <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                            Mark Attendance
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <span className="text-emerald-800 font-medium">Present</span>
                        </div>
                        <p className="text-3xl font-bold text-emerald-700">38</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <span className="text-orange-800 font-medium">Late</span>
                        </div>
                        <p className="text-3xl font-bold text-orange-700">3</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <span className="text-blue-800 font-medium">On Leave</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-700">2</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="text-red-800 font-medium">Absent</span>
                        </div>
                        <p className="text-3xl font-bold text-red-700">2</p>
                    </div>
                </div>

                {/* Attendance Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Employee</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Role</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Clock In</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Clock Out</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Hours</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceData.map((record) => (
                                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-4 px-6 font-medium text-gray-800">{record.name}</td>
                                    <td className="py-4 px-6 text-gray-600">{record.role}</td>
                                    <td className="py-4 px-6 text-gray-600">{record.clockIn}</td>
                                    <td className="py-4 px-6 text-gray-600">{record.clockOut}</td>
                                    <td className="py-4 px-6 text-gray-600">{record.hours > 0 ? `${record.hours} hrs` : '-'}</td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                            record.status === 'late' ? 'bg-orange-100 text-orange-700' :
                                            record.status === 'leave' ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BranchAttendance;
