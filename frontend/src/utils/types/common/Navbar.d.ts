import React from "react";

export interface NavbarProps {
    toggleSidebar: () => void;
}

export interface UserDropDownProps {
    handleHrDashboard: () => void;
    signOutHandle: (event: React.MouseEvent<HTMLButtonElement>) => void;
    userRole?: number;
}

export interface INotificationDataForStockLimitReach {
    product_name: string;
}

export interface INavbarNotificationSectionProps {
    notificationMessage: string;
    setIsNewNotificationAvailable: React.Dispatch<
        React.SetStateAction<boolean>
    >;
}
