import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../utils/api/axios";
import alert from "../../../utils/alert.ts";
import DoctorScheduleForAdmin from "./Schedule/DoctorScheduleForAdmin.tsx";
import PatientForm from "./Schedule/PatientForm.tsx";
import {
    addPatientAppointmentForAdmin,
    getPatientByPhone,
} from "../../../utils/api/PatientAppointment/PatientAppointmentAdd.ts";
import { daysOfWeek } from "../../../utils/types/Website/dateUtils.ts";

const DoctorScheduleDetails: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { schedule } = location.state || {};
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [allSlots, setAllSlots] = useState<number[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userDetails, setUserDetails] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        nic: "",
        email: "",
        address: "",
    });

    const [timer, setTimer] = useState(600);
    const [isLookingUpPatient, setIsLookingUpPatient] = useState(false);
    const [patientFound, setPatientFound] = useState<boolean | null>(null);
    const [debounceTimer, setDebounceTimer] = useState<number | null>(null);

    useEffect(() => {
        if (!schedule) {
            navigate("/dashboard/doctor/appointment", { replace: true });
        }
    }, [schedule, navigate]);

    useEffect(() => {
        const countdown = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    navigate("/dashboard/doctor/appointment", {
                        replace: true,
                    });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdown);
    }, [navigate]);

    useEffect(() => {
        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
        };
    }, [debounceTimer]);

    useEffect(() => {
        if (selectedDate && schedule?.doctor_id) {
            const checkAvailability = async () => {
                const selectedDay = daysOfWeek[selectedDate.getDay()];
                const formattedDate = selectedDate.toLocaleDateString("en-CA");

                setIsLoadingSlots(true);
                setError(null);
                setAllSlots([]);
                setBookedSlots([]);
                setSelectedSlot(null);

                try {
                    const response = await api.post(
                        "/check-doctor-availability",
                        {
                            doctor_id: schedule.doctor_id,
                            appointment_date: formattedDate,
                            schedule_day: selectedDay,
                        },
                    );

                    if (response.data.status === 200) {
                        const { all_slots, booked_slots } = response.data.data;
                        setAllSlots(all_slots);
                        setBookedSlots(booked_slots);
                    } else {
                        setError(
                            "No available slots found for the selected date.",
                        );
                    }
                } catch (err) {
                    setError(
                        "Failed to fetch available slots. Please try again.",
                    );
                    console.error(err);
                } finally {
                    setIsLoadingSlots(false);
                }
            };

            checkAvailability();
        } else if (!selectedDate) {
            setAllSlots([]);
            setBookedSlots([]);
            setSelectedSlot(null);
            setError(null);
        }
    }, [selectedDate, schedule?.doctor_id]);

    const formatTimer = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    const lookupPatientByPhone = async (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
            setPatientFound(null);
            return;
        }

        setIsLookingUpPatient(true);
        setPatientFound(null);

        try {
            const response = await getPatientByPhone(cleanPhone);

            if (response.status === 200 && response.data.status === 200) {
                const patientData = response.data.data;
                setUserDetails((prev) => ({
                    ...prev,
                    firstName: patientData.firstName || "",
                    lastName: patientData.lastName || "",
                    email: patientData.email || "",
                    nic: patientData.nic || "",
                    address: patientData.address || "",
                    phone: cleanPhone,
                }));
                setPatientFound(true);
            } else {
                setPatientFound(false);
            }
        } catch (error: any) {
            console.error("Error looking up patient:", error);
            if (
                error.response?.status === 404 ||
                error.response?.data?.message?.includes("not found")
            ) {
                setPatientFound(false);
            } else {
                setPatientFound(null);
                console.warn("Patient lookup failed due to server error");
            }
        } finally {
            setIsLookingUpPatient(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "phone") {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            setPatientFound(null);
            setIsLookingUpPatient(false);

            setUserDetails((prev) => ({ ...prev, [name]: value }));

            if (value === "") {
                setUserDetails((prev) => ({
                    ...prev,
                    firstName: "",
                    lastName: "",
                    email: "",
                    nic: "",
                    address: "",
                    phone: "",
                }));
                return;
            }

            const cleanPhone = value.replace(/\D/g, "");
            if (cleanPhone.length >= 10) {
                const newTimer = setTimeout(() => {
                    lookupPatientByPhone(value);
                }, 500);

                setDebounceTimer(newTimer);
            }
        } else {
            setUserDetails((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSlotClick = (slot: number) => {
        setSelectedSlot(slot);
    };

    const handleBooking = async () => {
        const appointmentData = {
            schedule_id: schedule?.id,
            first_name: userDetails.firstName,
            last_name: userDetails.lastName,
            phone: userDetails.phone,
            NIC: userDetails.nic,
            email: userDetails.email,
            address: userDetails.address,
            date: selectedDate?.toLocaleDateString("en-CA"),
            slot: selectedSlot,
            doctor_id: schedule?.doctor_id,
            branch_id: schedule?.branch_id,
        };

        try {
            const response =
                await addPatientAppointmentForAdmin(appointmentData);

            if (response.status === 200) {
                alert.success(
                    response.data.message ||
                        "Appointment created successfully.",
                );
                navigate("/dashboard/doctor/appointment", { replace: true });
            } else {
                alert.error(
                    response.data.message ||
                        "Failed to confirm booking. Please try again.",
                );
            }
        } catch (error) {
            alert.error(
                "An error occurred while booking the appointment. Please try again.",
            );
        }
    };

    if (!schedule) {
        return null;
    }

    return (
        <div className="p-2 mt-20 ml-[16rem] mr-[30px]">
            <div className="flex gap-8">
                <DoctorScheduleForAdmin
                    schedule={schedule}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    isLoadingSlots={isLoadingSlots}
                    error={error}
                    allSlots={allSlots}
                    bookedSlots={bookedSlots}
                    selectedSlot={selectedSlot}
                    handleSlotClick={handleSlotClick}
                />
                <PatientForm
                    userDetails={userDetails}
                    handleInputChange={handleInputChange}
                    handleBooking={handleBooking}
                    timer={timer}
                    formatTimer={formatTimer}
                    isLookingUpPatient={isLookingUpPatient}
                    patientFound={patientFound}
                />
            </div>
        </div>
    );
};

export default DoctorScheduleDetails;
