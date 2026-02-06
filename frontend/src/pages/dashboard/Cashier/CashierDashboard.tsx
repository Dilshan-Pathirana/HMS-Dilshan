import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, CashierMenuItems } from '../../../components/common/Layout/SidebarMenu';
import { 
    DollarSign, 
    FileText, 
    CreditCard, 
    TrendingUp,
    Users,
    CheckCircle
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface CashierStats {
    todaysTransactions: number;
    todaysRevenue: number;
    pendingPayments: number;
    processedBills: number;
}

export const CashierDashboard: React.FC = () => {
    const [stats, setStats] = useState<CashierStats>({
        todaysTransactions: 0,
        todaysRevenue: 0,
        pendingPayments: 0,
        processedBills: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Cashier');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/cashier/dashboard-stats');
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

    const StatCard = ({ 
        title, 
        value, 
        icon, 
        color 
    }: { 
        title: string; 
        value: number | string; 
        icon: React.ReactNode; 
        color: string;
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-neutral-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-neutral-800">{typeof value === 'number' ? value : value}</p>
        </div>
    );

    return (
        <DashboardLayout
            userName={userName}
            userRole="Cashier"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={CashierMenuItems} />}
        >
            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                Hello, {userName}!
                            </h1>
                            <p className="text-neutral-600 mt-1">Manage payments and billing efficiently.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-green-600">${stats.todaysRevenue}</span>
                            <span className="text-sm text-neutral-500">Today's Revenue</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Today's Transactions"
                        value={stats.todaysTransactions}
                        icon={<CreditCard className="w-6 h-6 text-white" />}
                        color="from-emerald-500 to-emerald-600"
                    />
                    <StatCard
                        title="Today's Revenue"
                        value={`$${stats.todaysRevenue}`}
                        icon={<DollarSign className="w-6 h-6 text-white" />}
                        color="from-green-500 to-green-600"
                    />
                    <StatCard
                        title="Pending Payments"
                        value={stats.pendingPayments}
                        icon={<FileText className="w-6 h-6 text-white" />}
                        color="from-orange-500 to-orange-600"
                    />
                    <StatCard
                        title="Processed Bills"
                        value={stats.processedBills}
                        icon={<CheckCircle className="w-6 h-6 text-white" />}
                        color="from-blue-500 to-blue-600"
                    />
                </div>

                {/* Recent Transactions & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Transactions */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            Recent Transactions
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <div>
                                    <p className="font-medium text-neutral-800">Payment #12345</p>
                                    <p className="text-xs text-neutral-500">John Doe - Consultation</p>
                                </div>
                                <span className="text-lg font-bold text-emerald-600">$150</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div>
                                    <p className="font-medium text-neutral-800">Payment #12344</p>
                                    <p className="text-xs text-neutral-500">Jane Smith - Lab Tests</p>
                                </div>
                                <span className="text-lg font-bold text-primary-500">$85</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div>
                                    <p className="font-medium text-neutral-800">Payment #12343</p>
                                    <p className="text-xs text-neutral-500">Robert Wilson - Pharmacy</p>
                                </div>
                                <span className="text-lg font-bold text-purple-600">$45</span>
                            </div>
                        </div>
                        <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-primary-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all font-medium">
                            View All Transactions
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <FileText className="w-5 h-5 text-emerald-600" />
                                <div>
                                    <p className="font-medium text-neutral-800">Create New Bill</p>
                                    <p className="text-xs text-neutral-500">Generate patient invoice</p>
                                </div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <CreditCard className="w-5 h-5 text-primary-500" />
                                <div>
                                    <p className="font-medium text-neutral-800">Process Payment</p>
                                    <p className="text-xs text-neutral-500">Accept payment from patient</p>
                                </div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="font-medium text-neutral-800">View Reports</p>
                                    <p className="text-xs text-neutral-500">Financial reports & summaries</p>
                                </div>
                            </button>
                        </div>

                        {/* Payment Methods */}
                        <div className="mt-6 pt-6 border-t border-neutral-200">
                            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Payment Methods</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-neutral-50 rounded-lg text-center">
                                    <CreditCard className="w-6 h-6 mx-auto text-neutral-600 mb-1" />
                                    <p className="text-xs font-medium text-neutral-700">Card</p>
                                </div>
                                <div className="p-3 bg-neutral-50 rounded-lg text-center">
                                    <DollarSign className="w-6 h-6 mx-auto text-neutral-600 mb-1" />
                                    <p className="text-xs font-medium text-neutral-700">Cash</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
