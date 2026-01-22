import React, { useState } from "react";
import {
    FaEnvelope,
    FaPhone,
    FaUser,
    FaCheckCircle,
    FaMapMarkerAlt,
    FaIdCard,
    FaClock,
    FaInfoCircle,
    FaCreditCard,
    FaSpinner,
} from "react-icons/fa";
import {
    userDetailsTypes,
} from "../../../../utils/types/Appointment/IDoctorSchedule.ts";
import { useNavigate } from "react-router-dom";
import {
    createAppointmentForPayment,
    AppointmentData,
} from "../../../../utils/api/Appointment/appointmentPayment.ts";

const PatientForm: React.FC<{
    userDetails: userDetailsTypes;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    timer: number;
    formatTimer: (seconds: number) => string;
    appointmentData?: AppointmentData;
}> = ({ userDetails, handleInputChange, timer, formatTimer, appointmentData }) => {
    const navigate = useNavigate();

    // Payment flow state
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [paymentStatus, setPaymentStatus] = useState<"success" | "failure" | "pending" | null>(null);

    const handleBookingConfirmation = async () => {
        if (!appointmentData) {
            alert('Appointment data is missing. Please try again.');
            return;
        }

        // Basic validation
        if (!userDetails.firstName || !userDetails.lastName || !userDetails.phone || !userDetails.nic) {
            alert('Please fill in all required fields.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await createAppointmentForPayment(userDetails, appointmentData);

            console.log('Appointment response:', response);

            if (response.success && response.data) {
                // Store payment data and show payment modal
                setPaymentData(response.data);
                setShowPaymentModal(true);
                setPaymentStatus(null); // Reset status, let user click Pay Now
            } else {
                alert(response.error || 'Failed to prepare appointment. Please try again.');
            }
        } catch (error) {
            console.error('Error preparing appointment:', error);
            alert('Failed to prepare appointment. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayNow = () => {
        if (!paymentData) return;

        // Create a form element and submit it programmatically
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentData.payment_url;
        // Removed target="_blank" to use same window

        // Add all payment data as hidden fields
        Object.entries(paymentData.payment_data).forEach(([key, value]) => {
            if (key !== 'payment_url') {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = String(value);
                form.appendChild(input);
            }
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        // Show payment instructions
        setPaymentStatus("pending");
    };

    const handleCloseModal = () => {
        setShowPaymentModal(false);
        setPaymentData(null);
        setPaymentStatus(null);
        // Redirect to dashboard or appointment success page
        navigate('/patient-dashboard');
    };

    return (
        <div className="flex-1 bg-gradient-to-br from-white via-blue-50 to-white shadow-lg rounded-xl p-4 border border-blue-100 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4 border-b border-blue-100 pb-3">
                <div className="flex items-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                        <FaUser className="text-blue-600 w-3 h-3" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-900">
                        Enter Patient Details
                    </h1>
                </div>
                <div className="flex items-center bg-gradient-to-r from-red-50 to-red-100 px-2 py-1 rounded-lg border border-red-200 shadow-sm">
                    <FaClock className="text-red-600 w-3 h-3 mr-1" />
                    <span className="text-red-700 font-bold text-sm">
                        {formatTimer(timer)}
                    </span>
                </div>
            </div>

            <form className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="group">
                        <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                            <div className="w-4 h-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center mr-1 shadow-sm">
                                <FaUser className="text-blue-600 w-2 h-2" />
                            </div>
                            First Name
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={userDetails.firstName}
                            onChange={handleInputChange}
                            className="w-full px-2 py-2 bg-white border border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-gray-700 text-sm outline-none"
                            placeholder="First name"
                        />
                        {/*{errors.firstName && (*/}
                        {/*    <div className="mt-1 flex items-center text-red-600 text-xs bg-red-50 px-2 py-1 rounded border border-red-200">*/}
                        {/*        <FaExclamationTriangle className="w-3 h-3 mr-1" />*/}
                        {/*        {errors.firstName}*/}
                        {/*    </div>*/}
                        {/*)}*/}
                    </div>

                    <div className="group">
                        <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                            <div className="w-4 h-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center mr-1 shadow-sm">
                                <FaUser className="text-blue-600 w-2 h-2" />
                            </div>
                            Last Name
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={userDetails.lastName}
                            onChange={handleInputChange}
                            className="w-full px-2 py-2 bg-white border border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-gray-700 text-sm outline-none disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed"
                            placeholder="Last name"
                        />
                        {/*{errors.lastName && (*/}
                        {/*    <div className="mt-1 flex items-center text-red-600 text-xs bg-red-50 px-2 py-1 rounded border border-red-200">*/}
                        {/*        <FaExclamationTriangle className="w-3 h-3 mr-1" />*/}
                        {/*        {errors.lastName}*/}
                        {/*    </div>*/}
                        {/*)}*/}
                    </div>
                </div>

                <div className="group">
                    <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                        <div className="w-4 h-4 bg-gradient-to-br from-green-100 to-green-200 rounded flex items-center justify-center mr-1 shadow-sm">
                            <FaPhone className="text-green-600 w-2 h-2" />
                        </div>
                        Phone
                    </label>
                    <input
                        type="text"
                        name="phone"
                        value={userDetails.phone}
                        onChange={handleInputChange}
                        className="w-full px-2 py-2 bg-white border border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-gray-700 text-sm outline-none disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed"
                        placeholder="Phone number"
                    />
                    {/*{errors.phone && (*/}
                    {/*    <div className="mt-1 flex items-center text-red-600 text-xs bg-red-50 px-2 py-1 rounded border border-red-200">*/}
                    {/*        <FaExclamationTriangle className="w-3 h-3 mr-1" />*/}
                    {/*        {errors.phone}*/}
                    {/*    </div>*/}
                    {/*)}*/}
                </div>

                <div className="group">
                    <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                        <div className="w-4 h-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center mr-1 shadow-sm">
                            <FaIdCard className="text-purple-600 w-2 h-2" />
                        </div>
                        NIC
                    </label>
                    <input
                        type="text"
                        name="nic"
                        value={userDetails.nic}
                        onChange={handleInputChange}
                        className="w-full px-2 py-2 bg-white border border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-gray-700 text-sm outline-none disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed"
                        placeholder="NIC number"
                    />
                </div>

                <div className="group">
                    <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                        <div className="w-4 h-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded flex items-center justify-center mr-1 shadow-sm">
                            <FaEnvelope className="text-orange-600 w-2 h-2" />
                        </div>
                        Email
                        <span className="text-gray-400 text-xs ml-1">
                            (optional)
                        </span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={userDetails.email}
                        onChange={handleInputChange}
                        className="w-full px-2 py-2 bg-white border border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-gray-700 text-sm outline-none disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed"
                        placeholder="Email address"
                    />
                </div>

                <div className="group">
                    <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                        <div className="w-4 h-4 bg-gradient-to-br from-teal-100 to-teal-200 rounded flex items-center justify-center mr-1 shadow-sm">
                            <FaMapMarkerAlt className="text-teal-600 w-2 h-2" />
                        </div>
                        Address
                        <span className="text-gray-400 text-xs ml-1">
                            (optional)
                        </span>
                    </label>
                    <input
                        type="text"
                        name="address"
                        value={userDetails.address}
                        onChange={handleInputChange}
                        className="w-full px-2 py-2 bg-white border border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-gray-700 text-sm outline-none disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed"
                        placeholder="Address"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="button"
                        onClick={handleBookingConfirmation}
                        disabled={isLoading}
                        className="group relative overflow-hidden w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 text-white px-4 py-2 rounded-lg font-bold transition-all duration-300 shadow-md hover:shadow-lg border border-blue-500 hover:border-blue-400 disabled:border-gray-400 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                        <div className="flex items-center justify-center space-x-2 relative z-10">
                            {isLoading ? (
                                <FaSpinner className="w-4 h-4 animate-spin" />
                            ) : (
                                <FaCheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                            )}
                            <span className="text-sm">
                                {isLoading ? 'Processing...' : 'Confirm Booking'}
                            </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:animate-pulse"></div>
                    </button>
                </div>
            </form>

            {/* Payment Modal */}
            {showPaymentModal && paymentData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <FaCreditCard className="text-blue-600 w-5 h-5 mr-2" />
                            Complete Payment
                        </h2>

                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mb-4">
                            <div className="flex items-center mb-2">
                                <FaInfoCircle className="text-blue-600 w-5 h-5 mr-2" />
                                <h4 className="font-semibold text-blue-800">Payment Details</h4>
                            </div>
                            <div className="text-sm text-blue-700 space-y-1">
                                <p><span className="font-semibold">Amount:</span> LKR {paymentData.payment_amount}</p>
                                <p><span className="font-semibold">Order ID:</span> {paymentData.order_id}</p>
                                <p><span className="font-semibold">Service:</span> Appointment Booking</p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-4">
                            <div className="flex items-center mb-2">
                                <FaInfoCircle className="text-yellow-600 w-5 h-5 mr-2" />
                                <h4 className="font-semibold text-yellow-800">Important Notice</h4>
                            </div>
                            <p className="text-sm text-yellow-700 leading-relaxed">
                                Please note a total of{" "}
                                <span className="font-bold">LKR {paymentData.payment_amount}</span>{" "}
                                will be deducted from your card to confirm your appointment. This covers only
                                appointment booking tax and handling charges; it does <em>not</em> include doctor
                                fees, hospital charges, or medicines. This payment is{" "}
                                <span className="font-medium">non-refundable</span>.
                            </p>
                            <p className="mt-3 text-sm text-yellow-700 leading-relaxed">
                                දැනුම්දීම: ඔබගේ වෛද්‍ය හමුව තහවුරු කිරීම සඳහා රු.{" "}
                                <span className="font-bold">{paymentData.payment_amount}</span> ක මුදලක් අය කරනු ලබයි.
                                මෙම ගාස්තුව වෙබ් අඩවියේ ක්‍රියාකාරී ගාස්තු, බදු හා වෙනත් හැසිරවීමේ ගාස්තු සඳහා පමණි.
                                වෛද්‍ය ගාස්තු, රෝහල් ගාස්තු හෝ ඖෂධ ගාස්තු ඇතුළත් නොවේ.
                            </p>
                        </div>

                        {paymentStatus === "pending" && (
                            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-4">
                                <div className="flex items-center mb-2">
                                    <FaSpinner className="text-green-600 w-5 h-5 mr-2 animate-spin" />
                                    <h4 className="font-semibold text-green-800">Payment Window Opened</h4>
                                </div>
                                <p className="text-sm text-green-700">
                                    PayHere payment window has been opened in a new tab. Please complete your payment there.
                                    Once payment is successful, your appointment will be confirmed and you'll receive an SMS notification.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                            {!paymentStatus && (
                                <button
                                    type="button"
                                    onClick={handlePayNow}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                >
                                    <FaCreditCard className="w-4 h-4" />
                                    <span>Pay Now</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/*{showModal && (*/}
            {/*    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">*/}
            {/*        <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">*/}
            {/*            <h2 className="text-xl font-bold mb-4">Payments</h2>*/}
            {/*            <form*/}
            {/*                action="https://sandbox.payhere.lk/pay/checkout"*/}
            {/*                method="post"*/}
            {/*                target="payhereWindow"*/}
            {/*                onSubmit={handlePayhereSubmit}*/}
            {/*                className="space-y-4"*/}
            {/*            >*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="merchant_id"*/}
            {/*                    value={merchantId}*/}
            {/*                />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="return_url"*/}
            {/*                    value={returnUrl}*/}
            {/*                />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="cancel_url"*/}
            {/*                    value={cancelUrl}*/}
            {/*                />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="notify_url"*/}
            {/*                    value={notifyUrl}*/}
            {/*                />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="order_id"*/}
            {/*                    value={orderId}*/}
            {/*                />*/}
            {/*                <input type="hidden" name="items" value={items} />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="currency"*/}
            {/*                    value={currency}*/}
            {/*                />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="amount"*/}
            {/*                    value={amountFormatted}*/}
            {/*                />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="first_name"*/}
            {/*                    value={userDetails.firstName}*/}
            {/*                />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="last_name"*/}
            {/*                    value={userDetails.lastName}*/}
            {/*                />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="email"*/}
            {/*                    value={userDetails.email}*/}
            {/*                />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="phone"*/}
            {/*                    value={userDetails.phone}*/}
            {/*                />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="address"*/}
            {/*                    value={userDetails.address}*/}
            {/*                />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="city"*/}
            {/*                    value="anuradhapura"*/}
            {/*                />*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="country"*/}
            {/*                    value="sri lanka"*/}
            {/*                />*/}
            {/*                <input type="hidden" name="hash" value={hash} />*/}
            {/*                /!* Pass appointment ID for backend webhook processing *!/*/}
            {/*                <input*/}
            {/*                    type="hidden"*/}
            {/*                    name="custom_1"*/}
            {/*                    value={createdAppointmentId || appointmentData?.scheduleId || 'unknown'}*/}
            {/*                />*/}

            {/*                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-4">*/}
            {/*                    <div className="flex items-center mb-2">*/}
            {/*                        <FaInfoCircle className="text-yellow-600 w-5 h-5 mr-2" />*/}
            {/*                        <h4 className="font-semibold text-yellow-800">*/}
            {/*                            Important Notice*/}
            {/*                        </h4>*/}
            {/*                    </div>*/}
            {/*                    <p className="text-sm text-yellow-700 leading-relaxed">*/}
            {/*                        Please note a total of{" "}*/}
            {/*                        <span className="font-bold">*/}
            {/*                            Rs. 350.00*/}
            {/*                        </span>{" "}*/}
            {/*                        will be deducted from your card to confirm*/}
            {/*                        your appointment. This covers only*/}
            {/*                        appointment booking tax and handling*/}
            {/*                        charges; it does <em>not</em> include doctor*/}
            {/*                        fees, hospital charges, or medicines. This*/}
            {/*                        payment is{" "}*/}
            {/*                        <span className="font-medium">*/}
            {/*                            non-refundable*/}
            {/*                        </span>*/}
            {/*                        . For details, please review our{" "}*/}
            {/*                        <a*/}
            {/*                            href="/terms"*/}
            {/*                            className="underline text-yellow-800 hover:text-yellow-900"*/}
            {/*                        >*/}
            {/*                            Terms &amp; Conditions*/}
            {/*                        </a>*/}
            {/*                        .*/}
            {/*                    </p>*/}
            {/*                    <p className="mt-3 text-sm text-yellow-700 leading-relaxed">*/}
            {/*                        දැනුම්දීම: ඔබගේ වෛද්‍ය හමුව තහවුරු කිරීම*/}
            {/*                        සඳහා රු.{" "}*/}
            {/*                        <span className="font-bold">350.00</span> ක*/}
            {/*                        මුදලක් අය කරනු ලබයි. මෙම ගාස්තුව වෙබ් අඩවියේ*/}
            {/*                        ක්‍රියාකාරී ගාස්තු, බදු හා වෙනත් හැසිරවීමේ*/}
            {/*                        ගාස්තු සඳහා පමණි. වෛද්‍ය ගාස්තු, රෝහල්*/}
            {/*                        ගාස්තු හෝ ඖෂධ ගාස්තු ඇතුළත් නොවේ. මෙම ගෙවීම{" "}*/}
            {/*                        <span className="font-medium">*/}
            {/*                            ආපසු නොලබනු ලබන*/}
            {/*                        </span>{" "}*/}
            {/*                        බව සලකන්න. වැඩි විස්තර සඳහා{" "}*/}
            {/*                        <a*/}
            {/*                            href="/terms"*/}
            {/*                            className="underline text-yellow-800 hover:text-yellow-900"*/}
            {/*                        >*/}
            {/*                            නියමයන් සහ කොන්දේසි*/}
            {/*                        </a>{" "}*/}
            {/*                        කියවන්න.*/}
            {/*                    </p>*/}
            {/*                </div>*/}

            {/*                <div className="flex justify-end space-x-2">*/}
            {/*                    <button*/}
            {/*                        type="button"*/}
            {/*                        onClick={() => setShowModal(false)}*/}
            {/*                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"*/}
            {/*                    >*/}
            {/*                        Cancel*/}
            {/*                    </button>*/}
            {/*                    <button*/}
            {/*                        type="submit"*/}
            {/*                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"*/}
            {/*                    >*/}
            {/*                        Pay Now*/}
            {/*                    </button>*/}
            {/*                </div>*/}
            {/*            </form>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*)}*/}


            {/*{paymentStatus && (*/}
            {/*    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">*/}
            {/*        <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-sm p-6 text-center">*/}
            {/*            {paymentStatus === "success" ? (*/}
            {/*                <>*/}
            {/*                    <FaCheckCircle className="text-green-500 w-12 h-12 mx-auto mb-4" />*/}
            {/*                    <h3 className="text-xl font-bold mb-2">*/}
            {/*                        Payment Successful*/}
            {/*                    </h3>*/}
            {/*                    <p>Your payment was processed successfully.</p>*/}
            {/*                </>*/}
            {/*            ) : (*/}
            {/*                <>*/}
            {/*                    <FaExclamationTriangle className="text-red-500 w-12 h-12 mx-auto mb-4" />*/}
            {/*                    <h3 className="text-xl font-bold mb-2">*/}
            {/*                        Payment Failed*/}
            {/*                    </h3>*/}
            {/*                    <p>*/}
            {/*                        There was an issue processing your payment.*/}
            {/*                        Please try again.*/}
            {/*                    </p>*/}
            {/*                </>*/}
            {/*            )}*/}
            {/*            <button*/}
            {/*                onClick={() => setPaymentStatus(null)}*/}
            {/*                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"*/}
            {/*            >*/}
            {/*                Close*/}
            {/*            </button>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*)}*/}
        </div>
    );
};

export default PatientForm;
