import React from "react";
import { handleAddToCart } from "../CommonFunctionalities.ts";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store.tsx";
import { ProductGridProps } from "../../../../utils/types/pos/IPurchasing.ts";
import { Copy, Tag, PlusCircle } from "lucide-react";

const SalesProductGrid: React.FC<ProductGridProps> = ({ filteredProducts }) => {
    const dispatch = useDispatch<AppDispatch>();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {filteredProducts.map((product) => (
                <button
                    key={product.id}
                    onClick={() => handleAddToCart(product, dispatch)}
                    className="group relative flex flex-col items-start bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md hover:border-primary-300 hover:ring-2 hover:ring-primary-500/20 transition-all duration-200 text-left w-full overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlusCircle className="w-5 h-5 text-primary-500 transform group-hover:scale-110 transition-transform" />
                    </div>

                    <div className="w-full mb-3 pb-3 border-b border-neutral-100 group-hover:border-primary-50 transition-colors">
                        <h3 className="font-bold text-neutral-800 line-clamp-1 group-hover:text-primary-700 transition-colors">
                            {product.item_name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-500">
                            <Copy className="w-3 h-3" />
                            <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">{product.item_code}</span>
                        </div>
                    </div>

                    <div className="w-full flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs text-neutral-400 uppercase font-medium tracking-wider">Price</span>
                            <span className="text-lg font-bold text-emerald-600">
                                LKR {product.unit_selling_price.toFixed(2)}
                            </span>
                        </div>
                        <div className="p-1.5 bg-neutral-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                            <Tag className="w-4 h-4 text-neutral-400 group-hover:text-primary-500" />
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default SalesProductGrid;
