export interface IDoctorCreatedDiseaseFormTypes {
    doctor_id: string;
    disease_name: string;
    description: string;
    priority: number | "";
}

export interface DoctorDisease {
    id: string;
    doctor_id: string;
    disease_name: string;
    description: string | null;
    priority: number | null;
    doctor_first_name: string;
    doctor_last_name: string;
}

export interface DoctorDiseaseTableProps {
    refreshDiseases?: boolean;
}

export interface DoctorDisease {
    id: string;
    doctor_id: string;
    disease_name: string;
    description: string | null;
    priority: number | null;
    doctor_first_name: string;
    doctor_last_name: string;
}

export interface DiseaseFormData {
    doctor_id: string;
    disease_name: string;
    description: string;
    priority: number | "";
}

export interface DoctorDiseaseEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    disease: DoctorDisease;
}
