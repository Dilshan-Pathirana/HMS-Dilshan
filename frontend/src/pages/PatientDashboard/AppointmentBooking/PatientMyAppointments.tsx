import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaMapMarkerAlt, FaTimes, FaRedo, FaEye, FaCheck, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import {
  appointmentPatientApi,
  appointmentPublicApi,
  AppointmentBooking,
  TimeSlot,
} from '../../../services/appointmentService';

interface Props {
  onBookNew?: () => void;
}

interface RescheduleEligibility {
  can_reschedule: boolean;
  reason: string | null;
  remaining_attempts: number;
  max_attempts: number;
  is_admin_cancelled: boolean;
  appointment_details: {
    id: string;
    date: string;
    time: string;
    doctor_id: string;
    branch_id: string;
    status: string;
  };
  settings: {
    max_advance_booking_days: number;
    reschedule_advance_hours: number;
  };
}

const PatientMyAppointments: React.FC<Props> = ({ onBookNew }) => {
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentBooking | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [confirmCancellation, setConfirmCancellation] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Reschedule states
  const [rescheduleEligibility, setRescheduleEligibility] = useState<RescheduleEligibility | null>(null);
  const [rescheduleStep, setRescheduleStep] = useState<'checking' | 'ineligible' | 'select' | 'confirm'>('checking');
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlot, setRescheduleSlot] = useState<number | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [confirmReschedule, setConfirmReschedule] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState<{
    token_number: number;
    appointment_date: string;
    appointment_time: string;
  } | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: { status?: string; from_date?: string } = {};
      
      if (filter === 'upcoming') {
        params.from_date = new Date().toISOString().split('T')[0];
      }

      const response = await appointmentPatientApi.getMyAppointments(params);
      
      if (response.status === 200) {
        let filteredAppointments = response.appointments;
        
        if (filter === 'past') {
          const today = new Date().toISOString().split('T')[0];
          filteredAppointments = response.appointments.filter(
            (apt) => apt.appointment_date < today || apt.status === 'completed' || apt.status === 'cancelled'
          );
        }
        
        setAppointments(filteredAppointments);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !cancelReason.trim() || !confirmCancellation) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await appointmentPatientApi.cancelAppointment(
        selectedAppointment.id, 
        cancelReason,
        true // confirmed flag - patient has explicitly confirmed
      );
      
      if (response.status === 200) {
        setShowCancelModal(false);
        setCancelReason('');
        setConfirmCancellation(false);
        setSelectedAppointment(null);
        loadAppointments();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  // Open reschedule modal and check eligibility
  const openRescheduleModal = async (appointment: AppointmentBooking) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
    setRescheduleStep('checking');
    setRescheduleDate('');
    setRescheduleSlot(null);
    setRescheduleReason('');
    setConfirmReschedule(false);
    setRescheduleSuccess(null);
    setAvailableSlots([]);

    try {
      const response = await appointmentPatientApi.getRescheduleEligibility(appointment.id);
      setRescheduleEligibility(response);
      
      if (response.can_reschedule) {
        setRescheduleStep('select');
      } else {
        setRescheduleStep('ineligible');
      }
    } catch (err: any) {
      console.error('Failed to check reschedule eligibility:', err);
      setRescheduleEligibility({
        can_reschedule: false,
        reason: err.response?.data?.message || 'Failed to check reschedule eligibility',
        remaining_attempts: 0,
        max_attempts: 0,
        is_admin_cancelled: false,
        appointment_details: {
          id: appointment.id,
          date: appointment.appointment_date,
          time: appointment.appointment_time || '',
          doctor_id: '',
          branch_id: '',
          status: appointment.status,
        },
        settings: {
          max_advance_booking_days: 30,
          reschedule_advance_hours: 24,
        },
      });
      setRescheduleStep('ineligible');
    }
  };

  // Load available slots for selected date
  const loadAvailableSlots = async (date: string) => {
    if (!selectedAppointment || !rescheduleEligibility) return;

    setLoadingSlots(true);
    setAvailableSlots([]);
    setRescheduleSlot(null);

    try {
      const response = await appointmentPublicApi.getAvailableSlots(
        rescheduleEligibility.appointment_details.doctor_id,
        {
          branch_id: rescheduleEligibility.appointment_details.branch_id,
          start_date: date,
          days: 1,
        }
      );

      if (response.status === 200 && response.available_days && response.available_days.length > 0) {
        // Find the day matching our selected date
        const selectedDay = response.available_days.find(day => day.date === date);
        if (selectedDay && selectedDay.slots) {
          setAvailableSlots(selectedDay.slots);
        } else {
          setAvailableSlots([]);
        }
      } else {
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
      setError('Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle date change for reschedule
  const handleRescheduleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setRescheduleDate(date);
    if (date) {
      loadAvailableSlots(date);
    }
  };

  // Handle reschedule submission
  const handleRescheduleAppointment = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleSlot || !confirmReschedule) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await appointmentPatientApi.rescheduleAppointment(
        selectedAppointment.id,
        {
          new_date: rescheduleDate,
          new_slot_number: rescheduleSlot,
          reason: rescheduleReason || 'Rescheduled by patient',
          confirmed: true,
        }
      );

      if (response.status === 200) {
        setRescheduleSuccess({
          token_number: response.new_booking.token_number,
          appointment_date: response.new_booking.appointment_date,
          appointment_time: response.new_booking.appointment_time,
        });
        setRescheduleStep('confirm');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setActionLoading(false);
    }
  };

  // Close reschedule modal
  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setSelectedAppointment(null);
    setRescheduleEligibility(null);
    setRescheduleStep('checking');
    setRescheduleDate('');
    setRescheduleSlot(null);
    setRescheduleReason('');
    setConfirmReschedule(false);
    setAvailableSlots([]);
    setRescheduleSuccess(null);
    
    // Reload appointments if successful
    if (rescheduleSuccess) {
      loadAppointments();
    }
  };

  // Get min date for reschedule (tomorrow, respecting 24-hour rule)
  const getMinRescheduleDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get max date for reschedule
  const getMaxRescheduleDate = () => {
    const maxDate = new Date();
    const maxDays = rescheduleEligibility?.settings?.max_advance_booking_days || 30;
    maxDate.setDate(maxDate.getDate() + maxDays);
    return maxDate.toISOString().split('T')[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800';
      case 'in_session':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-neutral-100 text-neutral-800';
      case 'cancelled':
        return 'bg-error-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const canCancel = (appointment: AppointmentBooking) => {
    const cancelableStatuses = ['confirmed', 'pending_payment'];
    return cancelableStatuses.includes(appointment.status);
  };

  const canReschedule = (appointment: AppointmentBooking) => {
    const reschedulableStatuses = ['confirmed'];
    return reschedulableStatuses.includes(appointment.status);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-800">My Appointments</h2>
        {onBookNew && (
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            onClick={onBookNew}
          >
            Book New Appointment
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-4">
        {(['upcoming', 'past', 'all'] as const).map((f) => (
          <button
            key={f}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-error-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-neutral-500">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-8">
          <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-2" />
          <p className="text-neutral-500">No appointments found</p>
          {filter === 'upcoming' && onBookNew && (
            <button
              className="mt-4 text-indigo-600 hover:text-indigo-800"
              onClick={onBookNew}
            >
              Book your first appointment →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusLabel(appointment.status)}
                    </span>
                    <span className="ml-2 text-lg font-bold text-indigo-600">
                      #{appointment.token_number}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-neutral-600">
                      <FaUser className="mr-2 text-neutral-400" />
                      <span className="font-medium">{appointment.doctor_name || 'Doctor'}</span>
                    </div>
                    <div className="flex items-center text-neutral-600">
                      <FaCalendarAlt className="mr-2 text-neutral-400" />
                      <span>
                        {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-neutral-600">
                      <FaClock className="mr-2 text-neutral-400" />
                      <span>{appointment.appointment_time}</span>
                    </div>
                    {appointment.branch_name && (
                      <div className="flex items-center text-neutral-600">
                        <FaMapMarkerAlt className="mr-2 text-neutral-400" />
                        <span>{appointment.branch_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 mt-4 md:mt-0">
                  <button
                    className="p-2 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View Details"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <FaEye />
                  </button>
                  
                  {canReschedule(appointment) && (
                    <button
                      className="p-2 text-neutral-500 hover:text-primary-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Reschedule"
                      onClick={() => openRescheduleModal(appointment)}
                    >
                      <FaRedo />
                    </button>
                  )}
                  
                  {canCancel(appointment) && (
                    <button
                      className="p-2 text-neutral-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                      title="Cancel"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowCancelModal(true);
                      }}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              {appointment.payment_status === 'pending' && appointment.status !== 'cancelled' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-yellow-700 text-sm">
                    <FaExclamationTriangle className="mr-2" />
                    Payment pending - Amount: Rs. {appointment.booking_fee?.toFixed(2)}
                  </div>
                </div>
              )}

              {appointment.status === 'completed' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-green-600 text-sm">
                    <FaCheck className="mr-2" />
                    Consultation completed
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal - Red Warning Theme */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 border-t-4 border-error-600">
            {/* Warning Header */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="text-error-600 text-3xl" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-red-700 text-center mb-2">Cancel Appointment</h3>
            
            {/* Strong Warning Message */}
            <div className="bg-error-50 border-2 border-red-300 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-center font-medium">
                ⚠️ This action is <strong>non-reversible</strong>.
              </p>
              <p className="text-red-700 text-center mt-2 text-sm">
                Your appointment will be permanently cancelled, and <strong>booking fees will NOT be refunded</strong>.
              </p>
            </div>

            {/* Appointment Details */}
            <div className="bg-neutral-50 rounded-lg p-3 mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-neutral-500">Doctor:</span>
                <span className="font-medium">{selectedAppointment.doctor_name}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-500">Date:</span>
                <span className="font-medium">
                  {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-500">Time:</span>
                <span className="font-medium">{selectedAppointment.appointment_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Token #:</span>
                <span className="font-bold text-indigo-600">#{selectedAppointment.token_number}</span>
              </div>
            </div>

            {/* Reason Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Reason for cancellation <span className="text-error-500">*</span>
              </label>
              <textarea
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-error-500"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
              />
            </div>

            {/* Confirmation Checkbox */}
            <div className="mb-6">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmCancellation}
                  onChange={(e) => setConfirmCancellation(e.target.checked)}
                  className="mt-1 h-4 w-4 text-error-600 focus:ring-red-500 border-neutral-300 rounded"
                />
                <span className="ml-2 text-sm text-neutral-700">
                  I understand that this action is permanent and my <strong>booking fee will NOT be refunded</strong>. I wish to proceed with the cancellation.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                className="flex-1 py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setConfirmCancellation(false);
                }}
                disabled={actionLoading}
              >
                Go Back
              </button>
              <button
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-red-300 disabled:cursor-not-allowed"
                onClick={handleCancelAppointment}
                disabled={!cancelReason.trim() || !confirmCancellation || actionLoading}
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Cancelling...
                  </span>
                ) : (
                  'Confirm Cancellation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedAppointment && !showCancelModal && !showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">Appointment Details</h3>
              <button
                className="text-neutral-400 hover:text-neutral-600"
                onClick={() => setSelectedAppointment(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">Token Number</span>
                <span className="font-bold text-indigo-600">#{selectedAppointment.token_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                  {getStatusLabel(selectedAppointment.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Doctor</span>
                <span className="font-medium">{selectedAppointment.doctor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Date</span>
                <span>{new Date(selectedAppointment.appointment_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Time</span>
                <span>{selectedAppointment.appointment_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Type</span>
                <span className="capitalize">{selectedAppointment.appointment_type?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Booking Type</span>
                <span className="capitalize">{selectedAppointment.booking_type?.replace('_', ' ')}</span>
              </div>
              {selectedAppointment.booking_fee && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Fee</span>
                  <span>Rs. {selectedAppointment.booking_fee.toFixed(2)}</span>
                </div>
              )}
              {selectedAppointment.notes && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-neutral-500 text-sm">Notes</span>
                  <p className="text-neutral-700">{selectedAppointment.notes}</p>
                </div>
              )}
              {selectedAppointment.cancellation_reason && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-neutral-500 text-sm">Cancellation Reason</span>
                  <p className="text-error-600">{selectedAppointment.cancellation_reason}</p>
                </div>
              )}
            </div>

            <button
              className="w-full mt-6 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
              onClick={() => setSelectedAppointment(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Modal - Blue Theme with Steps */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 border-t-4 border-primary-500 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <FaRedo className="text-primary-500 text-lg" />
                </div>
                <h3 className="text-xl font-bold text-blue-700">Reschedule Appointment</h3>
              </div>
              <button
                className="text-neutral-400 hover:text-neutral-600"
                onClick={closeRescheduleModal}
              >
                <FaTimes />
              </button>
            </div>

            {/* Step: Checking Eligibility */}
            {rescheduleStep === 'checking' && (
              <div className="text-center py-8">
                <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-neutral-600">Checking reschedule eligibility...</p>
              </div>
            )}

            {/* Step: Ineligible */}
            {rescheduleStep === 'ineligible' && rescheduleEligibility && (
              <div>
                <div className="bg-error-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <FaExclamationTriangle className="text-error-500 text-xl mr-3 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-700">Cannot Reschedule</p>
                      <p className="text-error-600 mt-1">{rescheduleEligibility.reason}</p>
                    </div>
                  </div>
                </div>

                {/* Info about reschedule rules */}
                <div className="bg-neutral-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-neutral-700 mb-2 flex items-center">
                    <FaInfoCircle className="mr-2 text-primary-500" />
                    Reschedule Rules
                  </h4>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    <li>• Rescheduling requires 24-hour advance notice</li>
                    <li>• You can reschedule once per appointment</li>
                    <li>• Admin-cancelled appointments allow 2 reschedules</li>
                  </ul>
                </div>

                <button
                  className="w-full py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
                  onClick={closeRescheduleModal}
                >
                  Close
                </button>
              </div>
            )}

            {/* Step: Select New Date & Slot */}
            {rescheduleStep === 'select' && rescheduleEligibility && (
              <div>
                {/* Special Banner for Admin-Cancelled Appointments */}
                {rescheduleEligibility.is_admin_cancelled && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3 mb-4">
                    <p className="text-amber-800 text-sm">
                      <strong>ℹ️ Doctor-Cancelled Appointment:</strong> This appointment was cancelled by the branch on doctor's request. 
                      You have <strong>{rescheduleEligibility.remaining_attempts}</strong> reschedule attempts available.
                    </p>
                  </div>
                )}

                {/* Remaining Attempts Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Remaining Reschedules:</span>
                    <span className="font-bold text-blue-800">
                      {rescheduleEligibility.remaining_attempts} of {rescheduleEligibility.max_attempts}
                    </span>
                  </div>
                </div>

                {/* Current Appointment Details */}
                <div className="bg-neutral-50 rounded-lg p-3 mb-4 text-sm">
                  <h4 className="font-semibold text-neutral-700 mb-2">Current Appointment</h4>
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-500">Doctor:</span>
                    <span className="font-medium">{selectedAppointment.doctor_name}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-500">Current Date:</span>
                    <span className="font-medium">
                      {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Current Time:</span>
                    <span className="font-medium">{selectedAppointment.appointment_time}</span>
                  </div>
                </div>

                {/* New Date Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Select New Date <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={handleRescheduleDateChange}
                    min={getMinRescheduleDate()}
                    max={getMaxRescheduleDate()}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Must be at least 24 hours from now
                  </p>
                </div>

                {/* Slot Selection */}
                {rescheduleDate && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Select Time Slot <span className="text-error-500">*</span>
                    </label>
                    
                    {loadingSlots ? (
                      <div className="text-center py-4">
                        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-sm text-neutral-500 mt-2">Loading available slots...</p>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-700 text-sm">
                        No available slots for this date. Please select another date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.slot_number}
                            className={`p-2 text-sm rounded-lg border transition-colors ${
                              !slot.available
                                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200'
                                : rescheduleSlot === slot.slot_number
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'bg-white text-neutral-700 border-neutral-300 hover:border-blue-400 hover:bg-blue-50'
                            }`}
                            onClick={() => slot.available && setRescheduleSlot(slot.slot_number)}
                            disabled={!slot.available}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reason (Optional) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Reason for Rescheduling (Optional)
                  </label>
                  <textarea
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={2}
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="Why are you rescheduling?"
                  />
                </div>

                {/* Confirmation Checkbox */}
                <div className="mb-6">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmReschedule}
                      onChange={(e) => setConfirmReschedule(e.target.checked)}
                      className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <span className="ml-2 text-sm text-neutral-700">
                      I confirm that I want to reschedule this appointment to the new date and time selected above.
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    className="flex-1 py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
                    onClick={closeRescheduleModal}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
                    onClick={handleRescheduleAppointment}
                    disabled={!rescheduleDate || !rescheduleSlot || !confirmReschedule || actionLoading}
                  >
                    {actionLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                        Rescheduling...
                      </span>
                    ) : (
                      'Confirm Reschedule'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {rescheduleStep === 'confirm' && rescheduleSuccess && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheck className="text-green-600 text-3xl" />
                </div>
                <h4 className="text-xl font-bold text-green-700 mb-2">Appointment Rescheduled!</h4>
                <p className="text-neutral-600 mb-4">Your appointment has been successfully rescheduled.</p>

                {/* New Appointment Details */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                  <h5 className="font-semibold text-green-800 mb-2">New Appointment Details</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">New Date:</span>
                      <span className="font-medium">
                        {new Date(rescheduleSuccess.appointment_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">New Time:</span>
                      <span className="font-medium">{rescheduleSuccess.appointment_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">New Token #:</span>
                      <span className="font-bold text-indigo-600">#{rescheduleSuccess.token_number}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-neutral-500 mb-4">
                  You will receive an SMS confirmation shortly.
                </p>

                <button
                  className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                  onClick={closeRescheduleModal}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientMyAppointments;
