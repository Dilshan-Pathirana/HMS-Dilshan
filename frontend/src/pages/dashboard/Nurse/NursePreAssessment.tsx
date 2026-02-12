import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Clock,
    Loader2,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Thermometer,
    Heart,
    Activity,
    Scale,
    Save,
    X
} from 'lucide-react';
import api from '../../../utils/api/axios';

interface QueueItem {
    id: string;
    patient_id: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    patient_name: string;
    vitals_recorded: boolean;
    nurse_assessment_status: string | null;
}

interface PreAssessmentForm {
    temperature: string;
    blood_pressure_systolic: string;
    blood_pressure_diastolic: string;
    pulse_rate: string;
    respiratory_rate: string;
    oxygen_saturation: string;
    weight: string;
    height: string;
    blood_sugar: string;
    chief_complaint: string;
    allergies: string;
    chronic_diseases: string;
    sleep_quality: string;
    appetite: string;
    lifestyle_notes: string;
    notes: string;
}

const emptyForm: PreAssessmentForm = {
    temperature: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    pulse_rate: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    weight: '',
    height: '',
    blood_sugar: '',
    chief_complaint: '',
    allergies: '',
    chronic_diseases: '',
    sleep_quality: '',
    appetite: '',
    lifestyle_notes: '',
    notes: '',
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
};

