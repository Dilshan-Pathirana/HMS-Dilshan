import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api/axios";
import { 
    ArrowLeft, CheckCircle, AlertTriangle, DollarSign,
    TrendingUp, TrendingDown, Lock, Save, FileText, Calendar, Printer
} from "lucide-react";
import { usePOSApi } from "../../hooks/usePOSApi";

interface EODSummary {
    id: string | null;
    summary_date: string;
    total_transactions: number;
    total_sales: number;
    cash_total: number;
    cash_count: number;
    card_total: number;
    card_count: number;
    online_total: number;
    online_count: number;
    qr_total: number;
    qr_count: number;
    cash_in_total: number;
    cash_out_total: number;
    expected_cash_balance: number;
    actual_cash_counted: number | null;
    cash_variance: number;
    variance_remarks: string | null;
    eod_status: string;
    submitted_at: string | null;
}

const CashierEODProcess = () => {
    const navigate = useNavigate();
    const posApi = usePOSApi();
    const [summary, setSummary] = useState<EODSummary | null>(null);
    const [actualCashCounted, setActualCashCounted] = useState("");
    const [varianceRemarks, setVarianceRemarks] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        fetchEODSummary();
    }, []);

    const fetchEODSummary = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Authentication required. Please log in again.");
                setIsLoading(false);
                return;
            }
            
            console.log("Fetching EOD summary with token:", token.substring(0, 20) + "...");
            
            const response = await api.get(
                posApi.eodSummary,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log("EOD Response:", response.data);
            
            // Handle both response.data.status and response.status
            if (response.data.status === 200 || response.status === 200) {
                const summaryData = response.data.data;
                if (summaryData) {
                    setSummary(summaryData);
                    if (summaryData.actual_cash_counted) {
                        setActualCashCounted(summaryData.actual_cash_counted.toString());
                    }
                    if (summaryData.variance_remarks) {
                        setVarianceRemarks(summaryData.variance_remarks);
                    }
                } else {
                    setError("No EOD data received from server");
                }
            } else {
                setError(response.data.message || "Failed to load EOD summary");
            }
        } catch (err: any) {
            console.error("Error fetching EOD summary:", err);
            if (err.code === "ERR_NETWORK") {
                setError("Cannot connect to server. Please ensure the backend server is running on port 8000.");
            } else if (err.response) {
                setError(err.response.data?.message || "Failed to load EOD summary");
            } else {
                setError("Failed to load EOD summary. Please check your connection.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const calculateVariance = () => {
        if (!summary || !actualCashCounted) return 0;
        return parseFloat(actualCashCounted) - summary.expected_cash_balance;
    };

    const printDailySalesReport = () => {
        if (!summary) return;
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const reportDate = new Date(summary.summary_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Daily Sales Report - ${reportDate}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                    h1 { text-align: center; color: #047857; margin-bottom: 5px; }
                    .date { text-align: center; color: #666; margin-bottom: 20px; }
                    .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                    .section-title { font-weight: bold; color: #374151; margin-bottom: 10px; border-bottom: 2px solid #047857; padding-bottom: 5px; }
                    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .row:last-child { border-bottom: none; }
                    .label { color: #666; }
                    .value { font-weight: 600; color: #111; }
                    .total-row { background: #f0fdf4; padding: 10px; border-radius: 5px; margin-top: 10px; }
                    .total-row .value { color: #047857; font-size: 1.2em; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; color: #999; font-size: 12px; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <h1>Daily Sales Report</h1>
                <p class="date">${reportDate}</p>
                
                <div class="section">
                    <div class="section-title">Sales Summary</div>
                    <div class="row">
                        <span class="label">Total Transactions</span>
                        <span class="value">${summary.total_transactions}</span>
                    </div>
                    <div class="row total-row">
                        <span class="label">Total Sales</span>
                        <span class="value">Rs. ${summary.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Payment Mode Breakdown</div>
                    <div class="row">
                        <span class="label">Cash (${summary.cash_count} transactions)</span>
                        <span class="value">Rs. ${summary.cash_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="row">
                        <span class="label">Card (${summary.card_count} transactions)</span>
                        <span class="value">Rs. ${summary.card_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="row">
                        <span class="label">Online (${summary.online_count} transactions)</span>
                        <span class="value">Rs. ${summary.online_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="row">
                        <span class="label">QR Code (${summary.qr_count} transactions)</span>
                        <span class="value">Rs. ${summary.qr_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Cash Movement</div>
                    <div class="row">
                        <span class="label">Cash In</span>
                        <span class="value" style="color: #059669;">Rs. ${summary.cash_in_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="row">
                        <span class="label">Cash Out</span>
                        <span class="value" style="color: #dc2626;">Rs. ${summary.cash_out_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="row total-row">
                        <span class="label">Expected Cash Balance</span>
                        <span class="value">Rs. ${summary.expected_cash_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                ${summary.eod_status !== 'OPEN' ? `
                <div class="section">
                    <div class="section-title">EOD Reconciliation</div>
                    <div class="row">
                        <span class="label">Actual Cash Counted</span>
                        <span class="value">Rs. ${(summary.actual_cash_counted || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="row">
                        <span class="label">Variance</span>
                        <span class="value" style="color: ${summary.cash_variance === 0 ? '#059669' : '#dc2626'};">
                            Rs. ${summary.cash_variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    ${summary.variance_remarks ? `
                    <div class="row">
                        <span class="label">Remarks</span>
                        <span class="value">${summary.variance_remarks}</span>
                    </div>
                    ` : ''}
                    <div class="row">
                        <span class="label">Status</span>
                        <span class="value">${summary.eod_status}</span>
                    </div>
                    <div class="row">
                        <span class="label">Submitted At</span>
                        <span class="value">${summary.submitted_at ? new Date(summary.submitted_at).toLocaleString() : '-'}</span>
                    </div>
                </div>
                ` : ''}

                <div class="footer">
                    <p>Generated on ${new Date().toLocaleString()}</p>
                    <p>Hospital Management System - POS Daily Sales Report</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        if (!actualCashCounted) {
            setError("Please enter the actual cash counted");
            return;
        }

        const variance = calculateVariance();
        if (Math.abs(variance) > 0 && !varianceRemarks) {
            setError("Please provide remarks for the cash variance");
            return;
        }

        setShowConfirmation(true);
    };

    const confirmSubmit = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");
            
            const response = await api.post(
                posApi.eodSubmit,
                {
                    actual_cash_counted: parseFloat(actualCashCounted),
                    variance_remarks: varianceRemarks || null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200) {
                setSuccess("EOD submitted successfully! Day is now locked.");
                fetchEODSummary();
                setTimeout(() => {
                    navigate("/pos");
                }, 2000);
            }
        } catch (err: any) {
            console.error("Error submitting EOD:", err);
            setError(err.response?.data?.message || "Failed to submit EOD");
        } finally {
            setIsSubmitting(false);
            setShowConfirmation(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center bg-white p-8 rounded-xl shadow-md border border-gray-200 max-w-md">
                    <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load EOD Summary</h2>
                    <p className="text-gray-600 mb-4">{error || "An unexpected error occurred"}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => {
                                setError("");
                                setIsLoading(true);
                                fetchEODSummary();
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => navigate("/pos")}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isEODLocked = summary.eod_status !== "OPEN";
    const variance = calculateVariance();
    const hasVariance = Math.abs(variance) > 0.01;

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/pos")}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">End of Day Process</h1>
                                <p className="text-emerald-100 text-sm">Close and reconcile daily transactions</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={printDailySalesReport}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
                            title="Print Daily Sales Report"
                        >
                            <Printer className="h-4 w-4" />
                            Print Report
                        </button>
                        <div className="text-sm bg-white/20 px-4 py-2 rounded-lg">
                            {new Date(summary.summary_date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="text-sm text-green-700">{success}</p>
                </div>
            )}

            {isEODLocked && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                    <Lock className="h-5 w-5 text-blue-500" />
                    <p className="text-sm text-blue-700">
                        EOD has been {summary.eod_status.toLowerCase()}. Day is locked.
                        {summary.submitted_at && ` Submitted at ${new Date(summary.submitted_at).toLocaleString()}`}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Summary */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Sales Summary */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Sales Summary</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                                <p className="text-3xl font-bold text-gray-800">{summary.total_transactions}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                                <p className="text-3xl font-bold text-blue-700">
                                    Rs. {summary.total_sales.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Mode Breakdown */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Mode Breakdown</h2>
                        <div className="space-y-3">
                            {[
                                { label: "Cash", amount: summary.cash_total, count: summary.cash_count, color: "from-green-50 to-emerald-50 border-green-200" },
                                { label: "Card", amount: summary.card_total, count: summary.card_count, color: "from-blue-50 to-cyan-50 border-blue-200" },
                                { label: "Online", amount: summary.online_total, count: summary.online_count, color: "from-purple-50 to-pink-50 border-purple-200" },
                                { label: "QR Code", amount: summary.qr_total, count: summary.qr_count, color: "from-orange-50 to-amber-50 border-orange-200" },
                            ].map((method) => (
                                <div key={method.label} className={`flex items-center justify-between p-4 bg-gradient-to-r ${method.color} rounded-xl border`}>
                                    <span className="text-sm font-medium text-gray-700">{method.label}</span>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">
                                            Rs. {method.amount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500">{method.count} transactions</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cash Movement */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Cash Movement</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="font-medium text-emerald-700">Cash In</span>
                                </div>
                                <span className="text-lg font-bold text-emerald-700">
                                    Rs. {summary.cash_in_total.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                                        <TrendingDown className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="font-medium text-red-700">Cash Out</span>
                                </div>
                                <span className="text-lg font-bold text-red-700">
                                    Rs. {summary.cash_out_total.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-300">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                                        <DollarSign className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="font-medium text-blue-700">Expected Cash Balance</span>
                                </div>
                                <span className="text-xl font-bold text-blue-700">
                                    Rs. {summary.expected_cash_balance.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Cash Counting */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sticky top-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Cash Counting</h2>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expected Cash Balance
                            </label>
                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200">
                                <p className="text-2xl font-bold text-gray-800">
                                    Rs. {summary.expected_cash_balance.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Cash sales + Cash in - Cash out
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Actual Cash Counted *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={actualCashCounted}
                                onChange={(e) => setActualCashCounted(e.target.value)}
                                disabled={isEODLocked}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-lg font-semibold disabled:bg-gray-100"
                                placeholder="0.00"
                            />
                        </div>

                        {actualCashCounted && (
                            <div className={`p-4 rounded-xl mb-6 ${
                                hasVariance 
                                    ? variance < 0 
                                        ? "bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200" 
                                        : "bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200"
                                    : "bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200"
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Variance:</span>
                                    <span className={`text-lg font-bold ${
                                        hasVariance 
                                            ? variance < 0 ? "text-red-700" : "text-yellow-700"
                                            : "text-green-700"
                                    }`}>
                                        {variance >= 0 ? "+" : ""}Rs. {variance.toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600">
                                    {hasVariance 
                                        ? variance < 0 
                                            ? "Cash shortage detected" 
                                            : "Cash excess detected"
                                        : "Cash matches expected balance"}
                                </p>
                            </div>
                        )}

                        {hasVariance && !isEODLocked && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Variance Remarks * (Required for variance)
                                </label>
                                <textarea
                                    value={varianceRemarks}
                                    onChange={(e) => setVarianceRemarks(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Explain the reason for cash variance..."
                                />
                            </div>
                        )}

                        {summary.variance_remarks && isEODLocked && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Variance Remarks
                                </label>
                                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                                    {summary.variance_remarks}
                                </div>
                            </div>
                        )}

                        {!isEODLocked && (
                            <button
                                onClick={handleSubmit}
                                disabled={!actualCashCounted || isSubmitting}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-medium"
                            >
                                <Save className="h-5 w-5" />
                                Submit End of Day
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm EOD Submission</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to submit the End of Day? This action cannot be undone and will lock all transactions for today.
                        </p>
                        <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Expected:</span>
                                    <span className="font-semibold">Rs. {summary.expected_cash_balance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Actual:</span>
                                    <span className="font-semibold">Rs. {parseFloat(actualCashCounted).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <span className="text-gray-600">Variance:</span>
                                    <span className={`font-bold ${
                                        hasVariance ? variance < 0 ? "text-red-600" : "text-yellow-600" : "text-green-600"
                                    }`}>
                                        {variance >= 0 ? "+" : ""}Rs. {variance.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSubmit}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
                            >
                                {isSubmitting ? "Submitting..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierEODProcess;
