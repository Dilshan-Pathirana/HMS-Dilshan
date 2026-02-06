import React from "react";
import { FaCheckCircle, FaPhone } from "react-icons/fa";
import { ISignUpFormFields } from "../../../utils/types/users/ISignUp.ts";

interface IPhoneNumberInputFieldProp {
    signupInfo: ISignUpFormFields;
    isOtpSent: boolean;
    errors: { [key: string]: string };
    isOtpVerified: boolean;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PhoneNumberInputField: React.FC<IPhoneNumberInputFieldProp> = ({
    signupInfo,
    isOtpSent,
    errors,
    isOtpVerified,
    handleChange,
}) => {
    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
                Phone Number
            </label>
            <div className="flex items-center border border-neutral-200 bg-neutral-50/50 rounded-xl p-3.5 w-full focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300 ease-out shadow-sm hover:bg-white hover:border-primary-200">
                <FaPhone className="text-neutral-400 mr-3" />
                <input
                    type="tel"
                    name="phone"
                    value={signupInfo.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full bg-transparent outline-none text-neutral-900 placeholder:text-neutral-400"
                    disabled={isOtpSent}
                />
                {isOtpSent && isOtpVerified && (
                    <span className="flex items-center text-success-600 font-medium text-sm ml-2 bg-success-50 px-2 py-0.5 rounded-full">
                        <FaCheckCircle className="mr-1" />
                        Verified
                    </span>
                )}
            </div>
            {errors.phone && (
                <p className="text-error-500 text-sm mt-1">{errors.phone}</p>
            )}
        </div>
    );
};

export default PhoneNumberInputField;
