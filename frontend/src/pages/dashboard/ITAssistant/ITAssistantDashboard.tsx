import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../components/common/Layout/SidebarMenu';
import { 
    Monitor, 
    Server, 
    Shield,
    AlertTriangle,
    CheckCircle,
    Settings,
    Database,
    User
} from 'lucide-react';
import api from "../../../utils/api/axios";

const ITAssistantMenuItems = [
    { label: 'Dashboard', icon: <Monitor className="w-5 h-5" />, path: '/it-assistant/dashboard' },
    { label: 'System Status', icon: <Server className="w-5 h-5" />, path: '/it-assistant/system-status' },
    { label: 'Support Tickets', icon: <AlertTriangle className="w-5 h-5" />, path: '/it-assistant/tickets' },
    { label: 'User Management', icon: <User className="w-5 h-5" />, path: '/it-assistant/users' },
    { label: 'Security', icon: <Shield className="w-5 h-5" />, path: '/it-assistant/security' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

interface ITStats {
    openTickets: number;
    systemsOnline: number;
    securityAlerts: number;
    activeUsers: number;
}

export const ITAssistantDashboard: React.FC = () => {
    const [stats, setStats] = useState<ITStats>({
        openTickets: 0,
        systemsOnline: 0,
        securityAlerts: 0,
        activeUsers: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('IT Assistant');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/it-assistant/dashboard-stats');
            if (response.data.status === 200) {
                setStats(response.data.data);
            }
            
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
            setProfileImage(userInfo.profile_picture || '');
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string; }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>{icon}</div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    );

    return (
        <DashboardLayout userName={userName} userRole="IT Assistant" profileImage={profileImage} sidebarContent={<SidebarMenu items={ITAssistantMenuItems} />}>
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                        Welcome, {userName}!
                    </h1>
                    <p className="text-gray-600 mt-1">System monitoring and technical support management.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Open Tickets" value={stats.openTickets} icon={<AlertTriangle className="w-6 h-6 text-white" />} color="from-orange-500 to-orange-600" />
                    <StatCard title="Systems Online" value={stats.systemsOnline} icon={<Server className="w-6 h-6 text-white" />} color="from-green-500 to-green-600" />
                    <StatCard title="Security Alerts" value={stats.securityAlerts} icon={<Shield className="w-6 h-6 text-white" />} color="from-red-500 to-red-600" />
                    <StatCard title="Active Users" value={stats.activeUsers} icon={<User className="w-6 h-6 text-white" />} color="from-blue-500 to-blue-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">System Status</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium">Database Server</span>
                                </div>
                                <span className="text-xs text-green-600">Online</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium">Application Server</span>
                                </div>
                                <span className="text-xs text-green-600">Running</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                    <span className="text-sm font-medium">Backup System</span>
                                </div>
                                <span className="text-xs text-yellow-600">Warning</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                <div><p className="font-medium text-gray-800">View Support Tickets</p><p className="text-xs text-gray-500">Manage user requests</p></div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Database className="w-5 h-5 text-blue-600" />
                                <div><p className="font-medium text-gray-800">Database Backup</p><p className="text-xs text-gray-500">Run system backup</p></div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Settings className="w-5 h-5 text-purple-600" />
                                <div><p className="font-medium text-gray-800">System Settings</p><p className="text-xs text-gray-500">Configure system</p></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
