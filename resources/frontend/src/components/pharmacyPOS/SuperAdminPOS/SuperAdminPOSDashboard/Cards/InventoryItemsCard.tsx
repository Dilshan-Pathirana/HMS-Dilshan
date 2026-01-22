import { Package } from "lucide-react";

interface InventoryItemsCardProps {
    totalProducts: number;
}

const InventoryItemsCard = ({ totalProducts }: InventoryItemsCardProps) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-medium">Inventory Items</span>
                <Package className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{totalProducts}</div>
        </div>
    );
};

export default InventoryItemsCard;
