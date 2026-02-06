import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { 
    Users, Calendar, Clock, ChevronLeft, Check, X, Filter, Search,
    CalendarDays, AlertTriangle, PieChart, Download, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface LeaveRequest {
    id: string;
    staffId: string;
    staffName: string;
    staffRole: string;
    department: string;
    leaveType: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    appliedOn: string;
}

interface LeaveBalance {
    staffId: string;
    staffName: string;
    department: string;
    sick: { total: number; used: number; remaining: number };
    vacation: { total: number; used: number; remaining: number };
    personal: { total: number; used: number; remaining: number };
}

interface UnapprovedAbsence {
    id: string;
    staffName: string;
    department: string;
    date: string;
    shift: string;
    flagged: boolean;
}

const leaveTypes = [
    { value: 'sick', label: 'Sick Leave', color: 'bg-error-100 text-red-700' },
    { value: 'vacation', label: 'Vacation', color: 'bg-blue-100 text-blue-700' },
    { value: 'personal', label: 'Personal Leave', color: 'bg-purple-100 text-purple-700' },
    { value: 'maternity', label: 'Maternity Leave', color: 'bg-pink-100 text-pink-700' },
    { value: 'paternity', label: 'Paternity Leave', color: 'bg-cyan-100 text-cyan-700' },
    { value: 'unpaid', label: 'Unpaid Leave', color: 'bg-neutral-100 text-neutral-700' },
];

const mockLeaveRequests: LeaveRequest[] = [
    { id: '1', staffId: '1', staffName: 'Dr. Sarah Wilson', staffRole: 'Doctor', department: 'Cardiology', leaveType: 'vacation', startDate: '2025-12-20', endDate: '2025-12-25', days: 5, reason: 'Family vacation', status: 'pending', appliedOn: '2025-12-15' },
    { id: '2', staffId: '2', staffName: 'John Doe', staffRole: 'Nurse', department: 'Emergency', leaveType: 'sick', startDate: '2025-12-18', endDate: '2025-12-19', days: 2, reason: 'Flu symptoms', status: 'pending', appliedOn: '2025-12-17' },
    { id: '3', staffId: '3', staffName: 'Emily Chen', staffRole: 'Doctor', department: 'Pediatrics', leaveType: 'personal', startDate: '2025-12-22', endDate: '2025-12-22', days: 1, reason: 'Personal matter', status: 'approved', appliedOn: '2025-12-14' },
];

const mockLeaveBalances: LeaveBalance[] = [
    { staffId: '1', staffName: 'Dr. Sarah Wilson', department: 'Cardiology', sick: { total: 12, used: 3, remaining: 9 }, vacation: { total: 20, used: 5, remaining: 15 }, personal: { total: 5, used: 2, remaining: 3 } },
    { staffId: '2', staffName: 'John Doe', department: 'Emergency', sick: { total: 12, used: 8, remaining: 4 }, vacation: { total: 15, used: 10, remaining: 5 }, personal: { total: 5, used: 4, remaining: 1 } },
    { staffId: '3', staffName: 'Emily Chen', department: 'Pediatrics', sick: { total: 12, used: 1, remaining: 11 }, vacation: { total: 20, used: 8, remaining: 12 }, personal: { total: 5, used: 3, remaining: 2 } },
];

const mockAbsences: UnapprovedAbsence[] = [
    { id: '1', staffName: 'Mike Johnson', department: 'Radiology', date: '2025-12-16', shift: 'Morning', flagged: true },
    { id: '2', staffName: 'Lisa Wang', department: 'Lab', date: '2025-12-15', shift: 'Night', flagged: false },
];

export const LeaveManagement: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    
    const [activeTab, setActiveTab] = useState<'requests' | 'balances' | 'absences' | 'calendar'>('requests');
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
    const [leaveBalances] = useState<LeaveBalance[]>(mockLeaveBalances);
    const [absences, setAbsences] = useState<UnapprovedAbsence[]>(mockAbsences);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    const handleApproveLeave = (id: string) => {
        setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
        toast.success('Leave request approved');
    };

    const handleRejectLeave = (id: string) => {
        setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
        toast.success('Leave request rejected');
    };

    const handleFlagAbsence = (id: string) => {
        setAbsences(prev => prev.map(a => a.id === id ? { ...a, flagged: !a.flagged } : a));
        toast.success('Absence flagged for follow-up');
    };

    const filteredRequests = leaveRequests.filter(r => {
        if (filterStatus !== 'all' && r.status !== filterStatus) return false;
        if (filterType !== 'all' && r.leaveType !== filterType) return false;
        if (searchQuery && !r.staffName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;

    const SidebarMenu = () => (
        <nav className="py-4">
            <div className="px-4 mb-4">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Navigation</h2>
            </div>
            <ul className="space-y-1 px-2">
                {BranchAdminMenuItems.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                item.path === '/branch-admin/hrm'
                                    ? 'bg-gradient-to-r from-emerald-500 to-primary-500 text-white shadow-md'
                                    : 'text-neutral-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
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

    const getLeaveTypeStyle = (type: string) => {
        return leaveTypes.find(t => t.value === type)?.color || 'bg-neutral-100 text-neutral-700';
    };

    const tabs = [
        { id: 'requests', label: 'Leave Requests', icon: <Calendar className="w-4 h-4" />, count: pendingCount },
        { id: 'balances', label: 'Leave Balances', icon: <PieChart className="w-4 h-4" /> },
        { id: 'absences', label: 'Unapproved Absences', icon: <AlertTriangle className="w-4 h-4" />, count: absences.length },
        { id: 'calendar', label: 'Leave Calendar', icon: <CalendarDays className="w-4 h-4" /> },
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
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">Leave Management</h1>
                            <p className="text-neutral-500">Manage leave requests, balances, and track absences</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Pending Requests</p>
                                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Approved This Month</p>
                                <p className="text-2xl font-bold text-green-600">12</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Check className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Currently On Leave</p>
                                <p className="text-2xl font-bold text-primary-500">5</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <CalendarDays className="w-6 h-6 text-primary-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Flagged Absences</p>
                                <p className="text-2xl font-bold text-error-600">{absences.filter(a => a.flagged).length}</p>
                            </div>
                            <div className="p-3 bg-error-100 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-error-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                    <div className="border-b border-neutral-200">
                        <div className="flex overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className="ml-1 px-2 py-0.5 bg-error-500 text-white text-xs rounded-full">{tab.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Leave Requests Tab */}
                        {activeTab === 'requests' && (
                            <div className="space-y-4">
                                {/* Filters */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by staff name..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Types</option>
                                        {leaveTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Requests List */}
                                <div className="space-y-3">
                                    {filteredRequests.map(request => (
                                        <div key={request.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center">
                                                        <User className="w-6 h-6 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-neutral-800">{request.staffName}</h4>
                                                        <p className="text-sm text-neutral-500">{request.staffRole} • {request.department}</p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className={`px-2 py-0.5 rounded text-xs ${getLeaveTypeStyle(request.leaveType)}`}>
                                                                {leaveTypes.find(t => t.value === request.leaveType)?.label}
                                                            </span>
                                                            <span className="text-sm text-neutral-600">
                                                                {request.startDate} to {request.endDate} ({request.days} days)
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-neutral-600 mt-2">
                                                            <strong>Reason:</strong> {request.reason}
                                                        </p>
                                                        <p className="text-xs text-neutral-400 mt-1">Applied on {request.appliedOn}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    {request.status === 'pending' ? (
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleApproveLeave(request.id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                                                            >
                                                                <Check className="w-4 h-4" /> Approve
                                                            </button>
                                                            <button 
                                                                onClick={() => handleRejectLeave(request.id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-error-500 text-white rounded-lg hover:bg-red-600 text-sm"
                                                            >
                                                                <X className="w-4 h-4" /> Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className={`px-3 py-1 rounded-full text-sm ${
                                                            request.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-error-100 text-red-700'
                                                        }`}>
                                                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredRequests.length === 0 && (
                                        <p className="text-center text-neutral-500 py-8">No leave requests found</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Leave Balances Tab */}
                        {activeTab === 'balances' && (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-neutral-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Staff</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Department</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase">Sick Leave</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase">Vacation</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase">Personal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {leaveBalances.map(balance => (
                                                <tr key={balance.staffId} className="hover:bg-neutral-50">
                                                    <td className="px-4 py-3 font-medium text-neutral-800">{balance.staffName}</td>
                                                    <td className="px-4 py-3 text-neutral-600">{balance.department}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-semibold text-neutral-800">{balance.sick.remaining}/{balance.sick.total}</span>
                                                            <div className="w-20 h-2 bg-neutral-200 rounded-full mt-1">
                                                                <div 
                                                                    className="h-full bg-error-500 rounded-full" 
                                                                    style={{ width: `${(balance.sick.remaining / balance.sick.total) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-semibold text-neutral-800">{balance.vacation.remaining}/{balance.vacation.total}</span>
                                                            <div className="w-20 h-2 bg-neutral-200 rounded-full mt-1">
                                                                <div 
                                                                    className="h-full bg-primary-500 rounded-full" 
                                                                    style={{ width: `${(balance.vacation.remaining / balance.vacation.total) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-semibold text-neutral-800">{balance.personal.remaining}/{balance.personal.total}</span>
                                                            <div className="w-20 h-2 bg-neutral-200 rounded-full mt-1">
                                                                <div 
                                                                    className="h-full bg-purple-500 rounded-full" 
                                                                    style={{ width: `${(balance.personal.remaining / balance.personal.total) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Unapproved Absences Tab */}
                        {activeTab === 'absences' && (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    {absences.map(absence => (
                                        <div key={absence.id} className={`border rounded-lg p-4 ${absence.flagged ? 'border-red-300 bg-error-50' : 'border-neutral-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${absence.flagged ? 'bg-error-100' : 'bg-orange-100'}`}>
                                                        <AlertTriangle className={`w-5 h-5 ${absence.flagged ? 'text-error-600' : 'text-orange-600'}`} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-neutral-800">{absence.staffName}</h4>
                                                        <p className="text-sm text-neutral-500">{absence.department}</p>
                                                        <p className="text-sm text-neutral-600 mt-1">
                                                            Missed {absence.shift} on {absence.date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {absence.flagged && (
                                                        <span className="px-2 py-1 bg-error-100 text-red-700 rounded text-xs font-medium">Flagged</span>
                                                    )}
                                                    <button 
                                                        onClick={() => handleFlagAbsence(absence.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-sm ${
                                                            absence.flagged 
                                                                ? 'border border-neutral-300 hover:bg-neutral-50' 
                                                                : 'bg-error-500 text-white hover:bg-red-600'
                                                        }`}
                                                    >
                                                        {absence.flagged ? 'Unflag' : 'Flag for Follow-up'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {absences.length === 0 && (
                                        <p className="text-center text-neutral-500 py-8">No unapproved absences</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Leave Calendar Tab */}
                        {activeTab === 'calendar' && (
                            <div className="space-y-4">
                                <div className="text-center py-12">
                                    <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-neutral-600">Leave Calendar View</h3>
                                    <p className="text-neutral-500 mt-2">Interactive calendar showing all staff leaves - Coming soon</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