const NursePreAssessment: React.FC = () => {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<QueueItem | null>(null);
    const [form, setForm] = useState<PreAssessmentForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchQueue = useCallback(async () => {
        try {
            setError(null);
            const response = await api.get('/nurse/todays-queue', getAuthHeaders());
            const payload = (response as any)?.data ? (response as any).data : response;
            setQueue(payload.queue || []);
        } catch (err: any) {
            setError('Failed to load today\'s queue');
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    // Auto-refresh every 30s
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshing(true);
            fetchQueue();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchQueue]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchQueue();
    };

    const handleSelectAppointment = async (appt: QueueItem) => {
        setSelectedAppointment(appt);
        setForm(emptyForm);
        setSuccess(null);

        // Check if pre-assessment already exists
        if (appt.vitals_recorded) {
            try {
                const resp = await api.get(`/nurse/pre-assessment/${appt.id}`, getAuthHeaders());
                const payload = (resp as any)?.data ? (resp as any).data : resp;
                if (payload.vitals) {
                    const v = payload.vitals;
                    setForm({
                        temperature: v.temperature?.toString() || '',
                        blood_pressure_systolic: v.blood_pressure_systolic?.toString() || '',
                        blood_pressure_diastolic: v.blood_pressure_diastolic?.toString() || '',
                        pulse_rate: v.pulse_rate?.toString() || '',
                        respiratory_rate: v.respiratory_rate?.toString() || '',
                        oxygen_saturation: v.oxygen_saturation?.toString() || '',
                        weight: v.weight?.toString() || '',
                        height: v.height?.toString() || '',
                        blood_sugar: v.blood_sugar?.toString() || '',
                        chief_complaint: v.chief_complaint || '',
                        allergies: v.allergies || '',
                        chronic_diseases: v.chronic_diseases || '',
                        sleep_quality: v.sleep_quality?.toString() || '',
                        appetite: v.appetite || '',
                        lifestyle_notes: v.lifestyle_notes || '',
                        notes: v.notes || '',
                    });
                }
            } catch { /* ignore */ }
        }
    };

    const handleSubmit = async () => {
        if (!selectedAppointment) return;

        try {
            setSaving(true);
            setError(null);

            const payload: any = {};
            if (form.temperature) payload.temperature = parseFloat(form.temperature);
            if (form.blood_pressure_systolic) payload.blood_pressure_systolic = parseInt(form.blood_pressure_systolic);
            if (form.blood_pressure_diastolic) payload.blood_pressure_diastolic = parseInt(form.blood_pressure_diastolic);
            if (form.pulse_rate) payload.pulse_rate = parseInt(form.pulse_rate);
            if (form.respiratory_rate) payload.respiratory_rate = parseInt(form.respiratory_rate);
            if (form.oxygen_saturation) payload.oxygen_saturation = parseFloat(form.oxygen_saturation);
            if (form.weight) payload.weight = parseFloat(form.weight);
            if (form.height) payload.height = parseFloat(form.height);
            if (form.blood_sugar) payload.blood_sugar = parseFloat(form.blood_sugar);
            if (form.chief_complaint) payload.chief_complaint = form.chief_complaint;
            if (form.allergies) payload.allergies = form.allergies;
            if (form.chronic_diseases) payload.chronic_diseases = form.chronic_diseases;
            if (form.sleep_quality) payload.sleep_quality = parseInt(form.sleep_quality);
            if (form.appetite) payload.appetite = form.appetite;
            if (form.lifestyle_notes) payload.lifestyle_notes = form.lifestyle_notes;
            if (form.notes) payload.notes = form.notes;

            await api.post(`/nurse/pre-assessment/${selectedAppointment.id}`, payload, getAuthHeaders());
            
            setSuccess('Pre-assessment saved successfully!');
            setSelectedAppointment(null);
            fetchQueue();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save pre-assessment');
        } finally {
            setSaving(false);
        }
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    const assessed = queue.filter(q => q.vitals_recorded);
    const pending = queue.filter(q => !q.vitals_recorded);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Pre-Assessment Queue</h1>
                    <p className="text-neutral-500">Today's patients awaiting nurse assessment</p>
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

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{queue.length}</p>
                            <p className="text-sm text-neutral-500">Total Patients</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pending.length}</p>
                            <p className="text-sm text-neutral-500">Pending Assessment</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{assessed.length}</p>
                            <p className="text-sm text-neutral-500">Assessed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success/Error */}
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-700">{success}</p>
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Queue */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-4 border-b border-neutral-200">
                        <h2 className="font-semibold text-lg text-neutral-800">Today's Queue</h2>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {queue.length === 0 ? (
                            <div className="p-12 text-center">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-neutral-500">No patients in today's queue</p>
                            </div>
                        ) : (
                            queue.map(appt => (
                                <div
                                    key={appt.id}
                                    onClick={() => !appt.vitals_recorded && handleSelectAppointment(appt)}
                                    className={`p-4 flex items-center justify-between transition-colors ${
                                        appt.vitals_recorded
                                            ? 'bg-green-50/50 cursor-default'
                                            : selectedAppointment?.id === appt.id
                                            ? 'bg-blue-50 cursor-pointer'
                                            : 'hover:bg-neutral-50 cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                            appt.vitals_recorded
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {appt.vitals_recorded ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutral-800">{appt.patient_name}</p>
                                            <p className="text-sm text-neutral-500">{formatTime(appt.appointment_time)}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        appt.vitals_recorded
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {appt.vitals_recorded ? 'Assessed' : 'Pending'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Assessment Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    {selectedAppointment ? (
                        <>
                            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-lg text-neutral-800">
                                        Pre-Assessment: {selectedAppointment.patient_name}
                                    </h2>
                                    <p className="text-sm text-neutral-500">
                                        Appointment at {formatTime(selectedAppointment.appointment_time)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedAppointment(null)}
                                    className="p-2 hover:bg-neutral-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4 space-y-6 max-h-[550px] overflow-y-auto">
                                {/* Vital Signs */}
                                <div>
                                    <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-500" />
                                        Vital Signs
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Temperature (°F)</label>
                                            <input type="number" step="0.1" value={form.temperature} onChange={e => setForm(f => ({...f, temperature: e.target.value}))}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-neutral-500 mb-1 block">BP Systolic</label>
                                                <input type="number" value={form.blood_pressure_systolic} onChange={e => setForm(f => ({...f, blood_pressure_systolic: e.target.value}))}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-neutral-500 mb-1 block">BP Diastolic</label>
                                                <input type="number" value={form.blood_pressure_diastolic} onChange={e => setForm(f => ({...f, blood_pressure_diastolic: e.target.value}))}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Pulse Rate (bpm)</label>
                                            <input type="number" value={form.pulse_rate} onChange={e => setForm(f => ({...f, pulse_rate: e.target.value}))}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Respiratory Rate</label>
                                            <input type="number" value={form.respiratory_rate} onChange={e => setForm(f => ({...f, respiratory_rate: e.target.value}))}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">SpO2 (%)</label>
                                            <input type="number" step="0.1" value={form.oxygen_saturation} onChange={e => setForm(f => ({...f, oxygen_saturation: e.target.value}))}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Blood Sugar (mg/dL)</label>
                                            <input type="number" step="0.1" value={form.blood_sugar} onChange={e => setForm(f => ({...f, blood_sugar: e.target.value}))}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Body Measurements */}
                                <div>
                                    <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                                        <Scale className="w-4 h-4 text-blue-500" />
                                        Body Measurements
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Weight (kg)</label>
                                            <input type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({...f, weight: e.target.value}))}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Height (cm)</label>
                                            <input type="number" step="0.1" value={form.height} onChange={e => setForm(f => ({...f, height: e.target.value}))}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Patient History */}
                                <div>
                                    <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-green-500" />
                                        Patient Assessment
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Chief Complaint</label>
                                            <textarea value={form.chief_complaint} onChange={e => setForm(f => ({...f, chief_complaint: e.target.value}))}
                                                placeholder="Why is the patient visiting today?"
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px] resize-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Known Allergies</label>
                                            <input type="text" value={form.allergies} onChange={e => setForm(f => ({...f, allergies: e.target.value}))}
                                                placeholder="List any known allergies..."
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Chronic Diseases</label>
                                            <input type="text" value={form.chronic_diseases} onChange={e => setForm(f => ({...f, chronic_diseases: e.target.value}))}
                                                placeholder="Diabetes, Hypertension, etc."
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-neutral-500 mb-1 block">Sleep Quality (1-10)</label>
                                                <input type="number" min="1" max="10" value={form.sleep_quality} onChange={e => setForm(f => ({...f, sleep_quality: e.target.value}))}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-neutral-500 mb-1 block">Appetite</label>
                                                <select value={form.appetite} onChange={e => setForm(f => ({...f, appetite: e.target.value}))}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                                    <option value="">Select...</option>
                                                    <option value="poor">Poor</option>
                                                    <option value="normal">Normal</option>
                                                    <option value="excess">Excess</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Lifestyle Notes</label>
                                            <textarea value={form.lifestyle_notes} onChange={e => setForm(f => ({...f, lifestyle_notes: e.target.value}))}
                                                placeholder="Exercise, diet, smoking, alcohol..."
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[60px] resize-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Additional Notes</label>
                                            <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                                                placeholder="Any additional observations..."
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[60px] resize-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                                    <button
                                        onClick={() => setSelectedAppointment(null)}
                                        className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        Save Assessment
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                            <div className="text-center">
                                <Thermometer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-neutral-500">Select a patient from the queue to begin assessment</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NursePreAssessment;
