import React, { useState, useEffect } from 'react';
import { Activity, Heart, Thermometer, Wind, Droplets, Search, Plus, TrendingUp, Loader2, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { nurseService, VitalSign, VitalSignInput, Patient } from '../../../services/nurseService';

const NurseVitalSigns: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [stats, setStats] = useState({ totalToday: 0, abnormal: 0 });

  const [newVital, setNewVital] = useState<VitalSignInput>({
    patient_id: 0,
    temperature: undefined,
    temperature_unit: 'F',
    blood_pressure_systolic: undefined,
    blood_pressure_diastolic: undefined,
    pulse_rate: undefined,
    respiration_rate: undefined,
    oxygen_saturation: undefined,
    pain_level: undefined,
    consciousness_level: 'Alert',
    notes: ''
  });

  // Fetch vital signs
  const fetchVitalSigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await nurseService.getVitalSigns({ per_page: 50 });
      // Safety check: ensure response.data exists or response itself is the array
      const data = response?.data || response || [];
      setVitalSigns(Array.isArray(data) ? data : []);

      // Calculate stats
      const today = new Date().toDateString();
      const todayVitals = (Array.isArray(data) ? data : []).filter((v: VitalSign) =>
        new Date(v.recorded_at).toDateString() === today
      );
      setStats({
        totalToday: todayVitals.length,
        abnormal: todayVitals.filter((v: VitalSign) => v.is_abnormal).length
      });
    } catch (err: any) {
      console.error('Error fetching vital signs:', err);
      setError(err.response?.data?.message || 'Failed to load vital signs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients for dropdown
  const fetchPatients = async (search?: string) => {
    try {
      const data = await nurseService.getAllPatients(search);
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  useEffect(() => {
    fetchVitalSigns();
    fetchPatients();
  }, []);

  // Debounce patient search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientSearch) {
        fetchPatients(patientSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const handleRecordVitals = async () => {
    if (!newVital.patient_id) {
      alert('Please select a patient');
      return;
    }

    try {
      setSaving(true);
      await nurseService.recordVitalSigns(newVital);
      setShowRecordModal(false);
      setNewVital({
        patient_id: 0,
        temperature: undefined,
        temperature_unit: 'F',
        blood_pressure_systolic: undefined,
        blood_pressure_diastolic: undefined,
        pulse_rate: undefined,
        respiration_rate: undefined,
        oxygen_saturation: undefined,
        pain_level: undefined,
        consciousness_level: 'Alert',
        notes: ''
      });
      fetchVitalSigns();
    } catch (err: any) {
      console.error('Error recording vital signs:', err);
      alert(err.response?.data?.message || 'Failed to record vital signs');
    } finally {
      setSaving(false);
    }
  };

  const getVitalStatus = (type: string, value: number): string => {
    switch (type) {
      case 'temp':
        if (value < 97 || value > 99.5) return 'text-error-600 bg-error-50';
        return 'text-green-600 bg-green-50';
      case 'pulse':
        if (value < 60 || value > 100) return 'text-error-600 bg-error-50';
        return 'text-green-600 bg-green-50';
      case 'spo2':
        if (value < 95) return 'text-error-600 bg-error-50';
        return 'text-green-600 bg-green-50';
      default:
        return 'text-neutral-600 bg-neutral-50';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredVitals = vitalSigns.filter(vital =>
    (vital.patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vital.patient?.registration_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-neutral-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
          <p className="mt-4 text-neutral-600">Loading vital signs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-neutral-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Vital Signs Management</h1>
            <p className="text-teal-100">Record and monitor patient vital signs</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchVitalSigns}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <Activity className="w-16 h-16 opacity-20" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-error-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">{stats.totalToday}</span>
          </div>
          <h3 className="text-neutral-600 text-sm font-medium">Total Recorded Today</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
              <Thermometer className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">{stats.abnormal}</span>
          </div>
          <h3 className="text-neutral-600 text-sm font-medium">Abnormal Readings</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">{vitalSigns.length}</span>
          </div>
          <h3 className="text-neutral-600 text-sm font-medium">Total Records</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">{patients.length}</span>
          </div>
          <h3 className="text-neutral-600 text-sm font-medium">Available Patients</h3>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by patient name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowRecordModal(true)}
            className="bg-gradient-to-r from-primary-500 to-cyan-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Record Vitals
          </button>
        </div>
      </div>

      {/* Vital Signs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4" />
                    Temp
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Pulse
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">BP</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4" />
                    RR
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    SpO2
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVitals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                    <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No vital signs recorded yet</p>
                  </td>
                </tr>
              ) : (
                filteredVitals.map((vital) => (
                  <tr key={vital.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-neutral-900">{vital.patient?.name || 'Unknown'}</div>
                        <div className="text-sm text-neutral-500">{vital.patient?.registration_number || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{formatDateTime(vital.recorded_at)}</td>
                    <td className="px-6 py-4">
                      {vital.temperature ? (
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getVitalStatus('temp', vital.temperature)}`}>
                          {vital.temperature}°{vital.temperature_unit}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {vital.pulse_rate ? (
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getVitalStatus('pulse', vital.pulse_rate)}`}>
                          {vital.pulse_rate} bpm
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900">
                      {vital.blood_pressure_systolic && vital.blood_pressure_diastolic
                        ? `${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900">
                      {vital.respiration_rate ? `${vital.respiration_rate}/min` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {vital.oxygen_saturation ? (
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getVitalStatus('spo2', vital.oxygen_saturation)}`}>
                          {vital.oxygen_saturation}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${vital.is_abnormal ? 'bg-error-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                        {vital.is_abnormal ? 'Abnormal' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 max-w-xs truncate">
                      {vital.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Vitals Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-primary-500 to-cyan-600 p-6 text-white flex items-center justify-between">
              <h2 className="text-2xl font-bold">Record Vital Signs</h2>
              <button onClick={() => setShowRecordModal(false)} className="hover:bg-white/20 p-1 rounded">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Select Patient</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-2"
                  />
                </div>
                <select
                  value={newVital.patient_id}
                  onChange={(e) => setNewVital({ ...newVital, patient_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="0">Choose a patient...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - {patient.registration_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Thermometer className="w-4 h-4 inline mr-1" />
                    Temperature
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="98.6"
                      value={newVital.temperature || ''}
                      onChange={(e) => setNewVital({ ...newVital, temperature: parseFloat(e.target.value) || undefined })}
                      className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <select
                      value={newVital.temperature_unit}
                      onChange={(e) => setNewVital({ ...newVital, temperature_unit: e.target.value as 'C' | 'F' })}
                      className="w-20 px-2 py-2 border border-neutral-300 rounded-lg"
                    >
                      <option value="F">°F</option>
                      <option value="C">°C</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Heart className="w-4 h-4 inline mr-1" />
                    Pulse (bpm)
                  </label>
                  <input
                    type="number"
                    placeholder="78"
                    value={newVital.pulse_rate || ''}
                    onChange={(e) => setNewVital({ ...newVital, pulse_rate: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">BP Systolic</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={newVital.blood_pressure_systolic || ''}
                    onChange={(e) => setNewVital({ ...newVital, blood_pressure_systolic: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">BP Diastolic</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={newVital.blood_pressure_diastolic || ''}
                    onChange={(e) => setNewVital({ ...newVital, blood_pressure_diastolic: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Wind className="w-4 h-4 inline mr-1" />
                    Respiratory Rate
                  </label>
                  <input
                    type="number"
                    placeholder="16"
                    value={newVital.respiration_rate || ''}
                    onChange={(e) => setNewVital({ ...newVital, respiration_rate: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Droplets className="w-4 h-4 inline mr-1" />
                    SpO2 (%)
                  </label>
                  <input
                    type="number"
                    placeholder="98"
                    value={newVital.oxygen_saturation || ''}
                    onChange={(e) => setNewVital({ ...newVital, oxygen_saturation: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Pain Level (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="0"
                    value={newVital.pain_level || ''}
                    onChange={(e) => setNewVital({ ...newVital, pain_level: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Consciousness (AVPU)</label>
                  <select
                    value={newVital.consciousness_level || 'Alert'}
                    onChange={(e) => setNewVital({ ...newVital, consciousness_level: e.target.value as any })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Alert">Alert</option>
                    <option value="Verbal">Verbal</option>
                    <option value="Pain">Pain</option>
                    <option value="Unresponsive">Unresponsive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Additional observations..."
                  value={newVital.notes || ''}
                  onChange={(e) => setNewVital({ ...newVital, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 p-6 bg-neutral-50 rounded-b-xl">
              <button
                onClick={() => setShowRecordModal(false)}
                className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleRecordVitals}
                disabled={saving || !newVital.patient_id}
                className="px-6 py-2 bg-gradient-to-r from-primary-500 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Vitals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseVitalSigns;
