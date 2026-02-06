import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../components/common/Layout/SidebarMenu';
import { BarChart3, TrendingUp, Users, Building2, FileText, User } from 'lucide-react';
import api from "../../../utils/api/axios";

const DirectorMenuItems = [
    { label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" />, path: '/director/dashboard' },
    { label: 'Analytics', icon: <TrendingUp className="w-5 h-5" />, path: '/director/analytics' },
    { label: 'Staff Overview', icon: <Users className="w-5 h-5" />, path: '/director/staff' },
    { label: 'Branch Performance', icon: <Building2 className="w-5 h-5" />, path: '/director/branch-performance' },
    { label: 'Reports', icon: <FileText className="w-5 h-5" />, path: '/director/reports' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const DirectorDashboard: React.FC = () => {
    const [stats, setStats] = useState({ totalRevenue: 0, totalStaff: 0, branches: 0, patients: 0 });
    const [userName, setUserName] = useState('Director');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/director/dashboard-stats');
                if (response.data.status === 200) setStats(response.data.data);
                const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
                setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
                setProfileImage(userInfo.profile_picture || '');
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, []);

    const StatCard = ({ title, value, icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: string; }) => (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${color} w-fit mb-4`}>{icon}</div>
            <h3 className="text-neutral-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-neutral-800">{typeof value === 'number' ? value : value}</p>
        </div>
    );

    return (
        <DashboardLayout userName={userName} userRole="Director" profileImage={profileImage} sidebarContent={<SidebarMenu items={DirectorMenuItems} />}>
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Welcome, Director {userName}!</h1>
                    <p className="text-neutral-600 mt-1">Executive overview and strategic insights.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={<TrendingUp className="w-6 h-6 text-white" />} color="from-green-500 to-green-600" />
                    <StatCard title="Total Staff" value={stats.totalStaff} icon={<Users className="w-6 h-6 text-white" />} color="from-blue-500 to-blue-600" />
                    <StatCard title="Branches" value={stats.branches} icon={<Building2 className="w-6 h-6 text-white" />} color="from-purple-500 to-purple-600" />
                    <StatCard title="Total Patients" value={stats.patients} icon={<Users className="w-6 h-6 text-white" />} color="from-emerald-500 to-emerald-600" />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all">
                            <BarChart3 className="w-5 h-5 text-emerald-600" />
                            <span className="font-medium text-neutral-800">View Analytics</span>
                        </button>
                        <button className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all">
                            <FileText className="w-5 h-5 text-primary-500" />
                            <span className="font-medium text-neutral-800">Generate Reports</span>
                        </button>
                        <button className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all">
                            <Building2 className="w-5 h-5 text-purple-600" />
                            <span className="font-medium text-neutral-800">Branch Overview</span>
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
