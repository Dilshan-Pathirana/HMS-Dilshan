import React from "react";
import { IPatientDetailsShowTableProps } from "../../../../../../utils/types/users/IDoctorData.ts";

const PatientDetailsShowTable: React.FC<IPatientDetailsShowTableProps> = ({
    appointmentWithGrouped,
}) => {
    const getStatusBadge = (status: number) => {
        if (status === 0) {
            return (
                <span className="inline-block bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Cancelled
                </span>
            );
        } else if (status === 1) {
            return (
                <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Active
                </span>
            );
        } else {
            return (
                <span className="inline-block bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Unknown
                </span>
            );
        }
    };

    return (
        <div className="overflow-x-auto ml-4">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                            Patient Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                            Phone
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                            Patient Selected Slot
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {appointmentWithGrouped.map((appointment, index) => (
                        <tr
                            key={`${appointment.patient_selected_slot}-${index}`}
                            className="hover:bg-gray-50"
                        >
                            <td className="px-4 py-2 text-sm text-gray-700">
                                {appointment.patient_first_name}{" "}
                                {appointment.patient_last_name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                                {appointment.patient_phone}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    {appointment.patient_selected_slot}
                                </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                                {getStatusBadge(appointment.status)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PatientDetailsShowTable;
