import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, SuperAdminMenuItems } from '../../../components/common/Layout/SidebarMenu';
import {
    Users,
    Building2,
    Activity,
    DollarSign,
    TrendingUp,
    Calendar,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import api from "../../../utils/api/axios";
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';

interface DashboardStats {
    totalUsers: number;
    totalBranches: number;
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    activeStaff: number;
}

export const SuperAdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalBranches: 0,
        totalPatients: 0,
        todayAppointments: 0,
        monthlyRevenue: 0,
        activeStaff: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Admin User');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch dashboard statistics
            const response: any = await api.get('/super-admin/dashboard-stats');
            if (response.data.status === 200) {
                setStats(response.data.data);
            }

            // Get user info
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
            setProfileImage(userInfo.profile_picture || '');
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Inline StatCard removed (using imported component)

    return (
        <DashboardLayout
            userName={userName}
            userRole="Super Admin"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={SuperAdminMenuItems} />}
        >
            {/* Page Header Component */}
            <PageHeader
                title={`Welcome back, ${userName.split(' ')[0]}!`}
                description="Here's what's happening with your hospital today."
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
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-xl h-32 animate-pulse border border-neutral-200" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={Users}
                        trend={{ value: 12, label: 'vs last month', isPositive: true }}
                    />
                    <StatCard
                        title="Total Branches"
                        value={stats.totalBranches}
                        icon={Building2}
                    />
                    <StatCard
                        title="Total Patients"
                        value={stats.totalPatients}
                        icon={Users}
                        trend={{ value: 8, label: 'vs last month', isPositive: true }}
                    />
                    <StatCard
                        title="Today's Appointments"
                        value={stats.todayAppointments}
                        icon={Calendar}
                    />
                    <StatCard
                        title="Monthly Revenue"
                        value={`$${stats.monthlyRevenue.toLocaleString()}`}
                        icon={DollarSign}
                        trend={{ value: 15, label: 'vs last month', isPositive: true }}
                    />
                    <StatCard
                        title="Active Staff"
                        value={stats.activeStaff}
                        icon={Activity}
                    />
                </div>
            )}

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h2 className="text-lg font-bold text-neutral-900 mb-6">Quick Actions</h2>
                    <div className="space-y-3">
                        <button className="w-full flex items-center gap-4 px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all group text-left">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-900">Add New User</p>
                                <p className="text-xs text-neutral-500">Create a new staff or user account</p>
                            </div>
                        </button>

                        <button className="w-full flex items-center gap-4 px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-primary-200 hover:shadow-md transition-all group text-left">
                            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-900">Add New Branch</p>
                                <p className="text-xs text-neutral-500">Register a new hospital branch</p>
                            </div>
                        </button>

                        <button className="w-full flex items-center gap-4 px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-purple-200 hover:shadow-md transition-all group text-left">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-900">View Reports</p>
                                <p className="text-xs text-neutral-500">Generate system reports</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h2 className="text-lg font-bold text-neutral-900 mb-6">System Status</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <span className="font-semibold text-neutral-800">Database</span>
                            </div>
                            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full">Online</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <span className="font-semibold text-neutral-800">API Services</span>
                            </div>
                            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full">Running</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <span className="font-semibold text-neutral-800">Backup System</span>
                            </div>
                            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full">Active</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                <span className="font-semibold text-neutral-800">Disk Space</span>
                            </div>
                            <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full">78% Used</span>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
