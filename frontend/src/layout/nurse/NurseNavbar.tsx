import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import CureLogo from "../../assets/cure-logo.png";
import { GiHamburgerMenu } from "react-icons/gi";
import { CgProfile } from "react-icons/cg";
import SignOutButton from "../../components/dashboard/sideBar/common/SignOutButton";

interface NurseNavbarProps {
    toggleSidebar: () => void;
}

const NurseNavbar: React.FC<NurseNavbarProps> = ({ toggleSidebar }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Get branch name from Redux state or localStorage
    const authState = useSelector((state: RootState) => state.auth);
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const branchName = authState.branchName || userInfo.branch_name || userInfo.branch?.name || userInfo.branch?.center_name || 'Nurse Station';

    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target as Node)
        ) {
            setIsDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
                        {/* Branch Name Display */}
                        <div className="hidden sm:block ml-2">
                            <h1 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                {branchName}
                            </h1>
                            <p className="text-xs text-gray-500">Nurse Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center relative gap-1 sm:gap-2 flex-shrink-0">
                        <div
                            className="flex items-center"
                            ref={dropdownRef}
                        >
                            <button
                                type="button"
                                className="flex text-sm bg-teal-600 rounded-full focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-700 min-h-[44px] min-w-[44px] items-center justify-center flex-shrink-0"
                                aria-expanded="false"
                                onClick={toggleDropdown}
                            >
                                <span className="sr-only">Open user menu</span>
                                <CgProfile className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-12 sm:top-14 w-48 sm:w-56 bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600">
                                    <ul className="py-1">
                                        <SignOutButton />
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NurseNavbar;
