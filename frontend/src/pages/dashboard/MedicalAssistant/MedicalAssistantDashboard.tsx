import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../components/common/Layout/SidebarMenu';
import { Stethoscope, Users, ClipboardList, Activity, FileText, User } from 'lucide-react';
import api from "../../../utils/api/axios";

const MedicalAssistantMenuItems = [
    { label: 'Dashboard', icon: <Stethoscope className="w-5 h-5" />, path: '/medical-assistant/dashboard' },
    { label: 'Patient Queue', icon: <Users className="w-5 h-5" />, path: '/medical-assistant/queue' },
    { label: 'Vital Signs', icon: <Activity className="w-5 h-5" />, path: '/medical-assistant/vital-signs' },
    { label: 'Lab Samples', icon: <ClipboardList className="w-5 h-5" />, path: '/medical-assistant/lab-samples' },
    { label: 'Reports', icon: <FileText className="w-5 h-5" />, path: '/medical-assistant/reports' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const MedicalAssistantDashboard: React.FC = () => {
    const [stats, setStats] = useState({ patientsAssisted: 0, vitalsRecorded: 0, labSamplesCollected: 0, pendingTasks: 0 });
    const [userName, setUserName] = useState('Medical Assistant');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/medical-assistant/dashboard-stats');
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
        <DashboardLayout userName={userName} userRole="Medical Assistant" profileImage={profileImage} sidebarContent={<SidebarMenu items={MedicalAssistantMenuItems} />}>
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Hello, {userName}!</h1>
                    <p className="text-gray-600 mt-1">Patient support and clinical assistance.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Patients Assisted" value={stats.patientsAssisted} icon={<Users className="w-6 h-6 text-white" />} color="from-emerald-500 to-emerald-600" />
                    <StatCard title="Vitals Recorded" value={stats.vitalsRecorded} icon={<Activity className="w-6 h-6 text-white" />} color="from-blue-500 to-blue-600" />
                    <StatCard title="Lab Samples" value={stats.labSamplesCollected} icon={<ClipboardList className="w-6 h-6 text-white" />} color="from-purple-500 to-purple-600" />
                    <StatCard title="Pending Tasks" value={stats.pendingTasks} icon={<FileText className="w-6 h-6 text-white" />} color="from-orange-500 to-orange-600" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Queue</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold">JD</div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">John Doe</p>
                                    <p className="text-xs text-gray-500">Vitals pending - Room 101</p>
                                </div>
                                <span className="px-2 py-1 bg-emerald-600 text-white text-xs rounded">Next</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">JS</div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">Jane Smith</p>
                                    <p className="text-xs text-gray-500">Lab sample collection - Room 102</p>
                                </div>
                                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Waiting</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">BJ</div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">Bob Johnson</p>
                                    <p className="text-xs text-gray-500">Pre-exam preparation - Room 103</p>
                                </div>
                                <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">Waiting</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Activity className="w-5 h-5 text-emerald-600" />
                                <div><p className="font-medium text-gray-800">Record Vital Signs</p><p className="text-xs text-gray-500">BP, Temperature, Pulse, etc.</p></div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <ClipboardList className="w-5 h-5 text-blue-600" />
                                <div><p className="font-medium text-gray-800">Collect Lab Sample</p><p className="text-xs text-gray-500">Register specimen</p></div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Stethoscope className="w-5 h-5 text-purple-600" />
                                <div><p className="font-medium text-gray-800">Prepare Exam Room</p><p className="text-xs text-gray-500">Set up for next patient</p></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
