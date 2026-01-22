/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    ArrowLeft, FileText, Search, Filter, Download,
    Receipt, DollarSign, CreditCard, Smartphone, QrCode, ListFilter,
    BarChart3, TrendingUp, Calendar, RefreshCw, Printer, Clock,
    CheckCircle, XCircle, AlertCircle, History, Banknote
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

interface ServiceItem {
    id?: string;
    service: string;
    amount: number;
    quantity?: number;
    product_id?: string;
}

interface Transaction {
    id: string;
    transaction_type: string;
    invoice_number: string;
    receipt_number: string;
    patient_name: string;
    patient_phone?: string;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    payment_status: string;
    payment_method: string;
    service_details: ServiceItem[] | string;
    remarks?: string;
    created_at: string;
}

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

const CashierTransactionList = () => {
    const navigate = useNavigate();
    const posApi = usePOSApi();
    const [activeTab, setActiveTab] = useState<"transactions" | "reports" | "eod">("transactions");
    
    // Transaction list state
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("ALL");
    const [filterPayment, setFilterPayment] = useState("ALL");
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    
    // Reports state
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isReportsLoading, setIsReportsLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [dateTo, setDateTo] = useState(
        new Date().toISOString().split('T')[0]
    );

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        if (activeTab === "reports" || activeTab === "eod") {
            fetchReportData();
        }
    }, [activeTab, dateFrom, dateTo]);

    const fetchTransactions = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            const response = await axios.get(
                posApi.transactions,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.status === 200) {
                setTransactions(Array.isArray(response.data.data) ? response.data.data : []);
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchReportData = async () => {
        try {
            setIsReportsLoading(true);
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            
            const response = await axios.get(
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
            setIsReportsLoading(false);
        }
    };

    const filteredTransactions = (Array.isArray(transactions) ? transactions : []).filter(t => {
        const matchesSearch =
            (t.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.receipt_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === "ALL" || t.transaction_type === filterType;
        const matchesPayment = filterPayment === "ALL" || t.payment_method === filterPayment;

        return matchesSearch && matchesType && matchesPayment;
    });

    const getPaymentIcon = (method: string) => {
        const icons = {
            CASH: DollarSign,
            CARD: CreditCard,
            ONLINE: Smartphone,
            QR: QrCode,
        };
        return icons[method as keyof typeof icons] || DollarSign;
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            PAID: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200",
            PARTIAL: "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200",
            PENDING: "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200",
        };
        return styles[status as keyof typeof styles] || styles.PENDING;
    };

    const getEODStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'SUBMITTED': return <Clock className="w-4 h-4 text-yellow-600" />;
            case 'REJECTED': return <XCircle className="w-4 h-4 text-red-600" />;
            default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const parseServiceDetails = (details: ServiceItem[] | string): ServiceItem[] => {
        if (typeof details === 'string') {
            try {
                return JSON.parse(details);
            } catch {
                return [];
            }
        }
        return details || [];
    };

    const reprintReceipt = (transaction: Transaction) => {
        const items = parseServiceDetails(transaction.service_details);
        const now = new Date(transaction.created_at);
        const dateStr = now.toLocaleDateString('en-GB');
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const balance = transaction.total_amount - transaction.paid_amount;

        const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receipt - ${transaction.receipt_number}</title>
    <style>
        @page { size: 58mm auto; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 10px; width: 58mm; padding: 2mm; line-height: 1.3; }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 3mm; margin-bottom: 2mm; }
        .header h1 { font-size: 12px; font-weight: bold; margin-bottom: 1mm; }
        .header p { font-size: 8px; }
        .info-row { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 1mm; }
        .divider { border-top: 1px dashed #000; margin: 2mm 0; }
        .items-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 9px; border-bottom: 1px solid #000; padding-bottom: 1mm; margin-bottom: 1mm; }
        .item-row { margin-bottom: 1.5mm; }
        .item-name { font-size: 9px; font-weight: bold; }
        .item-details { display: flex; justify-content: space-between; font-size: 8px; padding-left: 2mm; }
        .totals { border-top: 1px dashed #000; margin-top: 2mm; padding-top: 2mm; }
        .total-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 1mm; }
        .total-row.grand { font-weight: bold; font-size: 11px; border-top: 1px solid #000; padding-top: 1mm; margin-top: 1mm; }
        .footer { text-align: center; margin-top: 3mm; padding-top: 2mm; border-top: 1px dashed #000; font-size: 8px; }
        .footer p { margin-bottom: 1mm; }
        .reprint { text-align: center; font-size: 8px; font-weight: bold; margin-top: 2mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>CURE HOSPITAL</h1>
        <p>Healthcare Excellence</p>
    </div>
    <div class="reprint">*** REPRINT ***</div>
    <div class="info-row"><span>Date: ${dateStr}</span><span>Time: ${timeStr}</span></div>
    <div class="info-row"><span>Rcpt#: ${transaction.receipt_number}</span></div>
    <div class="info-row"><span>Inv#: ${transaction.invoice_number}</span></div>
    <div class="info-row"><span>Patient: ${transaction.patient_name}</span></div>
    ${transaction.patient_phone ? `<div class="info-row"><span>Phone: ${transaction.patient_phone}</span></div>` : ''}
    <div class="info-row"><span>Type: ${transaction.transaction_type}</span><span>Pay: ${transaction.payment_method}</span></div>
    <div class="divider"></div>
    <div class="items-header"><span>Item</span><span>Amount</span></div>
    ${items.map(item => `
        <div class="item-row">
            <div class="item-name">${item.service}</div>
            <div class="item-details">
                <span>${item.quantity || 1} x Rs.${((item.amount / (item.quantity || 1))).toFixed(2)}</span>
                <span>Rs.${item.amount.toFixed(2)}</span>
            </div>
        </div>
    `).join('')}
    <div class="totals">
        <div class="total-row"><span>Sub Total:</span><span>Rs.${transaction.total_amount.toFixed(2)}</span></div>
        <div class="total-row grand"><span>TOTAL:</span><span>Rs.${transaction.total_amount.toFixed(2)}</span></div>
        <div class="total-row"><span>Paid:</span><span>Rs.${transaction.paid_amount.toFixed(2)}</span></div>
        ${balance !== 0 ? `<div class="total-row"><span>${balance > 0 ? 'Balance Due:' : 'Change:'}</span><span>Rs.${Math.abs(balance).toFixed(2)}</span></div>` : ''}
    </div>
    <div class="footer">
        <p>Thank you for your visit!</p>
        <p>Trusted care for every illness.</p>
        <p><strong>www.cure.lk</strong></p>
    </div>
</body>
</html>`;

        const printWindow = window.open('', '_blank', 'width=250,height=600');
        if (printWindow) {
            printWindow.document.write(receiptHTML);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                printWindow.onafterprint = () => printWindow.close();
            };
            setTimeout(() => printWindow.print(), 500);
        }
    };

    const viewTransactionDetails = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setShowReceiptModal(true);
    };

    const getEODStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700';
            case 'SUBMITTED': return 'bg-yellow-100 text-yellow-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
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

    // Prepare pie chart data
    const paymentPieData = reportData ? [
        { name: 'Cash', value: reportData.payment_totals.cash, color: '#10B981' },
        { name: 'Card', value: reportData.payment_totals.card, color: '#3B82F6' },
        { name: 'Online', value: reportData.payment_totals.online, color: '#8B5CF6' },
        { name: 'QR', value: reportData.payment_totals.qr, color: '#F59E0B' },
    ].filter(d => d.value > 0) : [];

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
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Transactions & Reports</h1>
                                <p className="text-emerald-100 text-sm">View transactions, sales trends and EOD history</p>
                            </div>
                        </div>
                    </div>
                    {(activeTab === "reports" || activeTab === "eod") && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => window.print()}
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
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {[
                        { id: 'transactions', label: 'Today\'s Transactions', icon: <Receipt className="w-4 h-4" /> },
                        { id: 'reports', label: 'Daily Sales Reports', icon: <BarChart3 className="w-4 h-4" /> },
                        { id: 'eod', label: 'EOD History', icon: <History className="w-4 h-4" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as "transactions" | "reports" | "eod")}
                            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition ${
                                activeTab === tab.id
                                    ? "bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Transactions Tab */}
            {activeTab === "transactions" && (
                <>
                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by invoice, receipt, or patient name..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Transaction Type Filter */}
                            <div className="relative">
                                <ListFilter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="ALL">All Types</option>
                                    <option value="OPD">OPD</option>
                                    <option value="LAB">Lab</option>
                                    <option value="PHARMACY">Pharmacy</option>
                                    <option value="SERVICE">Service</option>
                                </select>
                            </div>

                            {/* Payment Method Filter */}
                            <div className="relative">
                                <ListFilter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <select
                                    value={filterPayment}
                                    onChange={(e) => setFilterPayment(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="ALL">All Payment Methods</option>
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="ONLINE">Online</option>
                                    <option value="QR">QR Code</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Today's Transactions ({filteredTransactions.length})
                            </h2>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            </div>
                        ) : filteredTransactions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-emerald-50 to-blue-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Invoice</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Patient</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Payment</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Status</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Time</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredTransactions.map((transaction) => {
                                            const PaymentIcon = getPaymentIcon(transaction.payment_method);
                                            return (
                                                <tr key={transaction.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {transaction.invoice_number}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {transaction.receipt_number}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 rounded border border-blue-200">
                                                            {transaction.transaction_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {transaction.patient_name}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            Rs. {transaction.total_amount.toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Paid: Rs. {transaction.paid_amount.toLocaleString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <div className="p-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded">
                                                                <PaymentIcon className="h-3 w-3 text-gray-600" />
                                                            </div>
                                                            <span className="text-sm text-gray-700">
                                                                {transaction.payment_method}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(transaction.payment_status)}`}>
                                                            {transaction.payment_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 text-center">
                                                        {new Date(transaction.created_at).toLocaleTimeString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => viewTransactionDetails(transaction)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                                title="View Details"
                                                            >
                                                                <Receipt className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => reprintReceipt(transaction)}
                                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                                title="Reprint Receipt"
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-fit mx-auto mb-4">
                                    <FileText className="h-8 w-8 text-gray-500" />
                                </div>
                                <p className="text-gray-500">
                                    {searchTerm || filterType !== "ALL" || filterPayment !== "ALL"
                                        ? "No transactions match your filters"
                                        : "No transactions for today"}
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Reports Tab */}
            {activeTab === "reports" && (
                <>
                    {/* Date Filter */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <div className="flex flex-wrap items-center gap-4">
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
                    </div>

                    {isReportsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : reportData && (
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

                            {/* Sales Trend Chart */}
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

                            {/* Daily Transactions Bar Chart */}
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
                        </>
                    )}
                </>
            )}

            {/* EOD History Tab */}
            {activeTab === "eod" && (
                <>
                    {/* Date Filter */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <div className="flex flex-wrap items-center gap-4">
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
                    </div>

                    {isReportsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : reportData && (
                        <>
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
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${getEODStatusColor(eod.status)}`}>
                                                                {getEODStatusIcon(eod.status)}
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
                        </>
                    )}
                </>
            )}

            {/* Receipt Details Modal */}
            {showReceiptModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-emerald-600" />
                                Transaction Details
                            </h3>
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Invoice & Receipt Numbers */}
                            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Invoice #</p>
                                        <p className="font-semibold text-gray-900">{selectedTransaction.invoice_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Receipt #</p>
                                        <p className="font-semibold text-gray-900">{selectedTransaction.receipt_number}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Patient</p>
                                    <p className="font-medium text-gray-900">{selectedTransaction.patient_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="font-medium text-gray-900">{selectedTransaction.patient_phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Type</p>
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                        {selectedTransaction.transaction_type}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Date & Time</p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(selectedTransaction.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Items</p>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Item</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Qty</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {parseServiceDetails(selectedTransaction.service_details).map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-3 py-2 text-gray-900">{item.service}</td>
                                                    <td className="px-3 py-2 text-center text-gray-600">{item.quantity || 1}</td>
                                                    <td className="px-3 py-2 text-right font-medium">Rs. {item.amount.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total Amount</span>
                                    <span className="font-bold text-lg">Rs. {selectedTransaction.total_amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Paid Amount</span>
                                    <span className="font-medium text-emerald-600">Rs. {selectedTransaction.paid_amount.toLocaleString()}</span>
                                </div>
                                {selectedTransaction.balance_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Balance Due</span>
                                        <span className="font-medium text-amber-600">Rs. {selectedTransaction.balance_amount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                    <span className="text-gray-600">Payment Method</span>
                                    <span className="font-medium">{selectedTransaction.payment_method}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Status</span>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusBadge(selectedTransaction.payment_status)}`}>
                                        {selectedTransaction.payment_status}
                                    </span>
                                </div>
                            </div>

                            {selectedTransaction.remarks && (
                                <div>
                                    <p className="text-xs text-gray-500">Remarks</p>
                                    <p className="text-sm text-gray-700">{selectedTransaction.remarks}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => {
                                    reprintReceipt(selectedTransaction);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white py-3 rounded-lg hover:shadow-lg transition"
                            >
                                <Printer className="h-4 w-4" />
                                Print Receipt
                            </button>
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierTransactionList;
