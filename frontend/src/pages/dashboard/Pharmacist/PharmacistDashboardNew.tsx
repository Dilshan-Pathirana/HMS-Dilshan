import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../../utils/api/axios";
import {
    FileText, Package, Pill, TrendingUp, Clock, CheckCircle, AlertTriangle,
    DollarSign, ShoppingCart, AlertCircle, Building2, MapPin, Phone, User, BarChart3
} from 'lucide-react';

interface DashboardStats {
    prescriptionsToday: number;
    dispensedToday: number;
    lowStock: number;
    nearExpiry: number;
    pendingClarifications: number;
    controlledDrugs: number;
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

interface RecentActivity {
    id: string;
    type: 'dispensed' | 'clarification' | 'alert' | 'return';
    description: string;
    time: string;
    patient?: string;
}

const PharmacistDashboardNew: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        prescriptionsToday: 48,
        dispensedToday: 42,
        lowStock: 12,
        nearExpiry: 8,
        pendingClarifications: 3,
        controlledDrugs: 156
    });

    const [recentActivities] = useState<RecentActivity[]>([
        { id: '1', type: 'dispensed', description: 'Dispensed medication for OPD patient', time: '10 mins ago', patient: 'John Doe' },
        { id: '2', type: 'alert', description: 'Low stock alert for Paracetamol 500mg', time: '25 mins ago' },
        { id: '3', type: 'clarification', description: 'Prescription clarification requested from Dr. Silva', time: '45 mins ago', patient: 'Jane Smith' },
        { id: '4', type: 'dispensed', description: 'IPD ward supply issued', time: '1 hour ago' },
        { id: '5', type: 'return', description: 'Medication return processed', time: '2 hours ago', patient: 'Mike Johnson' },
    ]);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        
        // Fetch branch information from API
        const fetchBranchInfo = async () => {
            try {
                const response = await api.get('/pharmacist/dashboard-stats');
                if (response.data.status === 200) {
                    if (response.data.branch) {
                        setBranchInfo(response.data.branch);
                    }
                    if (response.data.user?.name) {
                        setUserName(response.data.user.name);
                    }
                }
            } catch (error) {
                console.error('Error fetching branch info:', error);
            }
        };
        
        fetchBranchInfo();
    }, []);

    const quickActions = [
        { id: 'dispense', label: 'Dispense Prescription', icon: <Pill className="w-6 h-6" />, color: 'from-blue-500 to-cyan-600', path: '/pharmacy-dashboard/dispensing' },
        { id: 'check-stock', label: 'Check Stock', icon: <Package className="w-6 h-6" />, color: 'from-green-500 to-emerald-600', path: '/pharmacy-dashboard/product-list' },
        { id: 'purchase', label: 'Purchase Requests', icon: <ShoppingCart className="w-6 h-6" />, color: 'from-orange-500 to-red-600', path: '/pharmacy-dashboard/purchase' },
        { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-6 h-6" />, color: 'from-purple-500 to-pink-600', path: '/pharmacy-dashboard/reports' },
    ];

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'dispensed': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'clarification': return <FileText className="w-5 h-5 text-blue-600" />;
            case 'alert': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'return': return <Package className="w-5 h-5 text-purple-600" />;
            default: return <Clock className="w-5 h-5 text-gray-600" />;
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen ml-64 mt-16">
            {/* Branch Info Header */}
            {branchInfo && (
                <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Building2 className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{branchInfo.center_name}</h2>
                                <div className="flex items-center gap-4 mt-2 text-emerald-100 flex-wrap">
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

            {/* Welcome Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Welcome back, {userName.split(' ')[0] || 'Pharmacist'}!
                </h1>
                <p className="text-gray-600 mt-1">Here's what's happening at your pharmacy today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Prescriptions Today</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.prescriptionsToday}</p>
                    <p className="text-xs text-green-600 mt-2">+12% from yesterday</p>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Dispensed Today</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.dispensedToday}</p>
                    <p className="text-xs text-green-600 mt-2">87.5% completion rate</p>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.lowStock}</p>
                    <p className="text-xs text-yellow-600 mt-2">Requires attention</p>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Near Expiry</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.nearExpiry}</p>
                    <p className="text-xs text-red-600 mt-2">Within 90 days</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => navigate(action.path)}
                            className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all group"
                        >
                            <div className={`p-4 bg-gradient-to-br ${action.color} rounded-full text-white group-hover:scale-110 transition-transform`}>
                                {action.icon}
                            </div>
                            <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {recentActivities.map(activity => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                {getActivityIcon(activity.type)}
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                                    {activity.patient && (
                                        <p className="text-xs text-gray-500">Patient: {activity.patient}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Tasks */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Tasks</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-yellow-600" />
                                <div>
                                    <p className="font-medium text-gray-800">Prescription Clarifications</p>
                                    <p className="text-sm text-gray-600">{stats.pendingClarifications} pending</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate('/pharmacy-dashboard/prescriptions')}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                                Review
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <div>
                                    <p className="font-medium text-gray-800">Low Stock Alerts</p>
                                    <p className="text-sm text-gray-600">{stats.lowStock} items</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate('/pharmacy-dashboard/product-list')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                View
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-orange-600" />
                                <div>
                                    <p className="font-medium text-gray-800">Near Expiry Items</p>
                                    <p className="text-sm text-gray-600">{stats.nearExpiry} items</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                                Check
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <ShoppingCart className="w-5 h-5 text-purple-600" />
                                <div>
                                    <p className="font-medium text-gray-800">Purchase Requests</p>
                                    <p className="text-sm text-gray-600">Manage purchase orders</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate('/pharmacy-dashboard/purchase')}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                View
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">OPD Dispensed</p>
                        <p className="text-2xl font-bold text-blue-600">32</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">IPD Dispensed</p>
                        <p className="text-2xl font-bold text-green-600">10</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Ward Issues</p>
                        <p className="text-2xl font-bold text-purple-600">8</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Returns Processed</p>
                        <p className="text-2xl font-bold text-orange-600">5</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacistDashboardNew;
