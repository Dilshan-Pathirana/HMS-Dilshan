import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../components/common/Layout/SidebarMenu';
import { 
    FileText, 
    Folder, 
    Archive,
    Search,
    Upload,
    User
} from 'lucide-react';
import api from "../../../utils/api/axios";

const ClerkMenuItems = [
    { label: 'Dashboard', icon: <FileText className="w-5 h-5" />, path: '/clerk/dashboard' },
    { label: 'Records', icon: <Folder className="w-5 h-5" />, path: '/clerk/records' },
    { label: 'File Documents', icon: <Upload className="w-5 h-5" />, path: '/clerk/file-documents' },
    { label: 'Archive', icon: <Archive className="w-5 h-5" />, path: '/clerk/archive' },
    { label: 'Search', icon: <Search className="w-5 h-5" />, path: '/clerk/search' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const ClerkDashboard: React.FC = () => {
    const [stats, setStats] = useState({ pendingFiles: 0, processedToday: 0, totalRecords: 0, archiveCount: 0 });
    const [userName, setUserName] = useState('Clerk');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/clerk/dashboard-stats');
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
        <DashboardLayout userName={userName} userRole="Clerk" profileImage={profileImage} sidebarContent={<SidebarMenu items={ClerkMenuItems} />}>
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Hello, {userName}!</h1>
                    <p className="text-gray-600 mt-1">Manage records and documentation efficiently.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Pending Files" value={stats.pendingFiles} icon={<FileText className="w-6 h-6 text-white" />} color="from-orange-500 to-orange-600" />
                    <StatCard title="Processed Today" value={stats.processedToday} icon={<Upload className="w-6 h-6 text-white" />} color="from-green-500 to-green-600" />
                    <StatCard title="Total Records" value={stats.totalRecords} icon={<Folder className="w-6 h-6 text-white" />} color="from-blue-500 to-blue-600" />
                    <StatCard title="Archived Files" value={stats.archiveCount} icon={<Archive className="w-6 h-6 text-white" />} color="from-purple-500 to-purple-600" />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all">
                            <Upload className="w-5 h-5 text-emerald-600" />
                            <span className="font-medium text-gray-800">Upload Document</span>
                        </button>
                        <button className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all">
                            <Search className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-gray-800">Search Records</span>
                        </button>
                        <button className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all">
                            <Archive className="w-5 h-5 text-purple-600" />
                            <span className="font-medium text-gray-800">Archive Files</span>
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
