import React from "react";
import { CgProfile } from "react-icons/cg";
import { ProfileButtonProps } from "../../../../utils/types/pharmacy/PharcacyDashboardLayout";
const ProfileButton: React.FC<ProfileButtonProps> = ({ toggleDropdown }) => {
    return (
        <button
            type="button"
            className="flex text-sm bg-neutral-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
            aria-expanded="false"
            onClick={toggleDropdown}
        >
            <span className="sr-only">Open user menu</span>
            <CgProfile className="w-8 h-8 text-gray-100" />
        </button>
    );
};

export default ProfileButton;
