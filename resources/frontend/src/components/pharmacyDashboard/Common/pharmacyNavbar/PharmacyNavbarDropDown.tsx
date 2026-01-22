import React from "react";
import SignOutButton from "../../../dashboard/sideBar/common/SignOutButton.tsx";
import { PharmacyNavbarDropDownProps } from "../../../../utils/types/pharmacy/PharcacyDashboardLayout";

const PharmacyNavbarDropDown: React.FC<PharmacyNavbarDropDownProps> = ({
    isDropdownOpen,
}) => {
    return (
        isDropdownOpen && (
            <div className="absolute right-0 top-12 sm:top-14 w-48 sm:w-56 bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600">
                <ul className="py-1">
                    <SignOutButton />
                </ul>
            </div>
        )
    );
};

export default PharmacyNavbarDropDown;
