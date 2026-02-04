import { useState, useEffect } from "react";
import NavBar from "../UserWeb/NavBar.tsx";
import Footer from "../UserWeb/Footer.tsx";
import UserDetails from "./UserDetails.tsx";
import PatientAppointmentsDetails from "./PatientAppointment/PatientAppointmentsDetails.tsx";
import Spinner from "../../assets/Common/Spinner.tsx";

const PatientDashboard = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    }, []);

    return (
        <div className="bg-gray-50 w-screen h-screen flex flex-col">
            <NavBar />

            {isLoading ? (
                <div className="flex justify-center mt-20">
                    <Spinner isLoading={isLoading} />
                </div>
            ) : (
                <div className="flex-grow flex flex-col mt-20 md:flex-row">
                    <UserDetails />
                    <PatientAppointmentsDetails />
                </div>
            )}

            <Footer />
        </div>
    );
};

export default PatientDashboard;
