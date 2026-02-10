import React from "react";

export interface ISignUpFormFields {
    first_name: string;
    last_name: string;
    phone: string;
    NIC: string;
    password: string;
    email: string;
    address: string;
    city: string;
    date_of_birth: string;
    gender: string;
    blood_type: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    branch_ids: string[];
}

export interface ISignupFormProps {
    signupInfo: ISignUpFormFields;
    errors: { [key: string]: string };
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    setSignupInfo: React.Dispatch<React.SetStateAction<ISignUpFormFields>>;
    verifyOtp: (phoneNumber: string, otp: string) => Promise<void>;
    isOtpSent: boolean;
    isOtpVerified: boolean;
    isSubmitting: boolean;
    otpError: string;
    formRef: React.RefObject<HTMLDivElement>;
    autoSendOtp: () => Promise<boolean>;
    phoneExistsError?: string;
}

export interface IPhoneNumberVerificationProps {
    signupInfo: ISignUpFormFields;
    errors: { [key: string]: string };
    isOtpSent: boolean;
    verifyOtp: (phoneNumber: string, otp: string) => Promise<void>;
    isOtpVerified: boolean;
    otpError: string;
    formRef: React.RefObject<HTMLDivElement>;
    autoSendOtp: () => Promise<boolean>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    phoneExistsError?: string;
}

export interface ILoginFormProps {
    signInError: string;
    loginInfo: { email: string; password: string };
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    isLoading?: boolean;
}

export interface IPhone {
    phone: string;
}
