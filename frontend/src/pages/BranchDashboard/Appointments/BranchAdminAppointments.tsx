import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaCog,
  FaChartBar,
  FaFilter,
  FaEdit,
  FaTimes,
  FaHistory,
  FaSync,
  FaSave,
  FaUserMd,
} from 'react-icons/fa';
import {
  appointmentBranchAdminApi,
  AppointmentBooking,
  AppointmentSettings,
  AppointmentLog,
  AppointmentStatistics,
  Doctor,
} from '../../../services/appointmentService';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminMenuItems } from '../../../config/branchAdminNavigation';

const BranchAdminAppointments: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'appointments' | 'stats' | 'settings'>('appointments');
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [statistics, setStatistics] = useState<AppointmentStatistics | null>(null);
  const [settings, setSettings] = useState<AppointmentSettings | null>(null);
  const [logs, setLogs] = useState<AppointmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User info state
  const [userName, setUserName] = useState('Branch Admin');
  const [profileImage, setProfileImage] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchLogo, setBranchLogo] = useState('');
  const [userGender, setUserGender] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    doctor_id: '',
    status: 'all',
    start_date: '',
    end_date: '',
  });

  // Modal state
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentBooking | null>(null);
  const [modifyForm, setModifyForm] = useState({
    doctor_id: '',
    appointment_date: '',
    slot_number: 0,
    status: '',
    notes: '',
    reason: '',
  });

  // Load user info
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
    setProfileImage(userInfo.profile_picture || '');
    setBranchName(userInfo.branch_name || userInfo.branch?.name || 'Branch');
    setBranchLogo(userInfo.branch_logo || userInfo.branch?.logo || '');
    setUserGender(userInfo.gender || '');
  }, []);

  // Sidebar Menu Component
  const SidebarMenu = () => (
    <nav className="py-4">
      <div className="px-4 mb-4">
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Navigation</h2>
      </div>
      <ul className="space-y-1 px-2">
        {BranchAdminMenuItems.map((item, index) => (
          <li key={index}>
            <button
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                item.path === '/branch-admin/appointments'
                  ? 'bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700'
                  : 'text-neutral-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1 font-medium text-left">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  // Load appointments
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filters.date) params.date = filters.date;
      if (filters.doctor_id) params.doctor_id = filters.doctor_id;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.start_date && filters.end_date) {
        params.start_date = filters.start_date;
        params.end_date = filters.end_date;
      }

      const response = await appointmentBranchAdminApi.getAppointments(params);
      
      if (response.status === 200) {
        setAppointments(response.appointments);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load doctors
  const loadDoctors = useCallback(async () => {
    try {
      const response = await appointmentBranchAdminApi.getDoctors();
      if (response.status === 200) {
        setDoctors(response.doctors);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  }, []);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentBranchAdminApi.getStatistics();
      if (response.status === 200) {
        setStatistics(response.statistics);
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentBranchAdminApi.getSettings();
      if (response.status === 200) {
        setSettings(response.settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load appointment logs
  const loadLogs = async (bookingId: string) => {
    try {
      const response = await appointmentBranchAdminApi.getAppointmentLogs(bookingId);
      if (response.status === 200) {
        setLogs(response.logs);
        setShowLogsModal(true);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
      setError('Failed to load appointment logs');
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    if (activeTab === 'appointments') {
      loadAppointments();
    } else if (activeTab === 'stats') {
      loadStatistics();
    } else if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab, loadAppointments, loadStatistics, loadSettings]);

  // Modify appointment
  const handleModify = async () => {
    if (!selectedAppointment || !modifyForm.reason) {
      setError('Please provide a reason for modification');
      return;
    }

    try {
      setActionLoading('modify');
      const response = await appointmentBranchAdminApi.modifyAppointment(selectedAppointment.id, modifyForm);
      
      if (response.status === 200) {
        setSuccess('Appointment modified successfully');
        setShowModifyModal(false);
        loadAppointments();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to modify appointment');
    } finally {
      setActionLoading(null);
    }
  };

  // Cancel appointment
  const handleCancel = async (bookingId: string) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      setActionLoading(bookingId);
      const response = await appointmentBranchAdminApi.cancelAppointment(bookingId, reason);
      
      if (response.status === 200) {
        setSuccess('Appointment cancelled successfully');
        loadAppointments();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(null);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setActionLoading('settings');
      const response = await appointmentBranchAdminApi.updateSettings(settings);
      
      if (response.status === 200) {
        setSuccess('Settings saved successfully');
        setSettings(response.settings);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'checked_in': return 'bg-yellow-100 text-yellow-800';
      case 'in_session': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-error-100 text-red-800';
      case 'no_show': return 'bg-orange-100 text-orange-800';
      case 'pending_payment': return 'bg-amber-100 text-amber-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusLabel = (status: string) => status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <DashboardLayout 
      userName={userName} 
      userRole="Branch Admin" 
      profileImage={profileImage}
      sidebarContent={<SidebarMenu />}
      branchName={branchName}
      branchLogo={branchLogo}
      userGender={userGender}
    >
    <div className="p-6 bg-neutral-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Appointment Management</h1>
        <p className="text-neutral-600">Manage appointments, settings, and view statistics</p>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><FaTimes /></button>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-error-50 border border-red-200 rounded-lg text-red-700 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><FaTimes /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'appointments' ? 'bg-indigo-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
          onClick={() => setActiveTab('appointments')}
        >
          <FaCalendarAlt className="inline mr-2" />
          Appointments
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'stats' ? 'bg-indigo-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          <FaChartBar className="inline mr-2" />
          Statistics
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          <FaCog className="inline mr-2" />
          Settings
        </button>
      </div>

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b flex flex-wrap gap-3 items-center">
            <FaFilter className="text-neutral-400" />
            <input
              type="date"
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
            />
            <select
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm"
              value={filters.doctor_id}
              onChange={(e) => setFilters(prev => ({ ...prev, doctor_id: e.target.value }))}
            >
              <option value="">All Doctors</option>
              {doctors.map(doc => (
                <option key={doc.doctor_id} value={doc.doctor_id}>{doc.name}</option>
              ))}
            </select>
            <select
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
            <button
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm"
              onClick={loadAppointments}
            >
              <FaSync className={`inline mr-1 ${loading ? 'animate-spin' : ''}`} />
              Apply
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No appointments found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Token</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Doctor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date/Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Payment</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-bold text-indigo-600">#{apt.token_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{apt.patient_name || 'Patient'}</p>
                        <p className="text-xs text-neutral-500">{apt.patient_phone}</p>
                      </td>
                      <td className="px-4 py-3">{apt.doctor_name}</td>
                      <td className="px-4 py-3">
                        <p>{apt.appointment_date}</p>
                        <p className="text-xs text-neutral-500">{apt.appointment_time}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                          {getStatusLabel(apt.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">{apt.payment_status}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end space-x-1">
                          <button
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Modify"
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setModifyForm({
                                doctor_id: apt.doctor_id,
                                appointment_date: apt.appointment_date,
                                slot_number: apt.slot_number,
                                status: apt.status,
                                notes: apt.notes || '',
                                reason: '',
                              });
                              setShowModifyModal(true);
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded"
                            title="View Logs"
                            onClick={() => {
                              setSelectedAppointment(apt);
                              loadLogs(apt.id);
                            }}
                          >
                            <FaHistory />
                          </button>
                          {['confirmed', 'pending_payment'].includes(apt.status) && (
                            <button
                              className="p-1.5 text-error-600 hover:bg-error-50 rounded"
                              title="Cancel"
                              onClick={() => handleCancel(apt.id)}
                              disabled={actionLoading === apt.id}
                            >
                              <FaTimes />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && statistics && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Today's Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-600">{statistics.today.total}</p>
                <p className="text-sm text-neutral-600">Total</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-primary-500">{statistics.today.confirmed}</p>
                <p className="text-sm text-neutral-600">Confirmed</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{statistics.today.completed}</p>
                <p className="text-sm text-neutral-600">Completed</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{statistics.today.walk_in || 0}</p>
                <p className="text-sm text-neutral-600">Walk-ins</p>
              </div>
              <div className="text-center p-4 bg-error-50 rounded-lg">
                <p className="text-2xl font-bold text-error-600">{statistics.today.cancelled}</p>
                <p className="text-sm text-neutral-600">Cancelled</p>
              </div>
            </div>
          </div>

          {statistics.this_month && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">This Month</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-2xl font-bold text-neutral-800">{statistics.this_month.total}</p>
                  <p className="text-sm text-neutral-600">Total Appointments</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{statistics.this_month.completed}</p>
                  <p className="text-sm text-neutral-600">Completed</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-2xl font-bold text-error-600">{statistics.this_month.cancelled}</p>
                  <p className="text-sm text-neutral-600">Cancelled</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-600">Rs. {statistics.this_month.revenue?.toFixed(0)}</p>
                  <p className="text-sm text-neutral-600">Revenue</p>
                </div>
              </div>
            </div>
          )}

          {statistics.top_doctors && statistics.top_doctors.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Top Doctors This Month</h3>
              <div className="space-y-3">
                {statistics.top_doctors.map((doc, index) => (
                  <div key={doc.doctor_id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 mr-3">
                        {index + 1}
                      </span>
                      <FaUserMd className="text-neutral-400 mr-2" />
                      <span className="font-medium">{doc.name}</span>
                    </div>
                    <span className="text-indigo-600 font-bold">{doc.appointment_count} appointments</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Appointment Settings</h3>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              onClick={handleSaveSettings}
              disabled={actionLoading === 'settings'}
            >
              <FaSave className="mr-2" />
              {actionLoading === 'settings' ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking Rules */}
            <div className="space-y-4">
              <h4 className="font-medium text-neutral-700 border-b pb-2">Booking Rules</h4>
              
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">
                  Max Advance Booking Days
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={settings.max_advance_booking_days}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, max_advance_booking_days: parseInt(e.target.value) } : null)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">
                  Min Advance Booking Hours
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={settings.min_advance_booking_hours}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, min_advance_booking_hours: parseInt(e.target.value) } : null)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-600">Allow Walk-ins</label>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={settings.allow_walk_in}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, allow_walk_in: e.target.checked } : null)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-600">Require Payment for Online</label>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={settings.require_payment_for_online}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, require_payment_for_online: e.target.checked } : null)}
                />
              </div>
            </div>

            {/* Cancellation Rules */}
            <div className="space-y-4">
              <h4 className="font-medium text-neutral-700 border-b pb-2">Cancellation & Reschedule</h4>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-600">Allow Patient Cancellation</label>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={settings.allow_patient_cancellation}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, allow_patient_cancellation: e.target.checked } : null)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">
                  Cancellation Advance Hours
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={settings.cancellation_advance_hours}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, cancellation_advance_hours: parseInt(e.target.value) } : null)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-600">Allow Reschedule</label>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={settings.allow_reschedule}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, allow_reschedule: e.target.checked } : null)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">
                  Max Reschedule Count
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={settings.max_reschedule_count}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, max_reschedule_count: parseInt(e.target.value) } : null)}
                />
              </div>
            </div>

            {/* Fees */}
            <div className="space-y-4">
              <h4 className="font-medium text-neutral-700 border-b pb-2">Fees</h4>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">
                  Default Booking Fee (Rs.)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={settings.default_booking_fee}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, default_booking_fee: parseFloat(e.target.value) } : null)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">
                  Walk-in Fee (Rs.)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={settings.walk_in_fee}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, walk_in_fee: parseFloat(e.target.value) } : null)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-600">Refund on Cancellation</label>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={settings.refund_on_cancellation}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, refund_on_cancellation: e.target.checked } : null)}
                />
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <h4 className="font-medium text-neutral-700 border-b pb-2">Notifications</h4>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-600">Send SMS Confirmation</label>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={settings.send_sms_confirmation}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, send_sms_confirmation: e.target.checked } : null)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-600">Send SMS Reminder</label>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={settings.send_sms_reminder}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, send_sms_reminder: e.target.checked } : null)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">
                  Reminder Hours Before
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={settings.reminder_hours_before}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, reminder_hours_before: parseInt(e.target.value) } : null)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-600">Send Email Confirmation</label>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={settings.send_email_confirmation}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, send_email_confirmation: e.target.checked } : null)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify Modal */}
      {showModifyModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Modify Appointment</h3>
              <button onClick={() => setShowModifyModal(false)}><FaTimes /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Doctor</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={modifyForm.doctor_id}
                  onChange={(e) => setModifyForm(prev => ({ ...prev, doctor_id: e.target.value }))}
                >
                  {doctors.map(doc => (
                    <option key={doc.doctor_id} value={doc.doctor_id}>{doc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded-lg"
                  value={modifyForm.appointment_date}
                  onChange={(e) => setModifyForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Status</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={modifyForm.status}
                  onChange={(e) => setModifyForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Notes</label>
                <textarea
                  className="w-full p-2 border rounded-lg"
                  rows={2}
                  value={modifyForm.notes}
                  onChange={(e) => setModifyForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Reason for Modification *</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={modifyForm.reason}
                  onChange={(e) => setModifyForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter reason..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                className="flex-1 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
                onClick={() => setShowModifyModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                onClick={handleModify}
                disabled={!modifyForm.reason || actionLoading === 'modify'}
              >
                {actionLoading === 'modify' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Appointment History</h3>
              <button onClick={() => setShowLogsModal(false)}><FaTimes /></button>
            </div>

            <div className="space-y-3">
              {logs.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">No logs found</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border-l-4 border-indigo-600 pl-3 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-neutral-800">{log.action_label}</p>
                        <p className="text-sm text-neutral-600">{log.performed_by} ({log.performed_by_role})</p>
                        {log.reason && <p className="text-sm text-neutral-500 italic">{log.reason}</p>}
                      </div>
                      <span className="text-xs text-neutral-400">{log.created_at}</span>
                    </div>
                    {log.previous_status && log.new_status && (
                      <p className="text-xs mt-1">
                        <span className="text-neutral-500">{getStatusLabel(log.previous_status)}</span>
                        <span className="mx-1">→</span>
                        <span className="text-indigo-600">{getStatusLabel(log.new_status)}</span>
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              className="w-full mt-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
              onClick={() => setShowLogsModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
};

export default BranchAdminAppointments;
