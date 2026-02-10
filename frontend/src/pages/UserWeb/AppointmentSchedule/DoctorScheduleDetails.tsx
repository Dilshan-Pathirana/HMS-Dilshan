import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api/axios";
import alert from "../../../utils/alert.ts";
import DoctorScheduleForPatient from "./Schedule/DoctorScheduleForPatient.tsx";
import PatientForm from "./Schedule/PatientForm.tsx";
// import { addPatientAppointmentForPatient } from "../../../utils/api/PatientAppointment/PatientAppointmentAdd.ts";
import NavBar from "../NavBar.tsx";
import Footer from "../Footer.tsx";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import useFetchPatientDetails from "../../../utils/api/PatientAppointment/FetchPatientDetails.ts";
import { RootState } from "../../../store.tsx";
import { daysOfWeek } from "../../../utils/types/Website/dateUtils.ts";

const DoctorScheduleDetails: React.FC = () => {
    const navigate = useNavigate();
    const schedule = useSelector(
        (state: RootState) => state.doctorSchedule.selectedSchedule,
    );
    const authState = useSelector((state: RootState) => state.auth);
    const userId = authState.userId;
    const canBook = authState.isAuthenticated && authState.userRole === 5;
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [allSlots, setAllSlots] = useState<number[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timer, setTimer] = useState(600);

    const { userDetails, setUserDetails } = useFetchPatientDetails(userId);

    useEffect(() => {
        if (!schedule) {
            navigate("/doctor-schedule", { replace: true });
        }
    }, [schedule, navigate]);

    useEffect(() => {
        const countdown = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    navigate("/doctor-schedule", { replace: true });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdown);
    }, [navigate]);

    const formatTimer = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleCheckAvailability = async (dateToCheck?: Date) => {
        const targetDate = dateToCheck || selectedDate;

        if (!targetDate) {
            setError("Please select a date before checking availability.");
            return;
        }

        const selectedDay = daysOfWeek[targetDate.getDay()];
        const formattedDate = targetDate.toLocaleDateString("en-CA");

        setIsLoadingSlots(true);
        setError(null);
        setAllSlots([]);
        setBookedSlots([]);
        setSelectedSlot(null);

        try {
            const response = await api.post(
                "/schedules/check-availability",
                {
                    doctor_id: schedule?.doctor_id,
                    appointment_date: formattedDate,
                    schedule_day: selectedDay,
                },
            );

            if (response.data.status === 200) {
                const { all_slots, booked_slots } = response.data.data;
                setAllSlots(all_slots);
                setBookedSlots(booked_slots);
            } else {
                const errorMessage =
                    response.data.message ||
                    "No available slots found for the selected date.";
                setError(errorMessage);
            }
        } catch (err: any) {
            if (err.response && err.response.data) {
                const errorMessage =
                    err.response.data.message ||
                    "Failed to fetch available slots. Please try again.";
                setError(errorMessage);
                if (err.response.status === 500 && err.response.data.message) {
                    alert.error(err.response.data.message);
                }
            } else {
                setError("Failed to fetch available slots. Please try again.");
            }
            console.error(err);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleDateChange = (date: Date | null) => {
        setSelectedDate(date);
        if (date) {
            handleCheckAvailability(date);
        } else {
            setAllSlots([]);
            setBookedSlots([]);
            setSelectedSlot(null);
            setError(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserDetails({ ...userDetails, [name]: value });
    };

    const handleSlotClick = (slot: number) => {
        setSelectedSlot(slot);
    };

    // const handleBooking = async () => {
    //     const appointmentData = {
    //         schedule_id: schedule?.id,
    //         first_name: userDetails.firstName,
    //         last_name: userDetails.lastName,
    //         phone: userDetails.phone,
    //         nic: userDetails.nic,
    //         email: userDetails.email,
    //         address: userDetails.address,
    //         date: selectedDate?.toLocaleDateString("en-CA"),
    //         slot: selectedSlot,
    //         doctor_id: schedule?.doctor_id,
    //         branch_id: schedule?.branch_id,
    //     };
    //
    //     try {
    //         const response =
    //             await addPatientAppointmentForPatient(appointmentData);
    //
    //         if (response.status === 200) {
    //             alert.success(
    //                 response.data.message ||
    //                     "Appointment created successfully.",
    //             );
    //             navigate("/doctor-schedule", { replace: true });
    //         } else {
    //             alert.error(
    //                 response.data.message ||
    //                     "Failed to confirm booking. Please try again.",
    //             );
    //         }
    //     } catch (error) {
    //         alert.error(
    //             "An error occurred while booking the appointment. Please try again.",
    //         );
    //     }
    // };

    if (!schedule) {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <div className="flex-grow p-4 mt-24">
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                    <div className="flex-1">
                        <DoctorScheduleForPatient
                            schedule={schedule}
                            selectedDate={selectedDate}
                            setSelectedDate={handleDateChange}
                            isLoadingSlots={isLoadingSlots}
                            error={error}
                            allSlots={allSlots}
                            bookedSlots={bookedSlots}
                            selectedSlot={selectedSlot}
                            handleSlotClick={handleSlotClick}
                        />
                    </div>
                    <div className="flex-1">
                        {canBook ? (
                            <PatientForm
                                userDetails={userDetails}
                                handleInputChange={handleInputChange}
                                timer={timer}
                                formatTimer={formatTimer}
                                appointmentData={
                                    schedule && selectedDate && selectedSlot
                                        ? {
                                            doctorId: schedule.doctor_id,
                                            scheduleId: schedule.id,
                                            branchId: schedule.branch_id,
                                            date: selectedDate.toLocaleDateString("en-CA"),
                                            slot: selectedSlot
                                        }
                                        : undefined
                                }
                            />
                        ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                                <div className="text-lg font-semibold text-amber-900">Log in as a patient to book</div>
                                <div className="text-sm text-amber-800 mt-1">
                                    You can browse available sessions, but booking is only for registered patients.
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 rounded-md bg-primary-600 text-white"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="px-4 py-2 rounded-md border border-amber-300 text-amber-900"
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default DoctorScheduleDetails;
