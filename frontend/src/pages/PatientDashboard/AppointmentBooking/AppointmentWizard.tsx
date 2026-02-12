import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaMapMarkerAlt,
  FaStethoscope,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaSpinner,
  FaCreditCard,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaInfoCircle,
  FaHospital,
  FaLock,
} from 'react-icons/fa';
import api from "../../../utils/api/axios";
import { RootState } from '../../../store';
import useFetchPatientDetails from '../../../utils/api/PatientAppointment/FetchPatientDetails';

// User role constants - Staff roles that can use "Pay at Clinic" option
const STAFF_ROLES = [1, 2]; // Super Admin (1), Branch Admin (2)

// Types
interface DoctorSchedule {
  schedule_id: string;
  branch_id: string;
  branch_name: string;
  branch_city?: string;
  schedule_day: string;
  start_time: string;
  end_time: string;
  max_patients: number;
  time_per_patient: number;
}

interface Doctor {
  doctor_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  profile_picture?: string;
  specialization?: string;
  qualification?: string;
  schedules: DoctorSchedule[];
}

interface SlotInfo {
  slot_number: number;
  estimated_time: string;
  estimated_end_time: string;
  is_available: boolean;
  is_booked: boolean;
}

interface AvailabilityData {
  date: string;
  day: string;
  session: {
    start_time: string;
    end_time: string;
    time_per_patient: number;
  };
  slots: SlotInfo[];
  summary: {
    total_slots: number;
    available: number;
    booked: number;
  };
  disclaimer: string;
}

interface BookingResult {
  id: string;
  token_number: number;
  appointment_date: string;
  appointment_time: string;
  slot_number: number;
  status: string;
  payment_required: boolean;
  booking_fee: number;
  // Multi-slot booking results
  bookings?: Array<{
    id: string;
    token_number: number;
    slot_number: number;
    appointment_time: string;
  }>;
  total_amount?: number;
}

type WizardStep = 1 | 2 | 3 | 4;

