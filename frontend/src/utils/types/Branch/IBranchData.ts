export interface IBranchFormDataProps {
    center_name: string;
    register_number: string;
    register_document?: File | null;
    center_type: string;
    owner_type: string;
    owner_full_name: string;
    owner_id_number: string;
    owner_contact_number: string;
    division?: string;
    division_number?: string;
}

export interface IBranchData {
    id: string;
    center_name: string;
    register_number: string;
    register_document: File | string | undefined | null;
    center_type: string;
    owner_type: string;
    owner_full_name: string;
    owner_id_number: string;
    owner_contact_number: string;
    division: string;
    division_number?: string;
    branch_admin?: any; // IUserData
    pharmacies?: any[]; // IPharmacyData[], using any to avoid circular dependency issues for now or until I find where Pharmacy type is
}

export interface IPharmacyData {
    id: number;
    name: string;
    pharmacy_code: string;
    status: string;
    pharmacist_id?: string;
}
