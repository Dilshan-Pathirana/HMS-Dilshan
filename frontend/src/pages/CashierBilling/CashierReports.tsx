/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api/axios";
import {
    ArrowLeft, FileText, Download, Calendar, DollarSign,
    TrendingUp, CreditCard, Smartphone, QrCode, Banknote,
    Clock, Filter, RefreshCw, Printer, BarChart3, CheckCircle,
    XCircle, AlertCircle, History
} from "lucide-react";
import { usePOSApi } from "../../hooks/usePOSApi";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

// Type-safe wrapper components for recharts (fixes React 18 type conflicts)
const SafeResponsiveContainer = ResponsiveContainer as any;
const SafeAreaChart = AreaChart as any;
const SafeLineChart = LineChart as any;
const SafeBarChart = BarChart as any;
const SafePieChart = PieChart as any;
const SafeXAxis = XAxis as any;
const SafeYAxis = YAxis as any;
const SafeCartesianGrid = CartesianGrid as any;
const SafeTooltip = Tooltip as any;
const SafeLegend = Legend as any;
const SafeArea = Area as any;
const SafeLine = Line as any;
const SafeBar = Bar as any;
const SafePie = Pie as any;
const SafeCell = Cell as any;

interface DailyData {
    date: string;
    display_date: string;
    total_sales: number;
    transactions: number;
    cash: number;
    card: number;
    online: number;
    qr: number;
}

interface EODRecord {
    id: string;
    date: string;
    display_date: string;
    total_sales: number;
    total_transactions: number;
    cash_total: number;
    card_total: number;
    online_total: number;
    qr_total: number;
    cash_in_total: number;
    cash_out_total: number;
    expected_balance: number;
    actual_balance: number;
    variance: number;
    status: string;
    submitted_at: string | null;
    approved_at: string | null;
}

interface ReportData {
    period: {
        start: string;
        end: string;
        days: number;
    };
    summary: {
        total_sales: number;
        total_transactions: number;
        average_daily_sales: number;
        average_transaction: number;
    };
    payment_totals: {
        cash: number;
        card: number;
        online: number;
        qr: number;
    };
    daily_data: DailyData[];
    monthly_data: {
        month: string;
        display_month: string;
        total_sales: number;
        transactions: number;
    }[];
    eod_history: EODRecord[];
}

