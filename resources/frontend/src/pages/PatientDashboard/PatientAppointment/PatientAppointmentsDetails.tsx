import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FaSearch } from "react-icons/fa";
import axios from "axios";
import { RootState } from "../../../store.tsx";
import { IAppointment } from "../../../utils/types/Appointment/IAppointment.ts";
import PatientAppointmentScheduleTable from "./PatientAppointmentTable/PatientAppointmentScheduleTable.tsx";

const PatientAppointmentsDetails = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);

    const [appointments, setAppointments] = useState<IAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [visibleAppointments, setVisibleAppointments] = useState<number>(5);

    useEffect(() => {
        if (userId) {
            fetchAppointments(userId);
        }
    }, [userId]);

    const fetchAppointments = async (userId: string) => {
        try {
            const response = await axios.get(
                `/api/get-patient-appointments/${userId}`,
            );

            if (response.data.status === 200) {
                setAppointments(response.data.appointments);
            } else {
                setError("No appointments found.");
            }
        } catch (err) {
            setError("Failed to load appointments. Please try again.");
            console.error("Error fetching appointments:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredAppointments = appointments.filter(
        (appointment) =>
            appointment.doctor_first_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            appointment.doctor_last_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            appointment.areas_of_specialization
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    return (
        <div className="w-full md:w-3/4 h-full p-6 bg-gray-100">
            <h2 className="text-xl font-medium text-gray-800 pb-2 border-b border-indigo-200">
                Upcoming Appointments
            </h2>

            <div className="relative mb-3 mt-2">
                <input
                    type="text"
                    className="w-full py-2 px-3 pl-9 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Search by doctor or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-2.5 text-gray-400 text-sm" />
            </div>

            {loading ? (
                <p className="text-center text-gray-600">
                    Loading appointments...
                </p>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : filteredAppointments.length === 0 ? (
                <p className="text-center text-gray-600">
                    No upcoming appointments.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <PatientAppointmentScheduleTable
                        filteredAppointments={filteredAppointments}
                        visibleAppointments={visibleAppointments}
                    />
                </div>
            )}

            {visibleAppointments < filteredAppointments.length && (
                <button
                    className="mt-4 w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
                    onClick={() => setVisibleAppointments((prev) => prev + 5)}
                >
                    Load More
                </button>
            )}
        </div>
    );
};

export default PatientAppointmentsDetails;
