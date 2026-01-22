import React, { useState, useEffect, useCallback } from 'react';
import {
    Pill,
    Search,
    Plus,
    Trash2,
    Loader2,
    AlertCircle,
    Package,
    Info
} from 'lucide-react';
import { Medicine, Prescription } from './types';
import { getMedicines } from './consultationApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';

interface MedicineRecommendationProps {
    consultationId: string;
    prescriptions: Prescription[];
    setPrescriptions: React.Dispatch<React.SetStateAction<Prescription[]>>;
}

const POTENCY_OPTIONS = [
    '6C', '12C', '30C', '200C', '1M', '10M',
    '3X', '6X', '12X', '30X',
    'Q', 'Mother Tincture',
    'Other'
];

const FREQUENCY_OPTIONS = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Once weekly',
    'As needed',
    'Before meals',
    'After meals',
    'At bedtime'
];

const DURATION_OPTIONS = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '2 weeks',
    '3 weeks',
    '1 month',
    '2 months',
    '3 months',
    'Until next visit',
    'As directed'
];

const MedicineRecommendation: React.FC<MedicineRecommendationProps> = ({
    consultationId,
    prescriptions,
    setPrescriptions
}) => {
    const branchId = useSelector((state: RootState) => state.auth.branchId);
    
    const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Current prescription being added
    const [currentPrescription, setCurrentPrescription] = useState<Prescription>({
        medicine_id: null,
        medicine_name: '',
        potency: '30C',
        dosage: '',
        frequency: 'Twice daily',
        duration: '7 days',
        quantity: 1,
        instructions: ''
    });

    useEffect(() => {
        fetchMedicines();
    }, [searchTerm]);

    const fetchMedicines = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getMedicines(searchTerm, branchId || undefined);
            if (response.status === 200) {
                setAvailableMedicines(response.medicines);
            }
        } catch (error) {
            console.error('Failed to fetch medicines:', error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, branchId]);

    const handleSelectMedicine = (medicine: Medicine) => {
        setCurrentPrescription(prev => ({
            ...prev,
            medicine_id: medicine.id,
            medicine_name: medicine.product_name
        }));
        setShowAddForm(true);
    };

    const handleAddPrescription = () => {
        if (!currentPrescription.medicine_name.trim()) {
            alert('Please select or enter a medicine name.');
            return;
        }
        
        if (!currentPrescription.dosage.trim()) {
            alert('Please enter the dosage.');
            return;
        }
        
        setPrescriptions(prev => [...prev, { ...currentPrescription }]);
        
        // Reset form
        setCurrentPrescription({
            medicine_id: null,
            medicine_name: '',
            potency: '30C',
            dosage: '',
            frequency: 'Twice daily',
            duration: '7 days',
            quantity: 1,
            instructions: ''
        });
        setShowAddForm(false);
    };

    const handleRemovePrescription = (index: number) => {
        setPrescriptions(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdatePrescription = (index: number, field: keyof Prescription, value: any) => {
        setPrescriptions(prev => prev.map((p, i) =>
            i === index ? { ...p, [field]: value } : p
        ));
    };

    const handleManualEntry = () => {
        setCurrentPrescription({
            medicine_id: null,
            medicine_name: '',
            potency: '30C',
            dosage: '',
            frequency: 'Twice daily',
            duration: '7 days',
            quantity: 1,
            instructions: ''
        });
        setShowAddForm(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Medicine Recommendations</h2>
                    <p className="text-gray-500">
                        Select medicines from inventory (read-only) or enter manually
                    </p>
                </div>
                <button
                    onClick={handleManualEntry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Medicine
                </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-blue-700">Read-Only Inventory Access</p>
                    <p className="text-sm text-blue-600">
                        You can view available medicines but cannot modify stock. 
                        The pharmacist will issue the medicines after payment is collected.
                    </p>
                </div>
            </div>

            {/* Current Prescriptions */}
            {prescriptions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-800">
                            Prescribed Medicines ({prescriptions.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {prescriptions.map((prescription, index) => (
                            <div key={index} className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <Pill className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {prescription.medicine_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {prescription.potency} • {prescription.dosage} • {prescription.frequency}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemovePrescription(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Potency</label>
                                        <select
                                            value={prescription.potency}
                                            onChange={(e) => handleUpdatePrescription(index, 'potency', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {POTENCY_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                                        <select
                                            value={prescription.frequency}
                                            onChange={(e) => handleUpdatePrescription(index, 'frequency', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {FREQUENCY_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Duration</label>
                                        <select
                                            value={prescription.duration}
                                            onChange={(e) => handleUpdatePrescription(index, 'duration', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {DURATION_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={prescription.quantity}
                                            onChange={(e) => handleUpdatePrescription(index, 'quantity', parseInt(e.target.value) || 1)}
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                
                                <div className="mt-3">
                                    <label className="block text-xs text-gray-500 mb-1">Special Instructions</label>
                                    <input
                                        type="text"
                                        value={prescription.instructions}
                                        onChange={(e) => handleUpdatePrescription(index, 'instructions', e.target.value)}
                                        placeholder="e.g., Take with warm water, avoid coffee..."
                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Prescription Form */}
            {showAddForm && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-4">Add Medicine Prescription</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Medicine Name *
                            </label>
                            <input
                                type="text"
                                value={currentPrescription.medicine_name}
                                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, medicine_name: e.target.value, medicine_id: null }))}
                                placeholder="Enter medicine name..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Potency *
                            </label>
                            <select
                                value={currentPrescription.potency}
                                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, potency: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                {POTENCY_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dosage *
                            </label>
                            <input
                                type="text"
                                value={currentPrescription.dosage}
                                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, dosage: e.target.value }))}
                                placeholder="e.g., 3 pellets, 10 drops"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Frequency *
                            </label>
                            <select
                                value={currentPrescription.frequency}
                                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, frequency: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                {FREQUENCY_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration *
                            </label>
                            <select
                                value={currentPrescription.duration}
                                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, duration: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                {DURATION_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={currentPrescription.quantity}
                                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Special Instructions
                            </label>
                            <textarea
                                value={currentPrescription.instructions}
                                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, instructions: e.target.value }))}
                                placeholder="Any special instructions for the patient..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[60px] resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-4">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddPrescription}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <Plus className="w-4 h-4" />
                            Add Prescription
                        </button>
                    </div>
                </div>
            )}

            {/* Search Available Medicines */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search available medicines in inventory..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Available Medicines from Inventory */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Available in Inventory</h3>
                    <span className="text-sm text-gray-500">Read-only</span>
                </div>
                
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                ) : availableMedicines.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No medicines found in inventory</p>
                        <p className="text-sm text-gray-400">You can still add medicines manually</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                        {availableMedicines.map((medicine) => (
                            <div
                                key={medicine.id}
                                onClick={() => handleSelectMedicine(medicine)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Pill className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{medicine.product_name}</p>
                                        <p className="text-sm text-gray-500">
                                            {medicine.category} • {medicine.sku || 'No SKU'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-medium ${
                                        medicine.current_quantity > 10 
                                            ? 'text-green-600' 
                                            : medicine.current_quantity > 0 
                                            ? 'text-amber-600' 
                                            : 'text-red-600'
                                    }`}>
                                        {medicine.current_quantity} {medicine.unit}
                                    </p>
                                    <p className="text-sm text-gray-500">Rs. {medicine.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicineRecommendation;
