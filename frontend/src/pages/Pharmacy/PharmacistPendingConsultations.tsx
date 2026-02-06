import React, { useState, useEffect, useCallback } from 'react';
import {
    Pill,
    User,
    CheckCircle,
    Loader2,
    RefreshCw,
    AlertCircle,
    Package,
    Activity,
    DollarSign
} from 'lucide-react';
import api from "../../utils/api/axios";

interface PendingConsultation {
    id: string;
    patient_name: string;
    doctor_name: string;
    consultation_fee: number;
    paid_at: string;
    chief_complaint: string | null;
    diagnoses: { diagnosis_name: string; diagnosis_type: string }[];
    prescriptions: {
        id: string;
        medicine_id: number | null;
        medicine_name: string;
        potency: string;
        dosage: string;
        frequency: string;
        duration: string;
        quantity: number;
        instructions: string | null;
    }[];
}

const PharmacistPendingConsultations: React.FC = () => {
    const [consultations, setConsultations] = useState<PendingConsultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedConsultation, setSelectedConsultation] = useState<PendingConsultation | null>(null);
    const [dispensingNote, setDispensingNote] = useState('');

    const fetchPendingConsultations = useCallback(async () => {
        try {
            setError(null);
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await api.get('/pharmacist/consultations/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                setConsultations(response.data.consultations);
            }
        } catch (err: any) {
            console.error('Failed to fetch pending consultations:', err);
            setError(err.response?.data?.message || 'Failed to load pending consultations');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingConsultations();
    }, [fetchPendingConsultations]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshing(true);
            fetchPendingConsultations();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchPendingConsultations]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPendingConsultations();
    };

    const handleIssueMedicines = async () => {
        if (!selectedConsultation) return;

        try {
            setProcessingId(selectedConsultation.id);
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            
            const response = await api.post(
                `/pharmacist/consultations/${selectedConsultation.id}/dispense`,
                {
                    note: dispensingNote
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.status === 200) {
                alert('Medicines issued successfully! Consultation complete.');
                setSelectedConsultation(null);
                setDispensingNote('');
                fetchPendingConsultations();
            }
        } catch (err: any) {
            console.error('Failed to issue medicines:', err);
            alert(err.response?.data?.message || 'Failed to issue medicines');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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
                    <p className="text-neutral-500">Issue medicines for paid consultations</p>
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
                <div className="bg-error-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-error-500" />
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
                                            <p className="text-sm text-neutral-500">
                                                Dr. {consultation.doctor_name}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <DollarSign className="w-3.5 h-3.5" />
                                                    Paid {formatDate(consultation.paid_at)}
                                                </span>
                                            </div>

                                            {/* Prescription Summary */}
                                            <div className="mt-3 space-y-1">
                                                {consultation.prescriptions.slice(0, 3).map((p, i) => (
                                                    <p key={i} className="text-sm text-neutral-700 flex items-center gap-2">
                                                        <Package className="w-3.5 h-3.5 text-green-500" />
                                                        {p.medicine_name} {p.potency} - {p.dosage}, {p.frequency}
                                                    </p>
                                                ))}
                                                {consultation.prescriptions.length > 3 && (
                                                    <p className="text-sm text-neutral-500">
                                                        +{consultation.prescriptions.length - 3} more medicines
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                            <Pill className="w-4 h-4" />
                                            {consultation.prescriptions.length} medicine(s)
                                        </span>
                                        <button
                                            onClick={() => setSelectedConsultation(consultation)}
                                            className="mt-2 block w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Package className="w-4 h-4" />
                                            Issue Medicines
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Dispensing Modal */}
            {selectedConsultation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-200 sticky top-0 bg-white">
                            <h3 className="text-lg font-bold text-neutral-800">Issue Medicines</h3>
                            <p className="text-sm text-neutral-500">Review and dispense prescription</p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Patient Info */}
                            <div className="bg-neutral-50 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <User className="w-5 h-5 text-neutral-500" />
                                    <span className="font-semibold text-neutral-800">{selectedConsultation.patient_name}</span>
                                </div>
                                <p className="text-sm text-neutral-500">Dr. {selectedConsultation.doctor_name}</p>
                            </div>

                            {/* Diagnoses */}
                            {selectedConsultation.diagnoses.length > 0 && (
                                <div className="bg-purple-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-5 h-5 text-purple-600" />
                                        <span className="font-medium text-purple-800">Diagnoses</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedConsultation.diagnoses.map((d, i) => (
                                            <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                                {d.diagnosis_name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Prescriptions */}
                            <div className="bg-green-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Pill className="w-5 h-5 text-green-600" />
                                    <span className="font-medium text-green-800">
                                        Prescriptions ({selectedConsultation.prescriptions.length})
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {selectedConsultation.prescriptions.map((p, i) => (
                                        <div key={i} className="bg-white rounded-lg p-3 border border-green-200">
                                            <p className="font-semibold text-neutral-800">
                                                {p.medicine_name} {p.potency}
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-neutral-600">
                                                <span>Dosage: {p.dosage}</span>
                                                <span>Frequency: {p.frequency}</span>
                                                <span>Duration: {p.duration}</span>
                                                <span className="font-medium text-green-700">Qty: {p.quantity}</span>
                                            </div>
                                            {p.instructions && (
                                                <p className="mt-2 text-sm text-neutral-500 italic">
                                                    Note: {p.instructions}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Dispensing Note */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Dispensing Note (Optional)
                                </label>
                                <textarea
                                    value={dispensingNote}
                                    onChange={(e) => setDispensingNote(e.target.value)}
                                    placeholder="Add any notes about dispensing..."
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[60px] resize-none"
                                />
                            </div>

                            {/* Warning */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-700">
                                    Please verify all medicines before issuing. This action will be logged.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-neutral-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                            <button
                                onClick={() => {
                                    setSelectedConsultation(null);
                                    setDispensingNote('');
                                }}
                                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleIssueMedicines}
                                disabled={processingId === selectedConsultation.id}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {processingId === selectedConsultation.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                Confirm & Issue Medicines
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacistPendingConsultations;
