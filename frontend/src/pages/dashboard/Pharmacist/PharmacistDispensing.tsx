import React, { useState, useEffect } from 'react';
import api from "../../../utils/api/axios";
import {
    Pill, Search, Package, User, AlertTriangle, CheckCircle,
    RefreshCw, Barcode, X, Plus, Minus, ShieldAlert, Clock,
    FileText, DollarSign, Printer, Save
} from 'lucide-react';

interface PrescriptionItem {
    id: string;
    medicine_name: string;
    generic_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity_prescribed: number;
    quantity_available: number;
    quantity_to_dispense: number;
    unit_price: number;
    batch_number: string;
    expiry_date: string;
    is_controlled: boolean;
    is_dispensed: boolean;
    substitute_available?: boolean;
    substitute_name?: string;
}

interface CurrentPrescription {
    id: string;
    prescription_number: string;
    patient_name: string;
    patient_id: string;
    doctor_name: string;
    type: 'OPD' | 'IPD';
    items: PrescriptionItem[];
    allergies?: string[];
    notes?: string;
}

interface DispensingStats {
    dispensed_today: number;
    pending: number;
    partial: number;
    controlled_issued: number;
}

export const PharmacistDispensing: React.FC = () => {
    const [currentPrescription, setCurrentPrescription] = useState<CurrentPrescription | null>(null);
    const [prescriptionSearch, setPrescriptionSearch] = useState('');
    const [barcodeMode, setBarcodeMode] = useState(false);
    const [stats, setStats] = useState<DispensingStats>({
        dispensed_today: 42,
        pending: 8,
        partial: 3,
        controlled_issued: 12
    });
    const [loading, setLoading] = useState(false);
    const [showInteractionAlert, setShowInteractionAlert] = useState(false);
    const [interactionMessage, setInteractionMessage] = useState('');

    useEffect(() => {
        // Check URL params for prescription ID
        const urlParams = new URLSearchParams(window.location.search);
        const prescriptionId = urlParams.get('prescription');
        if (prescriptionId) {
            loadPrescription(prescriptionId);
        }
    }, []);

    const loadPrescription = async (prescriptionId: string) => {
        setLoading(true);
        try {
            // Mock data - replace with actual API call
            const mockPrescription: CurrentPrescription = {
                id: prescriptionId,
                prescription_number: 'RX-2025-001234',
                patient_name: 'John Doe',
                patient_id: 'P001',
                doctor_name: 'Dr. Silva',
                type: 'OPD',
                allergies: ['Penicillin', 'Sulfa drugs'],
                items: [
                    {
                        id: '1',
                        medicine_name: 'Amoxicillin 500mg',
                        generic_name: 'Amoxicillin',
                        dosage: '500mg',
                        frequency: 'TDS',
                        duration: '7 days',
                        quantity_prescribed: 21,
                        quantity_available: 150,
                        quantity_to_dispense: 21,
                        unit_price: 15.00,
                        batch_number: 'AMX-2025-001',
                        expiry_date: '2026-06-15',
                        is_controlled: false,
                        is_dispensed: false
                    },
                    {
                        id: '2',
                        medicine_name: 'Paracetamol 500mg',
                        generic_name: 'Paracetamol',
                        dosage: '500mg',
                        frequency: 'QID PRN',
                        duration: '5 days',
                        quantity_prescribed: 20,
                        quantity_available: 500,
                        quantity_to_dispense: 20,
                        unit_price: 5.00,
                        batch_number: 'PCM-2025-045',
                        expiry_date: '2027-01-20',
                        is_controlled: false,
                        is_dispensed: false
                    },
                    {
                        id: '3',
                        medicine_name: 'Codeine Phosphate 30mg',
                        generic_name: 'Codeine',
                        dosage: '30mg',
                        frequency: 'BD',
                        duration: '3 days',
                        quantity_prescribed: 6,
                        quantity_available: 25,
                        quantity_to_dispense: 6,
                        unit_price: 45.00,
                        batch_number: 'COD-2025-012',
                        expiry_date: '2025-08-30',
                        is_controlled: true,
                        is_dispensed: false
                    }
                ]
            };
            setCurrentPrescription(mockPrescription);

            // Check for drug interactions
            if (mockPrescription.allergies?.includes('Penicillin')) {
                setInteractionMessage('⚠️ Patient is allergic to Penicillin. Amoxicillin is a penicillin-type antibiotic. Please verify with the prescribing doctor.');
                setShowInteractionAlert(true);
            }
        } catch (error) {
            console.error('Error loading prescription:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchPrescription = () => {
        if (prescriptionSearch.trim()) {
            loadPrescription(prescriptionSearch);
        }
    };

    const updateQuantity = (itemId: string, delta: number) => {
        if (!currentPrescription) return;

        setCurrentPrescription(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                items: prev.items.map(item => {
                    if (item.id === itemId) {
                        const newQty = Math.max(0, Math.min(
                            item.quantity_available,
                            item.quantity_to_dispense + delta
                        ));
                        return { ...item, quantity_to_dispense: newQty };
                    }
                    return item;
                })
            };
        });
    };

    const toggleItemDispensed = (itemId: string) => {
        if (!currentPrescription) return;

        setCurrentPrescription(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                items: prev.items.map(item => {
                    if (item.id === itemId) {
                        return { ...item, is_dispensed: !item.is_dispensed };
                    }
                    return item;
                })
            };
        });
    };

    const calculateTotal = () => {
        if (!currentPrescription) return 0;
        return currentPrescription.items.reduce((total, item) => {
            return total + (item.quantity_to_dispense * item.unit_price);
        }, 0);
    };

    const handleDispenseAll = async () => {
        if (!currentPrescription) return;

        const hasControlled = currentPrescription.items.some(item => item.is_controlled && !item.is_dispensed);
        if (hasControlled) {
            alert('Controlled drugs require second-level approval. Please verify before dispensing.');
            return;
        }

        try {
            // API call to dispense
            console.log('Dispensing prescription:', currentPrescription.id);
            alert('Prescription dispensed successfully!');
            setCurrentPrescription(null);
        } catch (error) {
            console.error('Error dispensing:', error);
        }
    };

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-neutral-50">
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-neutral-900">Medicine Dispensing</h1>
                    <p className="text-neutral-600">Dispense medicines against prescriptions</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Dispensed Today</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.dispensed_today}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Pending</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.pending}</p>
                            </div>
                            <Clock className="w-10 h-10 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-primary-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Partial Dispense</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.partial}</p>
                            </div>
                            <Package className="w-10 h-10 text-primary-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-error-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Controlled Drugs</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.controlled_issued}</p>
                            </div>
                            <ShieldAlert className="w-10 h-10 text-error-500" />
                        </div>
                    </div>
                </div>

                {/* Search Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Enter Prescription Number or Patient ID..."
                                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                value={prescriptionSearch}
                                onChange={(e) => setPrescriptionSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchPrescription()}
                            />
                        </div>
                        <button
                            onClick={searchPrescription}
                            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                        >
                            <Search className="w-5 h-5" />
                            Search
                        </button>
                        <button
                            onClick={() => setBarcodeMode(!barcodeMode)}
                            className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                                barcodeMode 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                            }`}
                        >
                            <Barcode className="w-5 h-5" />
                            Barcode Mode
                        </button>
                    </div>
                </div>

                {/* Drug Interaction Alert */}
                {showInteractionAlert && (
                    <div className="bg-error-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-error-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-800">Drug Interaction / Allergy Alert</h3>
                                <p className="text-red-700">{interactionMessage}</p>
                            </div>
                            <button
                                onClick={() => setShowInteractionAlert(false)}
                                className="text-error-600 hover:text-red-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Current Prescription */}
                {currentPrescription ? (
                    <div className="bg-white rounded-lg shadow">
                        {/* Prescription Header */}
                        <div className="p-6 border-b border-neutral-200">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900">
                                        {currentPrescription.prescription_number}
                                    </h2>
                                    <div className="flex items-center gap-4 mt-2 text-neutral-600">
                                        <span className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            {currentPrescription.patient_name} ({currentPrescription.patient_id})
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" />
                                            Dr. {currentPrescription.doctor_name}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            currentPrescription.type === 'OPD' 
                                                ? 'bg-blue-100 text-blue-800' 
                                                : 'bg-purple-100 text-purple-800'
                                        }`}>
                                            {currentPrescription.type}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setCurrentPrescription(null)}
                                    className="text-neutral-400 hover:text-neutral-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {currentPrescription.allergies && currentPrescription.allergies.length > 0 && (
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-sm font-medium text-error-600">Known Allergies:</span>
                                    {currentPrescription.allergies.map((allergy, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-error-100 text-red-800 text-xs rounded-full">
                                            {allergy}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Medicine</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Dosage</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Batch</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Expiry</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Prescribed</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Available</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Dispense</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentPrescription.items.map((item) => (
                                        <tr key={item.id} className={item.is_dispensed ? 'bg-green-50' : ''}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {item.is_controlled && (
                                                        <span title="Controlled Drug">
                                                            <ShieldAlert className="w-4 h-4 text-error-500" />
                                                        </span>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-neutral-900">{item.medicine_name}</p>
                                                        <p className="text-sm text-neutral-500">{item.generic_name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">
                                                {item.frequency} x {item.duration}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">{item.batch_number}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={new Date(item.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
                                                    ? 'text-orange-600 font-medium' 
                                                    : 'text-neutral-600'
                                                }>
                                                    {item.expiry_date}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium">{item.quantity_prescribed}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={item.quantity_available < item.quantity_prescribed 
                                                    ? 'text-error-600 font-medium' 
                                                    : 'text-green-600'
                                                }>
                                                    {item.quantity_available}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="p-1 rounded bg-neutral-200 hover:bg-neutral-300"
                                                        disabled={item.is_dispensed}
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-12 text-center font-medium">
                                                        {item.quantity_to_dispense}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="p-1 rounded bg-neutral-200 hover:bg-neutral-300"
                                                        disabled={item.is_dispensed}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                LKR {(item.quantity_to_dispense * item.unit_price).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toggleItemDispensed(item.id)}
                                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                                        item.is_dispensed
                                                            ? 'bg-green-600 text-white'
                                                            : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                                                    }`}
                                                >
                                                    {item.is_dispensed ? '✓ Dispensed' : 'Mark Done'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer with Total and Actions */}
                        <div className="p-6 border-t border-neutral-200 bg-neutral-50">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-6">
                                    <div className="text-lg">
                                        <span className="text-neutral-600">Total Items: </span>
                                        <span className="font-bold">{currentPrescription.items.length}</span>
                                    </div>
                                    <div className="text-lg">
                                        <span className="text-neutral-600">Total Amount: </span>
                                        <span className="font-bold text-green-600">LKR {calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-100 flex items-center gap-2">
                                        <Printer className="w-4 h-4" />
                                        Print Label
                                    </button>
                                    <button className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-100 flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        Save Partial
                                    </button>
                                    <button
                                        onClick={handleDispenseAll}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Complete Dispensing
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-neutral-600 mb-2">No Prescription Selected</h3>
                        <p className="text-neutral-500">
                            Search for a prescription by number or patient ID to start dispensing
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PharmacistDispensing;
