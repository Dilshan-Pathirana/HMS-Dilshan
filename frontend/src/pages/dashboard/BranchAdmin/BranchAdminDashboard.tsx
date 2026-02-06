import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../components/common/Layout/BranchAdminSidebar';
import {
    Clock, Activity, Users, Calendar,
    UserCheck, Stethoscope, DollarSign, FileText, User
} from 'lucide-react';
import api from "../../../utils/api/axios";
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';

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
                const response = await api.get('/branch-admin/dashboard-stats');
                if (response.data.status === 200) {
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }

            // Fetch total pending requests count (PRs + Cash Entries + EOD Reports)
            try {
                const requestsResponse = await api.get('/branch-admin/requests/stats');
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

    // Inline StatCard removed (using imported component)

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
                {/* Page Header Component */}
                <PageHeader
                    title={`Welcome back, ${userName}!`}
                    description={`Branch Admin - ${branchName}`}
                    actions={
                        <div className="flex items-center gap-2 text-sm text-neutral-500 bg-white px-3 py-1.5 rounded-lg border border-neutral-200 shadow-sm">
                            <Calendar className="w-4 h-4" />
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    }
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Staff"
                        value={stats.totalStaff}
                        icon={Users}
                        trend={{ value: 5, label: "this month", isPositive: true }}
                    />
                    <StatCard
                        title="Doctors"
                        value={stats.totalDoctors}
                        icon={Stethoscope}
                    />
                    <StatCard
                        title="Total Patients"
                        value={stats.totalPatients}
                        icon={UserCheck}
                        trend={{ value: 12, label: "this month", isPositive: true }}
                    />
                    <StatCard
                        title="Today's Appointments"
                        value={stats.todayAppointments}
                        icon={Calendar}
                    />
                    <StatCard
                        title="Monthly Revenue"
                        value={`$${(stats.monthlyRevenue || 0).toLocaleString()}`}
                        icon={DollarSign}
                        trend={{ value: 8, label: "vs last month", isPositive: true }}
                    />
                    <StatCard
                        title="Pending Schedule Requests"
                        value={stats.pendingScheduleRequests || 0}
                        icon={Clock}
                        description="Requires attention"
                    />
                </div>

                {/* Quick Actions & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-600" />
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate('/branch-admin/hrm/staff')}
                                className="flex flex-col items-center justify-center p-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all group"
                            >
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors mb-3">
                                    <Users className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-neutral-900">Manage Staff</span>
                            </button>

                            <button
                                onClick={() => navigate('/branch-admin/appointments')}
                                className="flex flex-col items-center justify-center p-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-primary-200 hover:shadow-md transition-all group"
                            >
                                <div className="p-3 bg-primary-100 text-primary-600 rounded-lg group-hover:bg-primary-500 group-hover:text-white transition-colors mb-3">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-neutral-900">Appointments</span>
                            </button>

                            <button
                                onClick={() => navigate('/branch-admin/reports')}
                                className="flex flex-col items-center justify-center p-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-purple-200 hover:shadow-md transition-all group"
                            >
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors mb-3">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-neutral-900">Reports</span>
                            </button>

                            <button
                                onClick={() => navigate('/branch-admin/profile')}
                                className="flex flex-col items-center justify-center p-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-orange-200 hover:shadow-md transition-all group"
                            >
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors mb-3">
                                    <User className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-neutral-900">My Profile</span>
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary-500" />
                            Recent Activity
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                <span className="w-2.5 h-2.5 mt-2 rounded-full bg-emerald-500 shrink-0"></span>
                                <div>
                                    <p className="text-sm font-semibold text-neutral-900">New staff member added</p>
                                    <p className="text-xs text-neutral-500 mt-0.5">Dr. Smith joined as Cardiologist • 2 hours ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                <span className="w-2.5 h-2.5 mt-2 rounded-full bg-primary-500 shrink-0"></span>
                                <div>
                                    <p className="text-sm font-semibold text-neutral-900">Appointment rescheduled</p>
                                    <p className="text-xs text-neutral-500 mt-0.5">Patient John Doe moved to 3:00 PM • 4 hours ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                <span className="w-2.5 h-2.5 mt-2 rounded-full bg-orange-500 shrink-0"></span>
                                <div>
                                    <p className="text-sm font-semibold text-neutral-900">Monthly report generated</p>
                                    <p className="text-xs text-neutral-500 mt-0.5">November 2025 report ready • Yesterday</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
