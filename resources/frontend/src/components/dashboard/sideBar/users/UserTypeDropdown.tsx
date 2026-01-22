// UserTypeDropdown.tsx
import React, { useState } from "react";

interface UserTypeDropdownProps {
    onSelectUserType: (userType: string) => void;
}

const userTypes = [
    "Doctor",
    "Nurse",
    "Cashier",
    "IT Assistant",
    "Branch Admin",
    "Pharmacist",
    "Center Aids",
    "Support Staff",
    "Receptionist",
    "Therapist",
    "Radiology/Imaging Technologist",
    "Medical Technologist",
    "Phlebotomist",
    "Surgical Technologist",
    "Counselor",
    "HRM Manager",
    "Dietitian",
    "Paramedic/EMT",
    "Audiologist",
    "Medical Assistant",
    "Clerk",
    "Director",
    "Secretary"
];

const UserTypeDropdown: React.FC<UserTypeDropdownProps> = ({
    onSelectUserType,
}) => {
    const [selectedUserType, setSelectedUserType] = useState<string>(
        userTypes[0],
    );

    const handleSelectChange = (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const userType = event.target.value;
        setSelectedUserType(userType);
        onSelectUserType(userType); // Notify the parent of the selected user type
    };

    return (
        <div className="flex flex-col space-y-2">
            <label
                htmlFor="userType"
                className="text-sm font-medium text-gray-700"
            >
                Select User Type:
            </label>
            <select
                id="userType"
                value={selectedUserType}
                onChange={handleSelectChange}
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {userTypes.map((type) => (
                    <option key={type} value={type}>
                        {type}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default UserTypeDropdown;
