import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Activity, User, Users, CheckSquare, RefreshCw, MessageSquare, 
    Heart, Pill, FileText, Briefcase, ChevronDown, ChevronUp,
    Calendar, Clock, DollarSign, CreditCard, BookOpen
} from "lucide-react";

interface SidebarProps {
    isOpenSidebarMenu: boolean;
}

interface SidebarItem {
    label: string;
    icon: React.ReactNode;
    link: string;
}

interface HRSubItem {
    label: string;
    icon: React.ReactNode;
    link: string;
}

const NurseSidebar: React.FC<SidebarProps> = ({ isOpenSidebarMenu }) => {
    const location = useLocation();
    const [isHRExpanded, setIsHRExpanded] = useState(
        location.pathname.includes('/nurse-dashboard/hr')
    );

    const sidebarItems: SidebarItem[] = [
        {
            label: "Dashboard",
            icon: <Activity className="w-5 h-5" />,
            link: "/nurse-dashboard",
        },
        {
            label: "My Profile",
            icon: <User className="w-5 h-5" />,
            link: "/nurse-dashboard/profile",
        },
        {
            label: "Patients",
            icon: <Users className="w-5 h-5" />,
            link: "/nurse-dashboard/patients",
        },
        {
            label: "Vital Signs",
            icon: <Heart className="w-5 h-5" />,
            link: "/nurse-dashboard/vital-signs",
        },
        {
            label: "Medication",
            icon: <Pill className="w-5 h-5" />,
            link: "/nurse-dashboard/medication",
        },
        {
            label: "Tasks",
            icon: <CheckSquare className="w-5 h-5" />,
            link: "/nurse-dashboard/tasks",
        },
        {
            label: "Handover",
            icon: <RefreshCw className="w-5 h-5" />,
            link: "/nurse-dashboard/handover",
        },
        {
            label: "Feedback",
            icon: <MessageSquare className="w-5 h-5" />,
            link: "/nurse-dashboard/feedback",
        },
    ];

    const hrSubItems: HRSubItem[] = [
        {
            label: "HR Portal",
            icon: <Briefcase className="w-4 h-4" />,
            link: "/nurse-dashboard/hr",
        },
        {
            label: "My Shifts",
            icon: <Calendar className="w-4 h-4" />,
            link: "/nurse-dashboard/hr/schedules",
        },
        {
            label: "Leave & Requests",
            icon: <Clock className="w-4 h-4" />,
            link: "/nurse-dashboard/hr/schedule-requests",
        },
        {
            label: "Overtime & Salary",
            icon: <DollarSign className="w-4 h-4" />,
            link: "/nurse-dashboard/hr/overtime-salary",
        },
        {
            label: "Payslips",
            icon: <CreditCard className="w-4 h-4" />,
            link: "/nurse-dashboard/hr/payslips",
        },
        {
            label: "Service Letters",
            icon: <FileText className="w-4 h-4" />,
            link: "/nurse-dashboard/hr/service-letters",
        },
        {
            label: "Policies",
            icon: <BookOpen className="w-4 h-4" />,
            link: "/nurse-dashboard/hr/policies",
        },
    ];

    const isActiveLink = (link: string) => {
        if (link === "/nurse-dashboard") {
            return location.pathname === link;
        }
        return location.pathname.startsWith(link);
    };

    const isHRActive = location.pathname.includes('/nurse-dashboard/hr');

    return (
        <aside
            className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${
                isOpenSidebarMenu ? "translate-x-0" : "-translate-x-full"
            } sm:translate-x-0 bg-gradient-to-b from-teal-600 to-cyan-700 text-white`}
            aria-label="Sidebar"
        >
            <div className="h-full px-3 pb-4 overflow-y-auto">
                <ul className="space-y-1 font-medium">
                    {sidebarItems.map((item, index) => (
                        <li key={index}>
                            <Link
                                to={item.link}
                                className={`flex items-center px-4 py-3 rounded-lg transition-colors group ${
                                    isActiveLink(item.link)
                                        ? "bg-white/20 text-white"
                                        : "text-white hover:bg-white/10"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {item.icon}
                                    <span className="font-medium">
                                        {item.label}
                                    </span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* HR Section Divider */}
                <div className="my-4 border-t border-white/20"></div>
                <p className="px-4 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Human Resources
                </p>

                {/* HR Expandable Menu */}
                <ul className="space-y-1 font-medium">
                    <li>
                        <button
                            onClick={() => setIsHRExpanded(!isHRExpanded)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                                isHRActive
                                    ? "bg-white/20 text-white"
                                    : "text-white hover:bg-white/10"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Briefcase className="w-5 h-5" />
                                <span className="font-medium">HR Self-Service</span>
                            </div>
                            {isHRExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>
                    </li>
                    
                    {isHRExpanded && (
                        <div className="ml-4 space-y-1">
                            {hrSubItems.map((item, index) => (
                                <li key={index}>
                                    <Link
                                        to={item.link}
                                        className={`flex items-center px-4 py-2 rounded-lg transition-colors text-sm ${
                                            location.pathname === item.link
                                                ? "bg-white/20 text-white"
                                                : "text-white/80 hover:bg-white/10 hover:text-white"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </div>
                    )}
                </ul>
            </div>
        </aside>
    );
};

export default NurseSidebar;
