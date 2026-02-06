import React, { useState } from "react";
import Navbar from "../../components/dashboard/Navbar.tsx";
import DoctorDashboardSideBar from "./common/sidebar/DoctorDashboardSideBar.tsx";
import { Outlet } from "react-router-dom";



const DoctorDashboard: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
            <Navbar toggleSidebar={toggleSidebar} />
            <DoctorDashboardSideBar isOpenSidebarMenu={isSidebarOpen} />

            <main className={`flex-1 overflow-auto pt-16 transition-all duration-300 ${
                isSidebarOpen ? "ml-64" : "ml-0"
            }`}>
              <Outlet />
            </main>
        </div>
    );
};

export default DoctorDashboard;
