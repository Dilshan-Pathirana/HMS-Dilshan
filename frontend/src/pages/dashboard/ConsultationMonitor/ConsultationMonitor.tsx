import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    Users,
    Pill,
    Clock,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    Loader2,
    Stethoscope,
    ClipboardCheck,
    DollarSign,
    Timer,
    Eye,
    ChevronDown,
    Filter,
} from 'lucide-react';
import api from '../../../utils/api/axios';

/* ─── Types ────────────────────────────────────────────── */

interface MonitoringSummary {
    total_today: number;
    completed_today: number;
    in_progress: number;
    nurse_assessed: number;
    pharmacy_pending: number;
    issued_today: number;
    pending_opinions: number;
    revenue_today: number;
    avg_duration_minutes: number;
}

interface RecentConsultation {
    id: string;
    patient_name: string;
    doctor_name: string;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    consultation_fee: number;
    medicines_issued_at: string | null;
    requires_second_opinion: boolean;
}

interface MonitoringData {
    date: string;
    summary: MonitoringSummary;
    status_breakdown: Record<string, number>;
    recent_consultations: RecentConsultation[];
}

interface Branch {
    id: string;
    name: string;
    location: string | null;
    address: string | null;
}

interface ConsultationMonitorProps {
    /** If set, locks to this branch (for Branch Admin) */
    fixedBranchId?: string;
    /** Page title override */
    title?: string;
    /** Show branch filter dropdown (for Super Admin) */
    showBranchFilter?: boolean;
}

/* ─── Helpers ──────────────────────────────────────────── */

const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return { headers: { Authorization: `Bearer ${token}` } };
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    awaiting_opinion: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    medicines_issued: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
    payment_pending: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
};

const statusLabel: Record<string, string> = {
    in_progress: 'In Progress',
    awaiting_opinion: 'Awaiting Opinion',
    completed: 'Completed',
    paid: 'Paid',
    medicines_issued: 'Dispensed',
    payment_pending: 'Payment Pending',
};

const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

/* ─── Component ────────────────────────────────────────── */

