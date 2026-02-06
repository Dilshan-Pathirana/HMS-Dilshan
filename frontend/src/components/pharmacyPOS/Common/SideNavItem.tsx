import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SideNavItemProps } from "../../../utils/types/pos/ISidebar.ts";

export default function SideNavItem({
    title,
    icon,
    path,
    subItems,
}: SideNavItemProps) {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const isActive = (path: string) => location.pathname === path;

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div>
            {path ? (
                <Link
                    to={path}
                    className={`flex items-center px-6 py-3 ${
                        isActive(path)
                            ? "text-neutral-700 bg-neutral-200"
                            : "text-neutral-600 hover:bg-neutral-200"
                    }`}
                >
                    <div className="w-5 h-5 mr-3">{icon}</div>
                    {title}
                </Link>
            ) : (
                <div
                    className="flex items-center px-6 py-3 cursor-pointer text-neutral-600 hover:bg-neutral-200"
                    onClick={toggleOpen}
                >
                    <div className="w-5 h-5 mr-3">{icon}</div>
                    <span>{title}</span>
                    {subItems && (
                        <div className="ml-auto">
                            {isOpen ? (
                                <ChevronUp className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                        </div>
                    )}
                </div>
            )}

            {subItems && isOpen && (
                <div className="ml-8 mt-2 space-y-1">
                    {subItems.map((subItem) => (
                        <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`block ${
                                isActive(subItem.path)
                                    ? "text-neutral-700 bg-neutral-200"
                                    : "text-neutral-600 hover:bg-neutral-200"
                            } px-4 py-2 rounded-md`}
                        >
                            {subItem.title}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
