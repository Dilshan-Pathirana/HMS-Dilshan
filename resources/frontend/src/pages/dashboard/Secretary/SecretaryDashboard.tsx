import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../components/common/Layout/SidebarMenu';
import { Calendar, Mail, Phone, FileText, Clock, User } from 'lucide-react';
import axios from 'axios';

const SecretaryMenuItems = [
    { label: 'Dashboard', icon: <Calendar className="w-5 h-5" />, path: '/secretary/dashboard' },
    { label: 'Schedule', icon: <Calendar className="w-5 h-5" />, path: '/secretary/schedule' },
    { label: 'Correspondence', icon: <Mail className="w-5 h-5" />, path: '/secretary/correspondence' },
    { label: 'Documents', icon: <FileText className="w-5 h-5" />, path: '/secretary/documents' },
    { label: 'Calls', icon: <Phone className="w-5 h-5" />, path: '/secretary/calls' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const SecretaryDashboard: React.FC = () => {
    const [stats, setStats] = useState({ todayMeetings: 0, pendingEmails: 0, phoneCalls: 0, documentsProcessed: 0 });
    const [userName, setUserName] = useState('Secretary');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/secretary/dashboard-stats');
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
        <DashboardLayout userName={userName} userRole="Secretary" profileImage={profileImage} sidebarContent={<SidebarMenu items={SecretaryMenuItems} />}>
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Hello, {userName}!</h1>
                    <p className="text-gray-600 mt-1">Manage schedules, correspondence, and administrative tasks.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Today's Meetings" value={stats.todayMeetings} icon={<Calendar className="w-6 h-6 text-white" />} color="from-emerald-500 to-emerald-600" />
                    <StatCard title="Pending Emails" value={stats.pendingEmails} icon={<Mail className="w-6 h-6 text-white" />} color="from-orange-500 to-orange-600" />
                    <StatCard title="Phone Calls" value={stats.phoneCalls} icon={<Phone className="w-6 h-6 text-white" />} color="from-blue-500 to-blue-600" />
                    <StatCard title="Documents Processed" value={stats.documentsProcessed} icon={<FileText className="w-6 h-6 text-white" />} color="from-purple-500 to-purple-600" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                                <Clock className="w-5 h-5 text-emerald-600" />
                                <div><p className="font-medium text-gray-800">09:00 AM - Staff Meeting</p><p className="text-xs text-gray-500">Conference Room A</p></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <div><p className="font-medium text-gray-800">11:30 AM - Board Meeting</p><p className="text-xs text-gray-500">Board Room</p></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                <Clock className="w-5 h-5 text-purple-600" />
                                <div><p className="font-medium text-gray-800">02:00 PM - Director Call</p><p className="text-xs text-gray-500">Phone Conference</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Calendar className="w-5 h-5 text-emerald-600" />
                                <div><p className="font-medium text-gray-800">Schedule Meeting</p><p className="text-xs text-gray-500">Book conference room</p></div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Mail className="w-5 h-5 text-blue-600" />
                                <div><p className="font-medium text-gray-800">Send Email</p><p className="text-xs text-gray-500">Compose correspondence</p></div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <FileText className="w-5 h-5 text-purple-600" />
                                <div><p className="font-medium text-gray-800">Prepare Documents</p><p className="text-xs text-gray-500">Draft and organize files</p></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
