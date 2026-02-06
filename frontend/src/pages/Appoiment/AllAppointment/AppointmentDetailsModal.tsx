import React from "react";
import { AppointmentDetailsModalProps } from "../../../utils/types/Appointment/IAppointment.ts";

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
    appointment,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-neutral-800 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-xl font-bold text-neutral-800 mb-4">
                    Appointment Details
                </h2>
                <div className="text-neutral-700">
                    <p>
                        <strong>Patient:</strong>{" "}
                        {appointment.patient_first_name}{" "}
                        {appointment.patient_last_name}
                    </p>
                    <p>
                        <strong>Phone:</strong> {appointment.phone || "-"}
                    </p>
                    <p>
                        <strong>NIC:</strong> {appointment.NIC || "-"}
                    </p>
                    <p>
                        <strong>Email:</strong> {appointment.email || "-"}
                    </p>
                    <p>
                        <strong>Doctor:</strong> {appointment.doctor_first_name}{" "}
                        {appointment.doctor_last_name}
                    </p>
                    <p>
                        <strong>Specialization:</strong>{" "}
                        {appointment.areas_of_specialization || "-"}
                    </p>
                    <p>
                        <strong>Branch:</strong>{" "}
                        {appointment.center_name || "-"}
                    </p>
                    <p>
                        <strong>Date:</strong> {appointment.date}
                    </p>
                    <p>
                        <strong>Slot:</strong> {appointment.slot}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="mt-4 bg-error-500 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default AppointmentDetailsModal;
