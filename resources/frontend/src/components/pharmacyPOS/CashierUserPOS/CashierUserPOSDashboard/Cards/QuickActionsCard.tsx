import { useNavigate } from "react-router-dom";

const QuickActionsCard = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    onClick={() => navigate("/pos/sales")}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                    New Sale
                </button>
                <button
                    onClick={() => navigate("/pos/inventory")}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-100"
                >
                    Manage Inventory
                </button>
                <button
                    onClick={() => navigate("/pos/purchasing")}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-100"
                >
                    Purchasing Management
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-100">
                    Generate Report
                </button>
            </div>
        </div>
    );
};

export default QuickActionsCard;
