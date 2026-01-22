import { useState } from "react";
import UserTypeDropdown from "./UserTypeDropdown.tsx";
import DoctorCreateForm from "./usersCreateForms/DoctorCreateForm.tsx";
import NurseCreateForm from "./usersCreateForms/NurseCreateForm.tsx";
import CashierCreateForm from "./usersCreateForms/CashierCreateForm.tsx";
import PharmacistCreateForm from "./usersCreateForms/PharmacistCreateForm.tsx";
import GenericUserCreateForm from "./usersCreateForms/GenericUserCreateForm.tsx";

interface UsersTabProps {
    onUserCreated?: () => void;
}

const UsersTab: React.FC<UsersTabProps> = ({ onUserCreated }) => {
    const [selectedUserType, setSelectedUserType] = useState<string>("Doctor");

    const handleUserTypeChange = (userType: string) => {
        setSelectedUserType(userType);
    };

    // User types with specific forms
    const hasSpecificForm = ["Doctor", "Nurse", "Cashier", "Pharmacist"].includes(selectedUserType);

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">{`${selectedUserType} Create Form`}</h1>

            <UserTypeDropdown onSelectUserType={handleUserTypeChange} />

            <div className="mt-4">
                {selectedUserType === "Doctor" && <DoctorCreateForm onSuccess={onUserCreated} />}
                {selectedUserType === "Nurse" && <NurseCreateForm onSuccess={onUserCreated} />}
                {selectedUserType === "Cashier" && <CashierCreateForm onSuccess={onUserCreated} />}
                {selectedUserType === "Pharmacist" && <PharmacistCreateForm onSuccess={onUserCreated} />}
                {!hasSpecificForm && <GenericUserCreateForm userType={selectedUserType} onSuccess={onUserCreated} />}
            </div>
        </div>
    );
};

export default UsersTab;
