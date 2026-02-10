import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductCreateModal from "../SuperAdminUserPharmacyDashboard/products/productCreate/ProductCreateModal.tsx";
import { useUserRole } from "../../../utils/state/checkAuthenticatedUserStates.ts";
import {
    accessForAdmin,
    accessForPharmacyUser,
} from "../../../utils/state/GivePermissionForUserRole.tsx";
import {
    FaAngleDown,
    FaBox,
    FaTachometerAlt,
    FaLuggageCart,
    FaStore,
} from "react-icons/fa";
import {
    User, FileText, Pill, Package, BarChart3,
    ShoppingCart, MessageSquare
} from "lucide-react";
import {
    SidebarItem,
    SidebarProps,
} from "../../../utils/types/pharmacy/SidebarProps";

const PharmacySidebar: React.FC<SidebarProps> = ({ isOpenSidebarMenu }) => {
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
    const [activeTab, setActiveTab] = useState<string>("");
    const [isProductCreateModalOpen, setIsProductCreateModalOpen] =
        useState<boolean>(false);

    const userRole = useUserRole();
    const permissionForAdminUser = accessForAdmin(userRole);
    const permissionForPharmacistUser = accessForPharmacyUser(userRole);
    const navigate = useNavigate();

    const toggleMenu = (label: string) => {
        setOpenMenus((prev) => {
            const newMenuState = { ...prev };
            for (const key in newMenuState) {
                newMenuState[key] = false;
            }
            newMenuState[label] = !newMenuState[label];
            return newMenuState;
        });
    };

    const openModal = (child: any) => {
        if (child.label === "Add Product") {
            navigate("/pharmacy-dashboard/product-create");
        }

        if (child.label === "Add Supplier") {
            navigate("/pharmacy-dashboard/add-Supplier");
        }
    };
    const closeModal = () => setIsProductCreateModalOpen(false);

    const getRoutesByRole = () => {
        if (permissionForAdminUser || permissionForPharmacistUser) {
            return [
                { label: "Add Product", isButton: true },
                { label: "Product List", link: "product-list" },
            ];
        }
        return [];
    };

    const getSupplierRoutesForPharmacist = () => {
        if (permissionForPharmacistUser || permissionForAdminUser) {
            return [
                { label: "Add Supplier", isButton: true },
                { label: "Supplier List", link: "supplier-list" },
            ];
        }
        return [];
    };

    const sidebarItems: SidebarItem[] = [
        {
            label: "Dashboard",
            icon: <FaTachometerAlt className="w-5 h-5" />,
            link: "/pharmacy-dashboard",
        },
        ...(permissionForPharmacistUser ? [
            {
                label: "My Profile",
                icon: <User className="w-5 h-5" />,
                link: "/pharmacy-dashboard/profile",
            },
            {
                label: "Prescriptions",
                icon: <FileText className="w-5 h-5" />,
                link: "/pharmacy-dashboard/prescriptions",
            },
            {
                label: "Dispensing",
                icon: <Pill className="w-5 h-5" />,
                link: "/pharmacy-dashboard/dispensing",
            },
            {
                label: "Inventory",
                icon: <Package className="w-5 h-5" />,
                link: "/pharmacy-dashboard/inventory",
            },
            {
                label: "Reports",
                icon: <BarChart3 className="w-5 h-5" />,
                link: "/pharmacy-dashboard/reports",
            },
            {
                label: "Purchase Orders",
                icon: <ShoppingCart className="w-5 h-5" />,
                link: "/pharmacy-dashboard/purchase",
            },
            {
                label: "Feedback",
                icon: <MessageSquare className="w-5 h-5" />,
                link: "/pharmacy-dashboard/feedback",
            },
        ] : []),
        ...(permissionForAdminUser ? [{
            label: "Pharmacies",
            icon: <FaStore className="w-5 h-5" />,
            link: "/pharmacy-dashboard/pharmacies",
        }] : []),
        {
            label: "Products",
            icon: <FaBox className="w-5 h-5" />,
            children: getRoutesByRole(),
        },
        {
            label: "Suppliers",
            icon: <FaLuggageCart className="w-5 h-5" />,
            children: getSupplierRoutesForPharmacist(),
        },
    ];

    return (
        <>
            <aside
                className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${
                    isOpenSidebarMenu ? "translate-x-0" : "-translate-x-full"
                } bg-gradient-to-b from-primary-500 to-cyan-700 text-white`}
                aria-label="Sidebar"
            >
                <div className="h-full px-3 pb-4 overflow-y-auto">
                    <ul className="space-y-1 font-medium">
                        {sidebarItems.map((item, index) => (
                            <li key={index}>
                                {item.children ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                toggleMenu(item.label);
                                                setActiveTab(item.label);
                                            }}
                                            className={`flex items-center justify-between px-4 py-3 w-full rounded-lg hover:bg-white/10 transition-colors group ${
                                                activeTab === item.label
                                                    ? "bg-white/20 text-white"
                                                    : "text-white"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {item.icon}
                                                <span className="font-medium">
                                                    {item.label}
                                                </span>
                                            </div>
                                            <FaAngleDown
                                                className={`transition-transform transform ${
                                                    openMenus[item.label]
                                                        ? "rotate-180"
                                                        : "rotate-0"
                                                } w-5 h-5`}
                                            />
                                        </button>
                                        {openMenus[item.label] && (
                                            <ul className="pl-8 space-y-2">
                                                {item.children.map(
                                                    (child, childIndex) =>
                                                        child.isButton ? (
                                                            <li
                                                                key={childIndex}
                                                            >
                                                                <button
                                                                    onClick={() =>
                                                                        openModal(
                                                                            child,
                                                                        )
                                                                    }
                                                                    className="flex items-center px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                                                                >
                                                                    {
                                                                        child.label
                                                                    }
                                                                </button>
                                                            </li>
                                                        ) : (
                                                            <li
                                                                key={childIndex}
                                                            >
                                                                <Link
                                                                    to={
                                                                        child.link ||
                                                                        "#"
                                                                    }
                                                                    className={`flex items-center px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors ${
                                                                        activeTab ===
                                                                        child.label
                                                                            ? "bg-white/20"
                                                                            : ""
                                                                    }`}
                                                                    onClick={() =>
                                                                        setActiveTab(
                                                                            child.label,
                                                                        )
                                                                    }
                                                                >
                                                                    {
                                                                        child.label
                                                                    }
                                                                </Link>
                                                            </li>
                                                        ),
                                                )}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        to={item.link || "#"}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors group ${
                                            activeTab === item.label
                                                ? "bg-white/20 text-white"
                                                : "text-white"
                                        }`}
                                        onClick={() => setActiveTab(item.label)}
                                    >
                                        {item.icon}
                                        <span className="font-medium">
                                            {item.label}
                                        </span>
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>
            <ProductCreateModal
                isOpen={isProductCreateModalOpen}
                onClose={closeModal}
            />
        </>
    );
};

export default PharmacySidebar;
