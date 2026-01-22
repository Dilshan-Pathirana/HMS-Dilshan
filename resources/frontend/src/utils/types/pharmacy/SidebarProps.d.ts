export interface SidebarProps {
    isOpenSidebarMenu: boolean;
    isButton?: boolean;
    children?: SidebarItem[];
}

export interface SidebarItem {
    label: string;
    icon?: JSX.Element;
    link?: string;
    isButton?: boolean;
    children?: SidebarItem[];
    roles?: string[];
}
