import React, { useEffect } from "react";
import { INavbarNotificationSectionProps } from "../../../../utils/types/common/Navbar";

const NavbarNotificationSection: React.FC<INavbarNotificationSectionProps> = ({
    notificationMessage,
    setIsNewNotificationAvailable,
}) => {
    useEffect(() => {
        setIsNewNotificationAvailable(false)
    }, []);

    return (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
            {notificationMessage && (
                <div className="p-2">
                    <p>
                        {notificationMessage} product is reached the restock
                        level.
                    </p>
                </div>
            )}
        </div>
    );
};

export default NavbarNotificationSection;
