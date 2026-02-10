import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SignupForm from "../../components/signUpForm/SignupForm.tsx";
import OtpPopupModal from "../../components/signUpForm/OtpPopupModal.tsx";
import CredentialConflictModal from "../../components/signUpForm/CredentialConflictModal.tsx";
import alert from "../../utils/alert";
import { UserSignUp } from "../../utils/api/user/UserSignUp.ts";
import { SignUpFormFieldsAttributes } from "../../utils/form/formFieldsAttributes/SignUpFormFields.ts";
import { ISignUpFormFields } from "../../utils/types/users/ISignUp.ts";
import { sendSMS } from "../../utils/api/SMS/smsService.ts";
import { checkIsFiledEmpty } from "../../utils/helperFunctions/PatientSignUpForm.ts";
import api from "../../utils/api/axios";

interface ConflictItem {
    field: string;
    label: string;
    message: string;
}

const SignupPage: React.FC = () => {
    const [signupInfo, setSignupInfo] = useState<ISignUpFormFields>(
        SignUpFormFieldsAttributes,
    );

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [otpError, setOtpError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState("");
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [phoneExistsError, setPhoneExistsError] = useState("");
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [credentialConflicts, setCredentialConflicts] = useState<ConflictItem[]>([]);
    const formRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSignupInfo({ ...signupInfo, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });

        if (e.target.name === "phone") {
            setIsOtpSent(false);
            setIsOtpVerified(false);
            setPhoneExistsError(""); // Clear phone exists error when phone changes
        }

        // Clear conflict modal when user changes conflicting fields
        if (['phone', 'NIC', 'email'].includes(e.target.name)) {
            setCredentialConflicts([]);
        }
    };

    const checkCredentialsExist = async (): Promise<boolean> => {
        // Temporarily skip credential conflict checks.
        setCredentialConflicts([]);
        setPhoneExistsError("");
        return false;
    };

    const generateOtp = (): string => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const initiateOtpProcess = async () => {
        if (!signupInfo.phone) {
            alert.warn("Please enter your phone number.");
            return false;
        }

        // Check if phone, NIC, or email already exists
        const hasConflicts = await checkCredentialsExist();
        if (hasConflicts) {
            return false;
        }

        try {
            const newOtp = generateOtp();
            setGeneratedOtp(newOtp);
            setOtpError("");

            // Send OTP and show modal
            await sendSMS(
                signupInfo.phone,
                `Cure Health Care OTP: ${newOtp}. Use this to access your account. Expires in 2 mins. Never share this code for your safety`,
            );

            setIsOtpSent(true);
            setShowOtpModal(true); // Open the OTP popup modal
            alert.success("OTP sent successfully!");

            return true;
        } catch (error: any) {
            alert.error("Failed to send OTP. Please try again.");
            return false;
        }
    };

    const verifyOtp = async (_phoneNumber: string, otp: string) => {
        try {
            if (otp === generatedOtp) {
                setIsOtpVerified(true);
                setOtpError("");
                alert.success("Phone number verified successfully!");

                // Close modal after a brief delay to show success state
                setTimeout(() => {
                    setShowOtpModal(false);
                    createPatientUser();
                }, 1500);
            } else {
                setOtpError("Invalid OTP. Please check and try again.");
            }
        } catch (error: any) {
            setOtpError("Invalid OTP. Please try again.");
        }
    };

    const handleResendOtp = async () => {
        const newOtp = generateOtp();
        setGeneratedOtp(newOtp);
        setOtpError("");

        try {
            await sendSMS(
                signupInfo.phone,
                `Cure Health Care OTP: ${newOtp}. Use this to access your account. Expires in 2 mins. Never share this code for your safety`,
            );
            alert.success("New OTP sent successfully!");
        } catch (error) {
            alert.error("Failed to resend OTP. Please try again.");
        }
    };

    const handleCloseOtpModal = () => {
        setShowOtpModal(false);
        // Reset OTP state if user closes without verifying
        if (!isOtpVerified) {
            setIsOtpSent(false);
            setGeneratedOtp("");
            setOtpError("");
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (checkIsFiledEmpty(signupInfo)) {
            alert.warn(
                "Please fill first name / last name / mobile number / NIC and related branch.",
            );
            return;
        }

        if (!isOtpSent) {
            await initiateOtpProcess();
            return;
        }

        if (!isOtpVerified) {
            alert.warn("Please fill related data first.");
            return;
        }

        setIsSubmitting(true);
    };

    const createPatientUser = async () => {
        try {
            const response = await UserSignUp(signupInfo);

            if (response.data.status === 200) {
                const smsStatus = response.data.sms?.status;
                const credentials = response.data.credentials;
                if (smsStatus && smsStatus !== "sent" && credentials?.email && credentials?.password) {
                    alert.warn(
                        `SMS failed. Use these credentials to log in: ${credentials.email} / ${credentials.password}`,
                    );
                } else {
                    alert.success(
                        response.data.message || "Account created successfully!",
                    );
                }
                setSignupInfo(SignUpFormFieldsAttributes);
                setErrors({});
                setIsOtpSent(false);
                setIsOtpVerified(false);
                navigate("/login", {
                    state: {
                        message:
                            "We have sent your login credentials to the phone number you used for registration. Please check your message inbox.",
                    },
                });
            } else {
                alert.error(
                    response.data.message || "Failed to create account.",
                );
            }
        } catch (error: any) {
            if (error.response && error.response.data) {
                // Show the actual error message from the API
                const errorMessage = error.response.data.message || error.response.data.error || "Failed to create account.";
                alert.error(errorMessage);
                if (error.response.data.errors) {
                    setErrors(error.response.data.errors);
                }
            } else if (error.message) {
                alert.error(error.message);
            } else {
                alert.error("An error occurred. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <SignupForm
                signupInfo={signupInfo}
                errors={errors}
                handleChange={handleChange}
                handleSubmit={handleFormSubmit}
                setSignupInfo={setSignupInfo}
                verifyOtp={verifyOtp}
                isOtpSent={isOtpSent}
                isOtpVerified={isOtpVerified}
                isSubmitting={isSubmitting}
                otpError={otpError}
                formRef={formRef}
                autoSendOtp={initiateOtpProcess}
                phoneExistsError={phoneExistsError}
            />

            {/* OTP Verification Popup Modal */}
            <OtpPopupModal
                isOpen={showOtpModal}
                onClose={handleCloseOtpModal}
                phoneNumber={signupInfo.phone}
                onVerify={(otp) => verifyOtp(signupInfo.phone, otp)}
                otpError={otpError}
                isVerified={isOtpVerified}
                onResendOtp={handleResendOtp}
            />

            {/* Credential Conflict Popup Modal */}
            <CredentialConflictModal
                isOpen={showConflictModal}
                onClose={() => setShowConflictModal(false)}
                conflicts={credentialConflicts}
            />
        </>
    );
};

export default SignupPage;
