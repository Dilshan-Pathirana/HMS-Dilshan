import React from "react";
import { FaCog, FaSignOutAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { UserDropDownProps } from "../../../../utils/types/common/Navbar";
const NavbarUserDropDown: React.FC<UserDropDownProps> = ({
    handleHrDashboard,
    signOutHandle,
    userRole,
}) => {
    return (
        <div className="absolute top-full right-0 mt-2 w-48 sm:w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
            <div className="md:hidden py-1 border-b border-neutral-200">
                {userRole === 1 && (
                    <Link
                        to="/dashboard"
                        className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                        Admin Dashboard
                    </Link>
                )}
                {userRole === 7 || userRole === 1 ? (
                    <Link
                        to="/pharmacy-dashboard"
                        className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                        Pharmacy
                    </Link>
                ) : (
                    ""
                )}
            </div>
            <button
                className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                onClick={handleHrDashboard}
            >
                <FaCog className="mr-2" /> HR Dashboard
            </button>
            <button
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-neutral-100 text-error-500"
                onClick={signOutHandle}
            >
                <FaSignOutAlt className="mr-2 text-error-500" /> Logout
            </button>
        </div>
    );
};

export default NavbarUserDropDown;
