import React, { useState } from "react";
import {
    FaEnvelope,
    FaPhone,
    FaUser,
    FaSpinner,
    FaCheckCircle,
    FaUserPlus,
} from "react-icons/fa";
import {
    FormErrors,
    PatientProps,
} from "../../../../utils/types/Appointment/IDoctorSchedule.ts";
import { validateForm } from "../../../../utils/helperFunctions/PatientAppointment.ts";

const PatientForm: React.FC<PatientProps> = ({
    userDetails,
    handleInputChange,
    handleBooking,
    timer,
    formatTimer,
    isLookingUpPatient = false,
    patientFound = null,
}) => {
    const [errors, setErrors] = useState<FormErrors>({});

    const handleFormSubmit = () => {
        if (validateForm(userDetails, setErrors)) {
            handleBooking();
        }
    };

    React.useEffect(() => {
        if (patientFound === true) {
            setErrors({});
        }
    }, [patientFound]);

    return (
        <div className="flex-1 bg-white shadow-md rounded-md p-6">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">
                        Enter Patient Details
                    </h1>
                </div>
                <div className="text-red-600 font-bold text-lg">
                    Timer: {formatTimer(timer)}
                </div>
            </div>

            <form className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        <FaPhone className="inline-block mr-2" />
                        Patient Phone
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            name="phone"
                            value={userDetails.phone}
                            onChange={handleInputChange}
                            className="w-full mt-1 border border-gray-300 rounded-md shadow-sm p-2 pr-10"
                            placeholder="Enter your phone number"
                        />
                        {isLookingUpPatient && (
                            <FaSpinner className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin" />
                        )}
                    </div>
                    {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.phone}
                        </p>
                    )}
                    {patientFound === true && (
                        <div className="flex items-center mt-1 text-green-600 text-sm">
                            <FaCheckCircle className="mr-1" />
                            <span>Patient found - details auto-filled</span>
                        </div>
                    )}
                    {patientFound === false &&
                        userDetails.phone.length >= 10 && (
                            <div className="flex items-center mt-1 text-blue-600 text-sm">
                                <FaUserPlus className="mr-1" />
                                <span>
                                    New patient - please fill in details
                                </span>
                            </div>
                        )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        <FaUser className="inline-block mr-2" /> First Name
                    </label>
                    <input
                        type="text"
                        name="firstName"
                        value={userDetails.firstName}
                        onChange={handleInputChange}
                        className="w-full mt-1 border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.firstName}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        <FaUser className="inline-block mr-2" /> Last Name
                    </label>
                    <input
                        type="text"
                        name="lastName"
                        value={userDetails.lastName}
                        onChange={handleInputChange}
                        className="w-full mt-1 border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.lastName}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        NIC
                    </label>
                    <input
                        type="text"
                        name="nic"
                        value={userDetails.nic}
                        onChange={handleInputChange}
                        className="w-full mt-1 border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Enter your NIC"
                    />
                    {errors.nic && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.nic}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        <FaEnvelope className="inline-block mr-2" /> Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={userDetails.email}
                        onChange={handleInputChange}
                        className="w-full mt-1 border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Enter your email (optional)"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Address
                    </label>
                    <input
                        type="text"
                        name="address"
                        value={userDetails.address}
                        onChange={handleInputChange}
                        className="w-full mt-1 border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Enter your address (optional)"
                    />
                    {errors.address && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.address}
                        </p>
                    )}
                </div>

                {errors.general && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.general}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleFormSubmit}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 w-full"
                >
                    Confirm Booking
                </button>
            </form>
        </div>
    );
};

export default PatientForm;
