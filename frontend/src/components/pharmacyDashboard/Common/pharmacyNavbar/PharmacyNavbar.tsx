import React, { useState } from "react";
import { Link } from "react-router-dom";
import CureLogo from "../../../../assets/cure-logo.png";
import { GiHamburgerMenu } from "react-icons/gi";
import PharmacyNavbarDropDown from "./PharmacyNavbarDropDown.tsx";
import ProfileButton from "./ProfileButton.tsx";
import "../../../../assets/Styles/navbar-styles.css";
import { NavbarProps } from "../../../../utils/types/pharmacy/PharcacyDashboardLayout";

const PharmacyNavbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="px-2 sm:px-3 py-2 sm:py-3 lg:px-5 lg:pl-3">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center justify-start rtl:justify-end gap-1 sm:gap-2 min-w-0">
                        <button
                            data-drawer-target="logo-sidebar"
                            data-drawer-toggle="logo-sidebar"
                            aria-controls="logo-sidebar"
                            type="button"
                            className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 min-h-[44px] min-w-[44px] flex-shrink-0"
                            onClick={toggleSidebar}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <GiHamburgerMenu className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <Link to="/" className="flex flex-shrink-0">
                            <img
                                src={CureLogo}
                                className="h-10 sm:h-[50px] w-10 sm:w-[50px]"
                                alt="Cure Logo"
                            />
                        </Link>
                    </div>
                    <div className="flex items-center relative gap-1 sm:gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <ProfileButton toggleDropdown={toggleDropdown} />
                            <PharmacyNavbarDropDown
                                isDropdownOpen={isDropdownOpen}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default PharmacyNavbar;
