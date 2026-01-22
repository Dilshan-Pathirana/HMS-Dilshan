import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import {
    FileText, ShoppingCart, Clock, DollarSign, 
    TrendingUp, AlertCircle, ChevronRight, Building2, CalendarDays, CalendarClock
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface RequestStats {
    pendingPurchaseRequests: number;
    pendingEODReports: number;
    pendingCashEntries: number;
    pendingScheduleRequests: number;
    pendingModificationRequests: number;
    todaySubmissions: number;
}

export const BranchAdminRequests: React.FC = () => {
    const [stats, setStats] = useState<RequestStats>({
        pendingPurchaseRequests: 0,
        pendingEODReports: 0,
        pendingCashEntries: 0,
        pendingScheduleRequests: 0,
        pendingModificationRequests: 0,
        todaySubmissions: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Branch Admin');
    const [profileImage, setProfileImage] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setProfileImage(userInfo.profile_picture || '');
        setBranchName(userInfo.branch_name || userInfo.branch?.name || 'Branch');
        setBranchLogo(userInfo.branch_logo || userInfo.branch?.logo || '');
        setUserGender(userInfo.gender || '');
        
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            // Fetch all request stats from unified endpoint
            const requestsResponse = await axios.get('/api/branch-admin/requests/stats');
            const requestsData = requestsResponse.data.success ? requestsResponse.data.data : {};

            setStats({
                pendingPurchaseRequests: requestsData.pending_purchase_requests || 0,
                pendingEODReports: requestsData.pending_eod_reports || 0,
                pendingCashEntries: requestsData.pending_cash_entries || 0,
                pendingScheduleRequests: requestsData.pending_schedule_requests || 0,
                pendingModificationRequests: requestsData.pending_modification_requests || 0,
                todaySubmissions: requestsData.today_submissions || 0
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const requestModules = [
        {
            id: 'purchase-requests',
            title: 'Purchase Requests',
            description: 'Review and approve purchase requests from pharmacists',
            icon: <ShoppingCart className="w-8 h-8" />,
            count: stats.pendingPurchaseRequests,
            countLabel: 'Pending Approval',
            path: '/branch-admin/requests/purchase-requests',
            color: 'from-blue-500 to-indigo-600',
            bgColor: 'bg-blue-50'
        },
        {
            id: 'schedule-requests',
            title: 'Doctor Schedule Requests',
            description: 'Review and approve doctor schedule requests',
            icon: <CalendarDays className="w-8 h-8" />,
            count: stats.pendingScheduleRequests,
            countLabel: 'Pending Approval',
            path: '/branch-admin/requests/schedule-requests',
            color: 'from-purple-500 to-violet-600',
            bgColor: 'bg-purple-50'
        },
        {
            id: 'modification-requests',
            title: 'Schedule Modifications',
            description: 'Review doctor requests to block dates, delay schedules, and limit appointments',
            icon: <CalendarClock className="w-8 h-8" />,
            count: stats.pendingModificationRequests,
            countLabel: 'Pending Approval',
            path: '/branch-admin/requests/modification-requests',
            color: 'from-rose-500 to-pink-600',
            bgColor: 'bg-rose-50'
        },
        {
            id: 'eod-reports',
            title: 'End of Day Reports',
            description: 'View and review cashier EOD submissions',
            icon: <Clock className="w-8 h-8" />,
            count: stats.pendingEODReports,
            countLabel: 'Pending Review',
            path: '/branch-admin/requests/eod-reports',
            color: 'from-orange-500 to-red-600',
            bgColor: 'bg-orange-50'
        },
        {
            id: 'cash-entries',
            title: 'Cash Entries',
            description: 'Monitor and review cash in/out entries from cashiers',
            icon: <DollarSign className="w-8 h-8" />,
            count: stats.pendingCashEntries,
            countLabel: 'Today\'s Entries',
            path: '/branch-admin/requests/cash-entries',
            color: 'from-emerald-500 to-teal-600',
            bgColor: 'bg-emerald-50'
        }
    ];

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
                                item.path.includes('/requests') 
                                    ? 'bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700'
                                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
                            }`}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className="flex-1 font-medium text-left">{item.label}</span>
                            {item.badge && stats.pendingPurchaseRequests > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {stats.pendingPurchaseRequests}
                                </span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
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
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <FileText className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Requests Management</h2>
                                <p className="text-emerald-100 mt-1">
                                    Review and manage requests from your branch staff
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-100 text-sm">
                                {new Date().toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                            <div className="mt-2 flex items-center gap-2 justify-end">
                                <Building2 className="w-4 h-4 text-emerald-200" />
                                <span className="text-emerald-100">{branchName}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ShoppingCart className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.pendingPurchaseRequests}</p>
                                <p className="text-xs text-gray-500">Pending PRs</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <CalendarDays className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.pendingScheduleRequests}</p>
                                <p className="text-xs text-gray-500">Schedule Requests</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Clock className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.pendingEODReports}</p>
                                <p className="text-xs text-gray-500">EOD Reports</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.pendingCashEntries}</p>
                                <p className="text-xs text-gray-500">Cash Entries</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.todaySubmissions}</p>
                                <p className="text-xs text-gray-500">Today's Total</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Request Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {requestModules.map((module) => (
                        <div
                            key={module.id}
                            onClick={() => navigate(module.path)}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} text-white`}>
                                    {module.icon}
                                </div>
                                {module.count > 0 && (
                                    <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                                        {module.count}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {module.title}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {module.description}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                    {module.count} {module.countLabel}
                                </span>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Select a module above to view detailed requests</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default BranchAdminRequests;
