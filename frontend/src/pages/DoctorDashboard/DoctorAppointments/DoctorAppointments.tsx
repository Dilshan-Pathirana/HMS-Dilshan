import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUser,
  FaClock,
  FaCheck,
  FaTimes,
  FaPlay,
  FaBan,
  FaCalendarAlt,
  FaFilter,
  FaSync,
  FaChartBar,
  FaArrowRight,
} from 'react-icons/fa';
import {
  appointmentDoctorApi,
  AppointmentBooking,
  AppointmentStatistics,
} from '../../../services/appointmentService';

const DoctorAppointments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'all' | 'stats'>('queue');
  const [queue, setQueue] = useState<AppointmentBooking[]>([]);
  const [currentPatient, setCurrentPatient] = useState<AppointmentBooking | null>(null);
  const [queueSummary, setQueueSummary] = useState({
    total: 0,
    waiting: 0,
    completed: 0,
    current_token: 0,
  });
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [statistics, setStatistics] = useState<AppointmentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Load today's queue
  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentDoctorApi.getTodaysQueue();
      
      if (response.status === 200) {
        setQueue(response.queue || []);
        setCurrentPatient(response.current_patient || null);
        setQueueSummary(response.summary || {
          total: 0,
          waiting: 0,
          completed: 0,
          current_token: 0,
        });
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
      setError('Failed to load today\'s queue');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all appointments
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const params: { date?: string; status?: string } = {};
      
      if (filterDate) {
        params.date = filterDate;
      }
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await appointmentDoctorApi.getAppointments(params);
      
      if (response.status === 200) {
        setAppointments(response.appointments);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStatus]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentDoctorApi.getStatistics();
      
      if (response.status === 200) {
        setStatistics(response.statistics);
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'queue') {
      loadQueue();
      // Auto-refresh queue every 30 seconds
      const interval = setInterval(loadQueue, 30000);
      return () => clearInterval(interval);
    } else if (activeTab === 'all') {
      loadAppointments();
    } else if (activeTab === 'stats') {
      loadStatistics();
    }
  }, [activeTab, loadQueue, loadAppointments, loadStatistics]);

  // Action handlers
  const handleCheckIn = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      const response = await appointmentDoctorApi.checkInPatient(bookingId);
      
      if (response.status === 200) {
        loadQueue();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check in patient');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartSession = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      const response = await appointmentDoctorApi.startSession(bookingId);
      
      if (response.status === 200) {
        loadQueue();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start session');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteConsultation = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      const response = await appointmentDoctorApi.completeConsultation(bookingId);
      
      if (response.status === 200) {
        loadQueue();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkNoShow = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      const response = await appointmentDoctorApi.markNoShow(bookingId);
      
      if (response.status === 200) {
        loadQueue();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark no-show');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'checked_in':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_session':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Appointment Management</h1>
        <p className="text-gray-600">Manage your patient appointments</p>
      </div>

      {/* Queue Summary Cards */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Today's Total</p>
            <p className="text-2xl font-bold text-indigo-600">{queueSummary.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Waiting</p>
            <p className="text-2xl font-bold text-yellow-600">{queueSummary.waiting}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{queueSummary.completed}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Current Token</p>
            <p className="text-2xl font-bold text-purple-600">#{queueSummary.current_token}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'queue'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('queue')}
        >
          <FaClock className="inline mr-2" />
          Today's Queue
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('all')}
        >
          <FaCalendarAlt className="inline mr-2" />
          All Appointments
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'stats'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          <FaChartBar className="inline mr-2" />
          Statistics
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Today's Queue */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="font-semibold text-gray-800">Patient Queue</h2>
            <button
              className="text-indigo-600 hover:text-indigo-800 flex items-center"
              onClick={loadQueue}
              disabled={loading}
            >
              <FaSync className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Current Patient Card */}
          {currentPatient && (
            <div className="m-4 p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl font-bold text-purple-700">#{currentPatient.token_number}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{currentPatient.patient_name || 'Patient'}</p>
                    <p className="text-sm text-gray-600">{currentPatient.appointment_time}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm mr-3">
                    In Session
                  </span>
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                    onClick={() => handleCompleteConsultation(currentPatient.id)}
                    disabled={actionLoading === currentPatient.id}
                  >
                    <FaCheck className="mr-2" />
                    Complete
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && !queue.length ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : queue.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FaClock className="text-4xl mx-auto mb-2 text-gray-300" />
              <p>No patients in queue</p>
            </div>
          ) : (
            <div className="divide-y">
              {queue
                .filter((apt) => apt.id !== currentPatient?.id)
                .map((appointment) => (
                <div key={appointment.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <span className="font-bold text-indigo-600">#{appointment.token_number}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{appointment.patient_name || 'Patient'}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <FaClock className="mr-1" />
                          {appointment.appointment_time}
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {appointment.status === 'confirmed' && (
                        <>
                          <button
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
                            onClick={() => handleCheckIn(appointment.id)}
                            disabled={actionLoading === appointment.id}
                          >
                            <FaCheck className="mr-1" />
                            Check In
                          </button>
                          <button
                            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm flex items-center"
                            onClick={() => handleMarkNoShow(appointment.id)}
                            disabled={actionLoading === appointment.id}
                          >
                            <FaBan className="mr-1" />
                            No Show
                          </button>
                        </>
                      )}
                      
                      {appointment.status === 'checked_in' && (
                        <button
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center"
                          onClick={() => handleStartSession(appointment.id)}
                          disabled={actionLoading === appointment.id}
                        >
                          <FaPlay className="mr-1" />
                          Start Session
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Appointments */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b flex flex-wrap gap-3 items-center">
            <div className="flex items-center">
              <FaFilter className="text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-600">Filters:</span>
            </div>
            <input
              type="date"
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <select
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="in_session">In Session</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
            <button
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              onClick={loadAppointments}
            >
              Apply
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FaCalendarAlt className="text-4xl mx-auto mb-2 text-gray-300" />
              <p>No appointments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-indigo-600">#{appointment.token_number}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <FaUser className="text-gray-400 mr-2" />
                          <span>{appointment.patient_name || 'Patient'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{appointment.appointment_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{appointment.appointment_time}</td>
                      <td className="px-4 py-3 text-sm capitalize">{appointment.appointment_type?.replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-indigo-600 hover:text-indigo-800">
                          <FaArrowRight />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : statistics ? (
            <>
              {/* Today Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <p className="text-2xl font-bold text-indigo-600">{statistics.today.total}</p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{statistics.today.confirmed}</p>
                    <p className="text-sm text-gray-600">Confirmed</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{statistics.today.completed}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{statistics.today.cancelled}</p>
                    <p className="text-sm text-gray-600">Cancelled</p>
                  </div>
                </div>
              </div>

              {/* This Month Stats */}
              {statistics.this_month && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">This Month</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{statistics.this_month.total}</p>
                      <p className="text-sm text-gray-600">Total Appointments</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{statistics.this_month.completed}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{statistics.this_month.cancelled}</p>
                      <p className="text-sm text-gray-600">Cancelled</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <FaChartBar className="text-4xl mx-auto mb-2 text-gray-300" />
              <p>No statistics available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
