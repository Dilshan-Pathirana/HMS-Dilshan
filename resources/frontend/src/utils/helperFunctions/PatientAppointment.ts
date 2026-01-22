import {
    FormErrors,
    userDetailsTypes,
} from "../types/Appointment/IDoctorSchedule.ts";
import React from "react";

export const getCorrectFormattedDate = (dateForSchedule: Date) => {
    return `${dateForSchedule.getFullYear()}-${String(dateForSchedule.getMonth() + 1).padStart(2, "0")}-${String(dateForSchedule.getDate()).padStart(2, "0")}`;
};

export const validateForm = (
    userDetails: userDetailsTypes,
    setErrors: React.Dispatch<React.SetStateAction<FormErrors>>,
): boolean => {
    const newErrors: FormErrors = {};

    if (!userDetails.firstName?.trim()) {
        newErrors.firstName = "First name is required.";
    }
    if (!userDetails.lastName?.trim()) {
        newErrors.lastName = "Last name is required.";
    }
    if (!userDetails.phone?.trim()) {
        newErrors.phone = "Phone number is required.";
    } else if (userDetails.phone.replace(/\D/g, "").length !== 10) {
        newErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (userDetails.email && userDetails.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userDetails.email)) {
            newErrors.email = "Please enter a valid email address.";
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};
