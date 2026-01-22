import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { 
    Users, UserPlus, Calendar, Clock, Award, DollarSign,
    Shield, MessageSquare, FolderOpen, ClipboardList,
    ChevronRight, BarChart3,
    TrendingUp, AlertCircle, CheckCircle, UserCheck, Briefcase, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface StaffStats {
    totalStaff: number;
    activeOnShift: number;
    onLeave: number;
    pendingApprovals: number;
    upcomingTrainings: number;
    expiringSoonCerts: number;
}

const getStaffModules = (stats: StaffStats) => [
    {
        id: 'profiles',
        title: 'Staff Profile Management',
        description: 'Create, edit, delete staff profiles. Manage roles and view staff directory.',
        icon: <UserPlus className="w-8 h-8" />,
        path: '/branch-admin/staff/profiles',
        color: 'from-blue-500 to-blue-600',
        stats: { label: 'Total Staff', value: stats.totalStaff }
    },
    {
        id: 'scheduling',
        title: 'Scheduling & Shift Management',
        description: 'Create shifts, manage schedules, overtime, and on-call staff.',
        icon: <Calendar className="w-8 h-8" />,
        path: '/branch-admin/staff/scheduling',
        color: 'from-emerald-500 to-emerald-600',
        stats: { label: 'On Shift', value: stats.activeOnShift }
    },
    {
        id: 'hrm',
        title: 'HR Management',
        description: 'Leave approvals, attendance, payroll, overtime & HR reports.',
        icon: <Briefcase className="w-8 h-8" />,
        path: '/branch-admin/hrm',
        color: 'from-violet-500 to-violet-600',
        stats: { label: 'On Leave', value: stats.onLeave },
        isExternal: true
    },
    {
        id: 'training',
        title: 'Training & Development',
        description: 'Assign training modules, track progress, manage certifications.',
        icon: <Award className="w-8 h-8" />,
        path: '/branch-admin/staff/training',
        color: 'from-pink-500 to-pink-600',
        stats: { label: 'Active Programs', value: stats.upcomingTrainings }
    },
    {
        id: 'compliance',
        title: 'Compliance & Legal',
        description: 'Track licenses, audit trails, regulatory compliance.',
        icon: <Shield className="w-8 h-8" />,
        path: '/branch-admin/staff/compliance',
        color: 'from-red-500 to-red-600',
        stats: { label: 'Expiring Soon', value: stats.expiringSoonCerts }
    },
    {
        id: 'communication',
        title: 'Staff Communication',
        description: 'Announcements, internal messaging, meeting scheduling.',
        icon: <MessageSquare className="w-8 h-8" />,
        path: '/branch-admin/staff/communication',
        color: 'from-cyan-500 to-cyan-600',
        stats: { label: 'Messages', value: '-' }
    },
    {
        id: 'records',
        title: 'Employee Records',
        description: 'Manage documents, track work history, store contracts.',
        icon: <FolderOpen className="w-8 h-8" />,
        path: '/branch-admin/staff/records',
        color: 'from-amber-500 to-amber-600',
        stats: { label: 'Documents', value: '-' }
    },
    {
        id: 'feedback',
        title: 'Staff Feedback & Surveys',
        description: 'Conduct surveys, analyze feedback, improve satisfaction.',
        icon: <ClipboardList className="w-8 h-8" />,
        path: '/branch-admin/staff/feedback',
        color: 'from-indigo-500 to-indigo-600',
        stats: { label: 'Pending Approvals', value: stats.pendingApprovals }
    },
];

export const StaffManagementDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [stats, setStats] = useState<StaffStats>({
        totalStaff: 0,
        activeOnShift: 0,
        onLeave: 0,
        pendingApprovals: 0,
        upcomingTrainings: 0,
        expiringSoonCerts: 0
    });

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
        
        // Fetch staff stats
        fetchStaffStats();
    }, []);

    const fetchStaffStats = async () => {
        try {
            setIsLoadingStats(true);
            const response = await axios.get('/api/branch-admin/staff-stats');
            if (response.data.status === 200) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching staff stats:', error);
            // Keep default values on error
        } finally {
            setIsLoadingStats(false);
        }
    };

    const SidebarMenu = () => (
        <nav className="py-4">
            <div className="px-4 mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</h2>
            </div>
            <ul className="space-y-1 px-2">
                {BranchAdminMenuItems.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                item.path === '/branch-admin/hrm'
                                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
                            }`}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className="flex-1 font-medium text-left">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );

    const QuickStatCard = ({ title, value, icon, trend, trendUp, isLoading }: {
        title: string;
        value: number | string;
        icon: React.ReactNode;
        trend?: string;
        trendUp?: boolean;
        isLoading?: boolean;
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    {isLoading ? (
                        <div className="flex items-center gap-2 mt-1">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                    )}
                    {trend && !isLoading && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                            <TrendingUp className={`w-3 h-3 ${!trendUp && 'rotate-180'}`} />
                            {trend}
                        </p>
                    )}
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg">
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout 
            userName={userName}
            userRole="Branch Admin" 
            profileImage={profileImage}
            sidebarContent={<SidebarMenu />}
            branchName={branchName}
            branchLogo={branchLogo}
            userGender={userGender}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Staff Management</h1>
                            <p className="text-emerald-100 mt-1">Manage all aspects of your hospital staff</p>
                        </div>
                        <button 
                            onClick={() => navigate('/branch-admin/staff/add')}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                        >
                            <UserPlus className="w-5 h-5" />
                            Add New Staff
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <QuickStatCard 
                        title="Total Staff" 
                        value={stats.totalStaff} 
                        icon={<Users className="w-6 h-6 text-emerald-600" />}
                        isLoading={isLoadingStats}
                    />
                    <QuickStatCard 
                        title="On Shift" 
                        value={stats.activeOnShift} 
                        icon={<Briefcase className="w-6 h-6 text-blue-600" />}
                        isLoading={isLoadingStats}
                    />
                    <QuickStatCard 
                        title="On Leave" 
                        value={stats.onLeave} 
                        icon={<Clock className="w-6 h-6 text-orange-600" />}
                        isLoading={isLoadingStats}
                    />
                    <QuickStatCard 
                        title="Pending Approvals" 
                        value={stats.pendingApprovals} 
                        icon={<AlertCircle className="w-6 h-6 text-red-600" />}
                        isLoading={isLoadingStats}
                    />
                    <QuickStatCard 
                        title="Training Sessions" 
                        value={stats.upcomingTrainings} 
                        icon={<Award className="w-6 h-6 text-purple-600" />}
                        isLoading={isLoadingStats}
                    />
                    <QuickStatCard 
                        title="Certs Expiring" 
                        value={stats.expiringSoonCerts} 
                        icon={<Shield className="w-6 h-6 text-pink-600" />}
                        isLoading={isLoadingStats}
                    />
                </div>

                {/* Pending Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Pending Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">8</div>
                            <div>
                                <p className="font-medium text-gray-800">Leave Requests</p>
                                <p className="text-sm text-gray-500">Awaiting approval</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                            <div>
                                <p className="font-medium text-gray-800">Shift Swaps</p>
                                <p className="text-sm text-gray-500">Pending review</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
                            <div>
                                <p className="font-medium text-gray-800">Overtime Requests</p>
                                <p className="text-sm text-gray-500">Need approval</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </div>
                    </div>
                </div>

                {/* Staff Management Modules */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Staff Management Modules</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getStaffModules(stats).map((module) => (
                            <div 
                                key={module.id}
                                onClick={() => navigate(module.path)}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} text-white group-hover:scale-110 transition-transform`}>
                                        {module.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">
                                            {module.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">
                                                {module.stats.label}: <span className="text-emerald-600">{module.stats.value}</span>
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Staff Activity</h2>
                    <div className="space-y-4">
                        {[
                            { action: 'New staff member added', user: 'Dr. Sarah Wilson', time: '10 minutes ago', type: 'add' },
                            { action: 'Leave request approved', user: 'Nurse John Doe', time: '1 hour ago', type: 'approve' },
                            { action: 'Shift schedule updated', user: 'Emergency Department', time: '2 hours ago', type: 'update' },
                            { action: 'Training completed', user: 'IT Support Team', time: '3 hours ago', type: 'complete' },
                            { action: 'Certification renewed', user: 'Dr. Michael Brown', time: '5 hours ago', type: 'cert' },
                        ].map((activity, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                                <div className={`w-2 h-2 rounded-full ${
                                    activity.type === 'add' ? 'bg-blue-500' :
                                    activity.type === 'approve' ? 'bg-green-500' :
                                    activity.type === 'update' ? 'bg-orange-500' :
                                    activity.type === 'complete' ? 'bg-purple-500' :
                                    'bg-pink-500'
                                }`}></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                                    <p className="text-xs text-gray-500">{activity.user}</p>
                                </div>
                                <span className="text-xs text-gray-400">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
