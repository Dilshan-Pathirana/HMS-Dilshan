import { useEffect, useState } from "react";
import api from "../../../../utils/api/axios";
import {
    TrendingUp, AlertCircle, DollarSign, ShoppingCart,
    Calendar, Building2, Users, RefreshCw, Package
} from "lucide-react";

interface Branch {
    id: string;
    name: string;
}

interface AnalyticsData {
    branches: Branch[];
    selected_branch_id: string | null;
    summary: {
        total_sales: number;
        total_transactions: number;
        average_transaction: number;
        total_cash_in: number;
        total_cash_out: number;
    };
    daily_sales: {
        date: string;
        sales: number;
        transactions: number;
    }[];
    payment_trends: {
        cash: number;
        card: number;
        online: number;
        qr: number;
    };
    branch_comparison: {
        id: string;
        name: string;
        total_sales: number;
        transaction_count: number;
    }[];
    top_cashiers: {
        id: string;
        name: string;
        branch_name: string;
        total_sales: number;
        transaction_count: number;
    }[];
    top_products: {
        name: string;
        quantity: number;
        revenue: number;
    }[];
}

const SuperAdminPOSAnalytics = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [dateRange, setDateRange] = useState<'7days' | '30days' | 'thisMonth' | '3months'>('7days');
    const [selectedBranchId, setSelectedBranchId] = useState<string>("");

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange, selectedBranchId]);

    const fetchAnalytics = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("userToken");
            let url = `/super-admin/pos/analytics?range=${dateRange}`;
            if (selectedBranchId) {
                url += `&branch_id=${selectedBranchId}`;
            }

            const response = await api.get(url, token ? {
                headers: { Authorization: `Bearer ${token}` },
            } : undefined);

            const payload = (response as any)?.data ?? response;
            const analyticsData = payload?.data ?? payload?.analytics ?? payload;
            const isOk = payload?.status === 200 || payload?.status === "success" || payload?.success === true;

            if (isOk && analyticsData?.summary) {
                setAnalytics(analyticsData);
            } else if (analyticsData?.summary) {
                setAnalytics(analyticsData);
            } else {
                setError("Failed to load analytics data");
            }
        } catch (err) {
            console.error("Error fetching analytics:", err);
            setError("Failed to load analytics data");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-error-500 mb-4" />
                    <p className="text-neutral-600">{error || "Failed to load analytics"}</p>
                </div>
            </div>
        );
    }

    const { summary, daily_sales, payment_trends, branch_comparison, top_cashiers, top_products, branches } = analytics;
    const maxSales = Math.max(...daily_sales.map(d => d.sales), 1);

    return (
        <div className="p-6 space-y-6 bg-neutral-50 min-h-screen">
            {/* Header with Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">POS Analytics</h1>
                    <p className="text-neutral-500">
                        {selectedBranchId
                            ? branches.find(b => b.id === selectedBranchId)?.name
                            : "All Branches"} - Sales Performance
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Branch Filter */}
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-neutral-400" />
                        <select
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            className="border border-neutral-300 rounded-lg px-4 py-2 bg-white text-neutral-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">All Branches</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-neutral-400" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                            className="border border-neutral-300 rounded-lg px-4 py-2 bg-white text-neutral-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="thisMonth">This Month</option>
                            <option value="3months">Last 3 Months</option>
                        </select>
                    </div>

                    <button
                        onClick={() => fetchAnalytics()}
                        className="p-2 bg-blue-50 text-primary-500 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="p-2 bg-emerald-100 rounded-lg w-fit">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-neutral-500">Total Sales</p>
                        <p className="text-xl font-bold text-neutral-900">
                            Rs. {summary.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="p-2 bg-blue-100 rounded-lg w-fit">
                        <ShoppingCart className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-neutral-500">Transactions</p>
                        <p className="text-xl font-bold text-neutral-900">{summary.total_transactions}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="p-2 bg-purple-100 rounded-lg w-fit">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-neutral-500">Avg Transaction</p>
                        <p className="text-xl font-bold text-neutral-900">
                            Rs. {summary.average_transaction.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="p-2 bg-green-100 rounded-lg w-fit">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-neutral-500">Cash In</p>
                        <p className="text-xl font-bold text-green-600">
                            Rs. {summary.total_cash_in.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="p-2 bg-orange-100 rounded-lg w-fit">
                        <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-neutral-500">Net Cash Flow</p>
                        <p className={`text-xl font-bold ${(summary.total_cash_in - summary.total_cash_out) >= 0 ? 'text-green-600' : 'text-error-600'}`}>
                            Rs. {(summary.total_cash_in - summary.total_cash_out).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Sales Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Daily Sales Trend</h3>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                        {daily_sales.map((day) => {
                            const percentage = maxSales > 0 ? (day.sales / maxSales) * 100 : 0;
                            return (
                                <div key={day.date} className="flex items-center gap-3">
                                    <span className="text-xs text-neutral-500 w-16">
                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex-1 h-5 bg-neutral-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-medium text-neutral-700 w-20 text-right">
                                        Rs. {day.sales.toLocaleString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Payment Method Distribution */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Payment Distribution</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Cash', value: payment_trends.cash, color: 'bg-green-500' },
                            { label: 'Card', value: payment_trends.card, color: 'bg-primary-500' },
                            { label: 'Online', value: payment_trends.online, color: 'bg-purple-500' },
                            { label: 'QR Code', value: payment_trends.qr, color: 'bg-orange-500' },
                        ].map((method) => {
                            const total = payment_trends.cash + payment_trends.card + payment_trends.online + payment_trends.qr;
                            const percentage = total > 0 ? ((method.value / total) * 100).toFixed(1) : '0';
                            return (
                                <div key={method.label} className="bg-neutral-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-3 h-3 rounded-full ${method.color}`}></div>
                                        <span className="text-sm font-medium text-neutral-700">{method.label}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-neutral-900">{percentage}%</p>
                                    <p className="text-xs text-neutral-500">
                                        Rs. {method.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Branch Comparison & Top Cashiers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Branch Comparison */}
                {!selectedBranchId && branch_comparison && branch_comparison.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-neutral-600" />
                            Branch Comparison
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-neutral-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-600">Branch</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-600">Trans.</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-600">Sales</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branch_comparison.slice(0, 10).map((branch, index) => (
                                        <tr key={branch.id} className="border-b border-gray-100 hover:bg-neutral-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        index === 1 ? 'bg-neutral-100 text-neutral-700' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-neutral-50 text-neutral-500'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                    <span className="font-medium text-neutral-900">{branch.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right text-neutral-600">{branch.transaction_count}</td>
                                            <td className="py-3 px-4 text-right font-semibold text-neutral-900">
                                                Rs. {branch.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Top Cashiers */}
                <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${!selectedBranchId && branch_comparison.length > 0 ? '' : 'lg:col-span-2'}`}>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-neutral-600" />
                        Top Performing Cashiers
                    </h3>
                    {top_cashiers && top_cashiers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-neutral-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-600">Rank</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-600">Cashier</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-600">Branch</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-600">Trans.</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-600">Sales</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top_cashiers.map((cashier, index) => (
                                        <tr key={cashier.id} className="border-b border-gray-100 hover:bg-neutral-50">
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    index === 1 ? 'bg-neutral-100 text-neutral-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-neutral-50 text-neutral-500'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-medium text-neutral-900">{cashier.name}</td>
                                            <td className="py-3 px-4 text-neutral-600">{cashier.branch_name}</td>
                                            <td className="py-3 px-4 text-right text-neutral-600">{cashier.transaction_count}</td>
                                            <td className="py-3 px-4 text-right font-semibold text-neutral-900">
                                                Rs. {cashier.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-neutral-500">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No data available for the selected period</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-neutral-600" />
                    Top Selling Products
                </h3>
                {top_products && top_products.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-600">Rank</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-600">Product</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-600">Qty Sold</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-600">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top_products.map((product, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-neutral-50">
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-neutral-100 text-neutral-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-neutral-50 text-neutral-500'
                                            }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-medium text-neutral-900">{product.name}</td>
                                        <td className="py-3 px-4 text-right text-neutral-600">{product.quantity}</td>
                                        <td className="py-3 px-4 text-right font-semibold text-neutral-900">
                                            Rs. {product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-neutral-500">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No product data available for the selected period</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminPOSAnalytics;
