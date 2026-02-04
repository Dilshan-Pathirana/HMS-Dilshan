import { Bell } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import React, { useEffect, useState } from "react";
import {
    useAccessToken,
    useUserRole,
} from "../../../../utils/state/checkAuthenticatedUserStates.ts";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store.tsx";
import { UserSignOut } from "../../../../utils/api/user/UserSignOut.ts";
import NavbarUserDropDown from "./NavbarUserDropDown.tsx";
import NavbarNotificationSection from "./NavbarNotificationSection.tsx";
import Pusher from "pusher-js";
import {
    INotificationDataForStockLimitReach,
    NavbarProps,
} from "../../../../utils/types/common/Navbar";
import { notificationDataAttributeForStockLimitReach } from "../../../../utils/form/formFieldsAttributes/POS.ts";

export default function Navbar({ toggleSidebar }: NavbarProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationSectionShow, setIsNotificationSectionShow] =
        useState(false);
    const [notificationData, setNotificationData] =
        useState<INotificationDataForStockLimitReach>(
            notificationDataAttributeForStockLimitReach,
        );
    const [isNewNotificationAvailable, setIsNewNotificationAvailable] =
        useState(false);
    const accessToken = useAccessToken();
    const userRole = useUserRole();
    const navigate = useNavigate();
    const useAppDispatch = () => useDispatch<AppDispatch>();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const pusher = new Pusher("c17c8ca1cabc805f534d", {
            cluster: "ap2",
        });

        const channel = pusher.subscribe("vivd-firefly-891");

        channel.bind("reminder.sent", (data: any) => {
            setNotificationData(data);
            if (data) {
                setIsNewNotificationAvailable(true);
            }
        });

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    const showNotificationSectionVisibility = () => {
        setIsNotificationSectionShow((prev) => !prev);
    };

    const handleHrDashboard = () => {
        navigate("/hr-dashboard");
    };

    const signOutHandle = async (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.preventDefault();

        await dispatch(UserSignOut({ accessToken, userRole }));
        navigate("/login");
    };

    return (
        <header className="flex items-center justify-between px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 bg-[#ffffff] border-l-2 border-gray-200 gap-2">
            <div className="flex items-center gap-2 min-w-0">
                <button
                    onClick={toggleSidebar}
                    className="text-gray-500 focus:outline-none md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                >
                    <svg
                        className="h-5 w-5 sm:h-6 sm:w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M4 6H20M4 12H20M4 18H20"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
                <h1 className="text-lg sm:text-2xl font-semibold text-gray-800 truncate">
                    Dashboard
                </h1>
            </div>
            <div className="flex items-center relative gap-1 sm:gap-2 flex-shrink-0">
                <div className="hidden md:flex items-center gap-1 lg:gap-2">
                    {userRole === 1 && (
                        <Link to="/dashboard" className="navbar-button text-xs sm:text-sm">
                            Admin
                        </Link>
                    )}
                    {userRole === 7 || userRole === 1 ? (
                        <Link to="/pharmacy-dashboard" className="navbar-button text-xs sm:text-sm">
                            Pharmacy
                        </Link>
                    ) : (
                        ""
                    )}

                    <Link to="/hr-dashboard" className="navbar-button text-xs sm:text-sm">
                        HR
                    </Link>
                </div>

                <div className="flex items-center relative gap-1">
                    <button
                        onClick={showNotificationSectionVisibility}
                        className="text-gray-500 p-2 rounded-full hover:bg-gray-100 focus:outline-none relative min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                    >
                        <Bell className="h-5 w-5" />
                        {notificationData.product_name !== "" &&
                        isNewNotificationAvailable ? (
                            <p className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                1
                            </p>
                        ) : (
                            ""
                        )}
                    </button>

                    {isNotificationSectionShow && (
                        <NavbarNotificationSection
                            notificationMessage={notificationData.product_name}
                            setIsNewNotificationAvailable={
                                setIsNewNotificationAvailable
                            }
                        />
                    )}
                </div>

                <div className="flex items-center relative">
                    <button
                        onClick={toggleDropdown}
                        className="text-gray-500 p-2 rounded-full hover:bg-gray-100 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                    >
                        <FaUserCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>

                    {isDropdownOpen && (
                        <NavbarUserDropDown
                            handleHrDashboard={handleHrDashboard}
                            signOutHandle={signOutHandle}
                            userRole={userRole}
                        />
                    )}
                </div>
            </div>
        </header>
    );
}
