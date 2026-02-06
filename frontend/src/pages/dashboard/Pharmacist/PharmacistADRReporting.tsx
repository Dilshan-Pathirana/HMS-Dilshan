import React, { useState } from 'react';
import {
    AlertOctagon, Plus, Search, FileText, Calendar,
    User, Pill, Save, Send, AlertTriangle, CheckCircle,
    Clock, Eye, Filter
} from 'lucide-react';

interface ADRReport {
    id: string;
    report_number: string;
    patient_id: string;
    patient_name: string;
    drug_name: string;
    batch_number: string;
    reaction_type: string;
    reaction_description: string;
    severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
    onset_date: string;
    reported_date: string;
    status: 'draft' | 'submitted' | 'under_review' | 'closed';
    reporter: string;
    outcome: string;
}

interface MedicationError {
    id: string;
    error_number: string;
    error_type: string;
    drug_involved: string;
    description: string;
    contributing_factors: string;
    severity: 'no_harm' | 'minor' | 'moderate' | 'severe';
    detected_by: string;
    date: string;
    corrective_action: string;
    status: 'open' | 'resolved';
}

export const PharmacistADRReporting: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'adr' | 'medication_errors' | 'new_adr'>('adr');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('all');

    const [adrReports] = useState<ADRReport[]>([
        {
            id: '1',
            report_number: 'ADR-2025-001',
            patient_id: 'PAT-001',
            patient_name: 'John Perera',
            drug_name: 'Amoxicillin 500mg',
            batch_number: 'AMX-2025-A01',
            reaction_type: 'Allergic Reaction',
            reaction_description: 'Skin rash and mild urticaria developed 2 hours after administration',
            severity: 'moderate',
            onset_date: '2025-12-17',
            reported_date: '2025-12-17',
            status: 'under_review',
            reporter: 'Pharmacist N. Silva',
            outcome: 'Recovering'
        },
        {
            id: '2',
            report_number: 'ADR-2025-002',
            patient_id: 'PAT-015',
            patient_name: 'Mary Fernando',
            drug_name: 'Ibuprofen 400mg',
            batch_number: 'IBU-2025-B03',
            reaction_type: 'GI Disturbance',
            reaction_description: 'Severe gastric pain and nausea after first dose',
            severity: 'mild',
            onset_date: '2025-12-16',
            reported_date: '2025-12-16',
            status: 'closed',
            reporter: 'Pharmacist K. Jayawardena',
            outcome: 'Recovered'
        }
    ]);

    const [medicationErrors] = useState<MedicationError[]>([
        {
            id: '1',
            error_number: 'ME-2025-001',
            error_type: 'Wrong Dose',
            drug_involved: 'Metformin 500mg',
            description: 'Double dose nearly dispensed due to unclear prescription',
            contributing_factors: 'Illegible handwriting on prescription',
            severity: 'no_harm',
            detected_by: 'Pharmacist during verification',
            date: '2025-12-17',
            corrective_action: 'Contacted prescriber for clarification. Correct dose dispensed.',
            status: 'resolved'
        },
        {
            id: '2',
            error_number: 'ME-2025-002',
            error_type: 'Drug-Drug Interaction',
            drug_involved: 'Warfarin 5mg + Aspirin 100mg',
            description: 'Potential interaction not flagged by prescriber',
            contributing_factors: 'New prescription from different department',
            severity: 'minor',
            detected_by: 'Pharmacy dispensing system alert',
            date: '2025-12-16',
            corrective_action: 'Prescriber notified. Therapy adjusted.',
            status: 'resolved'
        }
    ]);

    const [newADR, setNewADR] = useState({
        patient_id: '',
        patient_name: '',
        drug_name: '',
        batch_number: '',
        reaction_type: '',
        reaction_description: '',
        severity: 'mild',
        onset_date: '',
        outcome: ''
    });

    const getSeverityBadge = (severity: string) => {
        const styles: Record<string, string> = {
            'mild': 'bg-green-100 text-green-800',
            'no_harm': 'bg-green-100 text-green-800',
            'moderate': 'bg-yellow-100 text-yellow-800',
            'minor': 'bg-yellow-100 text-yellow-800',
            'severe': 'bg-error-100 text-red-800',
            'life-threatening': 'bg-red-600 text-white'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[severity] || 'bg-neutral-100 text-neutral-800'}`}>
                {severity.replace('_', ' ').replace('-', ' ').toUpperCase()}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'draft': 'bg-neutral-100 text-neutral-800',
            'submitted': 'bg-blue-100 text-blue-800',
            'under_review': 'bg-yellow-100 text-yellow-800',
            'closed': 'bg-green-100 text-green-800',
            'open': 'bg-yellow-100 text-yellow-800',
            'resolved': 'bg-green-100 text-green-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-neutral-100 text-neutral-800'}`}>
                {status.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    const handleSubmitADR = () => {
        alert('ADR Report submitted successfully!');
        setActiveTab('adr');
    };

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-neutral-50">
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                            <AlertOctagon className="w-7 h-7 text-error-600" />
                            ADR & Medication Error Reporting
                        </h1>
                        <p className="text-neutral-600">Report adverse drug reactions and medication errors</p>
                    </div>
                    <button
                        onClick={() => setActiveTab('new_adr')}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700"
                    >
                        <Plus className="w-4 h-4" />
                        New ADR Report
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-error-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Total ADR Reports</p>
                                <p className="text-2xl font-bold text-neutral-900">{adrReports.length}</p>
                            </div>
                            <AlertOctagon className="w-10 h-10 text-error-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Under Review</p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {adrReports.filter(r => r.status === 'under_review').length}
                                </p>
                            </div>
                            <Clock className="w-10 h-10 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Medication Errors</p>
                                <p className="text-2xl font-bold text-neutral-900">{medicationErrors.length}</p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-orange-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Resolved</p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {medicationErrors.filter(e => e.status === 'resolved').length}
                                </p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('adr')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'adr' 
                                    ? 'text-error-600 border-b-2 border-error-600' 
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            ADR Reports
                        </button>
                        <button
                            onClick={() => setActiveTab('medication_errors')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'medication_errors' 
                                    ? 'text-error-600 border-b-2 border-error-600' 
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            Medication Errors
                        </button>
                        <button
                            onClick={() => setActiveTab('new_adr')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'new_adr' 
                                    ? 'text-error-600 border-b-2 border-error-600' 
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            <Plus className="w-4 h-4 inline mr-1" />
                            New Report
                        </button>
                    </div>

                    {/* ADR Reports Tab */}
                    {activeTab === 'adr' && (
                        <div className="p-4">
                            {/* Filters */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by patient, drug, or report number..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg"
                                    />
                                </div>
                                <select
                                    value={filterSeverity}
                                    onChange={(e) => setFilterSeverity(e.target.value)}
                                    className="px-3 py-2 border border-neutral-300 rounded-lg"
                                >
                                    <option value="all">All Severity</option>
                                    <option value="mild">Mild</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="severe">Severe</option>
                                    <option value="life-threatening">Life-Threatening</option>
                                </select>
                            </div>

                            {/* ADR Reports List */}
                            <div className="space-y-4">
                                {adrReports.map((report) => (
                                    <div key={report.id} className="border rounded-lg p-4 hover:bg-neutral-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-semibold text-neutral-900">{report.report_number}</span>
                                                    {getSeverityBadge(report.severity)}
                                                    {getStatusBadge(report.status)}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-neutral-500">Patient:</span>
                                                        <span className="ml-2 text-neutral-900">{report.patient_name} ({report.patient_id})</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-neutral-500">Drug:</span>
                                                        <span className="ml-2 text-neutral-900">{report.drug_name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-neutral-500">Reaction:</span>
                                                        <span className="ml-2 text-neutral-900">{report.reaction_type}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-neutral-500">Onset Date:</span>
                                                        <span className="ml-2 text-neutral-900">{report.onset_date}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-neutral-600 mt-2">{report.reaction_description}</p>
                                            </div>
                                            <button className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-blue-50 rounded">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Medication Errors Tab */}
                    {activeTab === 'medication_errors' && (
                        <div className="p-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search medication errors..."
                                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg"
                                    />
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                                    <Plus className="w-4 h-4" />
                                    Report Error
                                </button>
                            </div>

                            <div className="space-y-4">
                                {medicationErrors.map((error) => (
                                    <div key={error.id} className="border rounded-lg p-4 hover:bg-neutral-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-semibold text-neutral-900">{error.error_number}</span>
                                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                                        {error.error_type}
                                                    </span>
                                                    {getSeverityBadge(error.severity)}
                                                    {getStatusBadge(error.status)}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-neutral-500">Drug Involved:</span>
                                                        <span className="ml-2 text-neutral-900">{error.drug_involved}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-neutral-500">Detected By:</span>
                                                        <span className="ml-2 text-neutral-900">{error.detected_by}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-neutral-600 mt-2">{error.description}</p>
                                                <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                                                    <span className="font-medium text-green-800">Corrective Action:</span>
                                                    <span className="text-green-700 ml-2">{error.corrective_action}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New ADR Report Tab */}
                    {activeTab === 'new_adr' && (
                        <div className="p-6">
                            <div className="max-w-3xl mx-auto">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-yellow-800">Important Notice</h4>
                                        <p className="text-sm text-yellow-700">
                                            This form is for reporting suspected adverse drug reactions. All reports are confidential and will be reviewed by the pharmacy quality team.
                                        </p>
                                    </div>
                                </div>

                                <form className="space-y-6">
                                    {/* Patient Information */}
                                    <div className="border-b pb-6">
                                        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                                            <User className="w-5 h-5 text-neutral-600" />
                                            Patient Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Patient ID*</label>
                                                <input
                                                    type="text"
                                                    value={newADR.patient_id}
                                                    onChange={(e) => setNewADR(prev => ({ ...prev, patient_id: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                    placeholder="Enter patient ID"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Patient Name*</label>
                                                <input
                                                    type="text"
                                                    value={newADR.patient_name}
                                                    onChange={(e) => setNewADR(prev => ({ ...prev, patient_name: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                    placeholder="Enter patient name"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Drug Information */}
                                    <div className="border-b pb-6">
                                        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                                            <Pill className="w-5 h-5 text-neutral-600" />
                                            Drug Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Drug Name*</label>
                                                <input
                                                    type="text"
                                                    value={newADR.drug_name}
                                                    onChange={(e) => setNewADR(prev => ({ ...prev, drug_name: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                    placeholder="Enter drug name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Batch Number</label>
                                                <input
                                                    type="text"
                                                    value={newADR.batch_number}
                                                    onChange={(e) => setNewADR(prev => ({ ...prev, batch_number: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                    placeholder="Enter batch number"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reaction Details */}
                                    <div className="border-b pb-6">
                                        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                                            <AlertOctagon className="w-5 h-5 text-neutral-600" />
                                            Reaction Details
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Reaction Type*</label>
                                                    <select
                                                        value={newADR.reaction_type}
                                                        onChange={(e) => setNewADR(prev => ({ ...prev, reaction_type: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                    >
                                                        <option value="">Select type</option>
                                                        <option value="allergic">Allergic Reaction</option>
                                                        <option value="gi">GI Disturbance</option>
                                                        <option value="skin">Skin Reaction</option>
                                                        <option value="respiratory">Respiratory</option>
                                                        <option value="cardiovascular">Cardiovascular</option>
                                                        <option value="neurological">Neurological</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Severity*</label>
                                                    <select
                                                        value={newADR.severity}
                                                        onChange={(e) => setNewADR(prev => ({ ...prev, severity: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                    >
                                                        <option value="mild">Mild</option>
                                                        <option value="moderate">Moderate</option>
                                                        <option value="severe">Severe</option>
                                                        <option value="life-threatening">Life-Threatening</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Onset Date*</label>
                                                    <input
                                                        type="date"
                                                        value={newADR.onset_date}
                                                        onChange={(e) => setNewADR(prev => ({ ...prev, onset_date: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Outcome</label>
                                                    <select
                                                        value={newADR.outcome}
                                                        onChange={(e) => setNewADR(prev => ({ ...prev, outcome: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                    >
                                                        <option value="">Select outcome</option>
                                                        <option value="recovered">Recovered</option>
                                                        <option value="recovering">Recovering</option>
                                                        <option value="not_recovered">Not Recovered</option>
                                                        <option value="ongoing">Reaction Ongoing</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Description of Reaction*</label>
                                                <textarea
                                                    value={newADR.reaction_description}
                                                    onChange={(e) => setNewADR(prev => ({ ...prev, reaction_description: e.target.value }))}
                                                    rows={4}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                    placeholder="Describe the adverse reaction in detail..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-4">
                                        <button
                                            type="button"
                                            className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save as Draft
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmitADR}
                                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            Submit Report
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PharmacistADRReporting;
