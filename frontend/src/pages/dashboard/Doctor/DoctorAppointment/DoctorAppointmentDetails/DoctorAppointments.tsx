import { useEffect, useState } from "react";
import api from "../../../../../utils/api/axios";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../store.tsx";
import AppointmentModalStructure from "./AppointmentModal/AppointmentModalStructure.tsx";
import {
    Appointment,
    DoctorAppointmentsProps,
} from "../../../../../utils/types/users/IDoctorData.ts";

const DoctorAppointments = ({
    handleModalClose,
    schedule,
}: DoctorAppointmentsProps) => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [processedAppointments, setProcessedAppointments] = useState<
        Appointment[]
    >([]);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await api.get(
                `/get-doctor-schedule-appointments/${userId}/${schedule.branch_id}/${schedule.id}`,
            );
            const { schedule_appointments } = response.data;

            setProcessedAppointments(schedule_appointments);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            setProcessedAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId && schedule?.branch_id) {
            fetchAppointments();
        }
    }, [userId, schedule?.branch_id]);

    const handleAppointmentsCancelled = () => {
        fetchAppointments();
    };

    return (
        <AppointmentModalStructure
            handleModalClose={handleModalClose}
            schedule={schedule}
            loading={loading}
            appointments={processedAppointments}
            userId={userId}
            onAppointmentsCancelled={handleAppointmentsCancelled}
        />
    );
};

export default DoctorAppointments;
