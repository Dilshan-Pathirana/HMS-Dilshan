import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    Pill,
    Plus,
    ChevronLeft,
    Loader2,
    AlertTriangle,
    Search,
    Clock,
    User,
    FileText,
    Trash2,
    Copy,
    Check,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface Prescription {
    id: string;
    patient_name: string;
    patient_id: string;
    date: string;
    status: 'active' | 'completed' | 'cancelled';
    medications: Medication[];
}

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: number;
}

// Main Prescriptions Component
const DoctorPrescriptions: React.FC = () => {
    return (
        <Routes>
            <Route index element={<PrescriptionsList />} />
            <Route path="new" element={<CreatePrescription />} />
            <Route path=":prescriptionId" element={<ViewPrescription />} />
        </Routes>
    );
};

// Prescriptions List
const PrescriptionsList: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'today' | 'week'>('today');

    useEffect(() => {
        fetchPrescriptions();
    }, [userId]);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            // This would be an actual API call
            setPrescriptions([]);
        } catch (error) {
            console.error('Failed to fetch prescriptions:', error);
        } finally {
            setLoading(false);
        }
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Prescriptions</h1>
                    <p className="text-gray-500">Manage and issue patient prescriptions</p>
                </div>
                <Link
                    to="new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    New Prescription
                </Link>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by patient name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        {[
                            { key: 'today', label: 'Today' },
                            { key: 'week', label: 'This Week' },
                            { key: 'all', label: 'All' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filter === tab.key
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Prescriptions List */}
            {prescriptions.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No prescriptions found</h3>
                    <p className="text-gray-500 mb-4">Start by creating a new prescription</p>
                    <Link
                        to="new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" />
                        New Prescription
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="divide-y divide-gray-100">
                        {prescriptions.map((prescription) => (
                            <Link
                                key={prescription.id}
                                to={prescription.id}
                                className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors block"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Pill className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{prescription.patient_name}</p>
                                        <p className="text-sm text-gray-500">
                                            {prescription.medications.length} medication(s)
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">{prescription.date}</p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        prescription.status === 'active' ? 'bg-green-100 text-green-700' :
                                        prescription.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {prescription.status}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Create Prescription Component
const CreatePrescription: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patient');
    const appointmentId = searchParams.get('appointment');
    
    const [loading, setLoading] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [medications, setMedications] = useState<Medication[]>([]);
    const [drugSearch, setDrugSearch] = useState('');
    const [showDrugList, setShowDrugList] = useState(false);
    const [allergies, setAllergies] = useState<string[]>([]);

    // Sample drug list - in real app, this would come from API
    const drugList = [
        { id: 'paracetamol', name: 'Paracetamol 500mg', category: 'Analgesic' },
        { id: 'ibuprofen', name: 'Ibuprofen 400mg', category: 'NSAID' },
        { id: 'amoxicillin', name: 'Amoxicillin 500mg', category: 'Antibiotic' },
        { id: 'omeprazole', name: 'Omeprazole 20mg', category: 'PPI' },
        { id: 'metformin', name: 'Metformin 500mg', category: 'Antidiabetic' },
        { id: 'amlodipine', name: 'Amlodipine 5mg', category: 'Antihypertensive' },
        { id: 'atorvastatin', name: 'Atorvastatin 10mg', category: 'Statin' },
        { id: 'cetirizine', name: 'Cetirizine 10mg', category: 'Antihistamine' },
        { id: 'azithromycin', name: 'Azithromycin 500mg', category: 'Antibiotic' },
        { id: 'pantoprazole', name: 'Pantoprazole 40mg', category: 'PPI' }
    ];

    const frequencyOptions = [
        'Once daily',
        'Twice daily',
        'Three times daily',
        'Four times daily',
        'Every 6 hours',
        'Every 8 hours',
        'Every 12 hours',
        'At bedtime',
        'As needed',
        'Before meals',
        'After meals'
    ];

    const durationOptions = [
        '3 days',
        '5 days',
        '7 days',
        '10 days',
        '14 days',
        '1 month',
        '2 months',
        '3 months',
        'Continuous'
    ];

    const addMedication = (drug: typeof drugList[0]) => {
        const newMed: Medication = {
            id: drug.id + '-' + Date.now(),
            name: drug.name,
            dosage: '1 tablet',
            frequency: 'Once daily',
            duration: '7 days',
            instructions: '',
            quantity: 7
        };
        setMedications([...medications, newMed]);
        setDrugSearch('');
        setShowDrugList(false);
    };

    const updateMedication = (id: string, field: keyof Medication, value: any) => {
        setMedications(meds => 
            meds.map(m => m.id === id ? { ...m, [field]: value } : m)
        );
    };

    const removeMedication = (id: string) => {
        setMedications(meds => meds.filter(m => m.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (medications.length === 0) {
            alert('Please add at least one medication');
            return;
        }

        setLoading(true);
        try {
            await api.post('/create-prescription', {
                patient_id: patientId,
                appointment_id: appointmentId,
                medications
            });
            alert('Prescription created successfully!');
            navigate('/doctor-dashboard-new/prescriptions');
        } catch (error) {
            console.error('Failed to create prescription:', error);
            alert('Failed to create prescription. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filteredDrugs = drugList.filter(d => 
        d.name.toLowerCase().includes(drugSearch.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link to="/doctor-dashboard-new/prescriptions" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-4 h-4" /> Back to Prescriptions
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">New Prescription</h1>
                <p className="text-gray-500">Prescribe medications for a patient</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Information</h2>
                    {patientId ? (
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                    P
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">Patient ID: {patientId}</p>
                                    <p className="text-sm text-gray-500">From current consultation</p>
                                </div>
                            </div>
                            {allergies.length > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-sm text-red-700">Known Allergies: {allergies.join(', ')}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search patient by name or phone..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}
                </div>

                {/* Add Medication */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Medications</h2>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search medications..."
                            value={drugSearch}
                            onChange={(e) => {
                                setDrugSearch(e.target.value);
                                setShowDrugList(e.target.value.length > 0);
                            }}
                            onFocus={() => drugSearch && setShowDrugList(true)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        
                        {showDrugList && filteredDrugs.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                                {filteredDrugs.map((drug) => (
                                    <button
                                        key={drug.id}
                                        type="button"
                                        onClick={() => addMedication(drug)}
                                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                                    >
                                        <p className="font-medium text-gray-800">{drug.name}</p>
                                        <p className="text-xs text-gray-500">{drug.category}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Medication List */}
                {medications.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Medications ({medications.length})
                        </h2>
                        
                        <div className="space-y-4">
                            {medications.map((med, index) => (
                                <div key={med.id} className="p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                                                {index + 1}
                                            </span>
                                            <h3 className="font-medium text-gray-800">{med.name}</h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeMedication(med.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Dosage</label>
                                            <input
                                                type="text"
                                                value={med.dosage}
                                                onChange={(e) => updateMedication(med.id, 'dosage', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Frequency</label>
                                            <select
                                                value={med.frequency}
                                                onChange={(e) => updateMedication(med.id, 'frequency', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            >
                                                {frequencyOptions.map(f => (
                                                    <option key={f} value={f}>{f}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Duration</label>
                                            <select
                                                value={med.duration}
                                                onChange={(e) => updateMedication(med.id, 'duration', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            >
                                                {durationOptions.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={med.quantity}
                                                onChange={(e) => updateMedication(med.id, 'quantity', parseInt(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Special Instructions</label>
                                        <input
                                            type="text"
                                            value={med.instructions}
                                            onChange={(e) => updateMedication(med.id, 'instructions', e.target.value)}
                                            placeholder="e.g., Take with food, Avoid alcohol"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Drug Interaction Warning */}
                {medications.length > 1 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-yellow-600" />
                            <div>
                                <p className="font-medium text-yellow-800">Drug Interaction Check</p>
                                <p className="text-sm text-yellow-600">
                                    Please verify drug interactions before prescribing multiple medications
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/doctor-dashboard-new/prescriptions')}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || medications.length === 0}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Pill className="w-5 h-5" />
                                Create Prescription
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

// View Prescription Component
const ViewPrescription: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <Link to="/doctor-dashboard-new/prescriptions" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-4 h-4" /> Back to Prescriptions
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">View Prescription</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Prescription Details</h3>
                <p className="text-gray-500">Prescription details will be displayed here</p>
            </div>
        </div>
    );
};

export default DoctorPrescriptions;
