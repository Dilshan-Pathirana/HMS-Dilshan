import React, { useState } from "react";
import NavBar from "./NavBar.tsx";
import Footer from "./Footer.tsx";
import { ForgotPasswordField } from "../../utils/form/formFieldsAttributes/ForgotPasswordField.ts";
import { IPhone } from "../../utils/types/users/ISignUp.ts";
import { patientForgotPassword } from "../../utils/api/user/PatientForgotPassword.ts";
import { useNavigate } from "react-router-dom";

const ForgotPassword: React.FC = () => {
    const [phone, setPhone] = useState<IPhone>(ForgotPasswordField);
    const [error, setError] = useState<string>('');
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

        try {
            const response = await patientForgotPassword(phone);

            if (response.status === 200) {
                setError('');
                navigate("/login", {
                    state: {
                        message:
                            "We have sent your login credentials to the phone number you used for registration. Please check your message inbox.",
                    },
                });
            }
        }
        catch (error: any) {
            if (error.response.status === 422) {
                setError(error.response.data.message);
            }
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
                        Enter your phone number and we'll send you a new
                        password into the that number.
                    </p>
                    <form className="space-y-6" onSubmit={handleSubmit}>
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
                            {error && (
                                <p className="text-error-500 text-sm mt-1">
                                    {error}
                                </p>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 transition duration-300"
                        >
                            Request New Password
                        </button>
                    </form>
                </div>
            </section>
            <Footer />
        </>
    );
};

export default ForgotPassword;
