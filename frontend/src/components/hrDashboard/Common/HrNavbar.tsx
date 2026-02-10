import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import SignOutButton from "../../dashboard/sideBar/common/SignOutButton.tsx";
import CureLogo from "../../../assets/cure-logo.png";
import { CgProfile } from "react-icons/cg";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoNotificationsOutline } from "react-icons/io5";
import NotificationModal from "../../../pages/HRDashboard/Notification/NotificationModal.tsx";
import { useSelector } from "react-redux";
import { AuthState } from "../../../utils/types/auth";
import { getNotificationsByRole } from "../../../utils/api/notification/getNotifications.ts";
import { markNotificationsAsRead } from "../../../utils/api/notification/notificationsRead.ts";

type NavbarProps = {
    toggleSidebar: () => void;
};

const HrNavbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
        useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const notificationDropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const userId = useSelector(
        (state: { auth: AuthState }) => state.auth.userId,
    );
    const userRole = useSelector(
        (state: { auth: AuthState }) => state.auth.userRole,
    );

    const fetchNotifications = async () => {
        try {
            const data = await getNotificationsByRole(userId, userRole);
            if (data && data.notification) {
                setNotifications(data.notification.notifications || []);
                setNotificationCount(data.notification.notification_count || 0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [userId, userRole]);

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen((prev) => !prev);
    };

    const handleMarkNotificationsAsRead = async () => {
        try {
            await markNotificationsAsRead(userRole, notifications);
            setNotificationCount(0);
        } catch (error) {
            console.error("Error marking notifications as read:", error);
        }
    };

    const toggleNotificationDropdown = async () => {
        setIsNotificationDropdownOpen((prev) => !prev);

        if (!isNotificationDropdownOpen) {
            await handleMarkNotificationsAsRead();
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (
            profileDropdownRef.current &&
            !profileDropdownRef.current.contains(event.target as Node)
        ) {
            setIsProfileDropdownOpen(false);
        }
        if (
            notificationDropdownRef.current &&
            !notificationDropdownRef.current.contains(event.target as Node)
        ) {
            setIsNotificationDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleBackClick = () => {
        if (userRole === 7) {
            navigate("/pharmacy-dashboard");
        } else if (userRole === 1) {
            navigate("/dashboard");
        } else if (userRole === 6) {
            navigate("/pos");
        } else {
            navigate("/");
        }
    };

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
                            className="inline-flex items-center p-2 text-sm text-neutral-500 rounded-lg hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-neutral-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 min-h-[44px] min-w-[44px] flex-shrink-0"
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
                        <Link
                            to="/"
                            className="hidden sm:inline-flex text-xs sm:text-sm px-2 sm:px-4 py-2 font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 focus:outline-none focus:ring-4 focus:ring-blue-100 whitespace-nowrap"
                        >
                            Home
                        </Link>
                        <button
                            onClick={handleBackClick}
                            className="hidden sm:inline-flex text-xs sm:text-sm px-2 sm:px-4 py-2 font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-primary-500 dark:hover:bg-primary-500 dark:focus:ring-blue-800 whitespace-nowrap"
                        >
                            Main Dashboard
                        </button>
                        <div className="hidden sm:flex items-center">
                            <SignOutButton />
                        </div>
                        <div
                            className="relative flex items-center"
                            ref={notificationDropdownRef}
                        >
                            <button
                                type="button"
                                className="relative text-neutral-500 hover:bg-neutral-100 p-2 rounded-full dark:text-neutral-400 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                                aria-expanded="false"
                                onClick={toggleNotificationDropdown}
                            >
                                <span className="sr-only">
                                    Open notifications
                                </span>
                                <IoNotificationsOutline className="w-5 h-5 sm:w-6 sm:h-6" />
                                {notificationCount > 0 && (
                                    <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>
                            {isNotificationDropdownOpen && (
                                <NotificationModal
                                    notifications={notifications}
                                />
                            )}
                        </div>

                        <div
                            className="relative flex items-center"
                            ref={profileDropdownRef}
                        >
                            <button
                                type="button"
                                className="flex text-sm bg-neutral-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 min-h-[44px] min-w-[44px] items-center justify-center flex-shrink-0"
                                aria-expanded="false"
                                onClick={toggleProfileDropdown}
                            >
                                <span className="sr-only">Open user menu</span>
                                <CgProfile className="w-6 h-6 sm:w-8 sm:h-8 text-gray-100" />
                            </button>
                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 top-12 sm:top-14 w-48 sm:w-56 bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600">
                                    <div className="px-4 py-3">
                                        <p className="text-sm text-neutral-900 dark:text-white">
                                            Neil Sims
                                        </p>
                                        <p className="text-sm font-medium text-neutral-900 truncate dark:text-gray-300">
                                            neil.sims@flowbite.com
                                        </p>
                                    </div>
                                    <ul className="py-1">
                                        <li className="sm:hidden">
                                            <button
                                                onClick={handleBackClick}
                                                className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                                            >
                                                Main Dashboard
                                            </button>
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

export default HrNavbar;
