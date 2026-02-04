import api from "../axios";
import { Filters } from "../../types/Appointment/IAppointment.ts";

export const getFilteredAppointments = async (filters: Filters) => {
    try {
        return await api.get("/get-filter-appointment", {
            params: filters,
        });
    } catch (error) {
        console.error("Error fetching filtered appointments:", error);
        return { status: 500, data: [] };
    }
};
