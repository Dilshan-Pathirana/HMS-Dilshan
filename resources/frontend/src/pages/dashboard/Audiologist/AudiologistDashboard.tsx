import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../components/common/Layout/SidebarMenu';
import { Headphones, Users, Activity, FileText, Settings, User } from 'lucide-react';
import axios from 'axios';

const AudiologistMenuItems = [
    { label: 'Dashboard', icon: <Headphones className="w-5 h-5" />, path: '/audiologist/dashboard' },
    { label: 'Appointments', icon: <Users className="w-5 h-5" />, path: '/audiologist/appointments' },
    { label: 'Hearing Tests', icon: <Activity className="w-5 h-5" />, path: '/audiologist/hearing-tests' },
    { label: 'Test Results', icon: <FileText className="w-5 h-5" />, path: '/audiologist/results' },
    { label: 'Equipment', icon: <Settings className="w-5 h-5" />, path: '/audiologist/equipment' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const AudiologistDashboard: React.FC = () => {
    const [stats, setStats] = useState({ todayAppointments: 0, testsCompleted: 0, pendingResults: 0, equipmentCalibrated: 0 });
    const [userName, setUserName] = useState('Audiologist');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/audiologist/dashboard-stats');
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

    const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string; }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${color} w-fit mb-4`}>{icon}</div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    );

    return (
        <DashboardLayout userName={userName} userRole="Audiologist" profileImage={profileImage} sidebarContent={<SidebarMenu items={AudiologistMenuItems} />}>
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Hello, Audiologist {userName}!</h1>
                    <p className="text-gray-600 mt-1">Hearing assessments and audiometric testing.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Today's Appointments" value={stats.todayAppointments} icon={<Users className="w-6 h-6 text-white" />} color="from-emerald-500 to-emerald-600" />
                    <StatCard title="Tests Completed" value={stats.testsCompleted} icon={<Activity className="w-6 h-6 text-white" />} color="from-blue-500 to-blue-600" />
                    <StatCard title="Pending Results" value={stats.pendingResults} icon={<FileText className="w-6 h-6 text-white" />} color="from-orange-500 to-orange-600" />
                    <StatCard title="Equipment Calibrated" value={stats.equipmentCalibrated} icon={<Settings className="w-6 h-6 text-white" />} color="from-purple-500 to-purple-600" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
                                <Headphones className="w-5 h-5 text-emerald-600" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">Pure Tone Audiometry</p>
                                    <p className="text-xs text-gray-500">10:00 AM - Patient: John Doe</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                <Activity className="w-5 h-5 text-blue-600" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">Tympanometry</p>
                                    <p className="text-xs text-gray-500">02:00 PM - Patient: Jane Smith</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                                <Headphones className="w-5 h-5 text-purple-600" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">Hearing Aid Fitting</p>
                                    <p className="text-xs text-gray-500">04:00 PM - Patient: Bob Johnson</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Activity className="w-5 h-5 text-emerald-600" />
                                <div><p className="font-medium text-gray-800">Start Hearing Test</p><p className="text-xs text-gray-500">Begin audiometric assessment</p></div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <div><p className="font-medium text-gray-800">View Test Results</p><p className="text-xs text-gray-500">Check pending reports</p></div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Settings className="w-5 h-5 text-purple-600" />
                                <div><p className="font-medium text-gray-800">Calibrate Equipment</p><p className="text-xs text-gray-500">Verify instrument accuracy</p></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
