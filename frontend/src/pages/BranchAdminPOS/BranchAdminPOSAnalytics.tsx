import { useEffect, useState } from "react";
import api from "../../utils/api/axios";
import {
    TrendingUp, AlertCircle, DollarSign, ShoppingCart,
    Calendar, Filter, Package
} from "lucide-react";

interface AnalyticsData {
    branch: {
        id: string;
        name: string;
    };
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
    top_cashiers: {
        id: string;
        name: string;
        total_sales: number;
        transaction_count: number;
    }[];
    top_products: {
        name: string;
        quantity: number;
        revenue: number;
    }[];
}

const BranchAdminPOSAnalytics = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [dateRange, setDateRange] = useState<'7days' | '30days' | 'thisMonth'>('7days');

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("authToken");
            const response = await api.get(
                `/api/branch-admin/pos/analytics?range=${dateRange}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.status === 200) {
                setAnalytics(response.data.data);
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
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <p className="text-gray-600">{error || "Failed to load analytics"}</p>
                </div>
            </div>
        );
    }

    const { summary, daily_sales, payment_trends, top_cashiers, top_products } = analytics;
    const maxSales = Math.max(...daily_sales.map(d => d.sales));

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Branch Analytics</h1>
                    <p className="text-gray-500">{analytics.branch.name} - Sales Performance</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="thisMonth">This Month</option>
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="p-3 bg-emerald-100 rounded-lg w-fit">
                        <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">Total Sales</p>
                        <p className="text-2xl font-bold text-gray-900">
                            Rs. {summary.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="p-3 bg-blue-100 rounded-lg w-fit">
                        <ShoppingCart className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">Total Transactions</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.total_transactions}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="p-3 bg-purple-100 rounded-lg w-fit">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">Average Transaction</p>
                        <p className="text-2xl font-bold text-gray-900">
                            Rs. {summary.average_transaction.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="p-3 bg-orange-100 rounded-lg w-fit">
                        <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">Net Cash Flow</p>
                        <p className={`text-2xl font-bold ${(summary.total_cash_in - summary.total_cash_out) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Rs. {(summary.total_cash_in - summary.total_cash_out).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Sales Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales Trend</h3>
                    <div className="space-y-3">
                        {daily_sales.map((day) => {
                            const percentage = maxSales > 0 ? (day.sales / maxSales) * 100 : 0;
                            return (
                                <div key={day.date} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500 w-20">
                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-700 w-24 text-right">
                                        Rs. {day.sales.toLocaleString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Payment Method Distribution */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Distribution</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Cash', value: payment_trends.cash, color: 'bg-green-500' },
                            { label: 'Card', value: payment_trends.card, color: 'bg-blue-500' },
                            { label: 'Online', value: payment_trends.online, color: 'bg-purple-500' },
                            { label: 'QR Code', value: payment_trends.qr, color: 'bg-orange-500' },
                        ].map((method) => {
                            const total = payment_trends.cash + payment_trends.card + payment_trends.online + payment_trends.qr;
                            const percentage = total > 0 ? ((method.value / total) * 100).toFixed(1) : '0';
                            return (
                                <div key={method.label} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-3 h-3 rounded-full ${method.color}`}></div>
                                        <span className="text-sm font-medium text-gray-700">{method.label}</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900">{percentage}%</p>
                                    <p className="text-xs text-gray-500">
                                        Rs. {method.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Top Cashiers */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Cashiers</h3>
                {top_cashiers && top_cashiers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Rank</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Cashier</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Transactions</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Total Sales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top_cashiers.map((cashier, index) => (
                                    <tr key={cashier.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-50 text-gray-500'
                                            }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-medium text-gray-900">{cashier.name}</td>
                                        <td className="py-3 px-4 text-right text-gray-600">{cashier.transaction_count}</td>
                                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                                            Rs. {cashier.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No data available for the selected period</p>
                    </div>
                )}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-600" />
                    Top Selling Products
                </h3>
                {top_products && top_products.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Rank</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Qty Sold</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top_products.map((product, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-50 text-gray-500'
                                            }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                                        <td className="py-3 px-4 text-right text-gray-600">{product.quantity}</td>
                                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                                            Rs. {product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No product data available for the selected period</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BranchAdminPOSAnalytics;
