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
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
            </label>
            <div className="flex items-center border rounded-lg p-3 w-full focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <FaPhone className="text-gray-500 mr-3" />
                <input
                    type="tel"
                    name="phone"
                    value={signupInfo.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-500"
                    disabled={isOtpSent}
                />
                {isOtpSent && isOtpVerified && (
                    <span className="flex items-center text-green-600 font-medium text-sm ml-2">
                        <FaCheckCircle className="mr-1" />
                        Verified
                    </span>
                )}
            </div>
            {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
        </div>
    );
};

export default PhoneNumberInputField;
