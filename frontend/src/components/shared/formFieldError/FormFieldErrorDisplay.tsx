import React from "react";

interface FormFieldErrorDisplayProps {
    formFieldError: string;
}
const FormFieldErrorDisplay: React.FC<FormFieldErrorDisplayProps> = ({
    formFieldError,
}) => {
    return (
        formFieldError ? (
            <p className="text-red-500 text-sm mb-2">{formFieldError}</p>
        ) : ''
    );
};

export default FormFieldErrorDisplay;
