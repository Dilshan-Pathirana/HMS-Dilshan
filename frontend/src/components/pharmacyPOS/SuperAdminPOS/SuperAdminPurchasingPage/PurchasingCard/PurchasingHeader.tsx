import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PurchasingHeader = () => {
    const navigate = useNavigate();
    return (
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b m-5">
            <div className="flex items-center">
                <ArrowLeft
                    className="h-6 w-6 text-neutral-500 cursor-pointer"
                    onClick={() => navigate(-1)}
                />
                <h1 className="text-2xl font-semibold text-neutral-800 ml-4">
                    Purchasing Management
                </h1>
            </div>
        </header>
    );
};

export default PurchasingHeader;
