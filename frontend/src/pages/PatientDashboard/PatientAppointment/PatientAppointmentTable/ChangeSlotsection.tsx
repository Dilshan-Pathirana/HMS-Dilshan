import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../../utils/api/axios";
import axios from "axios";
import DatePicker from "react-datepicker";
import {
    FaUserMd,
    FaMapMarkerAlt,
    FaClock,
    FaCalendarAlt,
} from "react-icons/fa";
import Toast from "../../../dashboard/Users/UserManagement/UserView/Toast.tsx";
import DoctorAppoinmentCard from "./DoctorAppoinmentCard.tsx";
import { getAllBranches } from "../../../../utils/api/branch/GetAllBranches.ts";
import {
    Branch,
    ChangeSlotsectionProps,
    MoreBranchesProps,
} from "../../../../utils/types/Appointment/IDoctorSchedule.ts";
import { getCorrectFormattedDate } from "../../../../utils/helperFunctions/PatientAppointment.ts";
import {
    filterScheduleDays,
    getOneMonthLater,
    getToday,
} from "../../../../utils/helperFunctions/ScheduleDateArrangeInCalender.ts";
import { sendSMS } from "../../../../utils/api/SMS/smsService.ts";

export const ChangeSlotsection: React.FC<ChangeSlotsectionProps> = ({
    originalSlot,
    appointmentDate,
}) => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const appointment = state?.appointment;
    const [allSchedules, setAllSchedules] = useState<MoreBranchesProps[]>([]);
    const [selectedSchedule, setSelectedSchedule] =
        useState<MoreBranchesProps | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [availableSlots, setAvailableSlots] = useState<number[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [showAllBranches, setShowAllBranches] = useState(false);
    const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hoveredOriginalSlot, setHoveredOriginalSlot] = useState<
        number | null
    >(null);
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error" | "info" | "warning";
        visible: boolean;
    } | null>(null);

    const showToast = (
        message: string,
        type: "success" | "error" | "info" | "warning",
    ) => {
        setToast({ message, type, visible: true });
        setTimeout(() => {
            setToast((prev) => (prev ? { ...prev, visible: false } : null));
        }, 3000);
    };

    const handleShowAllBranches = async () => {
        if (showAllBranches) {
            setShowAllBranches(false);
            resetSelection();
            return;
        }

        setIsLoadingSchedules(true);
        setError(null);

        try {

            // Use the shared api instance for requests
            const scheduleRes = await api.get(`/get-doctor-schedule-by-id`, {
                params: {
                    doctor_id: appointment.doctor_id,
                },
            });

            const branchesRes = await getAllBranches();
            const allBranches: Branch[] = branchesRes.data.branches;

            const schedulesWithBranches: MoreBranchesProps[] =
                scheduleRes.data.doctorSchedule.map((schedule: any) => {
                    const matchedBranch = allBranches.find(
                        (branch) => branch.id === schedule.branch_id,
                    );
                    return {
                        ...schedule,
                        branch: matchedBranch || null,
                    };
                });

            const sortedSchedules = schedulesWithBranches.sort((a, b) => {
                if (a.branch_id === appointment.branch_id) return -1;
                if (b.branch_id === appointment.branch_id) return 1;
                const nameA = a.branch_center_name || "";
                const nameB = b.branch_center_name || "";
                return nameA.localeCompare(nameB);
            });

            setAllSchedules(sortedSchedules);
            setShowAllBranches(true);
        } catch (error) {
            console.error("Error getting all branch schedules:", error);
            showToast("Failed to fetch branch schedules", "error");
        } finally {
            setIsLoadingSchedules(false);
        }
    };

    const handleScheduleSelect = (schedule: MoreBranchesProps) => {
        setSelectedSchedule(schedule);
        setSelectedDate(null);
        setAvailableSlots([]);
        setBookedSlots([]);
        setSelectedSlot(null);
        setError(null);
    };

    const handleDateSelect = async (date: Date | null) => {
        setSelectedDate(date);
        setSelectedSlot(null);

        if (!date || !selectedSchedule) {
            setAvailableSlots([]);
            setBookedSlots([]);
            return;
        }

        setIsLoadingSlots(true);
        setError(null);

        try {
            const formattedDate = getCorrectFormattedDate(date);
            const response = await api.post(
                "/schedules/check-availability",
                {
                    doctor_id: appointment.doctor_id,
                    appointment_date: formattedDate,
                    schedule_day: selectedSchedule.schedule_day,
                    branch_id: selectedSchedule.branch_id,
                },
            );

            if (response.data.status === 200) {
                const { all_slots, booked_slots } = response.data.data;
                setAvailableSlots(all_slots);
                setBookedSlots(booked_slots);
            } else {
                setError("No available slots found for the selected date.");
                setAvailableSlots([]);
                setBookedSlots([]);
            }
        } catch (err) {
            setError("Failed to fetch available slots. Please try again.");
            setAvailableSlots([]);
            setBookedSlots([]);
            console.error(err);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleConfirmChange = async () => {
        if (!selectedSchedule || !selectedDate || !selectedSlot) {
            showToast(
                "Please select a branch, date, and slot before confirming.",
                "error",
            );
            return;
        }

        const formattedNewDate = getCorrectFormattedDate(selectedDate);

        try {
            setIsSubmitting(true);
            const response = await api.put(
                `/change-appointment-date/${appointment.user_id}`,
                {
                    doctor_id: appointment.doctor_id,
                    schedule_id: appointment.schedule_id,
                    date: appointmentDate
                        ? getCorrectFormattedDate(new Date(appointmentDate))
                        : "",
                    existing_slot: originalSlot,
                    new_branch_id: selectedSchedule.branch_id,
                    new_date: formattedNewDate,
                    new_slot: selectedSlot,
                },
            );

            if (response.data.status === 200) {
                if (appointment && appointment.phone) {
                    const smsMessage = `Dear ${appointment.patient_first_name} ${appointment.patient_last_name}, your appointment with Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name} has been rescheduled to ${formattedNewDate} at slot ${selectedSlot} at ${selectedSchedule.branch_center_name || "the selected branch"}.`;

                    try {
                        await sendSMS(appointment.phone, smsMessage);
                    } catch (smsError) {
                        console.error(
                            "Failed to send SMS notification:",
                            smsError,
                        );
                    }
                }

                showToast(response.data.message, "success");
                setTimeout(() => navigate(-1), 2000);
            } else {
                showToast(
                    response.data.message || "Failed to change appointment.",
                    "error",
                );
            }
        } catch (error) {
            console.error("Error changing appointment:", error);
            showToast(
                "An error occurred while changing the appointment.",
                "error",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetSelection = () => {
        setSelectedSchedule(null);
        setSelectedDate(null);
        setAvailableSlots([]);
        setBookedSlots([]);
        setSelectedSlot(null);
        setError(null);
    };

    const handleSlotClick = (slot: number) => {
        setSelectedSlot(slot);
    };

    const handleSlotHover = (slot: number) => {
        if (
            selectedSchedule?.branch_id === appointment.branch_id &&
            selectedDate &&
            appointmentDate &&
            getCorrectFormattedDate(selectedDate) ===
                getCorrectFormattedDate(new Date(appointmentDate)) &&
            slot === originalSlot
        ) {
            setHoveredOriginalSlot(slot);
        }
    };

    const handleSlotLeave = () => {
        setHoveredOriginalSlot(null);
    };

    const bookedSlotNumbers = bookedSlots.map(Number);

    return (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-md">
            {toast?.visible && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <h3 className="flex items-center font-medium mb-6 text-gray-800">
                <FaCalendarAlt className="w-5 h-5 mr-2 text-blue-500" />
                Select a new time slot
            </h3>

            <div className="flex flex-col gap-6">
                <DoctorAppoinmentCard
                    handleShowMoreSchedules={handleShowAllBranches}
                />

                {showAllBranches && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                            <FaMapMarkerAlt className="text-blue-500 mr-2" />
                            <h4 className="text-lg font-semibold text-gray-800">
                                Available Branches & Schedules
                                {isLoadingSchedules && (
                                    <span className="ml-2 text-sm text-blue-600">
                                        Loading...
                                    </span>
                                )}
                            </h4>
                        </div>

                        {allSchedules.length > 0 ? (
                            <div className="space-y-3 mb-6">
                                {allSchedules.map((schedule) => {
                                    const isSelected =
                                        selectedSchedule?.id === schedule.id;
                                    const isCurrentBranch =
                                        schedule.branch_id ===
                                        appointment.branch_id;

                                    return (
                                        <div
                                            key={schedule.id}
                                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                                isSelected
                                                    ? "border-blue-500 bg-blue-50 shadow-md"
                                                    : "border-gray-200 hover:border-blue-300 bg-white"
                                            }`}
                                            onClick={() =>
                                                handleScheduleSelect(schedule)
                                            }
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div
                                                        className={`p-2 rounded-full mr-3 ${
                                                            isCurrentBranch
                                                                ? "bg-green-100"
                                                                : "bg-blue-100"
                                                        }`}
                                                    >
                                                        <FaMapMarkerAlt
                                                            className={`w-4 h-4 ${
                                                                isCurrentBranch
                                                                    ? "text-green-600"
                                                                    : "text-blue-600"
                                                            }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-semibold text-gray-800 flex items-center">
                                                            {schedule.branch_center_name ||
                                                                "Unknown Branch"}
                                                            {isCurrentBranch && (
                                                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                                    Current
                                                                    Branch
                                                                </span>
                                                            )}
                                                        </h5>
                                                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                                            <span className="flex items-center">
                                                                <FaCalendarAlt className="w-3 h-3 mr-1" />
                                                                {
                                                                    schedule.schedule_day
                                                                }
                                                                s
                                                            </span>
                                                            <span className="flex items-center">
                                                                <FaClock className="w-3 h-3 mr-1" />
                                                                {
                                                                    schedule.start_time
                                                                }
                                                            </span>
                                                            <span className="flex items-center">
                                                                <FaUserMd className="w-3 h-3 mr-1" />
                                                                {
                                                                    schedule.max_patients
                                                                }{" "}
                                                                slots
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-gray-200 text-gray-600"
                                                    }`}
                                                >
                                                    {isSelected
                                                        ? "Selected"
                                                        : "Select"}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            !isLoadingSchedules && (
                                <p className="text-gray-500 text-center py-4">
                                    No schedules found for this doctor
                                </p>
                            )
                        )}

                        {selectedSchedule && (
                            <div className="border-t pt-4">
                                <h5 className="font-medium text-gray-700 mb-3">
                                    Select Date for{" "}
                                    {selectedSchedule.branch_center_name ||
                                        "Selected Branch"}
                                </h5>
                                <div className="flex items-center gap-4">
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={handleDateSelect}
                                        placeholderText="Select Date"
                                        dateFormat="yyyy/MM/dd"
                                        minDate={getToday()}
                                        maxDate={getOneMonthLater()}
                                        className="border border-gray-300 rounded-md px-3 py-2"
                                        filterDate={(date) => {
                                            const isPastDate =
                                                date < getToday();
                                            const isScheduleDay =
                                                filterScheduleDays(
                                                    date,
                                                    selectedSchedule.schedule_day,
                                                );
                                            return !isPastDate && isScheduleDay;
                                        }}
                                        dayClassName={(date) => {
                                            if (
                                                !filterScheduleDays(
                                                    date,
                                                    selectedSchedule.schedule_day,
                                                )
                                            ) {
                                                return "text-gray-300 cursor-not-allowed";
                                            } else {
                                                return "bg-blue-200 text-blue-800 font-semibold";
                                            }
                                        }}
                                    />
                                    {isLoadingSlots && (
                                        <span className="text-blue-600 text-sm">
                                            Checking availability...
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    Available on:{" "}
                                    <span className="font-semibold">
                                        {selectedSchedule.schedule_day}s
                                    </span>
                                </p>
                            </div>
                        )}

                        {availableSlots.length > 0 && (
                            <div className="border-t pt-4 mt-4">
                                <h5 className="font-medium text-gray-700 mb-3">
                                    Available Slots
                                </h5>
                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {availableSlots.map((slot) => {
                                        const isBooked =
                                            bookedSlotNumbers.includes(slot);
                                        const isSelected =
                                            slot === selectedSlot;
                                        const isOriginalSlot =
                                            selectedSchedule?.branch_id ===
                                                appointment.branch_id &&
                                            selectedDate &&
                                            appointmentDate &&
                                            getCorrectFormattedDate(
                                                selectedDate,
                                            ) ===
                                                getCorrectFormattedDate(
                                                    new Date(appointmentDate),
                                                ) &&
                                            slot === originalSlot;

                                        return (
                                            <div
                                                key={slot}
                                                className="relative"
                                                onMouseEnter={() =>
                                                    handleSlotHover(slot)
                                                }
                                                onMouseLeave={handleSlotLeave}
                                            >
                                                {hoveredOriginalSlot ===
                                                    slot && (
                                                    <div className="absolute -bottom-6 left-0 right-0 bg-blue-100 text-blue-800 text-xs text-center py-1 rounded z-10">
                                                        Current Slot
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        handleSlotClick(slot)
                                                    }
                                                    className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-all ${
                                                        isOriginalSlot
                                                            ? "bg-blue-200 text-blue-800 border-2 border-blue-400"
                                                            : isBooked
                                                              ? "bg-yellow-100 text-gray-500 cursor-not-allowed"
                                                              : isSelected
                                                                ? "bg-red-600 text-white"
                                                                : "bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                                                    }`}
                                                    disabled={
                                                        isBooked &&
                                                        !isOriginalSlot
                                                    }
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <FaUserMd
                                                            className={`text-lg mb-1 ${
                                                                isOriginalSlot
                                                                    ? "text-blue-600"
                                                                    : isBooked
                                                                      ? "text-gray-400"
                                                                      : isSelected
                                                                        ? "text-white"
                                                                        : "text-blue-500"
                                                            }`}
                                                        />
                                                        <span>#{slot}</span>
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="border-t pt-4 mt-4">
                                <p className="text-red-600 text-sm bg-red-50 p-3 rounded">
                                    {error}
                                </p>
                            </div>
                        )}

                        {selectedSchedule && selectedDate && selectedSlot && (
                            <div className="border-t pt-4 mt-4 flex justify-end">
                                <button
                                    onClick={handleConfirmChange}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
                                >
                                    {isSubmitting
                                        ? "Processing..."
                                        : selectedSchedule.branch_id ===
                                            appointment.branch_id
                                          ? "Confirm Time Change"
                                          : "Confirm Branch Change"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
