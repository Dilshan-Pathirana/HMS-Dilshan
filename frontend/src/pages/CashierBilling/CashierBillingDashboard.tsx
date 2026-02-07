import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api/axios";
import {
    DollarSign, ShoppingCart, TrendingUp, AlertCircle,
    FileText, PlusCircle, CheckCircle, Clock, Building2,
    CreditCard, Smartphone, QrCode, User, MapPin, BarChart3
} from "lucide-react";

interface DashboardStats {
    branch: {
        id: string;
        name: string;
        type: string;
    };
    cashier: {
        id: string;
        name: string;
    };
    today_stats: {
        date: string;
        total_sales: number;
        transaction_count: number;
        cash_in: number;
        cash_out: number;
    };
    payment_breakdown: {
        cash: number;
        card: number;
        online: number;
        qr: number;
    };
    eod_status: string;
    is_eod_locked: boolean;
}

const CashierBillingDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
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
                "/api/cashier-billing/dashboard-stats",
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
            <div className="flex items-center justify-center min-h-screen bg-neutral-50/50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50/50">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-error-500 mb-4" />
                    <p className="text-neutral-600">{error || "Failed to load dashboard"}</p>
                </div>
            </div>
        );
    }

    const { today_stats, payment_breakdown, eod_status, is_eod_locked } = stats;

    const quickActions = [
        { id: 'new-sale', label: 'New Transaction', icon: <ShoppingCart className="w-6 h-6" />, color: 'from-blue-500 to-cyan-600', path: '/pos/pos', disabled: is_eod_locked },
        { id: 'cash-entry', label: 'Cash Entry', icon: <PlusCircle className="w-6 h-6" />, color: 'from-green-500 to-emerald-600', path: '/pos/cash-entries', disabled: is_eod_locked },
        { id: 'transactions', label: 'Transactions', icon: <FileText className="w-6 h-6" />, color: 'from-purple-500 to-pink-600', path: '/pos/transactions', disabled: false },
        { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-6 h-6" />, color: 'from-indigo-500 to-violet-600', path: '/pos/reports', disabled: false },
        { id: 'eod', label: is_eod_locked ? 'EOD Locked' : 'End of Day', icon: <Clock className="w-6 h-6" />, color: 'from-orange-500 to-red-600', path: '/pos/eod', disabled: is_eod_locked },
    ];

    return (
        <div className="p-6 space-y-6 bg-neutral-50/50 min-h-screen font-sans">
            {/* Branch Info Header */}
            <div className="relative bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl shadow-xl p-8 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md shadow-lg border border-white/10">
                            <Building2 className="w-10 h-10 text-emerald-50" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{stats.branch.name}</h2>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-emerald-50/90 font-medium">
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg border border-white/5">
                                    <MapPin className="w-4 h-4" />
                                    {stats.branch.type || 'Main Branch'}
                                </span>
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg border border-white/5">
                                    <User className="w-4 h-4" />
                                    {stats.cashier.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-2">
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg border tracking-wide uppercase ${eod_status === 'OPEN' ? 'bg-emerald-500 text-white border-emerald-400' :
                                eod_status === 'SUBMITTED' ? 'bg-amber-500 text-white border-amber-400' :
                                    'bg-neutral-600 text-neutral-300 border-neutral-500'
                            }`}>
                            {eod_status === 'OPEN' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            {eod_status}
                        </div>
                        <p className="text-emerald-100/80 text-sm font-medium">
                            {new Date(today_stats.date).toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* EOD Status Alert */}
            {is_eod_locked && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-900">End of Day Locked</h4>
                        <p className="text-sm text-amber-800">
                            Transactions are disabled as EOD has been submitted. Contact admin for unlocks.
                        </p>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Sales", value: `Rs. ${today_stats.total_sales.toLocaleString()}`, sub: `${today_stats.transaction_count} transactions`, icon: DollarSign, color: "blue", trend: true },
                    { label: "Transactions", value: today_stats.transaction_count, sub: "Completed today", icon: ShoppingCart, color: "emerald", trend: false },
                    { label: "Cash In", value: `Rs. ${today_stats.cash_in.toLocaleString()}`, sub: "Additional collections", icon: PlusCircle, color: "teal", trend: true },
                    { label: "Cash Out", value: `Rs. ${today_stats.cash_out.toLocaleString()}`, sub: "Petty cash & expenses", icon: TrendingUp, color: "rose", trend: false, rotateIcon: true }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon className={`w-6 h-6 ${stat.rotateIcon ? 'rotate-180' : ''}`} />
                            </div>
                            {stat.trend && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                        </div>
                        <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-neutral-800 mt-1">{stat.value}</p>
                        <p className={`text-xs mt-2 font-medium ${stat.color === 'rose' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {stat.sub}
                        </p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-bold text-neutral-800 mb-4 px-1">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {quickActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => !action.disabled && navigate(action.path)}
                            disabled={action.disabled}
                            className={`relative flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all group overflow-hidden ${action.disabled
                                    ? 'bg-neutral-50 border-neutral-200 opacity-60 cursor-not-allowed'
                                    : 'bg-white border-neutral-200 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1'
                                }`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                            <div className={`p-4 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                {action.icon}
                            </div>
                            <span className="font-semibold text-neutral-700 text-sm">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Payment Mode Breakdown & EOD Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-200/60 p-6">
                    <h2 className="text-lg font-bold text-neutral-800 mb-6">Payment Breakdown</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: "Cash", value: payment_breakdown.cash, icon: DollarSign, color: "emerald" },
                            { label: "Card", value: payment_breakdown.card, icon: CreditCard, color: "blue" },
                            { label: "Online", value: payment_breakdown.online, icon: Smartphone, color: "violet" },
                            { label: "QR Code", value: payment_breakdown.qr, icon: QrCode, color: "amber" }
                        ].map((mode, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border bg-${mode.color}-50/30 border-${mode.color}-100 flex flex-col items-center text-center gap-2`}>
                                <div className={`p-2 rounded-lg bg-${mode.color}-100 text-${mode.color}-600`}>
                                    <mode.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{mode.label}</p>
                                    <p className="font-bold text-neutral-800 mt-0.5">Rs. {mode.value.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 p-6 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 bg-neutral-50 rounded-full mix-blend-multiply filter blur-2xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
                    <h2 className="text-lg font-bold text-neutral-800 mb-4 z-10">System Status</h2>
                    <div className="space-y-4 z-10">
                        <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                            <span className="text-sm text-neutral-500">Day Status</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${eod_status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700'
                                }`}>{eod_status}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                            <span className="text-sm text-neutral-500">Last Synced</span>
                            <span className="text-sm font-medium text-neutral-800">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="pt-2">
                            <p className="text-xs text-neutral-400">
                                {eod_status === 'OPEN' ? 'System ready for transactions.' : 'System locked. Please submit EOD report.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashierBillingDashboard;
