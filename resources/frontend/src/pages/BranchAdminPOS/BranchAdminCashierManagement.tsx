import { useState, useEffect } from "react";
import axios from "axios";
import { 
    Users, Search, RefreshCw, 
    DollarSign, TrendingUp, CheckCircle, Clock,
    AlertCircle, XCircle, Calendar, FileText
} from "lucide-react";
import { BranchBadge } from "../../components/pharmacyPOS/Common/BranchSelector";

interface Cashier {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
    created_at: string;
    today_transactions: number;
    today_total: number;
    week_transactions: number;
    week_total: number;
    eod_completed: boolean;
    last_eod_date: string | null;
}

interface CashierSummary {
    total_cashiers: number;
    active_today: number;
    eod_completed: number;
    eod_pending: number;
    total_today_sales: number;
}

interface EODStatus {
    cashier_id: string;
    cashier_name: string;
    date: string;
    eod_completed: boolean;
    total_transactions: number;
    total_amount: number;
    completed_at: string | null;
}

/**
 * Branch Admin Cashier Management Page
 * 
 * View and manage cashiers for the assigned branch:
 * - View all cashiers in the branch
 * - View today's and weekly transaction data
 * - Monitor EOD completion status
 * - View EOD details
 */
const BranchAdminCashierManagement = () => {
    const [cashiers, setCashiers] = useState<Cashier[]>([]);
    const [eodStatuses, setEodStatuses] = useState<EODStatus[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingEod, setIsLoadingEod] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"cashiers" | "eod">("cashiers");
    const [summary, setSummary] = useState<CashierSummary>({
        total_cashiers: 0,
        active_today: 0,
        eod_completed: 0,
        eod_pending: 0,
        total_today_sales: 0
    });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadCashiers();
    }, [selectedDate]);

    useEffect(() => {
        if (activeTab === "eod") {
            loadEODStatus();
        }
    }, [activeTab, selectedDate]);

    const loadCashiers = async () => {
        setIsLoading(true);
        setError("");
        try {
            const response = await axios.get(`/api/branch-admin/pos/cashiers?date=${selectedDate}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            // Backend returns { status: 200, data: [...] }
            const cashierData = response.data.data || response.data.cashiers || [];
            
            // Map backend response to frontend interface
            const mappedCashiers = cashierData.map((c: any) => ({
                id: c.id,
                name: c.name,
                email: c.email,
                is_active: c.is_active ?? true,
                created_at: c.created_at || '',
                today_transactions: c.today_transactions || 0,
                today_total: c.today_sales || c.today_total || 0,
                week_transactions: c.week_transactions || 0,
                week_total: c.week_sales || c.week_total || 0,
                eod_completed: c.eod_status === 'CLOSED' || c.eod_completed === true,
                last_eod_date: c.last_eod_date || null,
            }));
            
            setCashiers(mappedCashiers);

            // Calculate summary
            const activeCashiers = mappedCashiers.filter((c: Cashier) => c.today_transactions > 0).length;
            const eodCompleted = mappedCashiers.filter((c: Cashier) => c.eod_completed).length;
            const eodPending = mappedCashiers.filter((c: Cashier) => c.today_transactions > 0 && !c.eod_completed).length;
            const totalSales = mappedCashiers.reduce((sum: number, c: Cashier) => sum + (c.today_total || 0), 0);

            setSummary({
                total_cashiers: mappedCashiers.length,
                active_today: activeCashiers,
                eod_completed: eodCompleted,
                eod_pending: eodPending,
                total_today_sales: totalSales
            });
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load cashiers");
        } finally {
            setIsLoading(false);
        }
    };

    const loadEODStatus = async () => {
        setIsLoadingEod(true);
        try {
            const response = await axios.get(`/api/branch-admin/pos/cashiers/eod-status?date=${selectedDate}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            
            // Backend returns { status: 200, data: { date: '...', cashiers: [...] } }
            const eodData = response.data.data?.cashiers || response.data.eod_status || [];
            
            // Map to frontend interface
            const mappedEodStatuses = eodData.map((e: any) => ({
                cashier_id: e.cashier_id,
                cashier_name: e.cashier_name,
                date: selectedDate,
                eod_completed: e.eod_status === 'CLOSED' || e.eod_status === 'APPROVED',
                total_transactions: e.transaction_count || 0,
                total_amount: e.total_sales || 0,
                completed_at: e.submitted_at || e.approved_at || null,
            }));
            
            setEodStatuses(mappedEodStatuses);
        } catch (err: any) {
            console.error("Error loading EOD status:", err);
        } finally {
            setIsLoadingEod(false);
        }
    };

    const filteredCashiers = cashiers.filter(cashier => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const name = (cashier.name || '').toLowerCase();
        const email = (cashier.email || '').toLowerCase();
        return name.includes(search) || email.includes(search);
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        <Users className="w-8 h-8 mr-3 text-blue-600" />
                        Cashier Management
                    </h1>
                    <p className="text-gray-600 mt-1">Monitor and manage cashiers in your branch</p>
                </div>
                <BranchBadge />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Cashiers</p>
                            <p className="text-2xl font-bold text-gray-800">{summary.total_cashiers}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Active Today</p>
                            <p className="text-2xl font-bold text-green-600">{summary.active_today}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">EOD Completed</p>
                            <p className="text-2xl font-bold text-purple-600">{summary.eod_completed}</p>
                        </div>
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">EOD Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{summary.eod_pending}</p>
                        </div>
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Today's Sales</p>
                            <p className="text-xl font-bold text-blue-600">Rs. {summary.total_today_sales.toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-t-xl shadow-sm border-b">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab("cashiers")}
                        className={`px-6 py-4 font-medium transition-all border-b-2 ${
                            activeTab === "cashiers"
                                ? "text-blue-600 border-blue-600"
                                : "text-gray-500 border-transparent hover:text-gray-700"
                        }`}
                    >
                        <Users className="w-4 h-4 inline-block mr-2" />
                        Cashiers
                    </button>
                    <button
                        onClick={() => setActiveTab("eod")}
                        className={`px-6 py-4 font-medium transition-all border-b-2 ${
                            activeTab === "eod"
                                ? "text-blue-600 border-blue-600"
                                : "text-gray-500 border-transparent hover:text-gray-700"
                        }`}
                    >
                        <FileText className="w-4 h-4 inline-block mr-2" />
                        EOD Status
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search cashiers..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => activeTab === "cashiers" ? loadCashiers() : loadEODStatus()}
                        disabled={isLoading || isLoadingEod}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                    >
                        <RefreshCw className={`w-4 h-4 ${(isLoading || isLoadingEod) ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            {/* Content based on active tab */}
            {activeTab === "cashiers" ? (
                /* Cashiers Table */
                <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cashier
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Today's Transactions
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Today's Total
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Week Performance
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    EOD Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                                        <p className="mt-2 text-gray-500">Loading cashiers...</p>
                                    </td>
                                </tr>
                            ) : filteredCashiers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Users className="w-12 h-12 mx-auto text-gray-300" />
                                        <p className="mt-2 text-gray-500">No cashiers found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCashiers.map(cashier => (
                                    <tr key={cashier.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-semibold">
                                                        {(cashier.name || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="font-medium text-gray-900">{cashier.name || 'Unknown'}</p>
                                                    <p className="text-sm text-gray-500">{cashier.email || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                                                cashier.today_transactions > 0 
                                                    ? "bg-green-100 text-green-700" 
                                                    : "bg-gray-100 text-gray-500"
                                            }`}>
                                                {cashier.today_transactions} transactions
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="font-semibold text-blue-600">
                                                Rs. {(cashier.today_total || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div>
                                                <span className="font-medium text-gray-900">
                                                    Rs. {(cashier.week_total || 0).toLocaleString()}
                                                </span>
                                                <p className="text-xs text-gray-500">{cashier.week_transactions} transactions</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {cashier.eod_completed ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Completed
                                                </span>
                                            ) : cashier.today_transactions > 0 ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-500">
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    No Activity
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* EOD Status Table */
                <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cashier
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transactions
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Amount
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Completed At
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoadingEod ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                                        <p className="mt-2 text-gray-500">Loading EOD status...</p>
                                    </td>
                                </tr>
                            ) : eodStatuses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <FileText className="w-12 h-12 mx-auto text-gray-300" />
                                        <p className="mt-2 text-gray-500">No EOD records for selected date</p>
                                    </td>
                                </tr>
                            ) : (
                                eodStatuses.map((eod, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-semibold">
                                                        {(eod.cashier_name || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="font-medium text-gray-900">{eod.cashier_name || 'Unknown'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-gray-700">
                                            {new Date(eod.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="font-medium">{eod.total_transactions}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="font-semibold text-blue-600">
                                                Rs. {(eod.total_amount || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {eod.eod_completed ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Completed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                                            {eod.completed_at 
                                                ? new Date(eod.completed_at).toLocaleString() 
                                                : "-"
                                            }
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BranchAdminCashierManagement;
