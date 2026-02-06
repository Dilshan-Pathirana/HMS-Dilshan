import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaCalendarAlt, FaClock, FaUser, FaMapMarkerAlt, FaStethoscope, FaArrowLeft, FaArrowRight, FaCheck, FaTimes } from 'react-icons/fa';
import {
  appointmentPublicApi,
  appointmentPatientApi,
  Branch,
  Doctor,
  SlotDay,
  TimeSlot,
  AppointmentBooking,
} from '../../../services/appointmentService';

// Booking Steps
type BookingStep = 'search' | 'slots' | 'confirm' | 'payment' | 'success';

interface BookingState {
  selectedBranch: string;
  selectedSpecialization: string;
  searchQuery: string;
  selectedDoctor: Doctor | null;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  selectedSlotDay: SlotDay | null;
  appointmentType: string;
  notes: string;
  paymentMethod: string;
}

const initialBookingState: BookingState = {
  selectedBranch: '',
  selectedSpecialization: '',
  searchQuery: '',
  selectedDoctor: null,
  selectedDate: '',
  selectedSlot: null,
  selectedSlotDay: null,
  appointmentType: 'general',
  notes: '',
  paymentMethod: 'cash',
};

const PatientBookAppointment: React.FC = () => {
  // UI State
  const [currentStep, setCurrentStep] = useState<BookingStep>('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableDays, setAvailableDays] = useState<SlotDay[]>([]);
  const [booking, setBooking] = useState<BookingState>(initialBookingState);
  const [createdBooking, setCreatedBooking] = useState<AppointmentBooking | null>(null);
  const [_requiresPayment, setRequiresPayment] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [branchesRes, specializationsRes] = await Promise.all([
        appointmentPublicApi.getBranches(),
        appointmentPublicApi.getSpecializations(),
      ]);
      
      if (branchesRes.status === 200) {
        setBranches(branchesRes.branches);
      }
      if (specializationsRes.status === 200) {
        setSpecializations(specializationsRes.specializations);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to load booking data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Search doctors
  const searchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await appointmentPublicApi.searchDoctors({
        branch_id: booking.selectedBranch || undefined,
        specialization: booking.selectedSpecialization || undefined,
        doctor_name: booking.searchQuery || undefined,
      });
      
      if (response.status === 200) {
        setDoctors(response.doctors);
        if (response.doctors.length === 0) {
          setError('No doctors found matching your criteria.');
        }
      }
    } catch (err) {
      console.error('Failed to search doctors:', err);
      setError('Failed to search doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [booking.selectedBranch, booking.selectedSpecialization, booking.searchQuery]);

  // Load available slots for selected doctor
  const loadAvailableSlots = async (doctor: Doctor) => {
    try {
      setLoading(true);
      setError(null);
      
      const branchId = booking.selectedBranch || doctor.branch_id || '';
      
      const response = await appointmentPublicApi.getAvailableSlots(doctor.doctor_id, {
        branch_id: branchId,
        days: 14,
      });
      
      if (response.status === 200) {
        setAvailableDays(response.available_days);
        setBooking(prev => ({ ...prev, selectedDoctor: doctor }));
        setCurrentStep('slots');
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
      setError('Failed to load available slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Select a time slot
  const selectSlot = (day: SlotDay, slot: TimeSlot) => {
    setBooking(prev => ({
      ...prev,
      selectedDate: day.date,
      selectedSlot: slot,
      selectedSlotDay: day,
    }));
    setCurrentStep('confirm');
  };

  // Create booking
  const createBooking = async () => {
    if (!booking.selectedDoctor || !booking.selectedSlot || !booking.selectedDate) {
      setError('Please select a doctor and time slot');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const branchId = booking.selectedBranch || booking.selectedDoctor.branch_id || '';
      
      const response = await appointmentPatientApi.createBooking({
        doctor_id: booking.selectedDoctor.doctor_id,
        branch_id: branchId,
        appointment_date: booking.selectedDate,
        slot_number: booking.selectedSlot.slot_number,
        appointment_type: booking.appointmentType,
        notes: booking.notes,
        payment_method: booking.paymentMethod,
      });
      
      if (response.status === 201 || response.status === 200) {
        setCreatedBooking(response.booking);
        setRequiresPayment(response.requires_payment);
        
        if (response.requires_payment) {
          setCurrentStep('payment');
        } else {
          setCurrentStep('success');
        }
      }
    } catch (err: any) {
      console.error('Failed to create booking:', err);
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm payment
  const confirmPayment = async () => {
    if (!createdBooking) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await appointmentPatientApi.confirmPayment(createdBooking.id, {
        payment_method: booking.paymentMethod,
        amount_paid: createdBooking.booking_fee || 0,
      });
      
      if (response.status === 200) {
        setCreatedBooking(response.booking);
        setCurrentStep('success');
      }
    } catch (err: any) {
      console.error('Failed to confirm payment:', err);
      setError(err.response?.data?.message || 'Failed to confirm payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset booking
  const resetBooking = () => {
    setBooking(initialBookingState);
    setDoctors([]);
    setAvailableDays([]);
    setCreatedBooking(null);
    setRequiresPayment(false);
    setCurrentStep('search');
    setError(null);
  };

  // Step indicator
  const steps = [
    { key: 'search', label: 'Find Doctor', icon: FaSearch },
    { key: 'slots', label: 'Select Slot', icon: FaCalendarAlt },
    { key: 'confirm', label: 'Confirm', icon: FaCheck },
    { key: 'payment', label: 'Payment', icon: FaClock },
    { key: 'success', label: 'Done', icon: FaCheck },
  ];

  const getStepIndex = (step: BookingStep) => steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800">Book an Appointment</h1>
          <p className="text-neutral-600 mt-2">Find a doctor and schedule your visit</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const isActive = step.key === currentStep;
              const isCompleted = getStepIndex(currentStep) > index;
              const Icon = step.icon;
              
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-neutral-200 text-neutral-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? 'text-indigo-600 font-medium' : 'text-neutral-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-neutral-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-error-50 border border-red-200 rounded-lg flex items-center">
            <FaTimes className="text-error-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Step 1: Search Doctors */}
          {currentStep === 'search' && (
            <div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">Find a Doctor</h2>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Branch</label>
                  <select
                    className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={booking.selectedBranch}
                    onChange={(e) => setBooking(prev => ({ ...prev, selectedBranch: e.target.value }))}
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Specialization</label>
                  <select
                    className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={booking.selectedSpecialization}
                    onChange={(e) => setBooking(prev => ({ ...prev, selectedSpecialization: e.target.value }))}
                  >
                    <option value="">All Specializations</option>
                    {specializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Search by name..."
                    value={booking.searchQuery}
                    onChange={(e) => setBooking(prev => ({ ...prev, searchQuery: e.target.value }))}
                  />
                </div>
              </div>
              
              <button
                className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                onClick={searchDoctors}
                disabled={loading}
              >
                <FaSearch className="mr-2" />
                {loading ? 'Searching...' : 'Search Doctors'}
              </button>

              {/* Doctor Results */}
              {doctors.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-neutral-800 mb-3">Available Doctors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.doctor_id}
                        className="border border-neutral-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => loadAvailableSlots(doctor)}
                      >
                        <div className="flex items-start">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            {doctor.profile_picture ? (
                              <img
                                src={doctor.profile_picture}
                                alt={doctor.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <FaUser className="text-indigo-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-800">{doctor.name}</h4>
                            {doctor.specialization && (
                              <p className="text-sm text-indigo-600 flex items-center mt-1">
                                <FaStethoscope className="mr-1" />
                                {doctor.specialization}
                              </p>
                            )}
                            {doctor.branch_name && (
                              <p className="text-sm text-neutral-500 flex items-center mt-1">
                                <FaMapMarkerAlt className="mr-1" />
                                {doctor.branch_name}
                              </p>
                            )}
                          </div>
                          <FaArrowRight className="text-neutral-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Time Slot */}
          {currentStep === 'slots' && booking.selectedDoctor && (
            <div>
              <button
                className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
                onClick={() => setCurrentStep('search')}
              >
                <FaArrowLeft className="mr-2" />
                Back to search
              </button>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <FaUser className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-800">{booking.selectedDoctor.name}</h2>
                  <p className="text-indigo-600">{booking.selectedDoctor.specialization}</p>
                </div>
              </div>

              <h3 className="text-lg font-medium text-neutral-800 mb-3">Select Date & Time</h3>
              
              {availableDays.length === 0 ? (
                <p className="text-neutral-500 py-8 text-center">No available slots in the next 14 days</p>
              ) : (
                <div className="space-y-4">
                  {availableDays.map((day) => (
                    <div key={day.date} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-medium text-neutral-800">{day.day}</span>
                          <span className="text-neutral-500 ml-2">{new Date(day.date).toLocaleDateString()}</span>
                        </div>
                        <span className="text-sm text-indigo-600">{day.available_count} slots available</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {day.slots.map((slot) => (
                          <button
                            key={slot.slot_number}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                              slot.available
                                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                            }`}
                            disabled={!slot.available}
                            onClick={() => slot.available && selectSlot(day, slot)}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm Details */}
          {currentStep === 'confirm' && booking.selectedDoctor && booking.selectedSlot && (
            <div>
              <button
                className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
                onClick={() => setCurrentStep('slots')}
              >
                <FaArrowLeft className="mr-2" />
                Change time slot
              </button>
              
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">Confirm Your Appointment</h2>
              
              {/* Appointment Summary */}
              <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-neutral-500">Doctor</span>
                    <p className="font-medium text-neutral-800">{booking.selectedDoctor.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Specialization</span>
                    <p className="font-medium text-neutral-800">{booking.selectedDoctor.specialization || 'General'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Date</span>
                    <p className="font-medium text-neutral-800">
                      {new Date(booking.selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Time</span>
                    <p className="font-medium text-neutral-800">{booking.selectedSlot.time}</p>
                  </div>
                </div>
              </div>

              {/* Appointment Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Appointment Type</label>
                <select
                  className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={booking.appointmentType}
                  onChange={(e) => setBooking(prev => ({ ...prev, appointmentType: e.target.value }))}
                >
                  <option value="general">General Consultation</option>
                  <option value="follow_up">Follow-up Visit</option>
                  <option value="consultation">Specialist Consultation</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Notes (Optional)</label>
                <textarea
                  className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="Any symptoms or concerns you'd like to mention..."
                  value={booking.notes}
                  onChange={(e) => setBooking(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Payment Method</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={booking.paymentMethod === 'cash'}
                      onChange={() => setBooking(prev => ({ ...prev, paymentMethod: 'cash' }))}
                      className="mr-2"
                    />
                    Pay at Clinic
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={booking.paymentMethod === 'online'}
                      onChange={() => setBooking(prev => ({ ...prev, paymentMethod: 'online' }))}
                      className="mr-2"
                    />
                    Pay Online
                  </label>
                </div>
              </div>

              <button
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                onClick={createBooking}
                disabled={loading}
              >
                {loading ? 'Creating Appointment...' : 'Confirm Appointment'}
              </button>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 'payment' && createdBooking && (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">Complete Payment</h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">
                  Please complete the payment to confirm your appointment.
                </p>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-neutral-500 mb-1">Amount to Pay</p>
                <p className="text-3xl font-bold text-neutral-800">
                  Rs. {createdBooking.booking_fee?.toFixed(2) || '0.00'}
                </p>
              </div>

              <button
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={confirmPayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>

              <button
                className="mt-4 text-neutral-500 hover:text-neutral-700"
                onClick={() => setCurrentStep('success')}
              >
                Skip (Pay at Clinic)
              </button>
            </div>
          )}

          {/* Step 5: Success */}
          {currentStep === 'success' && createdBooking && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck className="text-green-600 text-2xl" />
              </div>
              
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">Appointment Booked!</h2>
              <p className="text-neutral-600 mb-6">Your appointment has been successfully scheduled.</p>

              <div className="bg-indigo-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-neutral-500">Token Number</span>
                    <p className="font-bold text-2xl text-indigo-600">#{createdBooking.token_number}</p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Status</span>
                    <p className="font-medium text-green-600 capitalize">{createdBooking.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Date</span>
                    <p className="font-medium text-neutral-800">{createdBooking.appointment_date}</p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Time</span>
                    <p className="font-medium text-neutral-800">{createdBooking.appointment_time}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  onClick={resetBooking}
                >
                  Book Another Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientBookAppointment;
