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
    User,
    ArrowRight,
    Activity
} from 'lucide-react';
import api from "../../../utils/api/axios";
import { StatCard } from '../../../components/ui/StatCard';
import { Card } from '../../../components/ui/Card';

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

    return (
        <DashboardLayout
            userName={userName}
            userRole="Pharmacist"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={PharmacistMenuItems} />}
        >
            <div className="space-y-8 p-2">
                {/* Branch Info Header */}
                {branchInfo && (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-xl">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none"></div>

                        <div className="relative z-10 p-8">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                                <div className="flex items-start gap-5">
                                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner border border-white/20">
                                        <Building2 className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-3xl font-bold tracking-tight text-white">{branchInfo.center_name}</h2>
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium border border-white/20">
                                                {branchInfo.center_type}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-emerald-50">
                                            <span className="flex items-center gap-2 text-sm">
                                                <MapPin className="w-4 h-4 opacity-80" />
                                                Reg: {branchInfo.register_number}
                                            </span>
                                            {branchInfo.division_number && (
                                                <span className="flex items-center gap-2 text-sm">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
                                                    Division: {branchInfo.division_number}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-3 text-emerald-50">
                                        <div className="text-right">
                                            <p className="text-xs opacity-70 uppercase tracking-wider">Owner</p>
                                            <p className="font-semibold">{branchInfo.owner_full_name}</p>
                                        </div>
                                        <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-100 text-sm bg-white/10 px-3 py-1.5 rounded-full">
                                        <Phone className="w-3.5 h-3.5" />
                                        <span>{branchInfo.owner_contact_number}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">
                            Pharmacy Overview
                        </h1>
                        <p className="text-neutral-500 mt-1">Manage inventory, process prescriptions, and track sales.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-neutral-200">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Today's Sales</p>
                            <p className="text-lg font-bold text-neutral-900">${stats.todaysSales}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Products"
                        value={stats.totalProducts}
                        icon={Package}
                        className="bg-white"
                        trend={{ value: 12, label: "vs last month", isPositive: true }}
                    />
                    <StatCard
                        title="Low Stock"
                        value={stats.lowStockItems}
                        icon={AlertTriangle}
                        className={stats.lowStockItems > 0 ? "border-red-200 bg-red-50/50" : ""}
                        description="Items require reordering"
                        trend={stats.lowStockItems > 0 ? { value: stats.lowStockItems, label: "Critical", isPositive: false } : undefined}
                    />
                    <StatCard
                        title="Pending Prescriptions"
                        value={stats.pendingPrescriptions}
                        icon={FileText}
                        className="bg-white"
                        description="Waiting for processing"
                    />
                    <StatCard
                        title="Monthly Revenue"
                        value={`$${stats.monthlyRevenue}`}
                        icon={DollarSign}
                        className="bg-white"
                        trend={{ value: 8, label: "Growth", isPositive: true }}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Alerts Section */}
                    <div className="lg:col-span-2">
                        <Card title="Stock Alerts" action={<AlertTriangle className="w-5 h-5 text-error-500" />}>
                            {stats.lowStockItems > 0 ? (
                                <div className="space-y-4">
                                    {/* This would ideally map through actual low stock items, but using static for now as per original */}
                                    <div className="flex items-center justify-between p-4 bg-error-50/50 rounded-xl border border-error-100 hover:border-error-200 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white rounded-lg shadow-sm text-error-500">
                                                <AlertTriangle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-neutral-900">Paracetamol 500mg</h4>
                                                <p className="text-sm text-neutral-500">Only 15 units remaining</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-white border border-error-200 text-error-700 font-medium rounded-lg text-sm hover:bg-error-50 transition-colors shadow-sm">
                                            Reorder
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-error-50/50 rounded-xl border border-error-100 hover:border-error-200 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white rounded-lg shadow-sm text-error-500">
                                                <AlertTriangle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-neutral-900">Amoxicillin 250mg</h4>
                                                <p className="text-sm text-neutral-500">Only 8 units remaining</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-white border border-error-200 text-error-700 font-medium rounded-lg text-sm hover:bg-error-50 transition-colors shadow-sm">
                                            Reorder
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-xl border border-amber-100 hover:border-amber-200 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white rounded-lg shadow-sm text-amber-500">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-neutral-900">Vitamin C 1000mg</h4>
                                                <p className="text-sm text-neutral-500">25 units remaining (Low)</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-white border border-amber-200 text-amber-700 font-medium rounded-lg text-sm hover:bg-amber-50 transition-colors shadow-sm">
                                            Reorder
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-500 mb-4">
                                        <Package className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-medium text-neutral-900">Inventory Healthy</h3>
                                    <p className="text-neutral-500 mt-1">No low stock items detected.</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="lg:col-span-1">
                        <Card title="Quick Actions">
                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-md transition-all group text-left">
                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-900">Add Product</p>
                                        <p className="text-xs text-neutral-500 mt-0.5">New inventory item</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all ml-auto" />
                                </button>

                                <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md transition-all group text-left">
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-900">Process Rx</p>
                                        <p className="text-xs text-neutral-500 mt-0.5">Handle prescription</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all ml-auto" />
                                </button>

                                <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-purple-200 hover:bg-purple-50/30 hover:shadow-md transition-all group text-left">
                                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-900">New Sale</p>
                                        <p className="text-xs text-neutral-500 mt-0.5">Record transaction</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all ml-auto" />
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
