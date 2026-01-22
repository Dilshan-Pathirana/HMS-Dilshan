import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaTimes, FaHome, FaCalendarAlt } from "react-icons/fa";

const AppointmentCancelled: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    const handleBookAgain = () => {
        navigate('/patient-dashboard/appointments/book');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-yellow-100 p-8 text-center">
                <div className="mb-6">
                    <FaTimes className="text-yellow-500 w-16 h-16 mx-auto" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                    Payment Cancelled
                </h1>
                <p className="text-gray-600 mb-6">
                    Your payment was cancelled and no charges were made. Your appointment has not been booked.
                </p>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-left mb-6">
                    <p className="text-sm text-yellow-800">
                        <strong>Order ID:</strong> {orderId || 'Not available'}
                    </p>
                    <p className="text-sm text-yellow-800 mt-2">
                        <strong>What happened:</strong> You chose to cancel the payment process before completion.
                    </p>
                    <p className="text-sm text-yellow-800 mt-1">
                        No charges have been made to your account and no appointment has been created.
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleBookAgain}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                        <FaCalendarAlt className="w-4 h-4" />
                        <span>Book Appointment Again</span>
                    </button>
                    <button
                        onClick={handleGoHome}
                        className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:from-gray-200 hover:to-gray-300 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                        <FaHome className="w-4 h-4" />
                        <span>Back to Home</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentCancelled;