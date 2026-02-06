import React, { useEffect, useRef, useState } from "react";
import { FaCheckCircle, FaTimes, FaMobileAlt, FaRedo } from "react-icons/fa";

interface OtpPopupModalProps {
    isOpen: boolean;
    onClose: () => void;
    phoneNumber: string;
    onVerify: (otp: string) => void;
    otpError: string;
    isVerified: boolean;
    onResendOtp: () => void;
}

const OtpPopupModal: React.FC<OtpPopupModalProps> = ({
    isOpen,
    onClose,
    phoneNumber,
    onVerify,
    otpError,
    isVerified,
    onResendOtp,
}) => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [otpTimer, setOtpTimer] = useState<number>(120);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setOtp(["", "", "", "", "", ""]);
            setOtpTimer(120);
            // Focus first input after modal opens
            setTimeout(() => {
                otpInputRefs.current[0]?.focus();
            }, 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || otpTimer <= 0) return;

        const timerId = setTimeout(() => {
            setOtpTimer((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timerId);
    }, [otpTimer, isOpen]);

    const handleOtpInputChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        index: number
    ) => {
        if (event.target.value.length <= 1) {
            const newOtp = [...otp];
            const digit = event.target.value.replace(/[^0-9]/g, "");
            newOtp[index] = digit;
            setOtp(newOtp);

            if (digit && index < 5) {
                otpInputRefs.current[index + 1]?.focus();
            }

            const isOtpComplete = newOtp.join("").length === 6;
            if (isOtpComplete) {
                onVerify(newOtp.join(""));
            }
        }
    };

    const handleOtpKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        index: number
    ) => {
        if (e.key === "Backspace") {
            if (index > 0 && otp[index] === "") {
                otpInputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === "ArrowRight" && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        } else if (e.key === "ArrowLeft" && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        const pastedData = event.clipboardData
            .getData("text")
            .replace(/[^0-9]/g, "")
            .slice(0, 6);

        if (!pastedData) return;

        const newOtp = [...otp];
        for (let i = 0; i < Math.min(6, pastedData.length); i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);

        if (pastedData.length === 6) {
            setTimeout(() => onVerify(pastedData), 300);
        }
    };

    const formatPhoneNumber = (phone: string) => {
        if (!phone) return "";
        const cleaned = phone.replace(/\D/g, "");
        let formatted = cleaned;

        if (cleaned.length > 6) {
            formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
        } else if (cleaned.length > 3) {
            formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
        }

        return formatted;
    };

    const handleResend = () => {
        setOtp(["", "", "", "", "", ""]);
        setOtpTimer(120);
        onResendOtp();
        setTimeout(() => {
            otpInputRefs.current[0]?.focus();
        }, 100);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-blue-700 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <FaMobileAlt className="text-white text-xl" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg">Verify Your Phone</h2>
                                <p className="text-blue-100 text-sm">OTP sent via SMS</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        >
                            <FaTimes className="text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isVerified ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaCheckCircle className="text-green-500 text-4xl" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-800 mb-2">Verified!</h3>
                            <p className="text-neutral-600">Your phone number has been verified successfully.</p>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <p className="text-neutral-600">
                                    We've sent a 6-digit verification code to
                                </p>
                                <p className="text-lg font-bold text-neutral-800 mt-1">
                                    {formatPhoneNumber(phoneNumber)}
                                </p>
                            </div>

                            {/* Timer */}
                            <div className="flex justify-center mb-4">
                                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                                    otpTimer > 30 
                                        ? 'bg-green-100 text-green-700' 
                                        : otpTimer > 0 
                                            ? 'bg-yellow-100 text-yellow-700' 
                                            : 'bg-error-100 text-red-700'
                                }`}>
                                    {otpTimer > 0 
                                        ? `Code expires in ${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, "0")}`
                                        : "Code expired"
                                    }
                                </div>
                            </div>

                            {/* OTP Input */}
                            <div className="flex justify-center gap-2 mb-4">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (otpInputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpInputChange(e, index)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                        onPaste={index === 0 ? handleOtpPaste : undefined}
                                        className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all ${
                                            digit 
                                                ? "border-primary-500 bg-blue-50" 
                                                : "border-neutral-200 hover:border-neutral-300"
                                        } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
                                    />
                                ))}
                            </div>

                            {/* Error Message */}
                            {otpError && (
                                <div className="bg-error-50 border border-red-200 rounded-lg p-3 mb-4">
                                    <p className="text-error-600 text-sm text-center font-medium">
                                        {otpError}
                                    </p>
                                </div>
                            )}

                            {/* Resend Option */}
                            <div className="text-center">
                                <p className="text-neutral-500 text-sm mb-2">Didn't receive the code?</p>
                                {otpTimer > 0 ? (
                                    <p className="text-neutral-400 text-sm">
                                        You can resend in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-primary-500 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                                    >
                                        <FaRedo className="text-xs" />
                                        Resend Code
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <p className="text-center text-xs text-neutral-400">
                        By verifying, you agree to receive SMS messages from Cure Health Care
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OtpPopupModal;
