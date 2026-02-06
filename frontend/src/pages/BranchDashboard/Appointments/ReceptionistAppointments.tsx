import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUser,
  FaSearch,
  FaPlus,
  FaCheck,
  FaTimes,
  FaPhone,
  FaCalendarAlt,
  FaUserMd,
  FaMoneyBillWave,
  FaSync,
} from 'react-icons/fa';
import {
  appointmentReceptionistApi,
  AppointmentBooking,
  Doctor,
} from '../../../services/appointmentService';

const ReceptionistAppointments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'walk-in'>('today');
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Walk-in form state
  const [walkInForm, setWalkInForm] = useState({
    patient_id: '',
    patient_name: '',
    patient_phone: '',
    doctor_id: '',
    appointment_type: 'general',
    notes: '',
    payment_method: 'cash',
    amount_paid: 0,
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);

  // Load today's appointments
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentReceptionistApi.getAppointments({
        date: new Date().toISOString().split('T')[0],
      });
      
      if (response.status === 200) {
        setAppointments(response.appointments);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load available doctors
  const loadDoctors = useCallback(async () => {
    try {
      const response = await appointmentReceptionistApi.getAvailableDoctors();
      
      if (response.status === 200) {
        setDoctors(response.doctors);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  }, []);

  // Search patients
  const searchPatients = useCallback(async (search: string) => {
    if (search.length < 2) {
      setPatients([]);
      return;
    }

    try {
      const response = await appointmentReceptionistApi.searchPatients(search);
      
      if (response.status === 200) {
        setPatients(response.patients);
        setShowPatientResults(true);
      }
    } catch (err) {
      console.error('Failed to search patients:', err);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
    loadDoctors();
  }, [loadAppointments, loadDoctors]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (patientSearch) {
        searchPatients(patientSearch);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [patientSearch, searchPatients]);

  // Select patient from search results
  const selectPatient = (patient: any) => {
    setWalkInForm((prev) => ({
      ...prev,
      patient_id: patient.id || patient.user_id,
      patient_name: patient.name || `${patient.first_name} ${patient.last_name}`,
      patient_phone: patient.phone || patient.phone_number,
    }));
    setPatientSearch('');
    setShowPatientResults(false);
  };

  // Create walk-in booking
  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walkInForm.doctor_id) {
      setError('Please select a doctor');
      return;
    }

    if (!walkInForm.patient_id && (!walkInForm.patient_name || !walkInForm.patient_phone)) {
      setError('Please select a patient or enter patient details');
      return;
    }

    try {
      setActionLoading('walk-in');
      setError(null);

      const response = await appointmentReceptionistApi.createWalkInBooking({
        patient_id: walkInForm.patient_id || undefined,
        patient_name: walkInForm.patient_name || undefined,
        patient_phone: walkInForm.patient_phone || undefined,
        doctor_id: walkInForm.doctor_id,
        appointment_type: walkInForm.appointment_type,
        notes: walkInForm.notes,
        payment_method: walkInForm.payment_method,
        amount_paid: walkInForm.amount_paid,
      });

      if (response.status === 201 || response.status === 200) {
        setSuccess(`Walk-in booking created! Token #${response.booking.token_number}`);
        setWalkInForm({
          patient_id: '',
          patient_name: '',
          patient_phone: '',
          doctor_id: '',
          appointment_type: 'general',
          notes: '',
          payment_method: 'cash',
          amount_paid: 0,
        });
        loadAppointments();
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create walk-in booking');
    } finally {
      setActionLoading(null);
    }
  };

  // Check in patient
  const handleCheckIn = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      const response = await appointmentReceptionistApi.checkInPatient(bookingId);
      
      if (response.status === 200) {
        loadAppointments();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check in patient');
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
      const response = await appointmentReceptionistApi.cancelAppointment(bookingId, reason);
      
      if (response.status === 200) {
        loadAppointments();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(null);
    }
  };

  // Record payment
  const handleRecordPayment = async (bookingId: string, amount: number) => {
    try {
      setActionLoading(bookingId);
      const response = await appointmentReceptionistApi.recordPayment(bookingId, {
        payment_method: 'cash',
        amount_paid: amount,
      });
      
      if (response.status === 200) {
        setSuccess('Payment recorded successfully');
        loadAppointments();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record payment');
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
        return 'bg-error-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      case 'pending_payment':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="p-6 bg-neutral-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Appointment Reception</h1>
        <p className="text-neutral-600">Manage walk-ins and check-ins</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between items-center">
          <div className="flex items-center">
            <FaCheck className="mr-2" />
            {success}
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
            <FaTimes />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-error-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error-500 hover:text-red-700">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'today'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
          onClick={() => setActiveTab('today')}
        >
          <FaCalendarAlt className="inline mr-2" />
          Today's Appointments
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'walk-in'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
          onClick={() => setActiveTab('walk-in')}
        >
          <FaPlus className="inline mr-2" />
          Walk-In Booking
        </button>
      </div>

      {/* Today's Appointments */}
      {activeTab === 'today' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="font-semibold text-neutral-800">
              Today's Schedule ({appointments.length} appointments)
            </h2>
            <button
              className="text-indigo-600 hover:text-indigo-800 flex items-center"
              onClick={loadAppointments}
              disabled={loading}
            >
              <FaSync className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <FaCalendarAlt className="text-4xl mx-auto mb-2 text-gray-300" />
              <p>No appointments for today</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Token</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Doctor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Payment</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-bold text-indigo-600">#{appointment.token_number}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-neutral-800">{appointment.patient_name || 'Patient'}</p>
                          {appointment.patient_phone && (
                            <p className="text-xs text-neutral-500 flex items-center">
                              <FaPhone className="mr-1" />
                              {appointment.patient_phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <FaUserMd className="text-neutral-400 mr-2" />
                          <span>{appointment.doctor_name || 'Doctor'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{appointment.appointment_time}</td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {appointment.booking_type === 'walk_in' ? (
                          <span className="text-orange-600">Walk-in</span>
                        ) : (
                          <span className="text-primary-500">Online</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {appointment.payment_status === 'paid' ? (
                          <span className="text-green-600 text-sm">Paid</span>
                        ) : appointment.payment_status === 'pending' ? (
                          <button
                            className="text-amber-600 text-sm hover:text-amber-700"
                            onClick={() => handleRecordPayment(appointment.id, appointment.booking_fee || 0)}
                            disabled={actionLoading === appointment.id}
                          >
                            <FaMoneyBillWave className="inline mr-1" />
                            Record Payment
                          </button>
                        ) : (
                          <span className="text-neutral-400 text-sm">{appointment.payment_status}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end space-x-2">
                          {appointment.status === 'confirmed' && (
                            <>
                              <button
                                className="px-2 py-1 bg-primary-500 text-white rounded text-xs hover:bg-primary-600"
                                onClick={() => handleCheckIn(appointment.id)}
                                disabled={actionLoading === appointment.id}
                              >
                                Check In
                              </button>
                              <button
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                onClick={() => handleCancel(appointment.id)}
                                disabled={actionLoading === appointment.id}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {appointment.status === 'pending_payment' && (
                            <button
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              onClick={() => handleCancel(appointment.id)}
                              disabled={actionLoading === appointment.id}
                            >
                              Cancel
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

      {/* Walk-In Booking Form */}
      {activeTab === 'walk-in' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Create Walk-In Booking</h2>

          <form onSubmit={handleCreateWalkIn} className="space-y-4">
            {/* Patient Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Search Existing Patient
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-neutral-400" />
                <input
                  type="text"
                  className="w-full pl-10 p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Search by name, phone, or ID..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </div>

              {/* Patient Search Results */}
              {showPatientResults && patients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {patients.map((patient) => (
                    <div
                      key={patient.id || patient.user_id}
                      className="p-3 hover:bg-neutral-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => selectPatient(patient)}
                    >
                      <div className="flex items-center">
                        <FaUser className="text-neutral-400 mr-2" />
                        <div>
                          <p className="font-medium text-neutral-800">
                            {patient.name || `${patient.first_name} ${patient.last_name}`}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {patient.phone || patient.phone_number} | {patient.patient_id || patient.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Or New Patient Details */}
            <div className="border-t border-neutral-200 pt-4">
              <p className="text-sm text-neutral-500 mb-3">Or enter new patient details:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Full name"
                    value={walkInForm.patient_name}
                    onChange={(e) => setWalkInForm((prev) => ({ ...prev, patient_name: e.target.value }))}
                    disabled={!!walkInForm.patient_id}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Phone number"
                    value={walkInForm.patient_phone}
                    onChange={(e) => setWalkInForm((prev) => ({ ...prev, patient_phone: e.target.value }))}
                    disabled={!!walkInForm.patient_id}
                  />
                </div>
              </div>
            </div>

            {/* Selected Patient Info */}
            {walkInForm.patient_id && (
              <div className="bg-indigo-50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <FaUser className="text-indigo-600 mr-2" />
                  <div>
                    <p className="font-medium text-indigo-800">{walkInForm.patient_name}</p>
                    <p className="text-sm text-indigo-600">{walkInForm.patient_phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-indigo-600 hover:text-indigo-800"
                  onClick={() => setWalkInForm((prev) => ({ ...prev, patient_id: '', patient_name: '', patient_phone: '' }))}
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {/* Doctor Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Doctor *</label>
              <select
                className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={walkInForm.doctor_id}
                onChange={(e) => setWalkInForm((prev) => ({ ...prev, doctor_id: e.target.value }))}
                required
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.doctor_id} value={doctor.doctor_id}>
                    {doctor.name} {doctor.specialization ? `- ${doctor.specialization}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Appointment Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Appointment Type</label>
                <select
                  className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={walkInForm.appointment_type}
                  onChange={(e) => setWalkInForm((prev) => ({ ...prev, appointment_type: e.target.value }))}
                >
                  <option value="general">General Consultation</option>
                  <option value="follow_up">Follow-up Visit</option>
                  <option value="emergency">Emergency</option>
                  <option value="consultation">Specialist Consultation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Payment Method</label>
                <select
                  className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={walkInForm.payment_method}
                  onChange={(e) => setWalkInForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="pending">Pay Later</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Notes (Optional)</label>
              <textarea
                className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={2}
                placeholder="Any notes or symptoms..."
                value={walkInForm.notes}
                onChange={(e) => setWalkInForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:bg-indigo-300"
              disabled={actionLoading === 'walk-in'}
            >
              {actionLoading === 'walk-in' ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FaPlus className="mr-2" />
                  Create Walk-In Booking
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReceptionistAppointments;
