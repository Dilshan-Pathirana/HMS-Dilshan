import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, SupplierMenuItems } from '../../../components/common/Layout/SidebarMenu';
import { 
    Package, 
    ShoppingCart, 
    DollarSign, 
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface SupplierStats {
    totalOrders: number;
    pendingOrders: number;
    totalProducts: number;
    monthlyRevenue: number;
    completedOrders: number;
}

export const SupplierDashboard: React.FC = () => {
    const [stats, setStats] = useState<SupplierStats>({
        totalOrders: 0,
        pendingOrders: 0,
        totalProducts: 0,
        monthlyRevenue: 0,
        completedOrders: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Supplier');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/supplier/dashboard-stats');
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-800">{typeof value === 'number' ? value : value}</p>
        </div>
    );

    return (
        <DashboardLayout
            userName={userName}
            userRole="Supplier"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={SupplierMenuItems} />}
        >
            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                Welcome, {userName}!
                            </h1>
                            <p className="text-gray-600 mt-1">Manage your orders, products, and deliveries.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-emerald-600">{stats.pendingOrders}</span>
                            <span className="text-sm text-gray-500">Pending Orders</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <StatCard
                        title="Total Orders"
                        value={stats.totalOrders}
                        icon={<ShoppingCart className="w-6 h-6 text-white" />}
                        color="from-emerald-500 to-emerald-600"
                    />
                    <StatCard
                        title="Pending Orders"
                        value={stats.pendingOrders}
                        icon={<Clock className="w-6 h-6 text-white" />}
                        color="from-orange-500 to-orange-600"
                    />
                    <StatCard
                        title="Completed Orders"
                        value={stats.completedOrders}
                        icon={<CheckCircle className="w-6 h-6 text-white" />}
                        color="from-green-500 to-green-600"
                    />
                    <StatCard
                        title="Total Products"
                        value={stats.totalProducts}
                        icon={<Package className="w-6 h-6 text-white" />}
                        color="from-blue-500 to-blue-600"
                    />
                    <StatCard
                        title="Monthly Revenue"
                        value={`$${stats.monthlyRevenue}`}
                        icon={<DollarSign className="w-6 h-6 text-white" />}
                        color="from-purple-500 to-purple-600"
                    />
                </div>

                {/* Pending Orders & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Orders */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-orange-600" />
                            Recent Orders
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <div>
                                    <p className="font-semibold text-gray-800">Order #ORD-2025-001</p>
                                    <p className="text-sm text-gray-600">City Hospital - 250 items</p>
                                    <p className="text-xs text-gray-500 mt-1">Placed 2 hours ago</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 bg-orange-600 text-white text-xs font-semibold rounded-full mb-2">
                                        Pending
                                    </span>
                                    <p className="text-lg font-bold text-gray-800">$2,450</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div>
                                    <p className="font-semibold text-gray-800">Order #ORD-2025-002</p>
                                    <p className="text-sm text-gray-600">General Hospital - 180 items</p>
                                    <p className="text-xs text-gray-500 mt-1">Placed 5 hours ago</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full mb-2">
                                        Processing
                                    </span>
                                    <p className="text-lg font-bold text-gray-800">$1,890</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                <div>
                                    <p className="font-semibold text-gray-800">Order #ORD-2024-999</p>
                                    <p className="text-sm text-gray-600">Medical Center - 120 items</p>
                                    <p className="text-xs text-gray-500 mt-1">Completed yesterday</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full mb-2">
                                        Delivered
                                    </span>
                                    <p className="text-lg font-bold text-gray-800">$1,320</p>
                                </div>
                            </div>
                        </div>
                        <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all font-medium">
                            View All Orders
                        </button>
                    </div>

                    {/* Quick Actions & Notifications */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                    <Package className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <p className="font-medium text-gray-800">Add New Product</p>
                                        <p className="text-xs text-gray-500">Add item to catalog</p>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-gray-800">View Orders</p>
                                        <p className="text-xs text-gray-500">Manage all orders</p>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                    <div>
                                        <p className="font-medium text-gray-800">View Reports</p>
                                        <p className="text-xs text-gray-500">Sales & performance</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h2>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Order #ORD-2024-999 delivered</p>
                                        <p className="text-xs text-gray-500">2 hours ago</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">New order received</p>
                                        <p className="text-xs text-gray-500">5 hours ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
