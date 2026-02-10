import { useEffect, useState } from "react";
import api from "../../../../utils/api/axios";
import {
    DollarSign, ShoppingCart, TrendingUp, AlertCircle,
    Building2, ArrowUpRight, ArrowDownRight,
    CreditCard, Smartphone, QrCode, BarChart3, Filter,
    RefreshCw
} from "lucide-react";

interface Branch {
    id: string;
    name: string;
    type?: string;
}

interface DashboardStats {
    selected_branch: Branch | null;
    all_branches: Branch[];
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
    branch_performance: {
        id: string;
        name: string;
        type: string;
        total_sales: number;
        transaction_count: number;
    }[];
    comparison: {
        yesterday_sales: number;
        sales_change_percentage: number;
    };
}

const SuperAdminPOSDashboardEnhanced = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedBranchId, setSelectedBranchId] = useState<string>("");

    useEffect(() => {
        fetchDashboardStats();
    }, [selectedBranchId]);

    const fetchDashboardStats = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("userToken");
            const url = selectedBranchId
                ? `/super-admin/pos/dashboard-stats?branch_id=${selectedBranchId}`
                : "/super-admin/pos/dashboard-stats";

            const response = await api.get(url, token ? {
                headers: { Authorization: `Bearer ${token}` },
            } : undefined);

            const payload = (response as any)?.data ?? response;
            const statsData = payload?.data ?? payload?.stats ?? payload;
            const isOk = payload?.status === 200 || payload?.status === "success" || payload?.success === true;

            if (isOk && statsData?.today_stats) {
                setStats(statsData);
            } else if (statsData?.today_stats) {
                setStats(statsData);
            } else {
                setError("Failed to load dashboard data");
            }
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            setError("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBranchChange = (branchId: string) => {
        setSelectedBranchId(branchId);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-error-500 mb-4" />
                    <p className="text-neutral-600">{error || "Failed to load dashboard"}</p>
                </div>
            </div>
        );
    }

    const { today_stats, payment_breakdown, branch_performance, comparison, all_branches } = stats;
    const salesChangePositive = comparison.sales_change_percentage >= 0;

    return (
        <div className="p-6 space-y-6 bg-neutral-50 min-h-screen">
            {/* Header with Branch Filter */}
            <div className="bg-gradient-to-r from-primary-500 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">
                                {selectedBranchId ? stats.selected_branch?.name : "All Branches"}
                            </h2>
                            <p className="text-blue-100 mt-1">Super Admin POS Dashboard</p>
                        </div>
                    </div>

                    {/* Branch Filter */}
                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-blue-200" />
                        <select
                            value={selectedBranchId}
                            onChange={(e) => handleBranchChange(e.target.value)}
                            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[200px]"
                        >
                            <option value="" className="text-neutral-800">All Branches</option>
                            {all_branches.map((branch) => (
                                <option key={branch.id} value={branch.id} className="text-neutral-800">
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => fetchDashboardStats()}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="mt-4 text-right">
                    <p className="text-blue-100 text-sm">
                        {new Date(today_stats.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Today's Sales */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${salesChangePositive ? 'text-emerald-600' : 'text-error-600'}`}>
                            {salesChangePositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {Math.abs(comparison.sales_change_percentage).toFixed(1)}%
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-neutral-500">Today's Sales</p>
                        <p className="text-2xl font-bold text-neutral-900">
                            Rs. {today_stats.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                            vs Rs. {comparison.yesterday_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })} yesterday
                        </p>
                    </div>
                </div>

                {/* Transaction Count */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="p-3 bg-blue-100 rounded-lg w-fit">
                        <ShoppingCart className="w-6 h-6 text-primary-500" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-neutral-500">Transactions</p>
                        <p className="text-2xl font-bold text-neutral-900">{today_stats.transaction_count}</p>
                    </div>
                </div>

                {/* Cash In */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="p-3 bg-green-100 rounded-lg w-fit">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-neutral-500">Cash In</p>
                        <p className="text-2xl font-bold text-green-600">
                            Rs. {today_stats.cash_in.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Net Cash */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="p-3 bg-purple-100 rounded-lg w-fit">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-neutral-500">Net Cash</p>
                        <p className="text-2xl font-bold text-purple-600">
                            Rs. {today_stats.net_cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Payment Methods & Branch Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Breakdown */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-neutral-600" />
                        Payment Methods
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Cash', value: payment_breakdown.cash, icon: <DollarSign className="w-5 h-5" />, color: 'bg-green-500' },
                            { label: 'Card', value: payment_breakdown.card, icon: <CreditCard className="w-5 h-5" />, color: 'bg-primary-500' },
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
                                            <span className="text-sm font-medium text-neutral-700">{method.label}</span>
                                            <span className="text-sm text-neutral-500">
                                                Rs. {method.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="w-full bg-neutral-200 rounded-full h-2">
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

                {/* Branch Performance */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-neutral-600" />
                        {selectedBranchId ? 'Branch Details' : 'Branch Performance'}
                    </h3>
                    {branch_performance && branch_performance.length > 0 ? (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {branch_performance.map((branch, index) => (
                                <div
                                    key={branch.id}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                        selectedBranchId === branch.id ? 'bg-blue-50 border border-blue-200' : 'bg-neutral-50 hover:bg-neutral-100'
                                    }`}
                                    onClick={() => handleBranchChange(selectedBranchId === branch.id ? '' : branch.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${
                                            index === 0 ? 'bg-yellow-100' :
                                            index === 1 ? 'bg-neutral-100' :
                                            index === 2 ? 'bg-orange-100' :
                                            'bg-indigo-100'
                                        }`}>
                                            <Building2 className={`w-4 h-4 ${
                                                index === 0 ? 'text-yellow-600' :
                                                index === 1 ? 'text-neutral-600' :
                                                index === 2 ? 'text-orange-600' :
                                                'text-indigo-600'
                                            }`} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutral-900">{branch.name}</p>
                                            <p className="text-xs text-neutral-500">{branch.transaction_count} transactions</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-neutral-900">
                                            Rs. {branch.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                        <span className="text-xs text-neutral-400">{branch.type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-neutral-500">
                            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No branch activity today</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminPOSDashboardEnhanced;
