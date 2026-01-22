import { ReactNode } from "react";

export interface SideNavItemProps {
    title: string;
    icon: ReactNode;
    path?: string;
    subItems?: { title: string; path: string }[];
}
