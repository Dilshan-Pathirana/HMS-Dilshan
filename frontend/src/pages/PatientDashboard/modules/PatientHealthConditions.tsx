import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    Heart,
    AlertTriangle,
    Activity,
    Plus,
    Edit2,
    Trash2,
    Calendar,
    User,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    Info
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface HealthCondition {
    id: string;
    name: string;
    type: 'chronic' | 'allergy' | 'other';
    diagnosed_date?: string;
    diagnosed_by?: string;
    severity?: 'mild' | 'moderate' | 'severe';
    notes?: string;
    is_active: boolean;
    self_reported: boolean;
}

const ALLERGY_OPTIONS = [
    'Penicillin', 'Aspirin', 'Ibuprofen', 'Sulfa drugs', 'Latex',
    'Peanuts', 'Tree nuts', 'Shellfish', 'Eggs', 'Milk', 'Soy', 'Wheat',
    'Bee stings', 'Dust mites', 'Pollen', 'Pet dander', 'Mold', 'Other'
];

const CHRONIC_CONDITIONS = [
    'Diabetes Type 1', 'Diabetes Type 2', 'Hypertension', 'Asthma',
    'COPD', 'Heart Disease', 'Arthritis', 'Thyroid Disorder',
    'Depression', 'Anxiety', 'Epilepsy', 'Kidney Disease', 'Other'
];

