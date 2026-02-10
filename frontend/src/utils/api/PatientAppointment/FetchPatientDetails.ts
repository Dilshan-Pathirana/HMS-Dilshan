import { useEffect, useState } from "react";
import api from "../axios";
import { PatientDetails } from "../../types/users/IPatient.ts";

const useFetchPatientDetails = (userId: string | null) => {
    const [userDetails, setUserDetails] = useState<PatientDetails>({
        firstName: "",
        lastName: "",
        phone: "",
        nic: "",
        email: "",
        address: "",
        patientId: "",
        branchId: "",
        city: "",
        dateOfBirth: "",
        gender: "",
        bloodType: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetchPatientDetails(userId);
        }
    }, [userId]);

    const fetchPatientDetails = async (_userId: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(
                `/patients/me`,
                { params: { include_profile: true } },
            );

            const patientData = response.data || {};
            const userData = patientData.user || {};
            const address = patientData.address || userData.home_address || "";
            const addressParts = typeof address === "string" ? address.split(",") : [];
            const city = addressParts.length > 1 ? addressParts[addressParts.length - 1].trim() : "";
            const emergencyInfo = userData.emergency_contact_info || patientData.emergency_contact || "";
            const emergencyParts = typeof emergencyInfo === "string" ? emergencyInfo.trim().split(" ") : [];
            const emergencyPhone = emergencyParts.length > 1 ? emergencyParts[emergencyParts.length - 1] : "";
            const emergencyName = emergencyPhone
                ? emergencyParts.slice(0, -1).join(" ")
                : emergencyInfo;

            setUserDetails({
                firstName: userData.first_name || "",
                lastName: userData.last_name || "",
                phone: userData.contact_number_mobile || patientData.contact_number || "",
                nic: userData.nic_number || "",
                email: userData.email || "",
                address: address || "",
                patientId: patientData.id || "",
                branchId: userData.branch_id || "",
                city: city,
                dateOfBirth: userData.date_of_birth || "",
                gender: patientData.gender || userData.gender || "",
                bloodType: patientData.blood_group || "",
                emergencyContactName: emergencyName || "",
                emergencyContactPhone: emergencyPhone || "",
            });
        } catch (error) {
            setError("An error occurred while fetching patient details.");
            console.error("Failed to fetch patient details", error);
        } finally {
            setLoading(false);
        }
    };

    return { userDetails, setUserDetails, loading, error };
};

export default useFetchPatientDetails;
