import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../components/common/Layout/BranchAdminSidebar';
import { 
    Clock, Activity, TrendingUp, Users, Calendar,
    UserCheck, Stethoscope, DollarSign, FileText, User
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
    totalStaff: number;
    totalDoctors: number;
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    pendingApprovals: number;
    pendingScheduleRequests: number;
    approvedSchedules: number;
    pendingLeaveRequests: number;
}

export const BranchAdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalStaff: 0,
        totalDoctors: 0,
        totalPatients: 0,
        todayAppointments: 0,
        monthlyRevenue: 0,
        pendingApprovals: 0,
        pendingScheduleRequests: 0,
        approvedSchedules: 0,
        pendingLeaveRequests: 0,
    });
    const [userName, setUserName] = useState('Branch Admin');
    const [profileImage, setProfileImage] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [loading, setLoading] = useState(true);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/branch-admin/dashboard-stats');
                if (response.data.status === 200) {
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }

            // Fetch total pending requests count (PRs + Cash Entries + EOD Reports)
            try {
                const requestsResponse = await axios.get('/api/branch-admin/requests/stats');
                if (requestsResponse.data.success) {
                    setPendingRequestsCount(requestsResponse.data.data.total_pending_requests || 0);
                }
            } catch (error) {
                console.error('Failed to fetch pending requests count:', error);
            }

            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
            setProfileImage(userInfo.profile_picture || '');
            setBranchName(userInfo.branch_name || userInfo.branch?.name || 'Branch');
            setBranchLogo(userInfo.branch_logo || userInfo.branch?.logo || '');
            setUserGender(userInfo.gender || '');
            setLoading(false);
        };
        fetchData();
    }, []);

    const StatCard = ({ title, value, icon, color, trend }: { 
        title: string; 
        value: number | string; 
        icon: React.ReactNode; 
        color: string;
        trend?: string;
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
                    {trend && (
                        <p className="text-emerald-600 text-sm mt-1 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout 
            userName={userName} 
            userRole="Branch Admin" 
            profileImage={profileImage}
            sidebarContent={<BranchAdminSidebar />}
            branchName={branchName}
            branchLogo={branchLogo}
            userGender={userGender}
        >
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
                            <p className="text-emerald-100 mt-1">Branch Admin - {branchName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-100 text-sm">Today's Date</p>
                            <p className="text-xl font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard 
                        title="Total Staff" 
                        value={stats.totalStaff} 
                        icon={<Users className="w-6 h-6 text-white" />} 
                        color="from-blue-500 to-blue-600"
                        trend="+5% this month"
                    />
                    <StatCard 
                        title="Doctors" 
                        value={stats.totalDoctors} 
                        icon={<Stethoscope className="w-6 h-6 text-white" />} 
                        color="from-emerald-500 to-emerald-600"
                    />
                    <StatCard 
                        title="Total Patients" 
                        value={stats.totalPatients} 
                        icon={<UserCheck className="w-6 h-6 text-white" />} 
                        color="from-purple-500 to-purple-600"
                        trend="+12% this month"
                    />
                    <StatCard 
                        title="Today's Appointments" 
                        value={stats.todayAppointments} 
                        icon={<Calendar className="w-6 h-6 text-white" />} 
                        color="from-orange-500 to-orange-600"
                    />
                    <StatCard 
                        title="Monthly Revenue" 
                        value={`$${(stats.monthlyRevenue || 0).toLocaleString()}`} 
                        icon={<DollarSign className="w-6 h-6 text-white" />} 
                        color="from-green-500 to-green-600"
                        trend="+8% vs last month"
                    />
                    <StatCard 
                        title="Pending Schedule Requests" 
                        value={stats.pendingScheduleRequests || 0} 
                        icon={<Clock className="w-6 h-6 text-white" />} 
                        color="from-red-500 to-red-600"
                    />
                </div>

                {/* Quick Actions & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-600" />
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => navigate('/branch-admin/hrm/staff')}
                                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all"
                            >
                                <Users className="w-5 h-5 text-emerald-600" />
                                <span className="font-medium text-gray-800">Manage Staff</span>
                            </button>
                            <button 
                                onClick={() => navigate('/branch-admin/appointments')}
                                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all"
                            >
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-gray-800">View Appointments</span>
                            </button>
                            <button 
                                onClick={() => navigate('/branch-admin/reports')}
                                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all"
                            >
                                <FileText className="w-5 h-5 text-purple-600" />
                                <span className="font-medium text-gray-800">Generate Report</span>
                            </button>
                            <button 
                                onClick={() => navigate('/branch-admin/profile')}
                                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all"
                            >
                                <User className="w-5 h-5 text-orange-600" />
                                <span className="font-medium text-gray-800">My Profile</span>
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Recent Activity
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">New staff member added</p>
                                    <p className="text-xs text-gray-500">Dr. Smith joined as Cardiologist - 2 hours ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Appointment rescheduled</p>
                                    <p className="text-xs text-gray-500">Patient John Doe - moved to 3:00 PM - 4 hours ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 mt-2 rounded-full bg-orange-500"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Monthly report generated</p>
                                    <p className="text-xs text-gray-500">November 2025 report ready - Yesterday</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