const PatientHealthConditions: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [conditions, setConditions] = useState<HealthCondition[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCondition, setEditingCondition] = useState<HealthCondition | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'chronic' | 'allergy' | 'other'>('all');

    // New condition form state
    const [newCondition, setNewCondition] = useState({
        name: '',
        type: 'chronic' as 'chronic' | 'allergy' | 'other',
        diagnosed_date: '',
        severity: 'mild' as 'mild' | 'moderate' | 'severe',
        notes: ''
    });

    useEffect(() => {
        const fetchConditions = async () => {
            try {
                const response = await api.get(`/patient/health-conditions`);
                const items = Array.isArray(response.data)
                    ? response.data
                    : (response.data?.conditions || []);
                const mapped = items.map((item: any) => ({
                    id: item.id,
                    name: item.condition_name || item.name || "",
                    type: 'other',
                    diagnosed_date: item.diagnosed_date,
                    diagnosed_by: item.diagnosed_by,
                    severity: item.severity,
                    notes: item.notes,
                    is_active: item.is_active ?? true,
                    self_reported: true,
                }));
                setConditions(mapped);
            } catch (error) {
                // Mock data for demo
                setConditions([
                    {
                        id: '1',
                        name: 'Diabetes Type 2',
                        type: 'chronic',
                        diagnosed_date: '2023-06-15',
                        diagnosed_by: 'Dr. Sarah Johnson',
                        severity: 'moderate',
                        notes: 'Controlled with medication and diet',
                        is_active: true,
                        self_reported: false
                    },
                    {
                        id: '2',
                        name: 'Hypertension',
                        type: 'chronic',
                        diagnosed_date: '2024-01-20',
                        diagnosed_by: 'Dr. Michael Chen',
                        severity: 'mild',
                        notes: 'Monitoring blood pressure regularly',
                        is_active: true,
                        self_reported: false
                    },
                    {
                        id: '3',
                        name: 'Penicillin',
                        type: 'allergy',
                        severity: 'severe',
                        notes: 'Causes hives and breathing difficulty',
                        is_active: true,
                        self_reported: true
                    },
                    {
                        id: '4',
                        name: 'Peanuts',
                        type: 'allergy',
                        severity: 'severe',
                        notes: 'Anaphylactic reaction - carry EpiPen',
                        is_active: true,
                        self_reported: false
                    },
                    {
                        id: '5',
                        name: 'Seasonal Allergies',
                        type: 'other',
                        severity: 'mild',
                        notes: 'Spring and fall, managed with antihistamines',
                        is_active: true,
                        self_reported: true
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchConditions();
        }
    }, [userId]);

    const handleAddCondition = async () => {
        if (!newCondition.name) return;

        const condition: HealthCondition = {
            id: Date.now().toString(),
            name: newCondition.name,
            type: newCondition.type,
            diagnosed_date: newCondition.diagnosed_date || undefined,
            severity: newCondition.severity,
            notes: newCondition.notes || undefined,
            is_active: true,
            self_reported: true
        };

        try {
            await api.post(`/patient/health-conditions`, {
                patient_id: userId,
                condition_name: condition.name,
                severity: condition.severity,
                diagnosed_date: condition.diagnosed_date || null,
                notes: condition.notes || null,
                is_active: true,
            });
        } catch (error) {
            // Continue with local update
        }

        setConditions([...conditions, condition]);
        setNewCondition({
            name: '',
            type: 'chronic',
            diagnosed_date: '',
            severity: 'mild',
            notes: ''
        });
        setShowAddModal(false);
    };

    const handleDeleteCondition = async (id: string) => {
        if (!confirm('Are you sure you want to remove this health condition?')) return;

        try {
            await api.delete(`/patient/health-conditions/${id}`);
        } catch (error) {
            // Continue with local update
        }

        setConditions(conditions.filter(c => c.id !== id));
    };

    const filteredConditions = conditions.filter(c =>
        activeTab === 'all' || c.type === activeTab
    );

    const chronicCount = conditions.filter(c => c.type === 'chronic' && c.is_active).length;
    const allergyCount = conditions.filter(c => c.type === 'allergy').length;
    const otherCount = conditions.filter(c => c.type === 'other').length;

    const getSeverityColor = (severity?: string) => {
        switch (severity) {
            case 'mild': return 'bg-green-100 text-green-700';
            case 'moderate': return 'bg-yellow-100 text-yellow-700';
            case 'severe': return 'bg-error-100 text-red-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'chronic': return <Heart className="w-5 h-5" />;
            case 'allergy': return <AlertTriangle className="w-5 h-5" />;
            default: return <Activity className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'chronic': return 'bg-error-100 text-error-600';
            case 'allergy': return 'bg-orange-100 text-orange-600';
            default: return 'bg-blue-100 text-primary-500';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Health Conditions</h1>
                    <p className="text-neutral-500">Manage your chronic illnesses and allergies</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Condition
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Chronic Conditions</p>
                            <p className="text-3xl font-bold text-error-600">{chronicCount}</p>
                        </div>
                        <div className="p-3 bg-error-50 rounded-xl text-error-600">
                            <Heart className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Known Allergies</p>
                            <p className="text-3xl font-bold text-orange-600">{allergyCount}</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Other Conditions</p>
                            <p className="text-3xl font-bold text-primary-500">{otherCount}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-primary-500">
                            <Activity className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'all', label: 'All Conditions', count: conditions.length },
                        { key: 'chronic', label: 'Chronic', count: chronicCount },
                        { key: 'allergy', label: 'Allergies', count: allergyCount },
                        { key: 'other', label: 'Other', count: otherCount }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                activeTab === tab.key
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                        >
                            {tab.label}
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                activeTab === tab.key ? 'bg-white/20' : 'bg-neutral-200'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Conditions List */}
            {filteredConditions.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-800 mb-2">No conditions recorded</h3>
                    <p className="text-neutral-500 mb-4">Add your health conditions to help your healthcare providers</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Condition
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredConditions.map((condition) => (
                        <div key={condition.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div
                                className="p-5 cursor-pointer hover:bg-neutral-50 transition-colors"
                                onClick={() => setExpandedId(expandedId === condition.id ? null : condition.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(condition.type)}`}>
                                            {getTypeIcon(condition.type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-neutral-800">{condition.name}</h3>
                                                {condition.self_reported && (
                                                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs rounded-full">
                                                        Self-reported
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                                                <span className="capitalize">{condition.type}</span>
                                                {condition.severity && (
                                                    <>
                                                        <span>•</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(condition.severity)}`}>
                                                            {condition.severity.charAt(0).toUpperCase() + condition.severity.slice(1)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {condition.self_reported && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCondition(condition.id);
                                                }}
                                                className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                        {expandedId === condition.id ? (
                                            <ChevronUp className="w-5 h-5 text-neutral-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-neutral-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === condition.id && (
                                <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        {condition.diagnosed_date && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-neutral-400" />
                                                <span className="text-neutral-500">Diagnosed:</span>
                                                <span className="text-neutral-700">
                                                    {new Date(condition.diagnosed_date).toLocaleDateString('en-US', {
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        {condition.diagnosed_by && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="w-4 h-4 text-neutral-400" />
                                                <span className="text-neutral-500">Diagnosed by:</span>
                                                <span className="text-neutral-700">{condition.diagnosed_by}</span>
                                            </div>
                                        )}
                                    </div>
                                    {condition.notes && (
                                        <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                                            <p className="text-sm text-neutral-600">
                                                <span className="font-medium text-neutral-700">Notes: </span>
                                                {condition.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Important Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-800">Keep Your Records Updated</h4>
                        <p className="mt-1 text-sm text-blue-700">
                            Maintaining accurate health information helps your doctors provide better care.
                            Always inform your healthcare provider about any new conditions or allergies.
                        </p>
                    </div>
                </div>
            </div>

            {/* Add Condition Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-neutral-800">Add Health Condition</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-neutral-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Condition Type *
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { key: 'chronic', label: 'Chronic', icon: Heart },
                                        { key: 'allergy', label: 'Allergy', icon: AlertTriangle },
                                        { key: 'other', label: 'Other', icon: Activity }
                                    ].map((type) => (
                                        <button
                                            key={type.key}
                                            onClick={() => setNewCondition({ ...newCondition, type: type.key as any, name: '' })}
                                            className={`p-3 rounded-xl border-2 transition-colors flex flex-col items-center gap-2 ${
                                                newCondition.type === type.key
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-neutral-200 hover:border-neutral-300'
                                            }`}
                                        >
                                            <type.icon className={`w-6 h-6 ${
                                                newCondition.type === type.key ? 'text-emerald-600' : 'text-neutral-400'
                                            }`} />
                                            <span className={`text-sm font-medium ${
                                                newCondition.type === type.key ? 'text-emerald-700' : 'text-neutral-600'
                                            }`}>{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Condition Name */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    {newCondition.type === 'allergy' ? 'Allergy *' : 'Condition Name *'}
                                </label>
                                {newCondition.type === 'allergy' ? (
                                    <select
                                        value={newCondition.name}
                                        onChange={(e) => setNewCondition({ ...newCondition, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">Select an allergy...</option>
                                        {ALLERGY_OPTIONS.map((allergy) => (
                                            <option key={allergy} value={allergy}>{allergy}</option>
                                        ))}
                                    </select>
                                ) : newCondition.type === 'chronic' ? (
                                    <select
                                        value={newCondition.name}
                                        onChange={(e) => setNewCondition({ ...newCondition, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">Select a condition...</option>
                                        {CHRONIC_CONDITIONS.map((condition) => (
                                            <option key={condition} value={condition}>{condition}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={newCondition.name}
                                        onChange={(e) => setNewCondition({ ...newCondition, name: e.target.value })}
                                        placeholder="Enter condition name..."
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                )}
                            </div>

                            {/* Severity */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Severity
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['mild', 'moderate', 'severe'].map((severity) => (
                                        <button
                                            key={severity}
                                            onClick={() => setNewCondition({ ...newCondition, severity: severity as any })}
                                            className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                                                newCondition.severity === severity
                                                    ? getSeverityColor(severity) + ' border-current'
                                                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                                            }`}
                                        >
                                            {severity.charAt(0).toUpperCase() + severity.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Diagnosed Date (for chronic conditions) */}
                            {newCondition.type === 'chronic' && (
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        Diagnosed Date (optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={newCondition.diagnosed_date}
                                        onChange={(e) => setNewCondition({ ...newCondition, diagnosed_date: e.target.value })}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Additional Notes (optional)
                                </label>
                                <textarea
                                    value={newCondition.notes}
                                    onChange={(e) => setNewCondition({ ...newCondition, notes: e.target.value })}
                                    placeholder="Any additional information about this condition..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCondition}
                                disabled={!newCondition.name}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                Add Condition
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientHealthConditions;
