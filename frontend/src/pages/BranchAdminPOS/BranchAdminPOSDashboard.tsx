import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api/axios";
import {
    DollarSign, ShoppingCart, TrendingUp, AlertCircle,
    PlusCircle, Building2, FileText,
    CreditCard, Smartphone, QrCode, User, MapPin, BarChart3,
    Users, ArrowUpRight, ArrowDownRight
} from "lucide-react";

interface BranchDashboardStats {
    branch: {
        id: string;
        name: string;
        type: string;
    };
    today_stats: {
        date: string;
        total_sales: number;
        transaction_count: number;
        cash_in: number;
        cash_out: number;
        net_cash: number;
    };
    payment_breakdown: {
        cash: number;
        card: number;
        online: number;
        qr: number;
    };
    cashier_stats: {
        id: string;
        name: string;
        total_sales: number;
        transaction_count: number;
        eod_status: string;
    }[];
    comparison: {
        yesterday_sales: number;
        sales_change_percentage: number;
    };
}

const BranchAdminPOSDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<BranchDashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("authToken");
            const response = await api.get(
                "/api/branch-admin/pos/dashboard-stats",
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.status === 200) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            setError("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <p className="text-gray-600">{error || "Failed to load dashboard"}</p>
                </div>
            </div>
        );
    }

    const { today_stats, payment_breakdown, cashier_stats, comparison } = stats;
    const salesChangePositive = comparison.sales_change_percentage >= 0;

    const quickActions = [
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-6 h-6" />, color: 'from-indigo-500 to-violet-600', path: '/pos/analytics' },
        { id: 'new-sale', label: 'New Transaction', icon: <ShoppingCart className="w-6 h-6" />, color: 'from-blue-500 to-cyan-600', path: '/pos/pos' },
        { id: 'transactions', label: 'Transactions', icon: <FileText className="w-6 h-6" />, color: 'from-purple-500 to-pink-600', path: '/pos/transactions' },
        { id: 'reports', label: 'Reports', icon: <TrendingUp className="w-6 h-6" />, color: 'from-orange-500 to-red-600', path: '/pos/reports' },
    ];

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Branch Info Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{stats.branch.name}</h2>
                            <div className="flex items-center gap-4 mt-2 text-purple-100 flex-wrap">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {stats.branch.type || 'Branch'}
                                </span>
                                <span className="text-white/70">|</span>
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    Branch Admin View
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-purple-100 text-sm">
                            {new Date(today_stats.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => navigate(action.path)}
                        className={`bg-gradient-to-r ${action.color} text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex flex-col items-center gap-2`}
                    >
                        {action.icon}
                        <span className="font-medium text-sm">{action.label}</span>
                    </button>
                ))}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Today's Sales */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${salesChangePositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {salesChangePositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {Math.abs(comparison.sales_change_percentage).toFixed(1)}%
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">Today's Sales</p>
                        <p className="text-2xl font-bold text-gray-900">
                            Rs. {today_stats.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            vs Rs. {comparison.yesterday_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })} yesterday
                        </p>
                    </div>
                </div>

                {/* Transaction Count */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="p-3 bg-blue-100 rounded-lg w-fit">
                        <ShoppingCart className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">Transactions</p>
                        <p className="text-2xl font-bold text-gray-900">{today_stats.transaction_count}</p>
                    </div>
                </div>

                {/* Cash In */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="p-3 bg-green-100 rounded-lg w-fit">
                        <PlusCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">Cash In</p>
                        <p className="text-2xl font-bold text-green-600">
                            Rs. {today_stats.cash_in.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Net Cash */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="p-3 bg-purple-100 rounded-lg w-fit">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">Net Cash</p>
                        <p className="text-2xl font-bold text-purple-600">
                            Rs. {today_stats.net_cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Payment Methods & Cashiers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Breakdown */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        Payment Methods
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Cash', value: payment_breakdown.cash, icon: <DollarSign className="w-5 h-5" />, color: 'bg-green-500' },
                            { label: 'Card', value: payment_breakdown.card, icon: <CreditCard className="w-5 h-5" />, color: 'bg-blue-500' },
                            { label: 'Online', value: payment_breakdown.online, icon: <Smartphone className="w-5 h-5" />, color: 'bg-purple-500' },
                            { label: 'QR', value: payment_breakdown.qr, icon: <QrCode className="w-5 h-5" />, color: 'bg-orange-500' },
                        ].map((method) => {
                            const total = payment_breakdown.cash + payment_breakdown.card + payment_breakdown.online + payment_breakdown.qr;
                            const percentage = total > 0 ? (method.value / total) * 100 : 0;
                            return (
                                <div key={method.label} className="flex items-center gap-4">
                                    <div className={`p-2 ${method.color} text-white rounded-lg`}>
                                        {method.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{method.label}</span>
                                            <span className="text-sm text-gray-500">
                                                Rs. {method.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`${method.color} h-2 rounded-full`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cashier Performance */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-600" />
                        Cashier Performance
                    </h3>
                    {cashier_stats && cashier_stats.length > 0 ? (
                        <div className="space-y-3">
                            {cashier_stats.map((cashier) => (
                                <div key={cashier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 rounded-full">
                                            <User className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{cashier.name}</p>
                                            <p className="text-xs text-gray-500">{cashier.transaction_count} transactions</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">
                                            Rs. {cashier.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            cashier.eod_status === 'OPEN' ? 'bg-green-100 text-green-700' :
                                            cashier.eod_status === 'LOCKED' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {cashier.eod_status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No cashier activity today</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BranchAdminPOSDashboard;
