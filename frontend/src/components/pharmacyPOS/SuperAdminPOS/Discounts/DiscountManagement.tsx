import axios from 'axios';
import { useState, useEffect } from "react";
import api from "../../../../utils/api/axios";
import {
    Tag, Gift, Percent, DollarSign, Calendar,
    Search, Plus, Edit, Trash2, AlertCircle,
    Check, X, Filter, ArrowUpRight
} from "lucide-react";

interface Discount {
    id: string;
    name: string;
    description?: string;
    scope: "item" | "category" | "bill";
    type: "percentage" | "fixed";
    value: number;
    product_id?: string;
    category?: string;
    branch_id?: string;
    is_global: boolean;
    valid_from?: string;
    valid_until?: string;
    min_purchase_amount?: number;
    min_quantity?: number;
    priority: number;
    requires_approval: boolean;
    cashier_can_apply: boolean;
    is_active: boolean;
    created_at: string;
    product?: {
        id: string;
        item_name: string;
        item_code: string;
    };
}

interface ActiveOffer {
    id: string;
    name: string;
    description?: string;
    scope: string;
    type: string;
    value: number;
    value_display: string;
    product?: string;
    category?: string;
    valid_until?: string;
    min_purchase?: number;
    cashier_can_apply: boolean;
}

const DiscountManagement = () => {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
    const [activeTab, setActiveTab] = useState<"all" | "active">("active");
    const [filterScope, setFilterScope] = useState<string>("");

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        scope: "item" as "item" | "category" | "bill",
        type: "percentage" as "percentage" | "fixed",
        value: 0,
        product_id: "",
        category: "",
        valid_from: "",
        valid_until: "",
        min_purchase_amount: 0,
        min_quantity: 1,
        priority: 10,
        requires_approval: false,
        cashier_can_apply: true,
        is_active: true,
    });

    useEffect(() => {
        fetchDiscounts();
        fetchActiveOffers();
    }, []);

    const fetchDiscounts = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("authToken");
            // This would typically fetch all discounts - for now we use active offers
            const response = await api.get("/super-admin/enhanced-pos/discounts/active-offers", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setActiveOffers(response.data.data);
            }
        } catch (err) {
            console.error("Error fetching discounts:", err);
            setError("Failed to load discounts");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActiveOffers = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await api.get("/super-admin/enhanced-pos/discounts/active-offers", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setActiveOffers(response.data.data);
            }
        } catch (err) {
            console.error("Error fetching active offers:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem("authToken");
            const url = editingDiscount 
                ? `/super-admin/enhanced-pos/discounts/${editingDiscount.id}`
                : "/super-admin/enhanced-pos/discounts";
            
            const method = editingDiscount ? "put" : "post";
            
            await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setShowModal(false);
            setEditingDiscount(null);
            resetForm();
            fetchDiscounts();
            fetchActiveOffers();
        } catch (err) {
            console.error("Error saving discount:", err);
            setError("Failed to save discount");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this discount?")) return;

        try {
            const token = localStorage.getItem("authToken");
            await api.delete(`/super-admin/enhanced-pos/discounts/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            fetchDiscounts();
            fetchActiveOffers();
        } catch (err) {
            console.error("Error deleting discount:", err);
            setError("Failed to delete discount");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            scope: "item",
            type: "percentage",
            value: 0,
            product_id: "",
            category: "",
            valid_from: "",
            valid_until: "",
            min_purchase_amount: 0,
            min_quantity: 1,
            priority: 10,
            requires_approval: false,
            cashier_can_apply: true,
            is_active: true,
        });
    };

    const getScopeColor = (scope: string) => {
        switch (scope) {
            case "item": return "bg-blue-100 text-blue-700";
            case "category": return "bg-purple-100 text-purple-700";
            case "bill": return "bg-green-100 text-green-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getScopeIcon = (scope: string) => {
        switch (scope) {
            case "item": return <Tag className="w-4 h-4" />;
            case "category": return <Gift className="w-4 h-4" />;
            case "bill": return <DollarSign className="w-4 h-4" />;
            default: return <Percent className="w-4 h-4" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Discount Management</h1>
                    <p className="text-gray-600 mt-1">Create and manage discounts for items, categories, and bills</p>
                </div>
                <button
                    onClick={() => {
                        setEditingDiscount(null);
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Discount
                </button>
            </div>

            {/* Tabs and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab("active")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === "active" 
                                ? "bg-blue-600 text-white" 
                                : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        Active Offers ({activeOffers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === "all" 
                                ? "bg-blue-600 text-white" 
                                : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        All Discounts
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={filterScope}
                        onChange={(e) => setFilterScope(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Scopes</option>
                        <option value="item">Item Discounts</option>
                        <option value="category">Category Discounts</option>
                        <option value="bill">Bill Discounts</option>
                    </select>
                </div>
            </div>

            {/* Discount Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeOffers
                    .filter(offer => !filterScope || offer.scope === filterScope)
                    .map((offer) => (
                    <div 
                        key={offer.id} 
                        className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getScopeColor(offer.scope)}`}>
                                    {getScopeIcon(offer.scope)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{offer.name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getScopeColor(offer.scope)}`}>
                                        {offer.scope.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => {
                                        // Edit logic would go here
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(offer.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Value Display */}
                        <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-emerald-600">
                                {offer.value_display}
                            </p>
                        </div>

                        {/* Details */}
                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                            {offer.product && (
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4" />
                                    <span>Product: {offer.product}</span>
                                </div>
                            )}
                            {offer.category && (
                                <div className="flex items-center gap-2">
                                    <Gift className="w-4 h-4" />
                                    <span>Category: {offer.category}</span>
                                </div>
                            )}
                            {offer.valid_until && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Valid until: {new Date(offer.valid_until).toLocaleDateString()}</span>
                                </div>
                            )}
                            {offer.min_purchase && offer.min_purchase > 0 && (
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    <span>Min purchase: Rs. {offer.min_purchase.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Cashier Badge */}
                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                                offer.cashier_can_apply 
                                    ? "bg-green-100 text-green-700" 
                                    : "bg-yellow-100 text-yellow-700"
                            }`}>
                                {offer.cashier_can_apply ? (
                                    <>
                                        <Check className="w-3 h-3" />
                                        Cashier can apply
                                    </>
                                ) : (
                                    <>
                                        <X className="w-3 h-3" />
                                        Admin approval required
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                ))}

                {activeOffers.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl">
                        <Gift className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No Active Discounts</h3>
                        <p className="text-gray-500 mt-1">Create your first discount to get started</p>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Discount
                        </button>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingDiscount ? "Edit Discount" : "Create New Discount"}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            {/* Scope */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount Scope *
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["item", "category", "bill"] as const).map((scope) => (
                                        <button
                                            key={scope}
                                            type="button"
                                            onClick={() => setFormData({...formData, scope})}
                                            className={`px-3 py-2 rounded-lg font-medium capitalize transition-colors ${
                                                formData.scope === scope
                                                    ? getScopeColor(scope) + " ring-2 ring-offset-2 ring-blue-500"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                        >
                                            {scope}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Type and Value */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type *
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value as "percentage" | "fixed"})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (Rs.)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Value *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value)})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Period */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valid From
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.valid_from}
                                        onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valid Until
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.valid_until}
                                        onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.cashier_can_apply}
                                        onChange={(e) => setFormData({...formData, cashier_can_apply: e.target.checked})}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Cashier can apply this discount</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.requires_approval}
                                        onChange={(e) => setFormData({...formData, requires_approval: e.target.checked})}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Requires manager approval</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Active</span>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingDiscount(null);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingDiscount ? "Update" : "Create"} Discount
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscountManagement;
