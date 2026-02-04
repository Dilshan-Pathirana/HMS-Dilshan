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
            const response = await api.get('/super-admin/dashboard-stats');
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

    const StatCard = ({ 
        title, 
        value, 
        icon, 
        color, 
        trend 
    }: { 
        title: string; 
        value: number | string; 
        icon: React.ReactNode; 
        color: string;
        trend?: { value: number; label: string };
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
                    {icon}
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 font-semibold">+{trend.value}%</span>
                    </div>
                )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</p>
            {trend && (
                <p className="text-xs text-gray-500 mt-1">{trend.label}</p>
            )}
        </div>
    );

    return (
        <DashboardLayout
            userName={userName}
            userRole="Super Admin"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={SuperAdminMenuItems} />}
        >
            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                Welcome back, {userName.split(' ')[0]}!
                            </h1>
                            <p className="text-gray-600 mt-1">Here's what's happening with your hospital today.</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-5 h-5" />
                            {new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard
                            title="Total Users"
                            value={stats.totalUsers}
                            icon={<Users className="w-6 h-6 text-white" />}
                            color="from-emerald-500 to-emerald-600"
                            trend={{ value: 12, label: 'vs last month' }}
                        />
                        <StatCard
                            title="Total Branches"
                            value={stats.totalBranches}
                            icon={<Building2 className="w-6 h-6 text-white" />}
                            color="from-blue-500 to-blue-600"
                        />
                        <StatCard
                            title="Total Patients"
                            value={stats.totalPatients}
                            icon={<Users className="w-6 h-6 text-white" />}
                            color="from-purple-500 to-purple-600"
                            trend={{ value: 8, label: 'vs last month' }}
                        />
                        <StatCard
                            title="Today's Appointments"
                            value={stats.todayAppointments}
                            icon={<Calendar className="w-6 h-6 text-white" />}
                            color="from-orange-500 to-orange-600"
                        />
                        <StatCard
                            title="Monthly Revenue"
                            value={`$${stats.monthlyRevenue.toLocaleString()}`}
                            icon={<DollarSign className="w-6 h-6 text-white" />}
                            color="from-green-500 to-green-600"
                            trend={{ value: 15, label: 'vs last month' }}
                        />
                        <StatCard
                            title="Active Staff"
                            value={stats.activeStaff}
                            icon={<Activity className="w-6 h-6 text-white" />}
                            color="from-cyan-500 to-cyan-600"
                        />
                    </div>
                )}

                {/* Quick Actions & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Users className="w-5 h-5 text-emerald-600" />
                                <div>
                                    <p className="font-medium text-gray-800">Add New User</p>
                                    <p className="text-xs text-gray-500">Create a new staff or user account</p>
                                </div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="font-medium text-gray-800">Add New Branch</p>
                                    <p className="text-xs text-gray-500">Register a new hospital branch</p>
                                </div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Activity className="w-5 h-5 text-purple-600" />
                                <div>
                                    <p className="font-medium text-gray-800">View Reports</p>
                                    <p className="text-xs text-gray-500">Generate system reports</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">System Status</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium text-gray-800">Database</span>
                                </div>
                                <span className="text-xs text-green-600 font-semibold">Online</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium text-gray-800">API Services</span>
                                </div>
                                <span className="text-xs text-green-600 font-semibold">Running</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium text-gray-800">Backup System</span>
                                </div>
                                <span className="text-xs text-green-600 font-semibold">Active</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                    <span className="text-sm font-medium text-gray-800">Disk Space</span>
                                </div>
                                <span className="text-xs text-yellow-600 font-semibold">78% Used</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