const ConsultationMonitor: React.FC<ConsultationMonitorProps> = ({
    fixedBranchId,
    title = 'Consultation Pipeline Monitor',
    showBranchFilter = false,
}) => {
    const [data, setData] = useState<MonitoringData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBranchId, setSelectedBranchId] = useState<string>(fixedBranchId || '');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );

    // Fetch branch list for super admin
    useEffect(() => {
        if (!showBranchFilter) return;
        (async () => {
            try {
                const resp = await api.get('/appointments/branches', getAuthHeaders());
                const payload = (resp as any)?.data ? (resp as any).data : resp;
                setBranches(payload.branches || []);
            } catch {
                setBranches([]);
            }
        })();
    }, [showBranchFilter]);

    // Fetch monitoring data
    const fetchStats = useCallback(async () => {
        try {
            setError(null);
            const params = new URLSearchParams();
            const branchId = fixedBranchId || selectedBranchId;
            if (branchId) params.append('branch_id', branchId);
            if (selectedDate) params.append('stat_date', selectedDate);
            const qs = params.toString() ? `?${params.toString()}` : '';

            const resp = await api.get(`/consultation/monitoring/stats${qs}`, getAuthHeaders());
            const payload = (resp as any)?.data ? (resp as any).data : resp;
            setData(payload);
        } catch (err: any) {
            console.error('Monitoring fetch error:', err);
            setError(err?.response?.data?.detail || 'Failed to load monitoring data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fixedBranchId, selectedBranchId, selectedDate]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // Auto-refresh every 30s
    useEffect(() => {
        const iv = setInterval(() => { setRefreshing(true); fetchStats(); }, 30000);
        return () => clearInterval(iv);
    }, [fetchStats]);

    const handleRefresh = () => { setRefreshing(true); fetchStats(); };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const s = data?.summary;

    return (
        <div className="space-y-6">
            {/* ─── Header ─────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800">{title}</h2>
                    <p className="text-neutral-500 text-sm">
                        Real-time view of the consultation workflow
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Date picker */}
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />

                    {/* Branch filter (super admin) */}
                    {showBranchFilter && (
                        <div className="relative">
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className="appearance-none pl-8 pr-8 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            >
                                <option value="">All Branches</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}{b.location ? ` — ${b.location}` : ''}
                                    </option>
                                ))}
                            </select>
                            <Filter className="w-4 h-4 text-neutral-400 absolute left-2.5 top-2.5 pointer-events-none" />
                            <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2 top-2.5 pointer-events-none" />
                        </div>
                    )}

                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 text-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {s && (
                <>
                    {/* ─── Pipeline Flow Visual ───────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                            Pipeline Flow — {data?.date}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                            {/* Nurse Assessed */}
                            <PipelineCard
                                icon={<ClipboardCheck className="w-6 h-6" />}
                                label="Nurse Assessed"
                                value={s.nurse_assessed}
                                color="bg-indigo-500"
                            />
                            {/* In Progress */}
                            <PipelineCard
                                icon={<Stethoscope className="w-6 h-6" />}
                                label="In Consultation"
                                value={s.in_progress}
                                color="bg-blue-500"
                            />
                            {/* Completed */}
                            <PipelineCard
                                icon={<CheckCircle className="w-6 h-6" />}
                                label="Completed"
                                value={s.completed_today}
                                color="bg-green-500"
                            />
                            {/* Pharmacy Pending */}
                            <PipelineCard
                                icon={<Pill className="w-6 h-6" />}
                                label="Pharmacy Pending"
                                value={s.pharmacy_pending}
                                color="bg-amber-500"
                                highlight={s.pharmacy_pending > 0}
                            />
                            {/* Dispensed */}
                            <PipelineCard
                                icon={<CheckCircle className="w-6 h-6" />}
                                label="Dispensed"
                                value={s.issued_today}
                                color="bg-teal-500"
                            />
                        </div>
                    </div>

                    {/* ─── Stat Cards ─────────────────────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={<Activity className="w-5 h-5 text-blue-600" />}
                            label="Total Consultations"
                            value={s.total_today}
                            bg="bg-blue-50"
                        />
                        <StatCard
                            icon={<Timer className="w-5 h-5 text-purple-600" />}
                            label="Avg Duration"
                            value={`${s.avg_duration_minutes} min`}
                            bg="bg-purple-50"
                        />
                        <StatCard
                            icon={<Eye className="w-5 h-5 text-amber-600" />}
                            label="Pending Opinions"
                            value={s.pending_opinions}
                            bg="bg-amber-50"
                        />
                        <StatCard
                            icon={<DollarSign className="w-5 h-5 text-green-600" />}
                            label="Revenue Today"
                            value={`Rs. ${s.revenue_today.toLocaleString()}`}
                            bg="bg-green-50"
                        />
                    </div>

                    {/* ─── Status Breakdown ────────────────────────── */}
                    {Object.keys(data?.status_breakdown || {}).length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                                Status Breakdown
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(data!.status_breakdown).map(([status, count]) => {
                                    const colors = statusColors[status] || {
                                        bg: 'bg-gray-100',
                                        text: 'text-gray-700',
                                        dot: 'bg-gray-500',
                                    };
                                    return (
                                        <div
                                            key={status}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${colors.bg}`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                            <span className={`text-sm font-medium ${colors.text}`}>
                                                {statusLabel[status] || status}: {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ─── Recent Consultations Table ─────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                                Recent Consultations
                            </h3>
                        </div>
                        {data!.recent_consultations.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">
                                No consultations found for this date.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-neutral-50 text-neutral-600">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Patient</th>
                                            <th className="px-4 py-3 text-left font-medium">Doctor</th>
                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                            <th className="px-4 py-3 text-left font-medium">Started</th>
                                            <th className="px-4 py-3 text-left font-medium">Completed</th>
                                            <th className="px-4 py-3 text-left font-medium">Fee</th>
                                            <th className="px-4 py-3 text-left font-medium">Dispensed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data!.recent_consultations.map((c) => {
                                            const colors = statusColors[c.status] || {
                                                bg: 'bg-gray-100',
                                                text: 'text-gray-700',
                                                dot: 'bg-gray-500',
                                            };
                                            return (
                                                <tr key={c.id} className="hover:bg-neutral-50">
                                                    <td className="px-4 py-3 font-medium text-neutral-800">
                                                        {c.patient_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600">
                                                        {c.doctor_name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                                            {statusLabel[c.status] || c.status}
                                                        </span>
                                                        {c.requires_second_opinion && (
                                                            <span className="ml-1 text-xs text-amber-600" title="Second opinion requested">
                                                                ⚑
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600">
                                                        {formatTime(c.started_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600">
                                                        {formatTime(c.completed_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-700 font-medium">
                                                        {c.consultation_fee > 0
                                                            ? `Rs. ${c.consultation_fee.toLocaleString()}`
                                                            : '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {c.medicines_issued_at ? (
                                                            <span className="inline-flex items-center gap-1 text-teal-600">
                                                                <CheckCircle className="w-4 h-4" />
                                                                {formatTime(c.medicines_issued_at)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-neutral-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

/* ─── Sub-components ───────────────────────────────────── */

const PipelineCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
    highlight?: boolean;
}> = ({ icon, label, value, color, highlight }) => (
    <div
        className={`relative flex flex-col items-center p-4 rounded-xl text-white ${color} ${
            highlight ? 'ring-2 ring-offset-2 ring-amber-400 animate-pulse' : ''
        }`}
    >
        {icon}
        <p className="text-3xl font-bold mt-2">{value}</p>
        <p className="text-xs opacity-80 text-center mt-1">{label}</p>
    </div>
);

const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    bg: string;
}> = ({ icon, label, value, bg }) => (
    <div className={`${bg} rounded-xl p-4 flex items-center gap-4`}>
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-neutral-800">{value}</p>
            <p className="text-xs text-neutral-500">{label}</p>
        </div>
    </div>
);

export default ConsultationMonitor;