const AppointmentWizard: React.FC = () => {
  const navigate = useNavigate();
  const userId = useSelector((state: RootState) => state.auth.userId);
  const userRole = useSelector((state: RootState) => state.auth.userRole);
  const patientBranchId = useSelector((state: RootState) => state.auth.branchId);
  const token = localStorage.getItem('token');
  const { userDetails } = useFetchPatientDetails(userId);

  // Check if user is staff (can use Pay at Clinic option)
  // Staff users: Super Admin (1), Branch Admin (2)
  const isStaffUser = STAFF_ROLES.includes(userRole as number);

  // Wizard State
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Branch-preference state
  const [allBranches, setAllBranches] = useState<{ id: string; name: string }[]>([]);
  const [patientBranchName, setPatientBranchName] = useState<string>('');
  const [branchScope, setBranchScope] = useState<'my-branch' | 'all'>('my-branch');
  const [branchFilter, setBranchFilter] = useState<string>(''); // manual dropdown
  const [initialSearchDone, setInitialSearchDone] = useState(false);

  // Step 1: Doctor Selection
  const [cities, setCities] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    doctorName: '',
    city: '',
    specialization: '',
  });
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Step 2: Branch & Date Selection
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const maxAdvanceBookingDays = 30; // Max days patients can book in advance

  // Step 3: Slot Selection (up to 5 slots)
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<SlotInfo[]>([]);
  const MAX_SLOTS = 5;
  const [bookingFeePerSlot, setBookingFeePerSlot] = useState<number>(350); // Default fee (Rs. 350), updated from system settings API

  const formatDateLocal = (dateValue: Date) => {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseTimeToMinutes = (timeValue: string): number => {
    const parts = (timeValue || '').split(':');
    const hours = Number(parts[0] || 0);
    const minutes = Number(parts[1] || 0);
    return hours * 60 + minutes;
  };

  const addMinutesToTime = (timeValue: string, minutesToAdd: number): string => {
    const total = parseTimeToMinutes(timeValue) + minutesToAdd;
    const hours = Math.floor(total / 60) % 24;
    const minutes = total % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Step 4: Payment & Confirmation
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'payhere' | 'cash'>('payhere');
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [_payhereData, setPayhereData] = useState<any>(null); // Used for storing payment data

  // Terms & Conditions
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-search when patient branch becomes available
  useEffect(() => {
    if (initialSearchDone) return;
    const bid = userDetails.branchId || patientBranchId;
    if (!bid || allBranches.length === 0) return;

    const matchedBranch = allBranches.find((b) => b.id === bid);
    if (matchedBranch) {
      setPatientBranchName(matchedBranch.name);
      setBranchFilter(bid);
      setBranchScope('my-branch');
    }
    setInitialSearchDone(true);
    // auto-search with patient branch
    searchDoctorsWithBranch(bid);
  }, [userDetails.branchId, patientBranchId, allBranches, initialSearchDone]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [citiesRes, specializationsRes, branchesRes] = await Promise.all([
        api.get('/appointments/cities'),
        api.get('/appointments/specializations'),
        api.get('/appointments/branches'),
      ]);

      // Axios interceptor unwraps response.data, so response IS the data
      const citiesData = (citiesRes as any)?.data || citiesRes;
      const specData = (specializationsRes as any)?.data || specializationsRes;
      const branchData = (branchesRes as any)?.data || branchesRes;

      if (citiesData?.status === 200) {
        setCities(citiesData.cities);
      }
      if (specData?.status === 200) {
        setSpecializations(specData.specializations);
      }
      if (branchData?.status === 200) {
        setAllBranches(
          (branchData.branches || []).map((b: any) => ({ id: b.id, name: b.name })),
        );
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search doctors (helper accepting explicit branch)
  const searchDoctorsWithBranch = useCallback(async (overrideBranch?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchFilters.doctorName) params.append('doctor_name', searchFilters.doctorName);
      if (searchFilters.city) params.append('city', searchFilters.city);
      if (searchFilters.specialization) params.append('specialization', searchFilters.specialization);

      const activeBranch = overrideBranch !== undefined ? overrideBranch : branchFilter;
      if (activeBranch) params.append('branch_id', activeBranch);

      const response = await api.get(`/appointments/doctors/search?${params.toString()}`);
      const payload = (response as any)?.data || response;

      if (payload?.status === 200) {
        setDoctors(payload.doctors);
        if (payload.doctors.length === 0) {
          setError('No doctors found matching your criteria. Try adjusting your filters.');
        }
      }
    } catch (err) {
      console.error('Doctor search failed:', err);
      setError('Failed to search doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchFilters, branchFilter]);

  // Search doctors (button click)
  const searchDoctors = useCallback(async () => {
    await searchDoctorsWithBranch();
  }, [searchDoctorsWithBranch]);

  // Expand search to all branches
  const handleExpandSearch = () => {
    setBranchScope('all');
    setBranchFilter('');
    searchDoctorsWithBranch('');
  };

  // Switch back to patient's branch
  const handleMyBranchOnly = () => {
    const bid = userDetails.branchId || patientBranchId;
    setBranchScope('my-branch');
    setBranchFilter(bid || '');
    searchDoctorsWithBranch(bid || '');
  };

  // Manual branch dropdown change
  const handleBranchFilterChange = (value: string) => {
    setBranchFilter(value);
    setBranchScope(value ? 'my-branch' : 'all');
    searchDoctorsWithBranch(value);
  };

  // Handle doctor selection
  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedBranch('');
    setSelectedSchedule(null);
    setSelectedDate('');
    setCurrentStep(2);
  };

  // Handle branch selection
  const handleBranchSelect = (branchId: string) => {
    setSelectedBranch(branchId);
    const schedule = selectedDoctor?.schedules.find(s => s.branch_id === branchId);
    setSelectedSchedule(schedule || null);
    setSelectedDate('');
    setAvailabilityData(null);
    setSelectedSlots([]);
  };

  // Load slots for selected date
  const loadSlots = async (date: string) => {
    if (!selectedDoctor || !selectedBranch) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/availability', {
        params: {
          doctor_id: selectedDoctor.doctor_id,
          branch_id: selectedBranch,
          date: date,
        },
      });

      const payload = (response as any)?.data ? (response as any).data : response;
      const rawSlots = Array.isArray(payload?.slots) ? payload.slots : [];
      const durationFromPayload = Number(payload?.slot_duration_minutes || 0);
      const durationFromSlots = rawSlots.length >= 2
        ? parseTimeToMinutes(rawSlots[1].time) - parseTimeToMinutes(rawSlots[0].time)
        : 0;
      const slotDuration = durationFromPayload || durationFromSlots || 0;

      const mappedSlots: SlotInfo[] = rawSlots.map((slot: any) => ({
        slot_number: Number(slot.slot_index || 0),
        estimated_time: String(slot.time || ''),
        estimated_end_time: slotDuration ? addMinutesToTime(String(slot.time || ''), slotDuration) : String(slot.time || ''),
        is_available: Boolean(slot.available),
        is_booked: !slot.available,
      }));

      const summary = {
        total_slots: mappedSlots.length,
        available: mappedSlots.filter((s) => s.is_available).length,
        booked: mappedSlots.filter((s) => s.is_booked).length,
      };

      const sessionStart = payload?.session_start_time || mappedSlots[0]?.estimated_time || '';
      const sessionEnd = payload?.session_end_time
        || (mappedSlots.length > 0 && slotDuration
          ? addMinutesToTime(mappedSlots[mappedSlots.length - 1].estimated_time, slotDuration)
          : mappedSlots[mappedSlots.length - 1]?.estimated_time || '');

      setAvailabilityData({
        date: date,
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        session: {
          start_time: sessionStart,
          end_time: sessionEnd,
          time_per_patient: slotDuration,
        },
        slots: mappedSlots,
        summary,
        disclaimer: 'Times are estimates and may vary based on consultation duration.',
      });

      if (mappedSlots.length === 0) {
        setError('No slots available');
      }
    } catch (err: any) {
      console.error('Failed to load slots:', err);
      setError(err.response?.data?.message || 'Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlots([]);
    loadSlots(date);
  };

  // Handle slot selection (toggle, max 5)
  const handleSlotSelect = (slot: SlotInfo) => {
    if (!slot.is_available) return;

    setSelectedSlots(prev => {
      const isAlreadySelected = prev.some(s => s.slot_number === slot.slot_number);

      if (isAlreadySelected) {
        // Remove if already selected
        return prev.filter(s => s.slot_number !== slot.slot_number);
      } else if (prev.length < MAX_SLOTS) {
        // Add if not at max
        return [...prev, slot].sort((a, b) => a.slot_number - b.slot_number);
      } else {
        // Max reached
        return prev;
      }
    });
  };

  // Proceed to step 3 (only if slots selected)
  const proceedToConfirmation = () => {
    if (selectedSlots.length > 0) {
      setCurrentStep(3);
    }
  };

  // Create booking (supports multiple slots + PayHere redirect)
  const createBooking = async () => {
    if (!selectedDoctor || selectedSlots.length === 0 || !selectedDate || !userDetails.patientId) {
      setError('Missing required booking information');
      return;
    }

    const isOnline = paymentMethod === 'payhere';

    try {
      setLoading(true);
      setError(null);

      const bookedItems = [] as Array<{ id: string; slot_number: number; appointment_time: string }>;

      for (const slot of selectedSlots) {
        const response = await api.post('/appointments', {
          doctor_id: selectedDoctor.doctor_id,
          branch_id: selectedBranch,
          date: selectedDate,
          slot_index: slot.slot_number,
          patient_id: userDetails.patientId,
          payment_method: isOnline ? 'online' : 'cash',
        });

        const payload = (response as any)?.data ? (response as any).data : response;
        const appointment = payload?.appointment || {};
        bookedItems.push({
          id: String(appointment.id || ''),
          slot_number: slot.slot_number,
          appointment_time: String(appointment.appointment_time || slot.estimated_time || ''),
        });
      }

      if (isOnline && bookedItems.length > 0) {
        // Redirect to PayHere for payment
        setPaymentProcessing(true);
        const appointmentIds = bookedItems.map(b => b.id);
        const origin = window.location.origin;
        const orderTag = appointmentIds.join(',');
        const prepRes = await api.post('/payments/prepare', {
          appointment_ids: appointmentIds,
          return_url: `${origin}/payment/success?order_ids=${orderTag}`,
          cancel_url: `${origin}/payment/cancel?order_ids=${orderTag}`,
        });
        const prepPayload = (prepRes as any)?.data ? (prepRes as any).data : prepRes;
        const action = prepPayload?.action;
        const fields = prepPayload?.fields;
        if (action && fields) {
          initiatePayHerePayment(action, fields);
          return; // user is being redirected — do NOT setLoading(false)
        } else {
          setError('Failed to prepare payment data.');
          setPaymentProcessing(false);
        }
      } else {
        // Cash / clinic payment → show success immediately
        setBookingResult({
          id: bookedItems[0]?.id || '',
          token_number: bookedItems[0]?.slot_number || 0,
          appointment_date: selectedDate,
          appointment_time: bookedItems[0]?.appointment_time || '',
          slot_number: bookedItems[0]?.slot_number || 0,
          status: 'confirmed',
          payment_required: false,
          booking_fee: bookingFeePerSlot,
          bookings: bookedItems.map((item) => ({
            id: item.id,
            token_number: item.slot_number,
            slot_number: item.slot_number,
            appointment_time: item.appointment_time,
          })),
          total_amount: selectedSlots.length * bookingFeePerSlot,
        });
        setBookingConfirmed(true);
      }
    } catch (err: any) {
      console.error('Booking failed:', err);

      if (err.response?.status === 409) {
        setError('Selected slot is already booked. Please choose another slot.');
        if (selectedDoctor && selectedDate) {
          loadSlots(selectedDate);
        }
        setLoading(false);
        return;
      }

      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to create booking. Please try again.');
      setPaymentProcessing(false);
    } finally {
      if (!paymentProcessing) setLoading(false);
    }
  };

  // PayHere payment — auto-submit a hidden HTML form (mandatory for PayHere)
  const initiatePayHerePayment = (action: string, fields: Record<string, string>) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  // Proceed to Step 4
  const proceedToPayment = () => {
    setCurrentStep(4);
  };

  // Reset wizard
  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedDoctor(null);
    setSelectedBranch('');
    setSelectedSchedule(null);
    setSelectedDate('');
    setAvailabilityData(null);
    setSelectedSlots([]);
    setBookingResult(null);
    setBookingConfirmed(false);
    setError(null);
    setTermsAccepted(false);
  };

  // Generate available dates for the next N days
  const getAvailableDates = () => {
    if (!selectedSchedule) return [];

    const dates: { date: string; day: string; label: string }[] = [];
    const today = new Date();
    const scheduleDay = selectedSchedule.schedule_day;

    for (let i = 0; i < maxAdvanceBookingDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

      if (dayName === scheduleDay) {
        dates.push({
          date: formatDateLocal(date),
          day: dayName,
          label: date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
        });
      }
    }

    return dates;
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex justify-between items-center mb-8 px-4">
      {[
        { step: 1, label: 'Find Doctor', icon: FaSearch },
        { step: 2, label: 'Select Date', icon: FaCalendarAlt },
        { step: 3, label: 'Choose Slot', icon: FaClock },
        { step: 4, label: 'Confirm', icon: FaCheck },
      ].map((item, index) => (
        <React.Fragment key={item.step}>
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                currentStep >= item.step
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-200 text-neutral-400'
              } ${currentStep === item.step ? 'ring-4 ring-indigo-200' : ''}`}
            >
              {bookingConfirmed && item.step === 4 ? (
                <FaCheck className="text-xl" />
              ) : (
                <item.icon className="text-xl" />
              )}
            </div>
            <span
              className={`mt-2 text-sm font-medium ${
                currentStep >= item.step ? 'text-indigo-600' : 'text-neutral-400'
              }`}
            >
              {item.label}
            </span>
          </div>
          {index < 3 && (
            <div
              className={`flex-1 h-1 mx-2 rounded ${
                currentStep > item.step ? 'bg-indigo-600' : 'bg-neutral-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800">Book an Appointment</h1>
          <p className="text-neutral-600 mt-2">Find a doctor and schedule your visit in 4 easy steps</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-error-50 border border-red-200 rounded-lg p-4 flex items-start">
            <FaExclamationTriangle className="text-error-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-error-600 underline text-sm mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Step 1: Doctor Selection */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-6">Find Your Doctor</h2>

              {/* Branch Scope Banner */}
              {patientBranchName && (
                <div className="mb-5 bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <FaHospital className="text-indigo-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-indigo-800">
                      {branchScope === 'my-branch' ? (
                        <>Showing doctors from your branch: <strong>{patientBranchName}</strong></>
                      ) : (
                        <>Showing doctors from <strong>all branches</strong></>
                      )}
                    </span>
                  </div>
                  {branchScope === 'my-branch' ? (
                    <button
                      onClick={handleExpandSearch}
                      className="ml-4 text-xs font-medium text-indigo-600 hover:text-indigo-800 underline whitespace-nowrap"
                    >
                      Show all branches
                    </button>
                  ) : (
                    <button
                      onClick={handleMyBranchOnly}
                      className="ml-4 text-xs font-medium text-indigo-600 hover:text-indigo-800 underline whitespace-nowrap"
                    >
                      My branch only
                    </button>
                  )}
                </div>
              )}

              {/* Search Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Doctor Name Search */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by doctor name..."
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchFilters.doctorName}
                    onChange={(e) =>
                      setSearchFilters((prev) => ({ ...prev, doctorName: e.target.value }))
                    }
                  />
                </div>

                {/* Branch Filter */}
                <div className="relative">
                  <FaHospital className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <select
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                    value={branchFilter}
                    onChange={(e) => handleBranchFilterChange(e.target.value)}
                  >
                    <option value="">All Branches</option>
                    {allBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}{b.id === (userDetails.branchId || patientBranchId) ? ' (Your branch)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City Filter */}
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <select
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                    value={searchFilters.city}
                    onChange={(e) =>
                      setSearchFilters((prev) => ({ ...prev, city: e.target.value }))
                    }
                  >
                    <option value="">All Cities</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specialization Filter */}
                <div className="relative">
                  <FaStethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <select
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                    value={searchFilters.specialization}
                    onChange={(e) =>
                      setSearchFilters((prev) => ({ ...prev, specialization: e.target.value }))
                    }
                  >
                    <option value="">All Specializations</option>
                    {specializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={searchDoctors}
                disabled={loading}
                className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <FaSearch className="mr-2" />
                    Search Doctors
                  </>
                )}
              </button>

              {/* Doctor Results */}
              {doctors.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-neutral-700 mb-4">
                    Found {doctors.length} doctor{doctors.length !== 1 ? 's' : ''}
                  </h3>

                  {/* Expand prompt — shown after initial branch-scoped results */}
                  {branchScope === 'my-branch' && patientBranchName && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between">
                      <p className="text-sm text-yellow-800">
                        Want to see doctors in other branches too?
                      </p>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={handleExpandSearch}
                          className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Yes, show all branches
                        </button>
                        <button
                          onClick={() => setError(null)}
                          className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                        >
                          No, keep my branch
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.doctor_id}
                        className="border border-neutral-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleSelectDoctor(doctor)}
                      >
                        <div className="flex items-start">
                          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {doctor.profile_picture ? (
                              <img
                                src={doctor.profile_picture}
                                alt={doctor.full_name}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              <FaUser className="text-indigo-600 text-2xl" />
                            )}
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="font-semibold text-neutral-800 text-lg">
                              Dr. {doctor.full_name}
                            </h4>
                            <p className="text-indigo-600 text-sm">
                              {doctor.specialization || 'General Practitioner'}
                            </p>
                            {doctor.qualification && (
                              <p className="text-neutral-500 text-xs mt-1">{doctor.qualification}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {doctor.schedules.slice(0, 4).map((schedule) => {
                                const isPatientBranch =
                                  schedule.branch_id === (userDetails.branchId || patientBranchId);
                                return (
                                  <span
                                    key={schedule.schedule_id}
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                      isPatientBranch
                                        ? 'bg-green-100 text-green-700 font-medium'
                                        : 'bg-neutral-100 text-neutral-600'
                                    }`}
                                  >
                                    <FaHospital className="mr-1" />
                                    {schedule.branch_name}
                                    {isPatientBranch && ' ★'}
                                  </span>
                                );
                              })}
                              {doctor.schedules.length > 4 && (
                                <span className="text-xs text-neutral-500">
                                  +{doctor.schedules.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                          <FaArrowRight className="text-neutral-400 ml-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Branch & Date Selection */}
          {currentStep === 2 && selectedDoctor && (
            <div>
              <button
                className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
                onClick={() => setCurrentStep(1)}
              >
                <FaArrowLeft className="mr-2" />
                Back to Doctor Search
              </button>

              <h2 className="text-xl font-semibold text-neutral-800 mb-2">Select Branch & Date</h2>
              <p className="text-neutral-600 mb-6">
                Choose where and when you'd like to see Dr. {selectedDoctor.full_name}
              </p>

              {/* Selected Doctor Summary */}
              <div className="bg-indigo-50 rounded-lg p-4 mb-6 flex items-center">
                <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center">
                  <FaUser className="text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-neutral-800">Dr. {selectedDoctor.full_name}</h4>
                  <p className="text-sm text-indigo-600">
                    {selectedDoctor.specialization || 'General Practitioner'}
                  </p>
                </div>
              </div>

              {/* Branch Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select Branch
                </label>
                <div className="grid gap-3">
                  {selectedDoctor.schedules
                    .filter(
                      (schedule, index, self) =>
                        index === self.findIndex((s) => s.branch_id === schedule.branch_id)
                    )
                    .map((schedule) => (
                      <div
                        key={schedule.branch_id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedBranch === schedule.branch_id
                            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                            : 'border-neutral-200 hover:border-indigo-300'
                        }`}
                        onClick={() => handleBranchSelect(schedule.branch_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FaHospital className="text-neutral-400 mr-3" />
                            <div>
                              <p className="font-medium text-neutral-800">{schedule.branch_name}</p>
                              <p className="text-sm text-neutral-500">
                                Available on {schedule.schedule_day}s • {schedule.start_time} -{' '}
                                {schedule.end_time}
                              </p>
                            </div>
                          </div>
                          {selectedBranch === schedule.branch_id && (
                            <FaCheck className="text-indigo-600" />
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Date Selection */}
              {selectedSchedule && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Date
                  </label>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start">
                    <FaInfoCircle className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      Dr. {selectedDoctor.full_name} is available on {selectedSchedule.schedule_day}s.
                      You can book up to {maxAdvanceBookingDays} days in advance.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {getAvailableDates().map((dateInfo) => (
                      <button
                        key={dateInfo.date}
                        className={`p-3 rounded-lg text-center transition-all ${
                          selectedDate === dateInfo.date
                            ? 'bg-indigo-600 text-white'
                            : 'bg-neutral-100 hover:bg-indigo-100 text-neutral-700'
                        }`}
                        onClick={() => handleDateSelect(dateInfo.date)}
                      >
                        <p className="font-medium">{dateInfo.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability Matrix */}
              {availabilityData && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-neutral-700">Available Slots</h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                        Available ({availabilityData.summary.available})
                      </span>
                      <span className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-indigo-500 mr-1"></span>
                        Selected ({selectedSlots.length}/{MAX_SLOTS})
                      </span>
                      <span className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-neutral-300 mr-1"></span>
                        Booked ({availabilityData.summary.booked})
                      </span>
                    </div>
                  </div>

                  {/* Multi-slot info banner */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 flex items-start">
                    <FaInfoCircle className="text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-indigo-800">
                      <strong>Multi-slot booking:</strong> You can select up to {MAX_SLOTS} slots at a time.
                      Each slot costs Rs. {bookingFeePerSlot.toFixed(2)}. Click a slot to select/deselect.
                    </p>
                  </div>

                  <div className="bg-neutral-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-neutral-500">Session Time</p>
                        <p className="font-medium">
                          {availabilityData.session.start_time} - {availabilityData.session.end_time}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          availabilityData.summary.total_slots === 0
                            ? 'bg-neutral-200 text-neutral-600'
                            : availabilityData.summary.available === 0
                            ? 'bg-error-100 text-red-700'
                            : availabilityData.summary.available <= 3
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {availabilityData.summary.total_slots === 0
                          ? 'No Slots'
                          : availabilityData.summary.available === 0
                          ? 'Full'
                          : availabilityData.summary.available <= 3
                          ? 'Nearly Full'
                          : 'Available'}
                      </div>
                    </div>

                    {availabilityData.summary.total_slots === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm flex items-start">
                        <FaExclamationTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                        No slots available for this date.
                      </div>
                    ) : (
                      <>
                        {/* Slot Grid with multi-select */}
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                          {availabilityData.slots.map((slot) => {
                            const isSelected = selectedSlots.some(s => s.slot_number === slot.slot_number);
                            const isMaxReached = selectedSlots.length >= MAX_SLOTS && !isSelected;

                            return (
                              <button
                                key={slot.slot_number}
                                disabled={!slot.is_available || isMaxReached}
                                onClick={() => handleSlotSelect(slot)}
                                className={`p-3 rounded-lg text-center transition-all ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-2 border-indigo-700 ring-2 ring-indigo-300'
                                    : slot.is_available && !isMaxReached
                                    ? 'bg-white border-2 border-green-200 hover:border-green-500 hover:shadow cursor-pointer'
                                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                }`}
                              >
                                <p className="font-bold text-lg">#{slot.slot_number}</p>
                                <p className="text-xs">{slot.estimated_time}</p>
                                {isSelected && <FaCheck className="mx-auto mt-1 text-sm" />}
                              </button>
                            );
                          })}
                        </div>

                        <p className="mt-4 text-xs text-neutral-500 flex items-center">
                          <FaInfoCircle className="mr-1" />
                          {availabilityData.disclaimer}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Selected Slots Summary & Continue Button */}
                  {selectedSlots.length > 0 && (
                    <div className="mt-6 bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-indigo-800">Selected Slots ({selectedSlots.length})</h4>
                        <span className="text-lg font-bold text-indigo-600">
                          Rs. {(selectedSlots.length * bookingFeePerSlot).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedSlots.map(slot => (
                          <span
                            key={slot.slot_number}
                            className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                          >
                            #{slot.slot_number} ({slot.estimated_time})
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSlotSelect(slot);
                              }}
                              className="ml-2 text-indigo-500 hover:text-indigo-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <button
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center font-semibold"
                        onClick={proceedToConfirmation}
                      >
                        Continue with {selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''}
                        <FaArrowRight className="ml-2" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Slot Confirmation */}
          {currentStep === 3 && selectedDoctor && selectedSlots.length > 0 && availabilityData && (
            <div>
              <button
                className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
                onClick={() => setCurrentStep(2)}
              >
                <FaArrowLeft className="mr-2" />
                Back to Date Selection
              </button>

              <h2 className="text-xl font-semibold text-neutral-800 mb-6">Confirm Your Selection</h2>

              {/* Appointment Summary */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Appointment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-neutral-500">Doctor</span>
                    <p className="font-medium text-neutral-800">Dr. {selectedDoctor.full_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Specialization</span>
                    <p className="font-medium text-neutral-800">
                      {selectedDoctor.specialization || 'General'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Branch</span>
                    <p className="font-medium text-neutral-800">{selectedSchedule?.branch_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Date</span>
                    <p className="font-medium text-neutral-800">
                      {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Selected Slots Display */}
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <span className="text-sm text-neutral-500">Selected Token{selectedSlots.length > 1 ? 's' : ''} ({selectedSlots.length})</span>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {selectedSlots.map((slot) => (
                      <div
                        key={slot.slot_number}
                        className="bg-white rounded-lg p-3 border border-indigo-200 text-center min-w-[100px]"
                      >
                        <p className="font-bold text-2xl text-indigo-600">#{slot.slot_number}</p>
                        <p className="text-xs text-neutral-600">
                          {slot.estimated_time} - {slot.estimated_end_time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <p className="text-xs text-neutral-500 flex items-center">
                    <FaInfoCircle className="mr-1" />
                    Estimated times are approximate and may vary based on actual consultation duration.
                  </p>
                </div>
              </div>

              {/* Appointment Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Appointment Type
                </label>
                <select
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                >
                  <option value="consultation">General Consultation</option>
                  <option value="follow_up">Follow-up Visit</option>
                  <option value="routine_checkup">Routine Checkup</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Notes for Doctor (Optional)
                </label>
                <textarea
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="Describe your symptoms or reason for visit..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                className="w-full py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center text-lg font-semibold"
                onClick={proceedToPayment}
              >
                Continue to Payment
                <FaArrowRight className="ml-2" />
              </button>
            </div>
          )}

          {/* Step 4: Payment & Confirmation */}
          {currentStep === 4 && !bookingConfirmed && (
            <div>
              <button
                className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
                onClick={() => setCurrentStep(3)}
              >
                <FaArrowLeft className="mr-2" />
                Back to Details
              </button>

              <h2 className="text-xl font-semibold text-neutral-800 mb-6">Payment Method</h2>

              {/* Payment Fee Info */}
              <div className="bg-blue-50 rounded-xl p-5 mb-6 border border-blue-200">
                <div className="flex items-start gap-3">
                  <FaCreditCard className="text-primary-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-800">Appointment Booking Fee</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm text-neutral-600">
                        <span>Per slot fee:</span>
                        <span>Rs. {bookingFeePerSlot.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-neutral-600">
                        <span>Number of slots:</span>
                        <span>× {selectedSlots.length}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-200">
                        <span className="font-medium text-neutral-800">Total Amount:</span>
                        <span className="font-bold text-xl text-primary-500">
                          Rs. {(selectedSlots.length * bookingFeePerSlot).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-3 mb-6">
                {/* Pay at Clinic - Only for Staff Users (Super Admin, Branch Admin, Receptionist) */}
                {isStaffUser && (
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                        : 'border-neutral-200 hover:border-indigo-300'
                    }`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          paymentMethod === 'cash' ? 'border-indigo-600' : 'border-neutral-300'
                        }`}
                      >
                        {paymentMethod === 'cash' && (
                          <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                        )}
                      </div>
                      <FaMoneyBillWave className="text-green-600 mr-3 text-xl" />
                      <div>
                        <p className="font-medium text-neutral-800">Pay at Clinic</p>
                        <p className="text-sm text-neutral-500">Patient pays cash when they arrive</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PayHere Online Payment */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'payhere'
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'border-neutral-200 hover:border-indigo-300'
                  }`}
                  onClick={() => setPaymentMethod('payhere')}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        paymentMethod === 'payhere' ? 'border-indigo-600' : 'border-neutral-300'
                      }`}
                    >
                      {paymentMethod === 'payhere' && (
                        <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                      )}
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-primary-500 rounded-lg flex items-center justify-center mr-3">
                      <FaLock className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">Pay with PayHere</p>
                      <p className="text-sm text-neutral-500">Secure online payment (Cards, Bank Transfer, eZ Cash)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PayHere Security Notice */}
              {paymentMethod === 'payhere' && (
                <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
                  <div className="flex items-start gap-2">
                    <FaLock className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-green-700 font-medium">Secure Payment Gateway</p>
                      <p className="text-xs text-green-600 mt-1">
                        You will be redirected to PayHere's secure payment page. We accept Visa, MasterCard,
                        American Express, eZ Cash, mCash, and direct bank transfers.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms & Conditions Agreement */}
              <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 text-indigo-600 border-neutral-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="termsAccepted" className="text-sm text-neutral-700 cursor-pointer">
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium underline"
                    >
                      Payment Terms & Conditions
                    </button>{' '}
                    including the <span className="font-semibold text-error-600">Non-Refundable Policy</span> for appointment bookings.
                  </label>
                </div>
              </div>

              {/* Confirm Booking Button */}
              <button
                className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => createBooking()}
                disabled={loading || paymentProcessing || !termsAccepted}
              >
                {loading || paymentProcessing ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    {paymentProcessing ? 'Redirecting to PayHere...' : 'Booking...'}
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2" />
                    Confirm Booking
                  </>
                )}
              </button>

              {!termsAccepted && (
                <p className="text-center text-sm text-amber-600 mt-2">
                  Please accept the terms and conditions to proceed
                </p>
              )}

              {/* Payment In Progress State - shown after PayHere redirect */}
              {paymentProcessing && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaSpinner className="text-primary-500 text-2xl animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">Payment In Progress</h3>
                  <p className="text-neutral-600 mb-4">
                    A new window has opened for payment. Please complete your payment on PayHere.
                  </p>
                  <p className="text-sm text-neutral-500">
                    After successful payment, you will be redirected to the confirmation page.
                    <br />
                    <strong>Do not close this window.</strong>
                  </p>
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">
                      <strong>Note:</strong> Your appointment will only be confirmed after payment is verified.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success State */}
          {bookingConfirmed && bookingResult && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCheck className="text-green-600 text-3xl" />
              </div>

              <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                {bookingResult.bookings && bookingResult.bookings.length > 1
                  ? `${bookingResult.bookings.length} Appointments Confirmed!`
                  : 'Appointment Confirmed!'}
              </h2>
              <p className="text-neutral-600 mb-8">
                Your appointment{bookingResult.bookings && bookingResult.bookings.length > 1 ? 's have' : ' has'} been successfully booked.
              </p>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8 text-left max-w-lg mx-auto">
                {/* Multi-booking display */}
                {bookingResult.bookings && bookingResult.bookings.length > 1 ? (
                  <>
                    <div className="text-center mb-4">
                      <span className="text-sm text-neutral-500">Your Token Numbers</span>
                      <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {bookingResult.bookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="bg-white rounded-lg px-4 py-3 border border-indigo-200 text-center"
                          >
                            <p className="text-3xl font-bold text-indigo-600">#{booking.token_number}</p>
                            <p className="text-xs text-neutral-500">{booking.appointment_time}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-200">
                      <div>
                        <span className="text-sm text-neutral-500">Date</span>
                        <p className="font-medium text-neutral-800">{bookingResult.appointment_date}</p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-500">Total Slots</span>
                        <p className="font-medium text-neutral-800">{bookingResult.bookings.length}</p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-500">Status</span>
                        <p className="font-medium text-green-600 capitalize">
                          {bookingResult.status.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-500">Total Amount</span>
                        <p className="font-medium text-indigo-600">
                          Rs. {bookingResult.total_amount?.toFixed(2) || (bookingResult.bookings.length * bookingFeePerSlot).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Single booking display (backwards compatible) */
                  <>
                    <div className="text-center mb-4">
                      <span className="text-sm text-neutral-500">Your Token Number</span>
                      <p className="text-5xl font-bold text-indigo-600">#{bookingResult.token_number}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-neutral-500">Date</span>
                        <p className="font-medium text-neutral-800">{bookingResult.appointment_date}</p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-500">Time</span>
                        <p className="font-medium text-neutral-800">{bookingResult.appointment_time}</p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-500">Status</span>
                        <p className="font-medium text-green-600 capitalize">
                          {bookingResult.status.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-500">Booking ID</span>
                        <p className="font-medium text-neutral-800 text-xs">{bookingResult.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  onClick={resetWizard}
                >
                  Book Another Appointment
                </button>
                <button
                  className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                  onClick={() => navigate('/patient-dashboard/my-appointments')}
                >
                  View My Appointments
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Payment Terms & Conditions</h2>
              <p className="text-indigo-100 text-sm mt-1">Please read carefully before proceeding</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Non-Refundable Policy */}
              <div className="bg-error-50 border-l-4 border-error-500 p-4 mb-6">
                <h3 className="text-lg font-bold text-red-800 flex items-center">
                  <FaInfoCircle className="mr-2" />
                  Non-Refundable Policy
                </h3>
                <p className="text-red-700 mt-2 text-sm">
                  All appointment booking fees are <strong>strictly non-refundable</strong>. Once payment is completed,
                  the booking fee cannot be refunded under any circumstances, including but not limited to:
                </p>
                <ul className="list-disc list-inside text-red-700 text-sm mt-2 space-y-1">
                  <li>Patient no-show or late arrival</li>
                  <li>Cancellation by the patient for any reason</li>
                  <li>Change of mind or scheduling conflicts</li>
                  <li>Duplicate bookings made by mistake</li>
                </ul>
              </div>

              {/* General Terms */}
              <div className="space-y-4 text-neutral-700 text-sm">
                <div>
                  <h4 className="font-semibold text-neutral-800 mb-2">1. Booking Confirmation</h4>
                  <p>
                    Your appointment is confirmed only after successful payment processing. You will receive a
                    confirmation with your token number and estimated consultation time.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-800 mb-2">2. Appointment Timing</h4>
                  <p>
                    The estimated time provided is approximate and may vary based on the actual consultation duration
                    of previous patients. Please arrive at least 15 minutes before your estimated time.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-800 mb-2">3. Rescheduling Policy</h4>
                  <p>
                    Rescheduling requests must be made at least 24 hours before the appointment time. Rescheduling
                    is subject to doctor availability and may require an additional fee.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-800 mb-2">4. Doctor Unavailability</h4>
                  <p>
                    In the rare event that the doctor is unavailable due to emergency or unforeseen circumstances,
                    you will be offered a rescheduled appointment or a credit for future bookings.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-800 mb-2">5. Consultation Fees</h4>
                  <p>
                    The booking fee covers the appointment slot reservation only. The doctor's consultation fee
                    and any additional charges for treatments, medications, or investigations are payable separately.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-800 mb-2">6. Payment Security</h4>
                  <p>
                    All payments are processed through PayHere, a secure payment gateway. Your payment information
                    is encrypted and never stored on our servers.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-800 mb-2">7. Medical Disclaimer</h4>
                  <p>
                    This booking system is for appointment scheduling only. It does not constitute medical advice.
                    In case of medical emergencies, please call emergency services immediately.
                  </p>
                </div>
              </div>

              {/* Agreement Notice */}
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-amber-800 text-sm">
                  <strong>By checking the agreement box,</strong> you acknowledge that you have read, understood,
                  and agree to these terms and conditions, including the non-refundable policy for appointment booking fees.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3">
              <button
                className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
                onClick={() => setShowTermsModal(false)}
              >
                Close
              </button>
              <button
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentWizard;
