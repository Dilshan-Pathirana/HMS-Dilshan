import React from "react";

export type RouteDefinition = {
    path: string;
    element: React.ReactNode;
};

export type NavbarProps = {
    toggleSidebar: () => void;
};

export type PharmacyNavbarDropDownProps = {
    isDropdownOpen: boolean;
    userRole?: number;
};

export type ProfileButtonProps = {
    toggleDropdown: () => void;
};
