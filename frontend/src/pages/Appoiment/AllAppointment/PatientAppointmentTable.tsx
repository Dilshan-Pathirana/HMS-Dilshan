import { useState, useEffect } from "react";
import { FiEye, FiXCircle } from "react-icons/fi";
import Spinner from "../../../assets/Common/Spinner.tsx";
import Pagination from "../../../components/pharmacyPOS/Common/Pagination.tsx";
import alert from "../../../utils/alert";
import { getAllPatientAppointments } from "../../../utils/api/Appointment/GetAllPatientAppointments.ts";
import { getFilteredAppointments } from "../../../utils/api/Appointment/GetFilteredAppointments.ts";
import AppointmentDetailsModal from "./AppointmentDetailsModal.tsx";
import {
    Appointment,
    Filters,
} from "../../../utils/types/Appointment/IAppointment.ts";
import { AppointmentCancelConfirmationAlert } from "../../../assets/Common/Alert/Appointment/AppointmentCancelConfirmationAlert.tsx";
import { deleteAppointment } from "../../../utils/api/Appointment/DeleteAppointment.ts";
import { sendSMS } from "../../../utils/api/SMS/smsService.ts";
import DoctorAppointmentFilter from "./DoctorAppointmentFilter.tsx";

interface PatientAppointmentTableProps {
    refreshAppointments: boolean;
}
const PatientAppointmentTable: React.FC<PatientAppointmentTableProps> = ({
    refreshAppointments,
}) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);

    const rowsPerPage = 10;

    useEffect(() => {
        fetchAllAppointments();
    }, [refreshAppointments]);

    const fetchAllAppointments = async () => {
        try {
            setIsLoading(true);
            const response = await getAllPatientAppointments();
            if (response.status === 200) {
                setAppointments(response.data.appointments || []);
            } else {
                alert.warn("Failed to fetch patient appointments.");
                setAppointments([]);
            }
        } catch {
            alert.error("An error occurred while fetching appointments.");
            setAppointments([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyFilter = async (filters: Filters) => {
        setIsLoading(true);
        try {
            const response = await getFilteredAppointments(filters);
            if (response.status === 200) {
                setAppointments(response.data.appointments || []);
            } else {
                alert.warn("No matching appointments found.");
                setAppointments([]);
            }
        } catch {
            alert.error("An error occurred while filtering appointments.");
            setAppointments([]);
        } finally {
            setIsLoading(false);
        }
    };

    const totalPages = Math.ceil(appointments.length / rowsPerPage);
    const paginatedAppointments = appointments.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => setCurrentPage(newPage);

    const handleCancelAppointment = async (appointmentId: string | number) => {
        const isConfirmed = await AppointmentCancelConfirmationAlert();
        if (isConfirmed) {
            const appointment = appointments.find(
                (appt) => String(appt.id) === String(appointmentId),
            );

            try {
                const response = await deleteAppointment(String(appointmentId));
                if (response.status === 200) {
                    if (appointment && appointment.phone) {
                        const smsMessage = `Dear ${appointment.patient_first_name} ${appointment.patient_last_name}, your appointment with Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name} scheduled for ${appointment.date} at slot ${appointment.slot} has been canceled.`;

                        try {
                            await sendSMS(appointment.phone, smsMessage);
                        } catch (smsError) {
                            console.error(
                                "Failed to send SMS notification:",
                                smsError,
                            );
                        }
                    }

                    alert.success("Appointment canceled successfully.");
                    setAppointments((prev) =>
                        prev.filter(
                            (appointment) =>
                                String(appointment.id) !==
                                String(appointmentId),
                        ),
                    );
                } else {
                    alert.error("Failed to cancel the appointment.");
                }
            } catch (error) {
                alert.error(
                    "An error occurred while canceling the appointment.",
                );
            }
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <>
                    <div>
                        <DoctorAppointmentFilter
                            onApplyFilter={handleApplyFilter}
                        />
                    </div>
                    {paginatedAppointments.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 mt-4">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[
                                        "Patient Name",
                                        "Doctor Name",
                                        "Branch",
                                        "Date",
                                        "Slot",
                                        "Actions",
                                    ].map((header) => (
                                        <th
                                            key={header}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedAppointments.map((appointment) => (
                                    <tr
                                        key={appointment.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {appointment.patient_first_name}{" "}
                                            {appointment.patient_last_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {appointment.doctor_first_name}{" "}
                                            {appointment.doctor_last_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {appointment.center_name || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {appointment.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {appointment.slot}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center space-x-2">
                                                <FiEye
                                                    className="text-blue-500 cursor-pointer hover:text-blue-700"
                                                    onClick={() =>
                                                        setSelectedAppointment(
                                                            appointment,
                                                        )
                                                    }
                                                />
                                                <FiXCircle
                                                    className="text-red-500 cursor-pointer hover:text-red-700"
                                                    onClick={() =>
                                                        handleCancelAppointment(
                                                            appointment.id,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-4 text-gray-600">
                            No patient appointments found.
                        </div>
                    )}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
            {selectedAppointment && (
                <AppointmentDetailsModal
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                />
            )}
        </div>
    );
};

export default PatientAppointmentTable;
