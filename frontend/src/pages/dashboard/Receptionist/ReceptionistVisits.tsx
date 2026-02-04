import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Search, 
    Plus, 
    X, 
    Check,
    Printer,
    Eye,
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import receptionistService, { Visit, Patient, Doctor } from '../../../services/receptionistService';

const ReceptionistVisits: React.FC = () => {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [newVisit, setNewVisit] = useState({
        patient_id: 0,
        doctor_id: 0,
        visit_type: 'opd' as 'opd' | 'follow_up' | 'walk_in' | 'emergency',
        department: '',
        reason: '',
        notes: '',
    });

    useEffect(() => {
        fetchVisits();
        fetchDoctors();
    }, [selectedDate]);

    const fetchVisits = async () => {
        setLoading(true);
        try {
            const response = await receptionistService.getVisits(selectedDate);
            setVisits(response?.data || []);
        } catch (error) {
            console.error('Error fetching visits:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const data = await receptionistService.getDoctors();
            setDoctors(data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const searchPatients = async (query: string) => {
        if (query.length < 2) {
            setPatients([]);
            return;
        }
        try {
            const results = await receptionistService.searchPatients(query);
            setPatients(results);
        } catch (error) {
            console.error('Error searching patients:', error);
        }
    };

    const handleCreateVisit = async () => {
        if (!newVisit.patient_id || !newVisit.visit_type) {
            setMessage({ type: 'error', text: 'Please fill in all required fields' });
            return;
        }

        try {
            await receptionistService.createVisit(newVisit);
            setMessage({ type: 'success', text: 'Visit recorded successfully' });
            setShowCreateModal(false);
            resetForm();
            fetchVisits();
        } catch (error: any) {
            setMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to create visit' });
        }
    };

    const handlePrintSlip = async (visitId: number) => {
        try {
            const data = await receptionistService.printVisitSlip(visitId);
            // Create a print-friendly window
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Visit Slip - ${data.visit_number}</title>
                            <style>
                                body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                                .title { font-size: 18px; font-weight: bold; }
                                .subtitle { font-size: 12px; color: #666; }
                                .info { margin: 15px 0; }
                                .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
                                .label { font-weight: bold; color: #555; }
                                .value { text-align: right; }
                                .token { font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; color: #6B46C1; }
                                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; border-top: 1px dashed #ccc; padding-top: 10px; }
                                @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <div class="title">${data.branch_name || 'Hospital'}</div>
                                <div class="subtitle">${data.branch_address || ''}</div>
                            </div>
                            <div class="token">${data.visit_number}</div>
                            <div class="info">
                                <div class="info-row">
                                    <span class="label">Patient:</span>
                                    <span class="value">${data.patient_name}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Patient ID:</span>
                                    <span class="value">${data.patient_code}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Age/Gender:</span>
                                    <span class="value">${data.patient_age || '-'} / ${data.patient_gender || '-'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Visit Type:</span>
                                    <span class="value">${data.visit_type?.toUpperCase()}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Doctor:</span>
                                    <span class="value">${data.doctor_name ? 'Dr. ' + data.doctor_name : 'Not assigned'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Date:</span>
                                    <span class="value">${new Date(data.created_at).toLocaleDateString()}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Time:</span>
                                    <span class="value">${new Date(data.created_at).toLocaleTimeString()}</span>
                                </div>
                            </div>
                            <div class="footer">
                                Please wait for your turn to be called.<br/>
                                Thank you for visiting.
                            </div>
                            <script>window.onload = function() { window.print(); }</script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to generate print slip' });
        }
    };

    const handleViewDetails = async (visitId: number) => {
        try {
            const details = await receptionistService.getVisitDetails(visitId);
            setSelectedVisit(details);
            setShowDetailModal(true);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to fetch visit details' });
        }
    };

    const resetForm = () => {
        setNewVisit({
            patient_id: 0,
            doctor_id: 0,
            visit_type: 'opd',
            department: '',
            reason: '',
            notes: '',
        });
        setSearchQuery('');
        setPatients([]);
    };

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const getVisitTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            opd: 'bg-blue-100 text-blue-700',
            follow_up: 'bg-green-100 text-green-700',
            walk_in: 'bg-yellow-100 text-yellow-700',
            emergency: 'bg-red-100 text-red-700',
        };
        return styles[type] || 'bg-gray-100 text-gray-700';
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            registered: 'bg-blue-100 text-blue-700',
            with_doctor: 'bg-purple-100 text-purple-700',
            lab: 'bg-orange-100 text-orange-700',
            pharmacy: 'bg-teal-100 text-teal-700',
            completed: 'bg-green-100 text-green-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Visit Records</h1>
                            <p className="text-sm text-gray-500">Manage OPD and visit records</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all font-medium"
                    >
                        <Plus className="w-4 h-4 inline mr-2" />
                        New Visit
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    message.type === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Date Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                            onClick={() => changeDate(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            className="px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg"
                        >
                            Today
                        </button>
                    </div>
                    <div className="text-sm text-gray-500">
                        Total: {visits.length} visits
                    </div>
                </div>
            </div>

            {/* Visits List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    </div>
                ) : visits.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No visits recorded for this date</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Visit #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Doctor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {visits.map((visit) => (
                                    <tr key={visit.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-teal-600">{visit.visit_number}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                                                    {visit.patient_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{visit.patient_name}</p>
                                                    <p className="text-xs text-gray-500">{visit.patient_code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVisitTypeBadge(visit.visit_type)}`}>
                                                {visit.visit_type.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {visit.doctor_name ? `Dr. ${visit.doctor_name}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(visit.status)}`}>
                                                {visit.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(visit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(visit.id)}
                                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handlePrintSlip(visit.id)}
                                                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"
                                                    title="Print Slip"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Visit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-800">Record New Visit</h2>
                                <button onClick={() => { setShowCreateModal(false); resetForm(); }}>
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Patient Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Patient <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            searchPatients(e.target.value);
                                        }}
                                        placeholder="Search patient..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                {patients.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {patients.map((patient) => (
                                            <div
                                                key={patient.id}
                                                onClick={() => {
                                                    setNewVisit(prev => ({ ...prev, patient_id: patient.id }));
                                                    setSearchQuery(patient.name);
                                                    setPatients([]);
                                                }}
                                                className="p-3 hover:bg-gray-50 cursor-pointer"
                                            >
                                                <p className="font-medium">{patient.name}</p>
                                                <p className="text-xs text-gray-500">{patient.patient_id}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Visit Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Visit Type <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['opd', 'follow_up', 'walk_in', 'emergency'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNewVisit(prev => ({ ...prev, visit_type: type as any }))}
                                            className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                                                newVisit.visit_type === type
                                                    ? 'bg-teal-500 text-white border-teal-500'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {type.replace('_', ' ').toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Doctor */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
                                <select
                                    value={newVisit.doctor_id}
                                    onChange={(e) => setNewVisit(prev => ({ ...prev, doctor_id: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value={0}>Select Doctor (Optional)</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            Dr. {doctor.name} {doctor.specialization && `(${doctor.specialization})`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                                <input
                                    type="text"
                                    value={newVisit.reason}
                                    onChange={(e) => setNewVisit(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Brief description..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <textarea
                                    value={newVisit.notes}
                                    onChange={(e) => setNewVisit(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={2}
                                    placeholder="Additional notes..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateVisit}
                                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700"
                            >
                                Record Visit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Detail Modal */}
            {showDetailModal && selectedVisit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-800">Visit Details</h2>
                                <button onClick={() => { setShowDetailModal(false); setSelectedVisit(null); }}>
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-center mb-6">
                                <span className="text-3xl font-bold text-teal-600">{selectedVisit.visit_number}</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Patient:</span>
                                    <span className="font-medium">{selectedVisit.patient_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Patient ID:</span>
                                    <span className="font-medium">{selectedVisit.patient_code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Visit Type:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVisitTypeBadge(selectedVisit.visit_type)}`}>
                                        {selectedVisit.visit_type.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Doctor:</span>
                                    <span className="font-medium">{selectedVisit.doctor_name ? `Dr. ${selectedVisit.doctor_name}` : 'Not assigned'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedVisit.status)}`}>
                                        {selectedVisit.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Date & Time:</span>
                                    <span className="font-medium">{new Date(selectedVisit.created_at).toLocaleString()}</span>
                                </div>
                                {selectedVisit.reason && (
                                    <div className="pt-3 border-t">
                                        <span className="text-gray-500 block mb-1">Reason:</span>
                                        <p className="text-gray-800">{selectedVisit.reason}</p>
                                    </div>
                                )}
                                {selectedVisit.notes && (
                                    <div className="pt-3 border-t">
                                        <span className="text-gray-500 block mb-1">Notes:</span>
                                        <p className="text-gray-800">{selectedVisit.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => { setShowDetailModal(false); setSelectedVisit(null); }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handlePrintSlip(selectedVisit.id);
                                    setShowDetailModal(false);
                                    setSelectedVisit(null);
                                }}
                                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                Print Slip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionistVisits;
