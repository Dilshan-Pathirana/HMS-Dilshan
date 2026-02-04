import React, { useState } from "react";
import {
    FaCodeBranch,
    FaAngleDown,
    FaTachometerAlt,
    FaUser, FaCogs, FaUsers, FaCalendarAlt, FaChartBar, FaCog,
} from "react-icons/fa";
import { Link } from "react-router-dom";

type SidebarProps = {
    isOpenSidebarMenu: boolean;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpenSidebarMenu }) => {
    const [activeMenu, setActiveMenu] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("");

    const toggleMenu = (label: string) => {
        setActiveMenu((prev) => (prev === label ? "" : label));
    };

    const sidebarItems = [
        {
            label: "Dashboard",
            icon: <FaTachometerAlt className="w-5 h-5" />,
            link: "/dashboard",
            isActive: activeTab === "Dashboard",
        },
        {
            label: "Branch Management",
            icon: <FaCodeBranch className="w-5 h-5" />,
            link: "branch/management",
            isActive: activeTab === "Branch",
        },
        {
            label: "Staff Management",
            icon: <FaCalendarAlt className="w-5 h-5" />,
            link: "staff",
            isActive: activeTab === "Staff",
            children: [
                { label: "Staff Dashboard", link: "/super-admin/staff" },
                { label: "Scheduling & Shifts", link: "/super-admin/staff/scheduling" },
            ],
        },
        {
            label: "Reports",
            icon: <FaCogs className="w-5 h-5" />,
            link: "/dashboard/super-admin/reports",
            isActive: activeTab === "Reports",
        },
        {
            label: "Analytics",
            icon: <FaChartBar className="w-5 h-5" />,
            link: "/dashboard/super-admin/analytics",
            isActive: activeTab === "Analytics",
        },
        {
            label: "Settings",
            icon: <FaCog className="w-5 h-5" />,
            link: "/dashboard/super-admin/settings",
            isActive: activeTab === "Settings",
        },
        {
            label: "Users Management",
            icon: <FaUser className="w-5 h-5" />,
            link: "users/list",
            isActive: activeTab === "Users",
        },
        {
            label: "Appointment",
            icon: <FaCogs className="w-5 h-5" />,
            link: "/super-admin/appointments",
            isActive: activeTab === "Appointments",
        },
        {
            label: "Patient Section",
            icon: <FaUsers className="w-5 h-5" />,
            link: "patient-section",
            children: [
                { label: "Create Questions", link: "patient/create-questions" },
                { label: "All Questions", link: "patient/all-questions" },
            ],
            isActive: activeTab === "PatientSection",
        },
        {
            label: "Doctor Section",
            icon: <FaUsers className="w-5 h-5" />,
            link: "patient-section",
            children: [
                { label: "Create Session", link: "doctor/create-session" },
            ],
            isActive: activeTab === "PatientSection",
        },
        {
            label: "Doctor Diseases",
            icon: <FaUsers className="w-5 h-5" />,
            link: "doctor-diseases",
            children: [
                { label: "Create Diseases", link: "doctor/create-diseases" },
                { label: "All Diseases", link: "doctor/all-diseases" },
            ],
            isActive: activeTab === "DoctorDiseases",
        },
    ];

    return (
        <aside
            id="logo-sidebar"
            className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${
                isOpenSidebarMenu ? "translate-x-0" : "-translate-x-full"
            } sm:translate-x-0 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700`}
            aria-label="Sidebar"
        >
            <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
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
                                        className={`flex items-center justify-between p-2 w-full rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group ${
                                            item.isActive
                                                ? "bg-gray-200"
                                                : "text-gray-900"
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
                                                activeMenu === item.label
                                                    ? "rotate-180"
                                                    : "rotate-0"
                                            } w-5 h-5`}
                                        />
                                    </button>
                                    {activeMenu === item.label && (
                                        <ul className="pl-8 space-y-2">
                                            {item.children.map(
                                                (child, childIndex) => (
                                                    <li key={childIndex}>
                                                        <Link
                                                            to={child.link}
                                                            className={`flex items-center p-2 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                                activeTab ===
                                                                child.label
                                                                    ? "bg-gray-200"
                                                                    : "text-gray-700"
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
                                    to={item.link}
                                    className={`flex items-center p-2 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group ${
                                        item.isActive
                                            ? "bg-gray-200"
                                            : "text-gray-900"
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

export default Sidebar;
