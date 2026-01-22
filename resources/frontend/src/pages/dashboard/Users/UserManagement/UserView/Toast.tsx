import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { ToastProps } from "../../../../../utils/types/users/Iuser.ts";
import {
    TOAST_BASE_STYLES,
    TOAST_ICONS,
    TOAST_TYPE_STYLES,
} from "../../../../../utils/staticData/Toast/Toastmodule.ts";

const Toast: React.FC<ToastProps> = ({
    message,
    type = "success",
    duration = 3000,
    onClose,
    position = "top-right",
    showCloseButton = true,
}) => {
    const [isVisible, setIsVisible] = useState(true);

    const timer = useMemo(() => {
        return setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, duration);
    }, [duration, onClose]);

    const handleClose = useCallback(() => {
        clearTimeout(timer);
        setIsVisible(false);
        setTimeout(onClose, 300);
    }, [timer, onClose]);

    const { className, icon } = useMemo(
        () => ({
            className: `${TOAST_BASE_STYLES} ${TOAST_TYPE_STYLES[type]}`,
            icon: TOAST_ICONS[type],
        }),
        [type],
    );

    const positionStyles = useMemo(() => {
        const positions = {
            "top-right": "top-4 right-4",
            "top-left": "top-4 left-4",
            "bottom-right": "bottom-4 right-4",
            "bottom-left": "bottom-4 left-4",
        };
        return positions[position];
    }, [position]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={`fixed z-50 ${positionStyles}`}
                >
                    <div className={className}>
                        <span className="mr-2 text-lg font-bold">{icon}</span>
                        <div className="flex-1">
                            <p className="text-sm font-medium">{message}</p>
                        </div>
                        {showCloseButton && (
                            <button
                                onClick={handleClose}
                                className="ml-4 text-xl font-bold opacity-70 hover:opacity-100 focus:outline-none"
                                aria-label="Close toast"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
