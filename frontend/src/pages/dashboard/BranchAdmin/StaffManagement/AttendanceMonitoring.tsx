import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import {
    Users, Calendar, Clock, ChevronLeft, Check, X, Filter, Search,
    AlertTriangle, Download, TrendingUp, TrendingDown, User, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface AttendanceLog {
    id: string;
    staffId: string;
    staffName: string;
    department: string;
    date: string;
    clockIn: string | null;
    clockOut: string | null;
    status: 'present' | 'late' | 'early-out' | 'absent';
    hoursWorked: number | null;
    shift: string;
}

interface DailyStats {
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    total: number;
}

interface ShiftCoverage {
    shift: string;
    required: number;
    present: number;
    coverage: number;
}

const mockAttendanceLogs: AttendanceLog[] = [
    { id: '1', staffId: '1', staffName: 'Dr. Sarah Wilson', department: 'Cardiology', date: '2025-12-18', clockIn: '08:02', clockOut: '17:05', status: 'present', hoursWorked: 9.05, shift: 'Morning' },
    { id: '2', staffId: '2', staffName: 'John Doe', department: 'Emergency', date: '2025-12-18', clockIn: '08:45', clockOut: null, status: 'late', hoursWorked: null, shift: 'Morning' },
    { id: '3', staffId: '3', staffName: 'Emily Chen', department: 'Pediatrics', date: '2025-12-18', clockIn: '07:55', clockOut: '14:30', status: 'early-out', hoursWorked: 6.58, shift: 'Morning' },
    { id: '4', staffId: '4', staffName: 'Mike Johnson', department: 'Radiology', date: '2025-12-18', clockIn: null, clockOut: null, status: 'absent', hoursWorked: null, shift: 'Morning' },
    { id: '5', staffId: '5', staffName: 'Lisa Wang', department: 'Lab', date: '2025-12-18', clockIn: '22:00', clockOut: null, status: 'present', hoursWorked: null, shift: 'Night' },
];

const mockDailyStats: DailyStats = {
    present: 42,
    late: 5,
    absent: 3,
    onLeave: 4,
    total: 54
};

const mockShiftCoverage: ShiftCoverage[] = [
    { shift: 'Morning (6AM-2PM)', required: 25, present: 23, coverage: 92 },
    { shift: 'Afternoon (2PM-10PM)', required: 20, present: 18, coverage: 90 },
    { shift: 'Night (10PM-6AM)', required: 10, present: 10, coverage: 100 },
];

export const AttendanceMonitoring: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');

    const [activeTab, setActiveTab] = useState<'logs' | 'coverage' | 'summary'>('logs');
    const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(mockAttendanceLogs);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    const handleMarkAttendance = (id: string, type: 'clockIn' | 'clockOut') => {
        const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        setAttendanceLogs(prev => prev.map(log => {
            if (log.id === id) {
                if (type === 'clockIn') {
                    return { ...log, clockIn: now, status: 'present' };
                } else {
                    const clockInTime = log.clockIn?.split(':').map(Number) || [8, 0];
                    const clockOutTime = now.split(':').map(Number);
                    const hours = (clockOutTime[0] * 60 + clockOutTime[1] - clockInTime[0] * 60 - clockInTime[1]) / 60;
                    return { ...log, clockOut: now, hoursWorked: Math.round(hours * 100) / 100 };
                }
            }
            return log;
        }));
        toast.success(`${type === 'clockIn' ? 'Clocked in' : 'Clocked out'} successfully`);
    };

    const filteredLogs = attendanceLogs.filter(log => {
        if (filterStatus !== 'all' && log.status !== filterStatus) return false;
        if (filterDepartment !== 'all' && log.department !== filterDepartment) return false;
        if (searchQuery && !log.staffName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const departments = [...new Set(attendanceLogs.map(l => l.department))];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-700';
            case 'late': return 'bg-yellow-100 text-yellow-700';
            case 'early-out': return 'bg-orange-100 text-orange-700';
            case 'absent': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'present': return 'Present';
            case 'late': return 'Late';
            case 'early-out': return 'Early Out';
            case 'absent': return 'Absent';
            default: return status;
        }
    };

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
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${item.path === '/branch-admin/hrm'
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
        { id: 'logs', label: 'Attendance Logs', icon: <Clock className="w-4 h-4" /> },
        { id: 'coverage', label: 'Shift Coverage', icon: <Users className="w-4 h-4" /> },
        { id: 'summary', label: 'Daily Summary', icon: <BarChart3 className="w-4 h-4" /> },
    ];

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
                            <h1 className="text-2xl font-bold text-gray-800">Attendance Monitoring</h1>
                            <p className="text-gray-500">Track staff attendance, shift coverage, and work hours</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Staff</p>
                                <p className="text-2xl font-bold text-gray-800">{mockDailyStats.total}</p>
                            </div>
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <Users className="w-6 h-6 text-gray-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Present</p>
                                <p className="text-2xl font-bold text-green-600">{mockDailyStats.present}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Check className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Late</p>
                                <p className="text-2xl font-bold text-yellow-600">{mockDailyStats.late}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Absent</p>
                                <p className="text-2xl font-bold text-red-600">{mockDailyStats.absent}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                                <X className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">On Leave</p>
                                <p className="text-2xl font-bold text-blue-600">{mockDailyStats.onLeave}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
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
                                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
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
                        {/* Attendance Logs Tab */}
                        {activeTab === 'logs' && (
                            <div className="space-y-4">
                                {/* Filters */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by staff name..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="present">Present</option>
                                        <option value="late">Late</option>
                                        <option value="early-out">Early Out</option>
                                        <option value="absent">Absent</option>
                                    </select>
                                    <select
                                        value={filterDepartment}
                                        onChange={(e) => setFilterDepartment(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Departments</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Logs Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Shift</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Clock In</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Clock Out</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Hours</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-emerald-600" />
                                                            </div>
                                                            <span className="font-medium text-gray-800">{log.staffName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">{log.department}</td>
                                                    <td className="px-4 py-3 text-gray-600">{log.shift}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {log.clockIn ? (
                                                            <span className="font-medium">{log.clockIn}</span>
                                                        ) : (
                                                            <span className="text-gray-400">--:--</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {log.clockOut ? (
                                                            <span className="font-medium">{log.clockOut}</span>
                                                        ) : (
                                                            <span className="text-gray-400">--:--</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {log.hoursWorked !== null ? (
                                                            <span className="font-medium">{log.hoursWorked}h</span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(log.status)}`}>
                                                            {getStatusLabel(log.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {!log.clockIn && (
                                                            <button
                                                                onClick={() => handleMarkAttendance(log.id, 'clockIn')}
                                                                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                                                            >
                                                                Clock In
                                                            </button>
                                                        )}
                                                        {log.clockIn && !log.clockOut && (
                                                            <button
                                                                onClick={() => handleMarkAttendance(log.id, 'clockOut')}
                                                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                                            >
                                                                Clock Out
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Shift Coverage Tab */}
                        {activeTab === 'coverage' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {mockShiftCoverage.map((shift, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-gray-800">{shift.shift}</h4>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${shift.coverage >= 95 ? 'bg-green-100 text-green-700' :
                                                        shift.coverage >= 80 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {shift.coverage}% Coverage
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Required</span>
                                                    <span className="font-medium">{shift.required}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Present</span>
                                                    <span className="font-medium text-green-600">{shift.present}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Shortage</span>
                                                    <span className="font-medium text-red-600">{shift.required - shift.present}</span>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <div className="w-full h-3 bg-gray-200 rounded-full">
                                                    <div
                                                        className={`h-full rounded-full ${shift.coverage >= 95 ? 'bg-green-500' :
                                                                shift.coverage >= 80 ? 'bg-yellow-500' :
                                                                    'bg-red-500'
                                                            }`}
                                                        style={{ width: `${shift.coverage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Coverage Alerts */}
                                <div className="mt-6">
                                    <h4 className="font-semibold text-gray-800 mb-3">Coverage Alerts</h4>
                                    <div className="space-y-2">
                                        {mockShiftCoverage.filter(s => s.coverage < 100).map((shift, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                                <p className="text-sm text-yellow-800">
                                                    <strong>{shift.shift}</strong> is {shift.required - shift.present} staff members short. Consider calling in on-call staff.
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Daily Summary Tab */}
                        {activeTab === 'summary' && (
                            <div className="space-y-6">
                                {/* Attendance Chart Placeholder */}
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                    <h4 className="font-semibold text-gray-800 mb-4">Attendance Distribution</h4>
                                    <div className="flex items-center justify-center h-48">
                                        <div className="flex items-end gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 bg-green-500 rounded-t" style={{ height: '160px' }}></div>
                                                <span className="text-xs text-gray-600 mt-2">Present</span>
                                                <span className="text-sm font-medium">{mockDailyStats.present}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 bg-yellow-500 rounded-t" style={{ height: '40px' }}></div>
                                                <span className="text-xs text-gray-600 mt-2">Late</span>
                                                <span className="text-sm font-medium">{mockDailyStats.late}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 bg-red-500 rounded-t" style={{ height: '25px' }}></div>
                                                <span className="text-xs text-gray-600 mt-2">Absent</span>
                                                <span className="text-sm font-medium">{mockDailyStats.absent}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 bg-blue-500 rounded-t" style={{ height: '35px' }}></div>
                                                <span className="text-xs text-gray-600 mt-2">On Leave</span>
                                                <span className="text-sm font-medium">{mockDailyStats.onLeave}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-green-100 rounded-lg">
                                                <TrendingUp className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Attendance Rate</p>
                                                <p className="text-xl font-bold text-gray-800">
                                                    {Math.round((mockDailyStats.present / mockDailyStats.total) * 100)}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-yellow-100 rounded-lg">
                                                <Clock className="w-6 h-6 text-yellow-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Punctuality Rate</p>
                                                <p className="text-xl font-bold text-gray-800">
                                                    {Math.round(((mockDailyStats.present - mockDailyStats.late) / mockDailyStats.present) * 100)}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-blue-100 rounded-lg">
                                                <TrendingDown className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Avg Hours Worked</p>
                                                <p className="text-xl font-bold text-gray-800">8.2h</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Department Breakdown */}
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <h4 className="font-semibold text-gray-800 mb-4">Department Breakdown</h4>
                                    <div className="space-y-3">
                                        {departments.map((dept, index) => {
                                            const deptLogs = attendanceLogs.filter(l => l.department === dept);
                                            const present = deptLogs.filter(l => l.status === 'present' || l.status === 'late').length;
                                            const rate = Math.round((present / deptLogs.length) * 100);
                                            return (
                                                <div key={index} className="flex items-center gap-4">
                                                    <span className="w-24 text-sm text-gray-600">{dept}</span>
                                                    <div className="flex-1 h-3 bg-gray-200 rounded-full">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full"
                                                            style={{ width: `${rate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium w-12 text-right">{rate}%</span>
                                                </div>
                                            );
                                        })}
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
