import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, PharmacistMenuItems } from '../../../components/common/Layout/SidebarMenu';
import { 
    Package, 
    FileText, 
    DollarSign, 
    AlertTriangle,
    TrendingUp,
    ShoppingCart,
    Building2,
    MapPin,
    Phone,
    User
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface PharmacistStats {
    totalProducts: number;
    lowStockItems: number;
    todaysSales: number;
    pendingPrescriptions: number;
    monthlyRevenue: number;
}

interface BranchInfo {
    id: string;
    center_name: string;
    center_type: string;
    register_number: string;
    owner_full_name: string;
    owner_contact_number: string;
    division: string | null;
    division_number: string | null;
}

export const PharmacistDashboard: React.FC = () => {
    const [stats, setStats] = useState<PharmacistStats>({
        totalProducts: 0,
        lowStockItems: 0,
        todaysSales: 0,
        pendingPrescriptions: 0,
        monthlyRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Pharmacist');
    const [profileImage, setProfileImage] = useState('');
    const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/pharmacist/dashboard-stats');
            if (response.data.status === 200) {
                setStats(response.data.data);
                if (response.data.branch) {
                    setBranchInfo(response.data.branch);
                }
                if (response.data.user) {
                    setUserName(response.data.user.name || 'Pharmacist');
                }
            }
            
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            if (!userName || userName === 'Pharmacist') {
                setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
            }
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
        color,
        alert 
    }: { 
        title: string; 
        value: number | string; 
        icon: React.ReactNode; 
        color: string;
        alert?: boolean;
    }) => (
        <div className={`bg-white rounded-xl shadow-sm border ${alert ? 'border-red-300' : 'border-neutral-200'} p-6 hover:shadow-md transition-shadow relative`}>
            {alert && (
                <div className="absolute top-2 right-2">
                    <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-error-500"></span>
                    </span>
                </div>
            )}
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
            userRole="Pharmacist"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={PharmacistMenuItems} />}
        >
            <div className="space-y-6">
                {/* Branch Info Header */}
                {branchInfo && (
                    <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{branchInfo.center_name}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-emerald-100">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {branchInfo.center_type}
                                        </span>
                                        <span className="text-white/70">|</span>
                                        <span>Reg: {branchInfo.register_number}</span>
                                        {branchInfo.division_number && (
                                            <>
                                                <span className="text-white/70">|</span>
                                                <span>Division: {branchInfo.division_number}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 text-emerald-100">
                                    <User className="w-4 h-4" />
                                    <span>{branchInfo.owner_full_name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-emerald-100">
                                    <Phone className="w-4 h-4" />
                                    <span>{branchInfo.owner_contact_number}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Page Header */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                Welcome, {userName}!
                            </h1>
                            <p className="text-neutral-600 mt-1">Manage pharmacy inventory and prescriptions efficiently.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-emerald-600">${stats.todaysSales}</span>
                            <span className="text-sm text-neutral-500">Today's Sales</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <StatCard
                        title="Total Products"
                        value={stats.totalProducts}
                        icon={<Package className="w-6 h-6 text-white" />}
                        color="from-emerald-500 to-emerald-600"
                    />
                    <StatCard
                        title="Low Stock Items"
                        value={stats.lowStockItems}
                        icon={<AlertTriangle className="w-6 h-6 text-white" />}
                        color="from-red-500 to-red-600"
                        alert={stats.lowStockItems > 0}
                    />
                    <StatCard
                        title="Today's Sales"
                        value={`$${stats.todaysSales}`}
                        icon={<DollarSign className="w-6 h-6 text-white" />}
                        color="from-green-500 to-green-600"
                    />
                    <StatCard
                        title="Pending Prescriptions"
                        value={stats.pendingPrescriptions}
                        icon={<FileText className="w-6 h-6 text-white" />}
                        color="from-orange-500 to-orange-600"
                    />
                    <StatCard
                        title="Monthly Revenue"
                        value={`$${stats.monthlyRevenue}`}
                        icon={<TrendingUp className="w-6 h-6 text-white" />}
                        color="from-blue-500 to-blue-600"
                    />
                </div>

                {/* Alerts & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Stock Alerts */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-error-600" />
                            Low Stock Alerts
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-error-50 rounded-lg border border-red-200">
                                <div>
                                    <p className="font-medium text-neutral-800">Paracetamol 500mg</p>
                                    <p className="text-xs text-neutral-500">Only 15 units left</p>
                                </div>
                                <button className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">
                                    Reorder
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-error-50 rounded-lg border border-red-200">
                                <div>
                                    <p className="font-medium text-neutral-800">Amoxicillin 250mg</p>
                                    <p className="text-xs text-neutral-500">Only 8 units left</p>
                                </div>
                                <button className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">
                                    Reorder
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div>
                                    <p className="font-medium text-neutral-800">Vitamin C 1000mg</p>
                                    <p className="text-xs text-neutral-500">25 units left</p>
                                </div>
                                <button className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700">
                                    Reorder
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Package className="w-5 h-5 text-emerald-600" />
                                <div>
                                    <p className="font-medium text-neutral-800">Add New Product</p>
                                    <p className="text-xs text-neutral-500">Add item to inventory</p>
                                </div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <FileText className="w-5 h-5 text-primary-500" />
                                <div>
                                    <p className="font-medium text-neutral-800">Process Prescription</p>
                                    <p className="text-xs text-neutral-500">Handle new prescription</p>
                                </div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <ShoppingCart className="w-5 h-5 text-purple-600" />
                                <div>
                                    <p className="font-medium text-neutral-800">New Sale</p>
                                    <p className="text-xs text-neutral-500">Record a sale transaction</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
