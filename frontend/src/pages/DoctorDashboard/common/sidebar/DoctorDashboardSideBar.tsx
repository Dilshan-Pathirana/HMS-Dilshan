import React, { useState } from "react";
import { FaCalendarAlt, FaQuestion } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

type SidebarProps = {
    isOpenSidebarMenu: boolean;
};

const DoctorDashboardSideBar: React.FC<SidebarProps> = ({
                                                            isOpenSidebarMenu,
                                                        }) => {
    const [activeTab, setActiveTab] = useState<string>("");
    const [openSubMenu, setOpenSubMenu] = useState<string>("");

    const sidebarItems = [
        {
            label: "Doctor Appointment",
            icon: <FaCalendarAlt className="w-5 h-5" />,
            link: "/doctor-dashboard/schedule-all",
        },
        {
            label: "Schedule Calendar",
            icon: <Calendar className="w-5 h-5" />,
            link: "/doctor-dashboard/schedule-calendar",
        },
        {
            label: "Questions",
            icon: <FaQuestion className="w-5 h-5" />,
            children: [
                {
                    label: "Create Questions",
                    link: "/doctor-dashboard/create-questions",
                },
                {
                    label: "All Questions",
                    link: "/doctor-dashboard/all-questions",
                },
            ],
        },
        {
            label: "All Sessions",
            icon: <Calendar className="w-5 h-5" />,
            link: "/doctor-dashboard/all-sessions",
        },
    ];

    return (
        <aside
            id="doctor-sidebar"
            className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${
                isOpenSidebarMenu ? "translate-x-0" : "-translate-x-full"
            } sm:translate-x-0 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700`}
            aria-label="Doctor Sidebar"
        >
            <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
                <ul className="space-y-2 font-medium">
                    {sidebarItems.map((item, index) => (
                        <li key={index}>
                            {item.children ? (
                                <>
                                    <button
                                        onClick={() =>
                                            setOpenSubMenu(
                                                openSubMenu === item.label
                                                    ? ""
                                                    : item.label,
                                            )
                                        }
                                        className={`flex w-full items-center p-2 rounded-lg justify-between dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                            openSubMenu === item.label
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
                                        <span>
                                            {openSubMenu === item.label
                                                ? "▾"
                                                : "▸"}
                                        </span>
                                    </button>
                                    {openSubMenu === item.label && (
                                        <ul className="ml-6 mt-1 space-y-1">
                                            {item.children.map(
                                                (subItem, subIndex) => (
                                                    <li key={subIndex}>
                                                        <Link
                                                            to={subItem.link}
                                                            onClick={() =>
                                                                setActiveTab(
                                                                    subItem.label,
                                                                )
                                                            }
                                                            className={`block p-2 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                                activeTab ===
                                                                subItem.label
                                                                    ? "bg-gray-200"
                                                                    : "text-gray-900"
                                                            }`}
                                                        >
                                                            {subItem.label}
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
                                    onClick={() => setActiveTab(item.label)}
                                    className={`flex items-center p-2 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                        activeTab === item.label
                                            ? "bg-gray-200"
                                            : "text-gray-900"
                                    }`}
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

export default DoctorDashboardSideBar;
