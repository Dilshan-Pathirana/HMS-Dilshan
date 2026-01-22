import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../components/common/Layout/SidebarMenu';
import { Ambulance, MapPin, Clock, Activity, AlertCircle, User } from 'lucide-react';
import axios from 'axios';

const ParamedicMenuItems = [
    { label: 'Dashboard', icon: <Ambulance className="w-5 h-5" />, path: '/paramedic/dashboard' },
    { label: 'Active Emergencies', icon: <AlertCircle className="w-5 h-5" />, path: '/paramedic/emergencies' },
    { label: 'Response History', icon: <Clock className="w-5 h-5" />, path: '/paramedic/history' },
    { label: 'Equipment Status', icon: <Activity className="w-5 h-5" />, path: '/paramedic/equipment' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const ParamedicDashboard: React.FC = () => {
    const [stats, setStats] = useState({ activeEmergencies: 0, responsesCompleted: 0, averageResponseTime: 0, equipmentStatus: 100 });
    const [userName, setUserName] = useState('Paramedic');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/paramedic/dashboard-stats');
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${color} w-fit mb-4`}>{icon}</div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-800">{typeof value === 'number' ? value : value}</p>
        </div>
    );

    return (
        <DashboardLayout userName={userName} userRole="Paramedic" profileImage={profileImage} sidebarContent={<SidebarMenu items={ParamedicMenuItems} />}>
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Hello, Paramedic {userName}!</h1>
                    <p className="text-gray-600 mt-1">Emergency response and ambulance services management.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Active Emergencies" value={stats.activeEmergencies} icon={<AlertCircle className="w-6 h-6 text-white" />} color="from-red-500 to-red-600" />
                    <StatCard title="Responses Today" value={stats.responsesCompleted} icon={<Ambulance className="w-6 h-6 text-white" />} color="from-blue-500 to-blue-600" />
                    <StatCard title="Avg Response Time" value={`${stats.averageResponseTime} min`} icon={<Clock className="w-6 h-6 text-white" />} color="from-green-500 to-green-600" />
                    <StatCard title="Equipment Status" value={`${stats.equipmentStatus}%`} icon={<Activity className="w-6 h-6 text-white" />} color="from-emerald-500 to-emerald-600" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Active Calls</h2>
                        <div className="space-y-3">
                            {stats.activeEmergencies > 0 ? (
                                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">Emergency - Cardiac Arrest</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>123 Main St, Downtown</span>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full">Critical</span>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No active emergencies</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg hover:from-red-100 hover:to-red-200 transition-all text-left border border-red-200">
                                <Ambulance className="w-5 h-5 text-red-600" />
                                <div><p className="font-medium text-gray-800">Respond to Emergency</p><p className="text-xs text-gray-500">New emergency call</p></div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Activity className="w-5 h-5 text-blue-600" />
                                <div><p className="font-medium text-gray-800">Equipment Check</p><p className="text-xs text-gray-500">Verify equipment status</p></div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Clock className="w-5 h-5 text-purple-600" />
                                <div><p className="font-medium text-gray-800">Log Response</p><p className="text-xs text-gray-500">Record emergency response</p></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