const CashierReports = () => {
    const navigate = useNavigate();
    const posApi = usePOSApi();
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [dateTo, setDateTo] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [activeTab, setActiveTab] = useState<"overview" | "daily" | "eod">("overview");

    useEffect(() => {
        fetchReportData();
    }, [dateFrom, dateTo]);

    const fetchReportData = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            
            const response = await api.get(
                posApi.dailySalesTrend,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { date_from: dateFrom, date_to: dateTo }
                }
            );

            if (response.data?.status === 200) {
                setReportData(response.data.data);
            }
        } catch (err) {
            console.error("Error fetching report data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        if (!reportData) return;

        const headers = ['Date', 'Total Sales', 'Transactions', 'Cash', 'Card', 'Online', 'QR'];
        const rows = reportData.daily_data.map(d => [
            d.date,
            d.total_sales.toFixed(2),
            d.transactions.toString(),
            d.cash.toFixed(2),
            d.card.toFixed(2),
            d.online.toFixed(2),
            d.qr.toFixed(2)
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales_report_${dateFrom}_to_${dateTo}.csv`;
        a.click();
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'SUBMITTED': return <Clock className="w-4 h-4 text-yellow-600" />;
            case 'REJECTED': return <XCircle className="w-4 h-4 text-red-600" />;
            default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700';
            case 'SUBMITTED': return 'bg-yellow-100 text-yellow-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Prepare pie chart data
    const paymentPieData = reportData ? [
        { name: 'Cash', value: reportData.payment_totals.cash, color: '#10B981' },
        { name: 'Card', value: reportData.payment_totals.card, color: '#3B82F6' },
        { name: 'Online', value: reportData.payment_totals.online, color: '#8B5CF6' },
        { name: 'QR', value: reportData.payment_totals.qr, color: '#F59E0B' },
    ].filter(d => d.value > 0) : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/pos")}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Daily Sales & EOD Reports</h1>
                                <p className="text-emerald-100 text-sm">View sales trends and EOD history</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters & Tabs */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Date Range:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                        </div>
                        <button
                            onClick={fetchReportData}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        {[
                            { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
                            { id: 'daily', label: 'Daily Sales', icon: <BarChart3 className="w-4 h-4" /> },
                            { id: 'eod', label: 'EOD History', icon: <History className="w-4 h-4" /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as "overview" | "daily" | "eod")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    activeTab === tab.id
                                        ? "bg-emerald-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {reportData && (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Sales</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        Rs. {reportData.summary.total_sales.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                                    <FileText className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Transactions</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {reportData.summary.total_transactions}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Avg Daily Sales</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        Rs. {reportData.summary.average_daily_sales.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Report Period</p>
                                    <p className="text-lg font-bold text-gray-800">
                                        {reportData.period.days} Days
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            {/* Sales Trend Line Chart */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Sales Trend</h2>
                                <div className="h-80">
                                    <SafeResponsiveContainer width="100%" height="100%">
                                        <SafeAreaChart data={reportData.daily_data}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <SafeCartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <SafeXAxis 
                                                dataKey="display_date" 
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                                tickLine={{ stroke: '#E5E7EB' }}
                                            />
                                            <SafeYAxis 
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                                tickLine={{ stroke: '#E5E7EB' }}
                                                tickFormatter={(value: number) => `Rs. ${(value/1000).toFixed(0)}k`}
                                            />
                                            <SafeTooltip 
                                                contentStyle={{ 
                                                    backgroundColor: 'white', 
                                                    border: '1px solid #E5E7EB',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                                formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Sales']}
                                            />
                                            <SafeArea 
                                                type="monotone" 
                                                dataKey="total_sales" 
                                                stroke="#10B981" 
                                                strokeWidth={2}
                                                fill="url(#colorSales)" 
                                            />
                                        </SafeAreaChart>
                                    </SafeResponsiveContainer>
                                </div>
                            </div>

                            {/* Payment Breakdown */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Pie Chart */}
                                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h2>
                                    <div className="h-64">
                                        <SafeResponsiveContainer width="100%" height="100%">
                                            <SafePieChart>
                                                <SafePie 
                                                    data={paymentPieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                >
                                                    {paymentPieData.map((entry, index) => (
                                                        <SafeCell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </SafePie>
                                                <SafeTooltip 
                                                    formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
                                                />
                                            </SafePieChart>
                                        </SafeResponsiveContainer>
                                    </div>
                                </div>

                                {/* Payment Method Cards */}
                                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Breakdown</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                                    <Banknote className="h-5 w-5 text-white" />
                                                </div>
                                                <span className="font-medium text-gray-700">Cash</span>
                                            </div>
                                            <p className="text-xl font-bold text-green-700">
                                                Rs. {reportData.payment_totals.cash.toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                                                    <CreditCard className="h-5 w-5 text-white" />
                                                </div>
                                                <span className="font-medium text-gray-700">Card</span>
                                            </div>
                                            <p className="text-xl font-bold text-blue-700">
                                                Rs. {reportData.payment_totals.card.toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                                                    <Smartphone className="h-5 w-5 text-white" />
                                                </div>
                                                <span className="font-medium text-gray-700">Online</span>
                                            </div>
                                            <p className="text-xl font-bold text-purple-700">
                                                Rs. {reportData.payment_totals.online.toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                                                    <QrCode className="h-5 w-5 text-white" />
                                                </div>
                                                <span className="font-medium text-gray-700">QR Code</span>
                                            </div>
                                            <p className="text-xl font-bold text-orange-700">
                                                Rs. {reportData.payment_totals.qr.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Transactions per Day Bar Chart */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Transactions</h2>
                                <div className="h-64">
                                    <SafeResponsiveContainer width="100%" height="100%">
                                        <SafeBarChart data={reportData.daily_data}>
                                            <SafeCartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <SafeXAxis 
                                                dataKey="display_date" 
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                            />
                                            <SafeYAxis 
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                            />
                                            <SafeTooltip 
                                                contentStyle={{ 
                                                    backgroundColor: 'white', 
                                                    border: '1px solid #E5E7EB',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <SafeBar dataKey="transactions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        </SafeBarChart>
                                    </SafeResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Daily Sales Tab */}
                    {activeTab === "daily" && (
                        <div className="space-y-6">
                            {/* Payment Methods Stacked Chart */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Sales by Payment Method</h2>
                                <div className="h-80">
                                    <SafeResponsiveContainer width="100%" height="100%">
                                        <SafeAreaChart data={reportData.daily_data}>
                                            <SafeCartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <SafeXAxis 
                                                dataKey="display_date" 
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                            />
                                            <SafeYAxis 
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                                tickFormatter={(value: number) => `Rs. ${(value/1000).toFixed(0)}k`}
                                            />
                                            <SafeTooltip 
                                                contentStyle={{ 
                                                    backgroundColor: 'white', 
                                                    border: '1px solid #E5E7EB',
                                                    borderRadius: '8px'
                                                }}
                                                formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
                                            />
                                            <SafeLegend />
                                            <SafeArea type="monotone" dataKey="cash" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Cash" />
                                            <SafeArea type="monotone" dataKey="card" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Card" />
                                            <SafeArea type="monotone" dataKey="online" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Online" />
                                            <SafeArea type="monotone" dataKey="qr" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="QR" />
                                        </SafeAreaChart>
                                    </SafeResponsiveContainer>
                                </div>
                            </div>

                            {/* Daily Data Table */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800">Daily Breakdown</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white">
                                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Transactions</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Cash</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Card</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Online</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">QR</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {reportData.daily_data.slice().reverse().map((day) => (
                                                <tr key={day.date} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {new Date(day.date).toLocaleDateString('en-US', { 
                                                            weekday: 'short',
                                                            month: 'short', 
                                                            day: 'numeric' 
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                                        {day.transactions}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                                        Rs. {day.cash.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                                        Rs. {day.card.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                                        Rs. {day.online.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                                        Rs. {day.qr.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                                        Rs. {day.total_sales.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50 font-semibold">
                                                <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-center">
                                                    {reportData.summary.total_transactions}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    Rs. {reportData.payment_totals.cash.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    Rs. {reportData.payment_totals.card.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    Rs. {reportData.payment_totals.online.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    Rs. {reportData.payment_totals.qr.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    Rs. {reportData.summary.total_sales.toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EOD History Tab */}
                    {activeTab === "eod" && (
                        <div className="space-y-6">
                            {/* EOD Summary Chart */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">EOD Sales History</h2>
                                <div className="h-80">
                                    <SafeResponsiveContainer width="100%" height="100%">
                                        <SafeLineChart data={reportData.eod_history.slice().reverse()}>
                                            <SafeCartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <SafeXAxis 
                                                dataKey="display_date" 
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                            />
                                            <SafeYAxis 
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                                tickFormatter={(value: number) => `Rs. ${(value/1000).toFixed(0)}k`}
                                            />
                                            <SafeTooltip 
                                                contentStyle={{ 
                                                    backgroundColor: 'white', 
                                                    border: '1px solid #E5E7EB',
                                                    borderRadius: '8px'
                                                }}
                                                formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
                                            />
                                            <SafeLegend />
                                            <SafeLine type="monotone" dataKey="total_sales" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} name="Total Sales" />
                                            <SafeLine type="monotone" dataKey="expected_balance" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} name="Expected Balance" />
                                            <SafeLine type="monotone" dataKey="actual_balance" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} name="Actual Balance" />
                                        </SafeLineChart>
                                    </SafeResponsiveContainer>
                                </div>
                            </div>

                            {/* Variance Chart */}
                            {reportData.eod_history.length > 0 && (
                                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Cash Variance History</h2>
                                    <div className="h-64">
                                        <SafeResponsiveContainer width="100%" height="100%">
                                            <SafeBarChart data={reportData.eod_history.slice().reverse()}>
                                                <SafeCartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                                <SafeXAxis 
                                                    dataKey="display_date" 
                                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                                />
                                                <SafeYAxis 
                                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                                />
                                                <SafeTooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'white', 
                                                        border: '1px solid #E5E7EB',
                                                        borderRadius: '8px'
                                                    }}
                                                    formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
                                                />
                                                <SafeBar 
                                                    dataKey="variance" 
                                                    fill="#EF4444"
                                                    radius={[4, 4, 0, 0]}
                                                    name="Variance"
                                                />
                                            </SafeBarChart>
                                        </SafeResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* EOD History Table */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800">EOD History Details</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Total Sales</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Trans.</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Cash In/Out</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Expected</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Actual</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Variance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {reportData.eod_history.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                                        <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                        <p className="text-lg font-medium">No EOD history found</p>
                                                        <p className="text-sm">EOD records will appear here after submission</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                reportData.eod_history.map((eod) => (
                                                    <tr key={eod.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {eod.display_date}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(eod.status)}`}>
                                                                {getStatusIcon(eod.status)}
                                                                {eod.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                                            Rs. {eod.total_sales.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                                            {eod.total_transactions}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                            <span className="text-green-600">+{eod.cash_in_total.toLocaleString()}</span>
                                                            <span className="text-gray-400 mx-1">/</span>
                                                            <span className="text-red-600">-{eod.cash_out_total.toLocaleString()}</span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                                            Rs. {eod.expected_balance.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                                            Rs. {eod.actual_balance.toLocaleString()}
                                                        </td>
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                                                            eod.variance === 0 ? 'text-green-600' :
                                                            Math.abs(eod.variance) < 100 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                            Rs. {eod.variance.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CashierReports;
