import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, Calendar, User, AlertCircle, FileText, Loader2, X, Check } from 'lucide-react';
import { nurseService, ShiftHandover, HandoverInput, Nurse } from '../../../services/nurseService';

const NurseHandover: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const [newHandover, setNewHandover] = useState<HandoverInput>({
    to_nurse_id: 0,
    ward: 'General',
    from_shift: 'morning',
    to_shift: 'afternoon',
    patient_updates: [],
    pending_tasks: [],
    critical_alerts: [],
    general_notes: '',
    special_observations: ''
  });

  // Fetch handovers
  const fetchHandovers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await nurseService.getHandovers({ per_page: 20 });
      // The service already returns response.data.data, so response is the actual data
      const data = Array.isArray(response) ? response : (response?.data || []);
      setHandovers(data);

      // Count pending
      const pending = data.filter((h: ShiftHandover) => !h.is_acknowledged);
      setPendingCount(pending.length);
    } catch (err: any) {
      console.error('Error fetching handovers:', err);
      setError(err.response?.data?.message || 'Failed to load handovers');
      setHandovers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch nurses list
  const fetchNurses = async () => {
    try {
      const data = await nurseService.getNursesList();
      setNurses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching nurses:', err);
    }
  };

  // Fetch wards
  const [wards, setWards] = useState<string[]>(['General', 'ICU', 'Emergency', 'Pediatric', 'Maternity', 'Surgery']);
  const fetchWards = async () => {
    try {
      const data = await nurseService.getWards();
      setWards(data);
    } catch (err) {
      console.error('Error fetching wards:', err);
    }
  };

  useEffect(() => {
    fetchHandovers();
    fetchNurses();
    fetchWards();
  }, []);

  const handleCreateHandover = async () => {
    if (!newHandover.to_nurse_id) {
      alert('Please select a nurse to hand over to');
      return;
    }

    try {
      setSaving(true);
      await nurseService.createHandover(newHandover);
      setShowCreateModal(false);
      setNewHandover({
        to_nurse_id: 0,
        ward: 'General',
        from_shift: 'morning',
        to_shift: 'afternoon',
        patient_updates: [],
        pending_tasks: [],
        critical_alerts: [],
        general_notes: '',
        special_observations: ''
      });
      fetchHandovers();
    } catch (err: any) {
      console.error('Error creating handover:', err);
      alert(err.response?.data?.message || 'Failed to create handover');
    } finally {
      setSaving(false);
    }
  };

  const handleAcknowledge = async (handoverId: number) => {
    try {
      await nurseService.acknowledgeHandover(handoverId);
      fetchHandovers();
    } catch (err: any) {
      console.error('Error acknowledging handover:', err);
      alert(err.response?.data?.message || 'Failed to acknowledge handover');
    }
  };

  const getShiftBadge = (shift: string) => {
    switch (shift) {
      case 'morning':
        return 'bg-yellow-100 text-yellow-800';
      case 'afternoon':
        return 'bg-teal-100 text-teal-800';
      case 'night':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-neutral-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
          <p className="mt-4 text-neutral-600">Loading handovers...</p>
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
            <h1 className="text-3xl font-bold mb-2">Shift Handover</h1>
            <p className="text-teal-100">Manage shift transitions and patient handover notes</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchHandovers}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <RefreshCw className="w-16 h-16 opacity-20" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">{(handovers || []).length}</span>
          </div>
          <h3 className="text-neutral-600 text-sm font-medium">Total Handovers</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">{pendingCount}</span>
          </div>
          <h3 className="text-neutral-600 text-sm font-medium">Pending Acknowledgement</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <Check className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">
              {(handovers || []).filter(h => h.is_acknowledged).length}
            </span>
          </div>
          <h3 className="text-neutral-600 text-sm font-medium">Acknowledged</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">{(nurses || []).length}</span>
          </div>
          <h3 className="text-neutral-600 text-sm font-medium">Available Nurses</h3>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-primary-500 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Handover
        </button>
      </div>

      {/* Handover Notes List */}
      <div className="space-y-6">
        {(handovers || []).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-neutral-500 text-lg">No handover notes yet</p>
            <p className="text-neutral-400 text-sm mt-2">Create your first handover note to get started</p>
          </div>
        ) : (
          (handovers || []).map((handover) => (
            <div key={handover.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getShiftBadge(handover.from_shift)}`}>
                      {handover.from_shift.charAt(0).toUpperCase() + handover.from_shift.slice(1)} → {handover.to_shift.charAt(0).toUpperCase() + handover.to_shift.slice(1)}
                    </span>
                    <div className="text-neutral-700">
                      <div className="font-medium">{formatDate(handover.handover_date)}</div>
                      <div className="text-sm text-neutral-500">Ward: {handover.ward}</div>
                    </div>
                    {!handover.is_acknowledged && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        Pending Acknowledgement
                      </span>
                    )}
                    {handover.is_acknowledged && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Acknowledged
                      </span>
                    )}
                  </div>
                  {!handover.is_acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(handover.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Acknowledge
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">From: </span>
                    <span className="font-medium text-neutral-900">{handover.fromNurse?.name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">To: </span>
                    <span className="font-medium text-neutral-900">{handover.toNurse?.name || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* General Notes */}
                {handover.general_notes && (
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary-500" />
                      General Notes
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4 text-sm text-neutral-700">
                      {handover.general_notes}
                    </div>
                  </div>
                )}

                {/* Special Observations */}
                {handover.special_observations && (
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-2">Special Observations</h3>
                    <div className="bg-purple-50 rounded-lg p-4 text-sm text-neutral-700">
                      {handover.special_observations}
                    </div>
                  </div>
                )}

                {/* Patient Updates */}
                {handover.patient_updates && handover.patient_updates.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary-500" />
                      Patient Updates ({handover.patient_updates.length})
                    </h3>
                    <div className="space-y-2">
                      {handover.patient_updates.map((update, idx) => (
                        <div key={idx} className="bg-neutral-50 rounded-lg p-3 text-sm">
                          <span className="font-medium">{update.patient_name}:</span> {update.update}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical Alerts */}
                {handover.critical_alerts && handover.critical_alerts.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-error-600" />
                      Critical Alerts
                    </h3>
                    <div className="space-y-2">
                      {handover.critical_alerts.map((alert, idx) => (
                        <div key={idx} className="bg-error-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{alert.patient_name}: {alert.alert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Tasks */}
                {handover.pending_tasks && handover.pending_tasks.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-2">Pending Tasks</h3>
                    <div className="space-y-2">
                      {handover.pending_tasks.map((task, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-neutral-700">
                          <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 ${task.priority === 'high' ? 'border-red-400' :
                            task.priority === 'medium' ? 'border-yellow-400' : 'border-neutral-300'
                            }`}></div>
                          <span>{task.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Handover Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-primary-500 to-cyan-600 p-6 text-white flex items-center justify-between">
              <h2 className="text-2xl font-bold">Create Shift Handover</h2>
              <button onClick={() => setShowCreateModal(false)} className="hover:bg-white/20 p-1 rounded">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Ward</label>
                  <select
                    value={newHandover.ward}
                    onChange={(e) => setNewHandover({ ...newHandover, ward: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {(wards || []).map((ward) => (
                      <option key={ward} value={ward}>{ward}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Handover To</label>
                  <select
                    value={newHandover.to_nurse_id}
                    onChange={(e) => setNewHandover({ ...newHandover, to_nurse_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="0">Select nurse...</option>
                    {(nurses || []).map((nurse) => (
                      <option key={nurse.id} value={nurse.id}>{nurse.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">From Shift</label>
                  <select
                    value={newHandover.from_shift}
                    onChange={(e) => setNewHandover({ ...newHandover, from_shift: e.target.value as any })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="morning">Morning Shift</option>
                    <option value="afternoon">Afternoon Shift</option>
                    <option value="night">Night Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">To Shift</label>
                  <select
                    value={newHandover.to_shift}
                    onChange={(e) => setNewHandover({ ...newHandover, to_shift: e.target.value as any })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="morning">Morning Shift</option>
                    <option value="afternoon">Afternoon Shift</option>
                    <option value="night">Night Shift</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">General Notes</label>
                <textarea
                  rows={4}
                  placeholder="General shift notes and observations..."
                  value={newHandover.general_notes}
                  onChange={(e) => setNewHandover({ ...newHandover, general_notes: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Special Observations</label>
                <textarea
                  rows={3}
                  placeholder="Any special observations or concerns..."
                  value={newHandover.special_observations}
                  onChange={(e) => setNewHandover({ ...newHandover, special_observations: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>Note:</strong> Patient-specific updates, critical alerts, and pending tasks can be added as JSON arrays for more detailed handovers.
              </div>
            </div>

            <div className="flex justify-end gap-4 p-6 bg-neutral-50 rounded-b-xl">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHandover}
                disabled={saving || !newHandover.to_nurse_id}
                className="px-6 py-2 bg-gradient-to-r from-primary-500 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Handover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseHandover;
