import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaStethoscope,
    FaChevronRight,
    FaUserMd,
    FaHospital,
    FaInfoCircle,
    FaClock
} from "react-icons/fa";
import api from "../../../../utils/api/axios";
import NavBar from "../../../UserWeb/NavBar.tsx";

import {IAppointment, IDoctorSchedule} from "../../../../utils/types/users/IUserEdit.ts";
import {ChangeSlotsection} from "./ChangeSlotsection";

const AppointmentManagement = () => {
    const { state } = useLocation();
    const appointment: IAppointment = state?.appointment;
    const [doctorSchedule, setDoctorSchedule] = useState<IDoctorSchedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const formattedDate = new Date(appointment.date).toLocaleDateString(
        "en-US",
        {
            timeZone: "UTC",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        },
    );

    const [appointmentDate] = useState<string>(formattedDate);
    const [OpenSlotSection, SetOpenSlotSection] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDoctorSchedule = async () => {
            try {
                const response = await api.get(
                    `/get-doctor-schedule?doctor_id=${appointment.doctor_id}&branch_id=${appointment.branch_id}`
                );
                setDoctorSchedule(response.data.doctor_schedule);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching doctor schedule:", err);
                setError("Failed to load doctor schedule");
                setLoading(false);
                setDoctorSchedule(null);
            }
        };
        fetchDoctorSchedule();
    }, [appointment.doctor_id, appointment.branch_id]);

    const SlotSection = () => {
        SetOpenSlotSection(!OpenSlotSection);
    };

    if (loading) {
        return (
            <div className="max-w-full">
                <NavBar />
                <div className="min-h-screen bg-gray-50 pt-20 pb-10 px-4 mt-10">
                    <div className="max-w-7xl mx-auto text-center py-20">
                        Loading appointment details...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-full">
                <NavBar />
                <div className="min-h-screen bg-gray-50 pt-20 pb-10 px-4 mt-10">
                    <div className="max-w-7xl mx-auto text-center py-20 text-red-500">
                        {error}
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="max-w-full">
            <NavBar />
            <div className="min-h-screen bg-gray-50 pt-20 pb-10 px-4 mt-10">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-[#4484f2] text-white rounded-t-lg p-6 shadow-md mb-6">
                        <h1 className="text-2xl font-bold">
                            Appointment Details
                        </h1>
                        <p className="text-sm mt-1 opacity-90">
                            Review and manage your appointment
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm">
                                        <div className="flex items-center mb-4">
                                            <div className="bg-[#4484f2] bg-opacity-10 p-2 rounded-full mr-2">
                                                <FaStethoscope className="text-[#4484f2]" />
                                            </div>
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Appointment
                                            </h2>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-center text-gray-500 text-sm mb-1">
                                                    <FaUserMd className="mr-2" />
                                                    <span>Doctor</span>
                                                </div>
                                                <p className="font-medium text-gray-800">{`Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}`}</p>
                                            </div>

                                            <div>
                                                <div className="flex items-center text-gray-500 text-sm mb-1">
                                                    <FaStethoscope className="mr-2" />
                                                    <span>Specialization</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {appointment.areas_of_specialization
                                                        .split(",")
                                                        .map(
                                                            (
                                                                specialty: string,
                                                                index: number,
                                                            ) => (
                                                                <span
                                                                    key={index}
                                                                    className={`${
                                                                        index %
                                                                        3 ===
                                                                        0
                                                                            ? "bg-blue-100 text-blue-700"
                                                                            : index %
                                                                            3 ===
                                                                            1
                                                                                ? "bg-purple-100 text-purple-700"
                                                                                : "bg-green-100 text-green-700"
                                                                    } px-2 py-1 rounded-full text-xs font-medium`}
                                                                >
                                                                    {specialty.trim()}
                                                                </span>
                                                            ),
                                                        )}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-center text-gray-500 text-sm mb-1">
                                                    <FaCalendarAlt className="mr-2" />
                                                    <span>Date & Time</span>
                                                </div>
                                                <p className="font-medium text-gray-800">
                                                    {appointmentDate} • Slot{" "}
                                                    {appointment.slot}
                                                </p>
                                            </div>

                                            {doctorSchedule && (
                                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                                    <h3 className="font-semibold text-yellow-800 flex items-center mb-2">
                                                        <FaClock className="mr-2" />
                                                        Doctor's Availability
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-yellow-600">Working Day</p>
                                                            <p className="font-medium text-yellow-800">
                                                                {doctorSchedule.schedule_day}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-yellow-600">Hours</p>
                                                            <p className="font-medium text-yellow-800">
                                                                {doctorSchedule.start_time} - {doctorSchedule.end_time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm">
                                        <div className="flex items-center mb-4">
                                            <div className="bg-[#4484f2] bg-opacity-10 p-2 rounded-full mr-2">
                                                <FaMapMarkerAlt className="text-[#4484f2]" />
                                            </div>
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Location
                                            </h2>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-center text-gray-500 text-sm mb-1">
                                                    <FaHospital className="mr-2" />
                                                    <span>Center</span>
                                                </div>
                                                <p className="font-medium text-gray-800">
                                                    {appointment.center_name}
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex items-center text-gray-500 text-sm mb-1">
                                                    <FaMapMarkerAlt className="mr-2" />
                                                    <span>Address</span>
                                                </div>
                                                <p className="font-medium text-gray-800">
                                                    {appointment.address}
                                                </p>
                                            </div>

                                            <div className="mt-4">
                                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                                    <div className="flex items-start">
                                                        <FaInfoCircle className="text-blue-500 mt-1 mr-2" />
                                                        <div>
                                                            <p className="text-sm text-blue-800">
                                                                Please arrive 15
                                                                minutes before
                                                                your appointment
                                                                time
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                                <div className="flex items-start">
                                                    <div className="bg-red-100 p-2 rounded-full mr-3">
                                                        <FaCalendarAlt className="text-red-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-800">
                                                            Cancel Appointment
                                                        </h3>
                                                        <p className="text-sm text-gray-500 mb-3">
                                                            Cancel this
                                                            appointment
                                                            permanently
                                                        </p>
                                                        <button onClick={() => navigate("/patient-dashboard/*")} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center text-sm font-medium">
                                                            Cancel
                                                            <FaChevronRight className="ml-2 text-xs" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                                <div className="flex items-start">
                                                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                                                        <FaCalendarAlt className="text-[#4484f2]" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-800">
                                                            Reschedule
                                                        </h3>
                                                        <p className="text-sm text-gray-500 mb-2">
                                                            Change date or time
                                                            of appointment
                                                        </p>
                                                        <div className="mb-3">
                                                            <div className="text-xs text-gray-600 mb-1">
                                                                Reschedule Count: {appointment.reschedule_count}/1
                                                            </div>
                                                            {appointment.reschedule_count >= 1 ? (
                                                                <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                                                    Maximum reschedules reached
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                                                    {1 - appointment.reschedule_count} reschedule remaining
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                onClick={SlotSection}
                                                                disabled={appointment.reschedule_count >= 1}
                                                                className={`px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center w-full md:w-auto text-base font-medium ${
                                                                    appointment.reschedule_count >= 1
                                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                        : "bg-blue-50 hover:bg-blue-100 text-[#4484f2]"
                                                                }`}>
                                                                <FaCalendarAlt className="mr-3" />
                                                                Reschedule
                                                                Appointment
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-full">
                                        {OpenSlotSection && (
                                            <ChangeSlotsection
                                                originalSlot={Number(appointment.slot)}
                                                appointmentDate={appointment.date}
                                                doctorSchedule={{ schedule_day: doctorSchedule?.day_of_week || doctorSchedule?.schedule_day || '' }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentManagement;
