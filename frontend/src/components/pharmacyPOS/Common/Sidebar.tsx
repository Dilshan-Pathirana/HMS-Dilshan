import { Link } from "react-router-dom";
import {
    Home,
    ShoppingCart,
    DollarSign,
    FileText,
    Clock,
    TrendingUp,
    Users,
} from "lucide-react";
import SideNavItem from "./SideNavItem.tsx";

import CureLogo from "../../../assets/cure-logo.png";
import React from "react";

interface SidebarProps {
    sidebarOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen }) => {
    return (
        <div
            className={`bg-white w-64 min-h-screen shadow-md ${sidebarOpen ? "block" : "hidden"} md:block`}
        >
            <div className="flex items-center justify-center h-16 pb-16 pt-5">
                <Link
                    to="/"
                    className="text-2xl font-semibold text-primary-500 mt-28 py-10 pb-24 hover:opacity-80 transition-opacity"
                >
                    <img
                        src={CureLogo}
                        alt="Logo"
                        className="h-[100px] w-[100px] m-2"
                    />
                </Link>
            </div>

            <nav className="mt-6 pb-16 overflow-y-auto max-h-[calc(100vh-4rem)]">
                {/* Dashboard - Main overview with stats */}
                <SideNavItem 
                    title="Dashboard" 
                    icon={<Home />} 
                    path="/pos" 
                />
                
                {/* Point of Sale - Create billing transactions */}
                <SideNavItem
                    title="Point of Sale"
                    icon={<ShoppingCart />}
                    path="/pos/pos"
                />
                
                {/* Cash Management - Cash in/out entries */}
                <SideNavItem
                    title="Cash Entries"
                    icon={<DollarSign />}
                    path="/pos/cash-entries"
                />
                
                {/* Transactions - View all transactions */}
                <SideNavItem
                    title="Transactions"
                    icon={<FileText />}
                    path="/pos/transactions"
                />
                
                {/* End of Day - Daily reconciliation */}
                <SideNavItem
                    title="End of Day"
                    icon={<Clock />}
                    path="/pos/eod"
                />
                
                {/* HR Self-Service */}
                <SideNavItem
                    title="HR Portal"
                    icon={<Users />}
                    path="/pos/hr"
                />
                
                {/* Reports section */}
                <SideNavItem
                    title="Reports"
                    icon={<TrendingUp />}
                    subItems={[
                        {
                            title: "Daily Sales Report",
                            path: "/pos/transactions",
                        },
                        {
                            title: "EOD History",
                            path: "/pos/eod",
                        },
                    ]}
                />
            </nav>
        </div>
    );
};

export default Sidebar;
