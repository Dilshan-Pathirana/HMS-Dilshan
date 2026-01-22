import { useLocation } from "react-router-dom";
import Footer from "../../Footer.tsx";
import NavBar from "../../NavBar.tsx";
import DoctorFilterWeb from "../DoctorFilterWeb.tsx";
import { DoctorSchedule } from "../../../../utils/types/Website/IDoctorSchedule.ts";
import React, { useState, useEffect } from "react";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import DoctorDetailsCard from "./DoctorDetailsCard.tsx";

const WebDoctorScheduleDetails = () => {
    const location = useLocation();
    const doctorSchedules: DoctorSchedule[] =
        location.state?.doctorSchedules || [];

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    }, []);

    let content: React.ReactNode;
    if (isLoading) {
        content = (
            <div className="flex justify-center mt-6">
                <Spinner isLoading={isLoading} />
            </div>
        );
    } else if (doctorSchedules.length === 0) {
        content = (
            <div className="text-center text-gray-500 mt-20 text-lg">
                No doctor schedules found. Please try adjusting your search
                criteria.
            </div>
        );
    } else {
        content = <DoctorDetailsCard doctorSchedules={doctorSchedules} />;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />

            <div className="mt-24 mb-10 px-4 md:px-8 flex-grow">
                <DoctorFilterWeb />
                {content}
            </div>
            <Footer />
        </div>
    );
};

export default WebDoctorScheduleDetails;
