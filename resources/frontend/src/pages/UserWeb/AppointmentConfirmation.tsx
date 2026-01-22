import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaSpinner, FaExclamationTriangle, FaHome, FaCalendarAlt, FaClock } from "react-icons/fa";
import { checkAppointmentStatus, AppointmentStatusResponse } from "../../utils/api/appointmentStatus";

const AppointmentConfirmation: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'pending' | 'success' | 'failed'>('loading');
    const [appointmentData, setAppointmentData] = useState<AppointmentStatusResponse['data'] | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 10; // Max 10 retries (about 30 seconds total)
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const checkPaymentStatus = async () => {
            if (!orderId) {
                setStatus('failed');
                return;
            }

            try {
                const response = await checkAppointmentStatus(orderId);
                console.log('Payment status response:', response);

                if (response.success && response.status === 'success') {
                    setStatus('success');
                    setAppointmentData(response.data);
                    // Clear any pending poll
                    if (pollIntervalRef.current) {
                        clearTimeout(pollIntervalRef.current);
                    }
                } else if (response.success && response.status === 'pending') {
                    setStatus('pending');
                    setAppointmentData(response.data);
                    
                    // Continue polling if we haven't exceeded max retries
                    if (retryCount < maxRetries) {
                        pollIntervalRef.current = setTimeout(() => {
                            setRetryCount(prev => prev + 1);
                        }, 3000); // Poll every 3 seconds
                    } else {
                        // After max retries, show pending state with option to check again
                        setStatus('pending');
                    }
                } else {
                    setStatus('failed');
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
                setStatus('failed');
            }
        };

        // Initial delay to allow webhook to process
        const initialDelay = retryCount === 0 ? 2000 : 0;
        const timeoutId = setTimeout(checkPaymentStatus, initialDelay);

        return () => {
            clearTimeout(timeoutId);
            if (pollIntervalRef.current) {
                clearTimeout(pollIntervalRef.current);
            }
        };
    }, [orderId, retryCount]);

    const handleGoHome = () => {
        navigate('/');
    };

    const handleGoToDashboard = () => {
        navigate('/patient-dashboard');
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-blue-100 p-8 text-center">
                    <div className="mb-6">
                        <FaSpinner className="text-blue-500 w-16 h-16 mx-auto animate-spin" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Processing Your Payment
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Please wait while we confirm your payment and create your appointment...
                    </p>
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded text-left">
                        <p className="text-sm text-blue-800">
                            <strong>Order ID:</strong> {orderId || 'Processing...'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-green-100 p-8 text-center">
                    <div className="mb-6">
                        <FaCheckCircle className="text-green-500 w-16 h-16 mx-auto" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Payment Successful!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Your appointment has been confirmed. You will receive an SMS confirmation shortly.
                    </p>

                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded text-left mb-6">
                        <p className="text-sm text-green-800">
                            <strong>Order ID:</strong> {orderId}
                        </p>
                        {appointmentData && (
                            <>
                                <p className="text-sm text-green-800 mt-1">
                                    <strong>Appointment ID:</strong> {appointmentData.appointment_id}
                                </p>
                                <p className="text-sm text-green-800 mt-1">
                                    <strong>Payment Amount:</strong> LKR {appointmentData.payment_amount ? Number(appointmentData.payment_amount).toFixed(2) : '0.00'}
                                </p>
                                <p className="text-sm text-green-800 mt-1">
                                    <strong>Payment Status:</strong> {appointmentData.payment_status}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleGoToDashboard}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                            <FaCalendarAlt className="w-4 h-4" />
                            <span>View My Appointments</span>
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
    }

    // Pending state - payment is still being processed
    if (status === 'pending') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-amber-100 p-8 text-center">
                    <div className="mb-6">
                        <FaClock className="text-amber-500 w-16 h-16 mx-auto" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Payment Processing...
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Your payment is being verified. This may take a few moments.
                    </p>
                    
                    <div className="flex justify-center mb-6">
                        <FaSpinner className="text-amber-500 w-8 h-8 animate-spin" />
                    </div>

                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded text-left mb-6">
                        <p className="text-sm text-amber-800">
                            <strong>Order ID:</strong> {orderId}
                        </p>
                        {appointmentData && (
                            <>
                                <p className="text-sm text-amber-800 mt-1">
                                    <strong>Token Number:</strong> #{appointmentData.token_number}
                                </p>
                                <p className="text-sm text-amber-800 mt-1">
                                    <strong>Appointment Date:</strong> {appointmentData.appointment_date}
                                </p>
                            </>
                        )}
                        {retryCount < maxRetries ? (
                            <p className="text-sm text-amber-700 mt-3">
                                <strong>Note:</strong> If you have completed the payment, please wait. 
                                The confirmation will appear automatically once verified.
                                <br />
                                <span className="text-xs text-amber-600">Checking... ({retryCount + 1}/{maxRetries})</span>
                            </p>
                        ) : (
                            <p className="text-sm text-amber-700 mt-3">
                                <strong>Note:</strong> Payment verification is taking longer than expected. 
                                Your appointment has been reserved. You can check your appointment status 
                                in your dashboard.
                            </p>
                        )}
                    </div>

                    {retryCount >= maxRetries && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded text-left mb-6">
                            <p className="text-sm text-blue-800">
                                <strong>What to do next:</strong>
                            </p>
                            <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                                <li>Check your email/SMS for payment confirmation</li>
                                <li>Go to your dashboard to see appointment status</li>
                                <li>Your slot is reserved and will be confirmed once payment is verified</li>
                            </ul>
                        </div>
                    )}

                    <div className="space-y-3">
                        {retryCount >= maxRetries ? (
                            <>
                                <button
                                    onClick={() => setRetryCount(0)}
                                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all duration-300 flex items-center justify-center space-x-2"
                                >
                                    <FaSpinner className="w-4 h-4" />
                                    <span>Check Again</span>
                                </button>
                                <button
                                    onClick={handleGoToDashboard}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center space-x-2"
                                >
                                    <FaCalendarAlt className="w-4 h-4" />
                                    <span>Go to Dashboard</span>
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }

    // Failed state
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center">
                <div className="mb-6">
                    <FaExclamationTriangle className="text-red-500 w-16 h-16 mx-auto" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                    Payment Processing Failed
                </h1>
                <p className="text-gray-600 mb-6">
                    We couldn't process your payment. Please try booking your appointment again.
                </p>

                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-left mb-6">
                    <p className="text-sm text-red-800">
                        If you believe this is an error, please contact our support team with the following details:
                    </p>
                    <p className="text-sm text-red-800 mt-2">
                        <strong>Order ID:</strong> {orderId || 'Not available'}
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/patient-dashboard/appointments/book')}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                        <FaCalendarAlt className="w-4 h-4" />
                        <span>Book New Appointment</span>
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

export default AppointmentConfirmation;
