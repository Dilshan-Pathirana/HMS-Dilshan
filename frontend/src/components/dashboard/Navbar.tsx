import React, { useState, useRef, useEffect } from "react";
import SignOutButton from "./sideBar/common/SignOutButton.tsx";
import { Link } from "react-router-dom";
import CureLogo from "../../assets/cure-logo.png";
import { CgProfile } from "react-icons/cg";
import { GiHamburgerMenu } from "react-icons/gi";
import { useSelector } from "react-redux";

type NavbarProps = {
    toggleSidebar: () => void;
};

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const userRole = useSelector((state: any) => state.auth.userRole);

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
        <nav className="fixed top-0 z-50 w-full bg-white border-b border-neutral-200 dark:bg-neutral-800 dark:border-gray-700">
            <div className="px-2 sm:px-3 py-2 sm:py-3 lg:px-5 lg:pl-3">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center justify-start rtl:justify-end gap-1 sm:gap-2 min-w-0">
                        <button
                            data-drawer-target="logo-sidebar"
                            data-drawer-toggle="logo-sidebar"
                            aria-controls="logo-sidebar"
                            type="button"
                            className="inline-flex items-center p-2 text-sm text-neutral-500 rounded-lg sm:hidden hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-neutral-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 min-h-[44px] min-w-[44px] flex-shrink-0"
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
                    <div className="flex items-center relative gap-1 sm:gap-3 flex-shrink-0">
                        <div className="hidden sm:flex items-center gap-1 md:gap-2">
                            {userRole !== 5 && (
                                <>
                                    <Link
                                        to="/pharmacy-dashboard"
                                        className="navbar-button hidden md:inline-flex"
                                    >
                                        Switch to Pharmacy
                                    </Link>
                                    <Link
                                        to="/hr-dashboard"
                                        className="navbar-button hidden md:inline-flex"
                                    >
                                        Switch HR
                                    </Link>
                                    <Link to="/pos" className="navbar-button hidden md:inline-flex">
                                        Switch POS
                                    </Link>
                                </>
                            )}
                        </div>
                        <div
                            className="flex items-center"
                            ref={dropdownRef}
                        >
                            <button
                                type="button"
                                className="flex text-sm bg-neutral-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 min-h-[44px] min-w-[44px] items-center justify-center flex-shrink-0"
                                aria-expanded="false"
                                onClick={toggleDropdown}
                            >
                                <span className="sr-only">Open user menu</span>
                                <CgProfile className="w-6 h-6 sm:w-8 sm:h-8 text-gray-100" />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-12 sm:top-14 w-48 sm:w-56 bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600">
                                    <ul className="py-1">
                                        {userRole !== 5 && (
                                            <>
                                                <li className="sm:hidden">
                                                    <Link
                                                        to="/pharmacy-dashboard"
                                                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                                                    >
                                                        Pharmacy
                                                    </Link>
                                                </li>
                                                <li className="sm:hidden">
                                                    <Link
                                                        to="/hr-dashboard"
                                                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                                                    >
                                                        HR
                                                    </Link>
                                                </li>
                                                <li className="sm:hidden">
                                                    <Link
                                                        to="/pos"
                                                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                                                    >
                                                        POS
                                                    </Link>
                                                </li>
                                                <li className="sm:hidden">
                                                    <hr className="border-gray-100 dark:border-gray-600" />
                                                </li>
                                            </>
                                        )}
                                        <li>
                                            <Link
                                                to="/hr-dashboard"
                                                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                                            >
                                                HR Management
                                            </Link>
                                        </li>
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

export default Navbar;
