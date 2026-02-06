import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    Search,
    Plus,
    Trash2,
    Loader2,
    Check,
    X,
    AlertCircle
} from 'lucide-react';
import { Diagnosis, ConsultationDiagnosis } from './types';
import { getDiagnoses, addDiagnosis } from './consultationApi';

interface DiagnosisSelectionProps {
    consultationId: string;
    diagnoses: ConsultationDiagnosis[];
    setDiagnoses: React.Dispatch<React.SetStateAction<ConsultationDiagnosis[]>>;
}

const DIAGNOSIS_TYPES = [
    { id: 'primary', label: 'Primary', color: 'blue', description: 'Main diagnosis' },
    { id: 'secondary', label: 'Secondary', color: 'purple', description: 'Contributing condition' },
    { id: 'differential', label: 'Differential', color: 'amber', description: 'Possible alternative' },
];

const CATEGORIES = [
    { id: 'acute', label: 'Acute', color: 'red' },
    { id: 'chronic', label: 'Chronic', color: 'blue' },
    { id: 'constitutional', label: 'Constitutional', color: 'green' },
];

const DiagnosisSelection: React.FC<DiagnosisSelectionProps> = ({
    consultationId,
    diagnoses,
    setDiagnoses
}) => {
    const [availableDiagnoses, setAvailableDiagnoses] = useState<Diagnosis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [addingNew, setAddingNew] = useState(false);
    
    // New diagnosis form
    const [newDiagnosis, setNewDiagnosis] = useState({
        diagnosis_code: '',
        diagnosis_name: '',
        category: 'acute' as 'acute' | 'chronic' | 'constitutional',
        description: ''
    });

    // Selection modal
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null);
    const [diagnosisType, setDiagnosisType] = useState<'primary' | 'secondary' | 'differential'>('primary');
    const [diagnosisNotes, setDiagnosisNotes] = useState('');

    useEffect(() => {
        fetchDiagnoses();
    }, [searchTerm, selectedCategory]);

    const fetchDiagnoses = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getDiagnoses(searchTerm, selectedCategory);
            if (response.status === 200) {
                setAvailableDiagnoses(response.diagnoses);
            }
        } catch (error) {
            console.error('Failed to fetch diagnoses:', error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedCategory]);

    const handleSelectDiagnosis = (diagnosis: Diagnosis) => {
        // Check if already added
        if (diagnoses.some(d => d.diagnosis_id === diagnosis.id)) {
            alert('This diagnosis is already added.');
            return;
        }
        
        setSelectedDiagnosis(diagnosis);
        setDiagnosisType('primary');
        setDiagnosisNotes('');
        setShowSelectionModal(true);
    };

    const handleConfirmDiagnosis = () => {
        if (!selectedDiagnosis) return;
        
        setDiagnoses(prev => [...prev, {
            diagnosis_id: selectedDiagnosis.id,
            diagnosis_type: diagnosisType,
            notes: diagnosisNotes
        }]);
        
        setShowSelectionModal(false);
        setSelectedDiagnosis(null);
        setDiagnosisType('primary');
        setDiagnosisNotes('');
    };

    const handleRemoveDiagnosis = (diagnosisId: string) => {
        setDiagnoses(prev => prev.filter(d => d.diagnosis_id !== diagnosisId));
    };

    const handleUpdateDiagnosisType = (diagnosisId: string, newType: 'primary' | 'secondary' | 'differential') => {
        setDiagnoses(prev => prev.map(d =>
            d.diagnosis_id === diagnosisId ? { ...d, diagnosis_type: newType } : d
        ));
    };

    const handleAddNewDiagnosis = async () => {
        if (!newDiagnosis.diagnosis_name.trim()) {
            alert('Please enter a diagnosis name.');
            return;
        }
        
        try {
            setAddingNew(true);
            const response = await addDiagnosis({
                diagnosis_code: newDiagnosis.diagnosis_code || `DX-${Date.now()}`,
                diagnosis_name: newDiagnosis.diagnosis_name,
                category: newDiagnosis.category,
                description: newDiagnosis.description
            });
            
            if (response.status === 201) {
                // Add the new diagnosis to the list and select it
                setAvailableDiagnoses(prev => [...prev, response.diagnosis]);
                handleSelectDiagnosis(response.diagnosis);
                
                // Reset form
                setNewDiagnosis({
                    diagnosis_code: '',
                    diagnosis_name: '',
                    category: 'acute',
                    description: ''
                });
                setShowAddForm(false);
            }
        } catch (error: any) {
            console.error('Failed to add diagnosis:', error);
            alert(error.response?.data?.message || 'Failed to add diagnosis.');
        } finally {
            setAddingNew(false);
        }
    };

    const getDiagnosisName = (diagnosisId: string) => {
        const d = availableDiagnoses.find(diag => diag.id === diagnosisId);
        return d?.diagnosis_name || 'Unknown';
    };

    const getTypeColor = (type: string) => {
        const typeInfo = DIAGNOSIS_TYPES.find(t => t.id === type);
        return typeInfo?.color || 'gray';
    };

    const getCategoryColor = (category: string) => {
        const cat = CATEGORIES.find(c => c.id === category);
        return cat?.color || 'gray';
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800">Diagnosis Selection</h2>
                    <p className="text-neutral-500">
                        Select diagnoses from the master list or add new ones
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                    <Plus className="w-4 h-4" />
                    Add New Diagnosis
                </button>
            </div>

            {/* Add New Form */}
            {showAddForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-semibold text-neutral-800 mb-4">Add New Diagnosis to Master</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Diagnosis Name *
                            </label>
                            <input
                                type="text"
                                value={newDiagnosis.diagnosis_name}
                                onChange={(e) => setNewDiagnosis(prev => ({ ...prev, diagnosis_name: e.target.value }))}
                                placeholder="e.g., Chronic Fatigue Syndrome"
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Diagnosis Code
                            </label>
                            <input
                                type="text"
                                value={newDiagnosis.diagnosis_code}
                                onChange={(e) => setNewDiagnosis(prev => ({ ...prev, diagnosis_code: e.target.value }))}
                                placeholder="e.g., CFS-001"
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Category *
                            </label>
                            <select
                                value={newDiagnosis.category}
                                onChange={(e) => setNewDiagnosis(prev => ({ ...prev, category: e.target.value as any }))}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Description
                            </label>
                            <input
                                type="text"
                                value={newDiagnosis.description}
                                onChange={(e) => setNewDiagnosis(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Brief description..."
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-4">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddNewDiagnosis}
                            disabled={addingNew || !newDiagnosis.diagnosis_name.trim()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                            {addingNew ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Add & Select
                        </button>
                    </div>
                </div>
            )}

            {/* Selected Diagnoses */}
            {diagnoses.length > 0 && (
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                        <h3 className="font-semibold text-neutral-800">Selected Diagnoses ({diagnoses.length})</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {diagnoses.map((diagnosis) => (
                            <div key={diagnosis.diagnosis_id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full bg-${getTypeColor(diagnosis.diagnosis_type)}-500`} />
                                    <div>
                                        <p className="font-medium text-neutral-800">
                                            {getDiagnosisName(diagnosis.diagnosis_id)}
                                        </p>
                                        {diagnosis.notes && (
                                            <p className="text-sm text-neutral-500">{diagnosis.notes}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={diagnosis.diagnosis_type}
                                        onChange={(e) => handleUpdateDiagnosisType(diagnosis.diagnosis_id, e.target.value as any)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500
                                            ${diagnosis.diagnosis_type === 'primary' ? 'bg-blue-50 border-blue-200' : ''}
                                            ${diagnosis.diagnosis_type === 'secondary' ? 'bg-purple-50 border-purple-200' : ''}
                                            ${diagnosis.diagnosis_type === 'differential' ? 'bg-amber-50 border-amber-200' : ''}
                                        `}
                                    >
                                        {DIAGNOSIS_TYPES.map(type => (
                                            <option key={type.id} value={type.id}>{type.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleRemoveDiagnosis(diagnosis.diagnosis_id)}
                                        className="p-2 text-error-500 hover:bg-error-50 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No diagnoses warning */}
            {diagnoses.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-700">No diagnosis selected</p>
                        <p className="text-sm text-amber-600">Please select at least one diagnosis before proceeding.</p>
                    </div>
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search diagnoses..."
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                </select>
            </div>

            {/* Available Diagnoses List */}
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                    <h3 className="font-semibold text-neutral-800">Available Diagnoses</h3>
                </div>
                
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                    </div>
                ) : availableDiagnoses.length === 0 ? (
                    <div className="text-center py-12">
                        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-neutral-500">No diagnoses found</p>
                        <p className="text-sm text-neutral-400">Try a different search or add a new diagnosis</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                        {availableDiagnoses.map((diagnosis) => {
                            const isSelected = diagnoses.some(d => d.diagnosis_id === diagnosis.id);
                            return (
                                <div
                                    key={diagnosis.id}
                                    onClick={() => !isSelected && handleSelectDiagnosis(diagnosis)}
                                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                                        isSelected
                                            ? 'bg-green-50 cursor-not-allowed'
                                            : 'hover:bg-neutral-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`px-2 py-1 text-xs rounded-full bg-${getCategoryColor(diagnosis.category)}-100 text-${getCategoryColor(diagnosis.category)}-700`}>
                                            {diagnosis.category}
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutral-800">{diagnosis.diagnosis_name}</p>
                                            {diagnosis.description && (
                                                <p className="text-sm text-neutral-500">{diagnosis.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    {isSelected ? (
                                        <Check className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-neutral-400" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Selection Modal */}
            {showSelectionModal && selectedDiagnosis && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-neutral-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-neutral-800">Add Diagnosis</h3>
                                <button
                                    onClick={() => setShowSelectionModal(false)}
                                    className="p-2 hover:bg-neutral-100 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-neutral-500" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-neutral-500">Selected Diagnosis</p>
                                <p className="font-semibold text-neutral-800 text-lg">{selectedDiagnosis.diagnosis_name}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Diagnosis Type
                                </label>
                                <div className="flex gap-2">
                                    {DIAGNOSIS_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setDiagnosisType(type.id as any)}
                                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                                                diagnosisType === type.id
                                                    ? `bg-${type.color}-100 border-${type.color}-500 text-${type.color}-700`
                                                    : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                                            }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={diagnosisNotes}
                                    onChange={(e) => setDiagnosisNotes(e.target.value)}
                                    placeholder="Add any specific notes about this diagnosis..."
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px] resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-neutral-200 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowSelectionModal(false)}
                                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDiagnosis}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                            >
                                <Check className="w-4 h-4" />
                                Add Diagnosis
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiagnosisSelection;
