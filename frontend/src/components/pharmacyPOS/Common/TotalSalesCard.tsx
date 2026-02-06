import { ShoppingCart } from "lucide-react";

interface TotalSalesCardProps {
    totalSales: number;
}

const TotalSalesCard = ({ totalSales }: TotalSalesCardProps) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-medium">Today Sales</span>
                <ShoppingCart className="h-4 w-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold">LKR {totalSales}</div>
        </div>
    );
};

export default TotalSalesCard;
