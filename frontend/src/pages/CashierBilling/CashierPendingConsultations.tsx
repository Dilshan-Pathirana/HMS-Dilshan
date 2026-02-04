import React, { useState, useEffect, useCallback } from 'react';
import {
    Stethoscope,
    User,
    Clock,
    DollarSign,
    Loader2,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Pill,
    Activity
} from 'lucide-react';
import api from "../../utils/api/axios";

interface PendingConsultation {
    id: string;
    patient_name: string;
    doctor_name: string;
    consultation_fee: number;
    started_at: string;
    completed_at: string;
    chief_complaint: string | null;
    diagnoses: { diagnosis_name: string; diagnosis_type: string }[];
    prescriptions: { medicine_name: string; potency: string; quantity: number }[];
}

const CashierPendingConsultations: React.FC = () => {
    const [consultations, setConsultations] = useState<PendingConsultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedConsultation, setSelectedConsultation] = useState<PendingConsultation | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
    const [paymentNote, setPaymentNote] = useState('');

    const fetchPendingConsultations = useCallback(async () => {
        try {
            setError(null);
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await api.get('/cashier/consultations/pending', {
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

    const handleProcessPayment = async () => {
        if (!selectedConsultation) return;

        try {
            setProcessingId(selectedConsultation.id);
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            
            const response = await api.post(
                `/cashier/consultations/${selectedConsultation.id}/payment`,
                {
                    payment_method: paymentMethod,
                    note: paymentNote
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.status === 200) {
                alert('Payment collected successfully! Sent to pharmacist for medicine dispensing.');
                setSelectedConsultation(null);
                setPaymentMethod('cash');
                setPaymentNote('');
                fetchPendingConsultations();
            }
        } catch (err: any) {
            console.error('Failed to process payment:', err);
            alert(err.response?.data?.message || 'Failed to process payment');
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
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Pending Consultations</h2>
                    <p className="text-gray-500">Collect payment for completed consultations</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-lg">
                        <Stethoscope className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{consultations.length}</p>
                        <p className="text-blue-100">Consultations Pending Payment</p>
                    </div>
                </div>
            </div>

            {/* Consultations List */}
            {consultations.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">All caught up!</h3>
                    <p className="text-gray-500">No consultations pending payment</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {consultations.map((consultation) => (
                            <div
                                key={consultation.id}
                                className="p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <User className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">
                                                {consultation.patient_name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Dr. {consultation.doctor_name}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDate(consultation.completed_at)}
                                                </span>
                                                {consultation.chief_complaint && (
                                                    <span className="text-gray-500">
                                                        {consultation.chief_complaint.substring(0, 50)}...
                                                    </span>
                                                )}
                                            </div>

                                            {/* Summary */}
                                            <div className="flex items-center gap-4 mt-2">
                                                {consultation.diagnoses.length > 0 && (
                                                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                                        <Activity className="w-3 h-3" />
                                                        {consultation.diagnoses.length} diagnosis
                                                    </span>
                                                )}
                                                {consultation.prescriptions.length > 0 && (
                                                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                        <Pill className="w-3 h-3" />
                                                        {consultation.prescriptions.length} medicine(s)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-800">
                                            Rs. {consultation.consultation_fee.toLocaleString()}
                                        </p>
                                        <button
                                            onClick={() => setSelectedConsultation(consultation)}
                                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <DollarSign className="w-4 h-4" />
                                            Collect Payment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {selectedConsultation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">Collect Payment</h3>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-500">Patient</p>
                                <p className="font-semibold text-gray-800">{selectedConsultation.patient_name}</p>
                                <p className="text-sm text-gray-500 mt-2">Doctor</p>
                                <p className="font-medium text-gray-700">Dr. {selectedConsultation.doctor_name}</p>
                            </div>

                            <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between">
                                <span className="text-green-700 font-medium">Consultation Fee</span>
                                <span className="text-2xl font-bold text-green-700">
                                    Rs. {selectedConsultation.consultation_fee.toLocaleString()}
                                </span>
                            </div>

                            {/* Prescriptions preview */}
                            {selectedConsultation.prescriptions.length > 0 && (
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <p className="text-sm text-blue-600 font-medium mb-2">
                                        Medicines to be issued ({selectedConsultation.prescriptions.length})
                                    </p>
                                    <div className="space-y-1">
                                        {selectedConsultation.prescriptions.slice(0, 3).map((p, i) => (
                                            <p key={i} className="text-sm text-gray-700">
                                                • {p.medicine_name} {p.potency} x{p.quantity}
                                            </p>
                                        ))}
                                        {selectedConsultation.prescriptions.length > 3 && (
                                            <p className="text-sm text-gray-500">
                                                +{selectedConsultation.prescriptions.length - 3} more
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <div className="flex gap-2">
                                    {(['cash', 'card', 'online'] as const).map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                                                paymentMethod === method
                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    placeholder="Add any payment note..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setSelectedConsultation(null);
                                    setPaymentMethod('cash');
                                    setPaymentNote('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessPayment}
                                disabled={processingId === selectedConsultation.id}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {processingId === selectedConsultation.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierPendingConsultations;
