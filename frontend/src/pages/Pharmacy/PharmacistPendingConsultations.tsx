import React, { useState, useEffect, useCallback } from 'react';
import {
    Pill,
    User,
    CheckCircle,
    Loader2,
    RefreshCw,
    AlertCircle,
    Package,
    Clock,
    Hash,
    FileText,
    CheckSquare,
    Square,
} from 'lucide-react';
import {
    getPharmacyQueue,
    issueMedicine,
    markMedicinesIssued,
    getIssuedMedicines,
} from '../DoctorDashboard/modules/consultation/consultationApi';
import { PharmacyQueueItem, IssuedMedicine } from '../DoctorDashboard/modules/consultation/types';

/** Track per-prescription issuing state in the modal */
interface PrescriptionIssueEntry {
    prescription_id: string;
    medicine_name: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
    quantity_prescribed: number | null;
    // pharmacist fills these
    quantity_issued: number;
    batch_number: string;
    notes: string;
    issued: boolean;          // already issued?
    issuing: boolean;         // in-flight request?
}

const PharmacistPendingConsultations: React.FC = () => {
    const [consultations, setConsultations] = useState<PharmacyQueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // modal
    const [selectedConsultation, setSelectedConsultation] = useState<PharmacyQueueItem | null>(null);
    const [issueEntries, setIssueEntries] = useState<PrescriptionIssueEntry[]>([]);
    const [alreadyIssued, setAlreadyIssued] = useState<IssuedMedicine[]>([]);
    const [markingIssued, setMarkingIssued] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // ─── Fetch queue ──────────────────────────────────────────
    const fetchQueue = useCallback(async () => {
        try {
            setError(null);
            const res = await getPharmacyQueue();
            const payload = (res as any)?.data ? (res as any).data : res;
            setConsultations(payload.queue ?? []);
        } catch (err: any) {
            console.error('Failed to fetch pharmacy queue:', err);
            setError(err?.response?.data?.detail || 'Failed to load pharmacy queue');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchQueue(); }, [fetchQueue]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const iv = setInterval(() => { setRefreshing(true); fetchQueue(); }, 30000);
        return () => clearInterval(iv);
    }, [fetchQueue]);

    const handleRefresh = () => { setRefreshing(true); fetchQueue(); };

    // ─── Open dispensing modal ────────────────────────────────
    const openModal = async (c: PharmacyQueueItem) => {
        setSelectedConsultation(c);
        setSuccessMsg(null);

        // Build issue entries from prescriptions
        const entries: PrescriptionIssueEntry[] = c.prescriptions.map((p) => ({
            prescription_id: p.id,
            medicine_name: p.medicine_name,
            dosage: p.dosage,
            frequency: p.frequency,
            duration: p.duration,
            instructions: p.instructions,
            quantity_prescribed: p.quantity,
            quantity_issued: p.quantity ?? 1,
            batch_number: '',
            notes: '',
            issued: false,
            issuing: false,
        }));

        // Check already issued medicines
        try {
            const issuedRes = await getIssuedMedicines(c.id);
            const issuedPayload = (issuedRes as any)?.data ? (issuedRes as any).data : issuedRes;
            const issuedList: IssuedMedicine[] = issuedPayload.issued_medicines ?? [];
            setAlreadyIssued(issuedList);

            // Mark entries that are already issued
            const issuedPrescriptionIds = new Set(issuedList.map((m) => m.prescription_id));
            entries.forEach((e) => {
                if (issuedPrescriptionIds.has(e.prescription_id)) {
                    e.issued = true;
                }
            });
        } catch {
            setAlreadyIssued([]);
        }

        setIssueEntries(entries);
    };

    // ─── Issue a single medicine ──────────────────────────────
    const handleIssueSingle = async (idx: number) => {
        if (!selectedConsultation) return;
        const entry = issueEntries[idx];
        if (entry.issued || entry.issuing) return;

        // Update issuing state
        setIssueEntries((prev) => prev.map((e, i) => i === idx ? { ...e, issuing: true } : e));

        try {
            await issueMedicine(selectedConsultation.id, {
                prescription_id: entry.prescription_id,
                medicine_name: entry.medicine_name,
                quantity_issued: entry.quantity_issued,
                batch_number: entry.batch_number || undefined,
                notes: entry.notes || undefined,
            });
            setIssueEntries((prev) =>
                prev.map((e, i) => i === idx ? { ...e, issued: true, issuing: false } : e)
            );
        } catch (err: any) {
            console.error('Failed to issue medicine:', err);
            alert(err?.response?.data?.detail || 'Failed to issue medicine');
            setIssueEntries((prev) => prev.map((e, i) => i === idx ? { ...e, issuing: false } : e));
        }
    };

    // ─── Issue all remaining ──────────────────────────────────
    const handleIssueAll = async () => {
        if (!selectedConsultation) return;
        const remaining = issueEntries.filter((e) => !e.issued && !e.issuing);
        if (remaining.length === 0) return;

        for (let i = 0; i < issueEntries.length; i++) {
            if (!issueEntries[i].issued && !issueEntries[i].issuing) {
                await handleIssueSingle(i);
            }
        }
    };

    // ─── Mark all medicines issued & close ────────────────────
    const handleMarkAllIssued = async () => {
        if (!selectedConsultation) return;
        const allIssued = issueEntries.every((e) => e.issued);
        if (!allIssued) {
            alert('Please issue all medicines before completing.');
            return;
        }

        setMarkingIssued(true);
        try {
            await markMedicinesIssued(selectedConsultation.id);
            setSuccessMsg('All medicines issued and consultation marked as dispensed!');
            setTimeout(() => {
                setSelectedConsultation(null);
                setSuccessMsg(null);
                fetchQueue();
            }, 1500);
        } catch (err: any) {
            console.error('Failed to mark issued:', err);
            alert(err?.response?.data?.detail || 'Failed to finalize dispensing');
        } finally {
            setMarkingIssued(false);
        }
    };

    // ─── Update entry field ───────────────────────────────────
    const updateEntry = (idx: number, field: keyof PrescriptionIssueEntry, value: any) => {
        setIssueEntries((prev) =>
            prev.map((e, i) => i === idx ? { ...e, [field]: value } : e)
        );
    };

    const allIssuedCount = issueEntries.filter((e) => e.issued).length;
    const totalCount = issueEntries.length;

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });

    // ─── Loading state ────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800">Prescription Dispensing</h2>
                    <p className="text-neutral-500">Issue medicines for completed consultations</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Pending Count */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-lg">
                        <Pill className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{consultations.length}</p>
                        <p className="text-green-100">Prescriptions Pending Dispensing</p>
                    </div>
                </div>
            </div>

            {/* Consultations List */}
            {consultations.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-800 mb-2">All caught up!</h3>
                    <p className="text-neutral-500">No prescriptions pending dispensing</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {consultations.map((consultation) => (
                            <div
                                key={consultation.id}
                                className="p-4 hover:bg-neutral-50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <User className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-neutral-800">
                                                {consultation.patient_name}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {consultation.completed_at
                                                        ? formatDate(consultation.completed_at)
                                                        : 'N/A'}
                                                </span>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                    {consultation.status}
                                                </span>
                                            </div>

                                            {/* Prescription Summary */}
                                            <div className="mt-3 space-y-1">
                                                {consultation.prescriptions.slice(0, 3).map((p, i) => (
                                                    <p key={i} className="text-sm text-neutral-700 flex items-center gap-2">
                                                        <Package className="w-3.5 h-3.5 text-green-500" />
                                                        {p.medicine_name}
                                                        {p.dosage ? ` - ${p.dosage}` : ''}
                                                        {p.frequency ? `, ${p.frequency}` : ''}
                                                    </p>
                                                ))}
                                                {consultation.prescriptions.length > 3 && (
                                                    <p className="text-sm text-neutral-500">
                                                        +{consultation.prescriptions.length - 3} more
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col items-end gap-2">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                            <Pill className="w-4 h-4" />
                                            {consultation.prescriptions.length} medicine(s)
                                        </span>
                                        <button
                                            onClick={() => openModal(consultation)}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Package className="w-4 h-4" />
                                            Dispense
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Dispensing Modal ──────────────────────────────── */}
            {selectedConsultation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-neutral-200 sticky top-0 bg-white z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-800">
                                        Issue Medicines
                                    </h3>
                                    <p className="text-sm text-neutral-500">
                                        {selectedConsultation.patient_name} &bull;{' '}
                                        {allIssuedCount}/{totalCount} issued
                                    </p>
                                </div>
                                {/* Progress */}
                                <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all rounded-full"
                                            style={{
                                                width: totalCount > 0
                                                    ? `${(allIssuedCount / totalCount) * 100}%`
                                                    : '0%',
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-neutral-600">
                                        {totalCount > 0
                                            ? Math.round((allIssuedCount / totalCount) * 100)
                                            : 0}
                                        %
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Success message */}
                        {successMsg && (
                            <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <p className="text-sm text-green-700 font-medium">{successMsg}</p>
                            </div>
                        )}

                        {/* Modal Body - Prescription Items */}
                        <div className="p-6 space-y-4">
                            {issueEntries.map((entry, idx) => (
                                <div
                                    key={entry.prescription_id}
                                    className={`rounded-xl border p-4 transition-colors ${
                                        entry.issued
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-white border-neutral-200'
                                    }`}
                                >
                                    {/* Medicine header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {entry.issued ? (
                                                <CheckSquare className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <Square className="w-5 h-5 text-neutral-400" />
                                            )}
                                            <div>
                                                <p className="font-semibold text-neutral-800">
                                                    {entry.medicine_name}
                                                </p>
                                                <div className="flex flex-wrap gap-3 mt-1 text-xs text-neutral-500">
                                                    {entry.dosage && <span>Dosage: {entry.dosage}</span>}
                                                    {entry.frequency && <span>Freq: {entry.frequency}</span>}
                                                    {entry.duration && <span>Duration: {entry.duration}</span>}
                                                    {entry.quantity_prescribed != null && (
                                                        <span className="font-medium text-green-700">
                                                            Prescribed Qty: {entry.quantity_prescribed}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {entry.issued && (
                                            <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded-full font-medium">
                                                Issued
                                            </span>
                                        )}
                                    </div>

                                    {entry.instructions && (
                                        <div className="mb-3 flex items-start gap-2 text-sm text-neutral-600 bg-amber-50 rounded-lg p-2">
                                            <FileText className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                            <span>{entry.instructions}</span>
                                        </div>
                                    )}

                                    {/* Issuing fields (disabled when already issued) */}
                                    {!entry.issued && (
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                                    Qty to Issue
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={entry.quantity_issued}
                                                    onChange={(e) =>
                                                        updateEntry(idx, 'quantity_issued', parseInt(e.target.value) || 1)
                                                    }
                                                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                                    <Hash className="w-3 h-3 inline mr-1" />
                                                    Batch #
                                                </label>
                                                <input
                                                    type="text"
                                                    value={entry.batch_number}
                                                    onChange={(e) =>
                                                        updateEntry(idx, 'batch_number', e.target.value)
                                                    }
                                                    placeholder="Optional"
                                                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={() => handleIssueSingle(idx)}
                                                    disabled={entry.issuing}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                                                >
                                                    {entry.issuing ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                    )}
                                                    Issue
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Warning */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-700">
                                    Please verify all medicines and quantities before issuing. This action will be logged.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-neutral-200 flex items-center justify-between sticky bottom-0 bg-white">
                            <button
                                onClick={() => { setSelectedConsultation(null); setIssueEntries([]); }}
                                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                            >
                                Close
                            </button>
                            <div className="flex items-center gap-3">
                                {allIssuedCount < totalCount && (
                                    <button
                                        onClick={handleIssueAll}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                        <Package className="w-4 h-4" />
                                        Issue All Remaining
                                    </button>
                                )}
                                <button
                                    onClick={handleMarkAllIssued}
                                    disabled={allIssuedCount < totalCount || markingIssued}
                                    className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {markingIssued ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4" />
                                    )}
                                    Complete Dispensing
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacistPendingConsultations;
