import React from "react";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { IPhoneNumberVerificationProps } from "../../../utils/types/users/ISignUp.ts";
import PhoneNumberInputField from "./PhoneNumberInputField.tsx";

const PhoneNumberVerification: React.FC<IPhoneNumberVerificationProps> = ({
    signupInfo,
    errors,
    isOtpSent,
    isOtpVerified,
    handleChange,
    phoneExistsError,
}) => {
    return (
        <>
            <PhoneNumberInputField
                signupInfo={signupInfo}
                isOtpSent={isOtpSent}
                errors={errors}
                isOtpVerified={isOtpVerified}
                handleChange={handleChange}
            />

            {/* Phone Already Exists Error - Prominent Display */}
            {phoneExistsError && (
                <div className="w-full bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <FaExclamationTriangle className="text-red-500 text-xl" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-red-700 text-base mb-1">Phone Number Already Registered</h4>
                        <p className="text-red-600 text-sm">
                            {phoneExistsError}
                        </p>
                        <a 
                            href="/login" 
                            className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                            Login to your existing account →
                        </a>
                    </div>
                </div>
            )}

            {/* OTP is now handled in popup modal - removed inline OTP input */}

            {isOtpVerified && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                    <FaCheckCircle className="text-green-500 mr-2" />
                    <span className="text-green-800 text-sm">
                        Phone number verified successfully!
                    </span>
                </div>
            )}
        </>
    );
};

export default PhoneNumberVerification;
