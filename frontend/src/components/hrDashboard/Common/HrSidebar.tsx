import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
    FaAngleDown,
    FaTachometerAlt,
    FaClipboardList,
    FaUser,
} from "react-icons/fa";
import {
    SidebarItem,
    SidebarProps,
} from "../../../utils/types/pharmacy/SidebarProps";
import { useUserRole } from "../../../utils/state/checkAuthenticatedUserStates.ts";
import {
    accessForAdmin,
    accessForCashierUser,
    accessForPharmacyUser,
} from "../../../utils/state/GivePermissionForUserRole.tsx";

const HrSidebar: React.FC<SidebarProps> = ({ isOpenSidebarMenu }) => {
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
    const [activeTab, setActiveTab] = useState<string>("");

    // Toggle the open state of menus
    const toggleMenu = (label: string) => {
        setOpenMenus((prev) => {
            const newMenuState = { ...prev };

            if (newMenuState[label]) {
                delete newMenuState[label];
            } else {
                Object.keys(newMenuState).forEach((key) => {
                    delete newMenuState[key];
                });
                newMenuState[label] = true;
            }

            return newMenuState;
        });
    };

    const userRole = useUserRole();
    const permissionForAdminUser = accessForAdmin(userRole);
    const permissionForPharmacistUser = accessForPharmacyUser(userRole);
    const permissionForCashierUser = accessForCashierUser(userRole);

    const sidebarItems: SidebarItem[] = [
        {
            label: "Dashboard",
            icon: <FaTachometerAlt className="w-5 h-5" />,
            link: "/hr-dashboard",
        },
    ];

    if (permissionForAdminUser) {
        sidebarItems.push(
            {
                label: "Staff and Users",
                icon: <FaUser className="w-5 h-5" />,
                children: [
                    {
                        label: "Shift Management",
                        link: "/hr-dashboard/shift-management",
                    },
                ],
            },
            {
                label: "Salary Management",
                icon: <FaClipboardList className="w-5 h-5" />,
                children: [
                    {
                        label: "ADD Staff Salary",
                        link: "/hr-dashboard/staff-salary",
                    },
                    {
                        label: "OT Management",
                        link: "/hr-dashboard/ot-management",
                    },
                    {
                        label: "Staff Salary Payment",
                        link: "/hr-dashboard/staff-salary-pay",
                    },
                ],
            },
            {
                label: "Leave Management",
                icon: <FaClipboardList className="w-5 h-5" />,
                children: [
                    {
                        label: "Leave Request",
                        link: "/hr-dashboard/leave-request",
                    },
                ],
            },
        );
    }

    if (permissionForPharmacistUser || permissionForCashierUser) {
        sidebarItems.push(
            {
                label: "Leave Management",
                icon: <FaClipboardList className="w-5 h-5" />,
                children: [
                    {
                        label: "Leave Management",
                        link: "/hr-dashboard/leave-management",
                    },
                    {
                        label: "Leave Request",
                        link: "/hr-dashboard/leave-request",
                    },
                ],
            },
            {
                label: "Shift Management",
                icon: <FaUser className="w-5 h-5" />,
                link: "users",
                children: [
                    {
                        label: "Shift List",
                        link: "/hr-dashboard/shift-management",
                    },
                ],
            },
        );
    }

    return (
        <aside
            className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${
                isOpenSidebarMenu ? "translate-x-0" : "-translate-x-full"
            } bg-white border-r border-neutral-200 dark:bg-neutral-800 dark:border-gray-700`}
            aria-label="Sidebar"
        >
            <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-neutral-800">
                <ul className="space-y-2 font-medium">
                    {sidebarItems.map((item, index) => (
                        <li key={index}>
                            {item.children ? (
                                <>
                                    <button
                                        onClick={() => {
                                            toggleMenu(item.label);
                                            setActiveTab(item.label);
                                        }}
                                        className={`flex items-center justify-between p-2 w-full rounded-lg dark:text-white hover:bg-neutral-100 dark:hover:bg-gray-700 group ${
                                            activeTab === item.label
                                                ? "bg-neutral-200 text-neutral-900"
                                                : "text-neutral-900"
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            {item.icon}
                                            <span className="ml-4">
                                                {item.label}
                                            </span>
                                        </div>
                                        <FaAngleDown
                                            className={`transition-transform transform ${
                                                openMenus[item.label]
                                                    ? "rotate-180"
                                                    : "rotate-0"
                                            } w-5 h-5`}
                                        />
                                    </button>
                                    {openMenus[item.label] && (
                                        <ul className="pl-8 space-y-2">
                                            {item.children.map(
                                                (child, childIndex) => (
                                                    <li key={childIndex}>
                                                        <Link
                                                            to={
                                                                child.link ||
                                                                "#"
                                                            }
                                                            className={`flex items-center p-2 rounded-lg dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-700 ${
                                                                activeTab ===
                                                                child.label
                                                                    ? "bg-neutral-200"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                setActiveTab(
                                                                    child.label,
                                                                )
                                                            }
                                                        >
                                                            {child.label}
                                                        </Link>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    )}
                                </>
                            ) : (
                                <Link
                                    to={item.link || "#"}
                                    className={`flex items-center p-2 rounded-lg dark:text-white hover:bg-neutral-100 dark:hover:bg-gray-700 group ${
                                        activeTab === item.label
                                            ? "bg-neutral-200"
                                            : "text-neutral-900"
                                    }`}
                                    onClick={() => setActiveTab(item.label)}
                                >
                                    {item.icon}
                                    <span className="ml-4">{item.label}</span>
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
};

export default HrSidebar;
