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

    const fetchPatientDetails = async (userId: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(
                `/patients/${userId}`,
            );
            if (response.data.status === 200) {
                const patientData = response.data.data;
                setUserDetails({
                    firstName: patientData.first_name || "",
                    lastName: patientData.last_name || "",
                    phone: patientData.phone || "",
                    nic: patientData.NIC || "",
                    email: patientData.email || "",
                    address: patientData.address || "",
                    patientId: patientData.patient_id || "",
                    branchId: patientData.branch_id || "",
                    city: patientData.city || "",
                    dateOfBirth: patientData.date_of_birth || "",
                    gender: patientData.gender || "",
                    bloodType: patientData.blood_type || "",
                    emergencyContactName: patientData.emergency_contact_name || "",
                    emergencyContactPhone: patientData.emergency_contact_phone || "",
                });
            } else {
                setError("Failed to fetch patient details");
                console.error("Error fetching patient details:", response.data);
            }
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
