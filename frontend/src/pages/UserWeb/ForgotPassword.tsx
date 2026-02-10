import React, { useState } from "react";
import NavBar from "./NavBar.tsx";
import Footer from "./Footer.tsx";
import { ForgotPasswordField } from "../../utils/form/formFieldsAttributes/ForgotPasswordField.ts";
import { IPhone } from "../../utils/types/users/ISignUp.ts";
import { patientForgotPassword, resetPassword, verifyForgotPasswordOtp } from "../../utils/api/user/PatientForgotPassword.ts";
import { useNavigate } from "react-router-dom";
import OtpPopupModal from "../../components/signUpForm/OtpPopupModal.tsx";

const ForgotPassword: React.FC = () => {
    const [phone, setPhone] = useState<IPhone>(ForgotPasswordField);
    const [error, setError] = useState<string>('');
    const [step, setStep] = useState<"request" | "verify" | "reset">("request");
    const [otpToken, setOtpToken] = useState("");
    const [otpError, setOtpError] = useState("");
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleInputFieldChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const { name, value } = event.target;

        setPhone((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setOtpError("");
        setIsSubmitting(true);

        try {
            if (step === "request") {
                const response = await patientForgotPassword(phone);
                const smsStatus = response.data?.sms?.status;
                const otp_token = response.data?.otp_token || "";

                if (smsStatus && smsStatus !== "sent") {
                    setError("Failed to send OTP. Please try again later.");
                    return;
                }

                if (otp_token) {
                    setOtpToken(otp_token);
                    setStep("verify");
                    setShowOtpModal(true);
                } else {
                    setError("If the account exists, an OTP has been sent.");
                }
            } else if (step === "reset") {
                if (!newPassword.trim()) {
                    setError("Please enter a new password.");
                    return;
                }
                if (newPassword !== confirmPassword) {
                    setError("Password confirmation does not match.");
                    return;
                }

                const response = await resetPassword({
                    token: otpToken,
                    new_password: newPassword,
                });

                if (response.status === 200) {
                    navigate("/login", {
                        state: {
                            message: "Your password has been reset successfully. Please log in.",
                        },
                    });
                }
            }
        } catch (error: any) {
            if (error.response?.data?.detail) {
                setError(error.response.data.detail);
            } else if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async (otp: string) => {
        try {
            const response = await verifyForgotPasswordOtp({
                otp_token: otpToken,
                otp: otp.trim(),
            });
            const resetToken = response.data?.reset_token || "";
            if (resetToken) {
                setOtpToken(resetToken);
                setIsOtpVerified(true);
                setTimeout(() => {
                    setShowOtpModal(false);
                    setStep("reset");
                }, 800);
            }
        } catch (error: any) {
            if (error.response?.data?.detail) {
                setOtpError(error.response.data.detail);
            } else {
                setOtpError("Invalid OTP. Please try again.");
            }
        }
    };

    const handleResendOtp = async () => {
        try {
            const response = await patientForgotPassword(phone);
            const smsStatus = response.data?.sms?.status;
            const otp_token = response.data?.otp_token || "";

            if (smsStatus && smsStatus !== "sent") {
                setOtpError("Failed to resend OTP. Please try again later.");
                return;
            }

            if (otp_token) {
                setOtpToken(otp_token);
                setOtpError("");
            } else {
                setOtpError("If the account exists, an OTP has been sent.");
            }
        } catch (error: any) {
            setOtpError("Failed to resend OTP. Please try again.");
        }
    };

    return (
        <>
            <NavBar />
            <section className="flex justify-center mb-32 px-4 md:px-6">
                <div className="w-full max-w-md mt-20 pt-24 pb-12">
                    <h2 className="text-3xl font-semibold text-neutral-800 mb-4">
                        Forgot your password?
                    </h2>
                    <p className="text-neutral-600 mb-6">
                        {step === "request" && "Enter your phone number and we'll send you a reset OTP."}
                        {step === "verify" && "Enter the OTP we sent to your phone."}
                        {step === "reset" && "Set a new password for your account."}
                    </p>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {step === "request" && (
                            <div>
                                <label
                                    htmlFor="phone"
                                    className="block text-sm font-medium text-neutral-700 mb-1"
                                >
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    id="phone"
                                    name="phone"
                                    onChange={handleInputFieldChange}
                                    required
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="07XXXXXXXX"
                                />
                            </div>
                        )}

                        {step === "verify" && (
                            <div className="space-y-3">
                                <p className="text-sm text-neutral-600">
                                    Check the OTP sent to your phone and verify to continue.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowOtpModal(true)}
                                    className="w-full border border-primary-500 text-primary-600 py-2 px-4 rounded-md hover:bg-primary-50 transition duration-300"
                                >
                                    Open OTP Verification
                                </button>
                            </div>
                        )}

                        {step === "reset" && (
                            <>
                                <div>
                                    <label
                                        htmlFor="new_password"
                                        className="block text-sm font-medium text-neutral-700 mb-1"
                                    >
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="new_password"
                                        name="new_password"
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Enter a new password"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="confirm_password"
                                        className="block text-sm font-medium text-neutral-700 mb-1"
                                    >
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirm_password"
                                        name="confirm_password"
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Re-enter the new password"
                                    />
                                </div>
                            </>
                        )}

                        {error && (
                            <p className="text-error-500 text-sm mt-1">
                                {error}
                            </p>
                        )}

                        {step !== "verify" && (
                            <button
                                type="submit"
                                className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 transition duration-300 disabled:opacity-60"
                                disabled={isSubmitting}
                            >
                                {step === "request" && "Send OTP"}
                                {step === "reset" && "Reset Password"}
                            </button>
                        )}
                    </form>
                </div>
            </section>
            <Footer />
            <OtpPopupModal
                isOpen={showOtpModal}
                onClose={() => setShowOtpModal(false)}
                phoneNumber={phone.phone}
                onVerify={handleVerifyOtp}
                otpError={otpError}
                isVerified={isOtpVerified}
                onResendOtp={handleResendOtp}
            />
        </>
    );
};

export default ForgotPassword;
