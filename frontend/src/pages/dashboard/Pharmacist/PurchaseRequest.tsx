import React, { useState, useEffect } from 'react';
import api from "../../../utils/api/axios";
import {
    ShoppingCart, Plus, Trash2, AlertCircle, TrendingUp, 
    Package, Send, Save
} from 'lucide-react';
import alert from '../../../utils/alert';

interface InventoryItem {
    id: string;
    item_name: string;
    current_stock: number;
    reorder_level: number;
    monthly_consumption: number;
    last_purchase_price: number;
    last_supplier: string;
    supplier_id: string;
    unit: string;
    pending_po_qty: number;
}

interface PRItem {
    item_id: string;
    item_name: string;
    current_stock: number;
    requested_quantity: number;
    unit: string;
    estimated_price: number;
    supplier_id: string;
    supplier_name: string;
    remarks: string;
}

interface Supplier {
    id: string;
    supplier_name: string;
    contact_person: string;
    phone: string;
    delivery_lead_time: number;
}

export const PurchaseRequest: React.FC = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [prItems, setPrItems] = useState<PRItem[]>([]);
    const [suggestedItems, setSuggestedItems] = useState<InventoryItem[]>([]);
    const [priority, setPriority] = useState<'Normal' | 'Urgent' | 'Emergency'>('Normal');
    const [generalRemarks, setGeneralRemarks] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);

    useEffect(() => {
        fetchInventoryData();
        fetchSuppliers();
    }, []);

    const fetchInventoryData = async () => {
        try {
            const response = await api.get('/pharmacy/products');
            if (response.data.status === 200 && response.data.products) {
                const mappedItems = response.data.products.map((p: any) => ({
                    id: p.id,
                    item_name: p.item_name,
                    current_stock: p.current_stock || 0,
                    reorder_level: p.reorder_level || 10,
                    monthly_consumption: p.monthly_consumption || 0,
                    last_purchase_price: p.unit_cost || 0,
                    last_supplier: p.supplier_name || '',
                    supplier_id: p.supplier_id || '',
                    unit: p.unit || 'units',
                    pending_po_qty: 0
                }));
                setItems(mappedItems);
                generateSuggestions(mappedItems);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/pharmacy/suppliers');
            const supplierData = Array.isArray(response.data) 
                ? response.data 
                : (response.data.data || response.data.suppliers || []);
            
            const mapped = supplierData.map((s: any) => ({
                id: s.id,
                supplier_name: s.supplier_name || s.name,
                contact_person: s.contact_person || '',
                phone: s.contact_number || s.phone || '',
                delivery_lead_time: s.delivery_lead_time || 7
            }));
            setSuppliers(mapped);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const generateSuggestions = (inventoryItems: InventoryItem[]) => {
        const suggestions = inventoryItems.filter(item => {
            // Low stock: Current Stock <= Reorder Level
            const isLowStock = item.current_stock <= item.reorder_level;
            
            // Zero stock
            const isZeroStock = item.current_stock === 0;
            
            // Fast moving: Monthly consumption > 50 units (configurable)
            const isFastMoving = item.monthly_consumption > 50;
            
            return isLowStock || isZeroStock || isFastMoving;
        });

        // Calculate suggested quantities
        const suggestionsWithQty = suggestions.map(item => {
            const leadTimeMonths = 0.5; // Default 2 weeks
            const safetyStock = Math.ceil(item.reorder_level * 0.2);
            const suggested = Math.ceil(
                (item.monthly_consumption * leadTimeMonths) + 
                safetyStock - 
                item.current_stock - 
                item.pending_po_qty
            );
            
            return {
                ...item,
                suggested_quantity: Math.max(suggested, item.reorder_level)
            };
        });

        setSuggestedItems(suggestionsWithQty as any);
    };

    const addItemToPR = (item: InventoryItem, suggestedQty?: number) => {
        const supplier = suppliers.find(s => s.id === item.supplier_id) || suppliers[0];
        
        const newItem: PRItem = {
            item_id: item.id,
            item_name: item.item_name,
            current_stock: item.current_stock,
            requested_quantity: suggestedQty || item.reorder_level,
            unit: item.unit,
            estimated_price: item.last_purchase_price,
            supplier_id: supplier?.id || '',
            supplier_name: supplier?.supplier_name || '',
            remarks: ''
        };

        setPrItems([...prItems, newItem]);
    };

    const removeItemFromPR = (index: number) => {
        setPrItems(prItems.filter((_, i) => i !== index));
    };

    const updatePRItem = (index: number, field: keyof PRItem, value: any) => {
        const updated = [...prItems];
        updated[index] = { ...updated[index], [field]: value };
        
        // Update supplier name when supplier_id changes
        if (field === 'supplier_id') {
            const supplier = suppliers.find(s => s.id === value);
            if (supplier) {
                updated[index].supplier_name = supplier.supplier_name;
            }
        }
        
        setPrItems(updated);
    };

    const calculateTotal = () => {
        return prItems.reduce((sum, item) => 
            sum + (item.requested_quantity * item.estimated_price), 0
        );
    };

    const saveDraft = async () => {
        if (prItems.length === 0) {
            alert.error('Please add at least one item to the purchase request');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                priority: priority,
                status: 'Draft',
                general_remarks: generalRemarks,
                items: prItems.map(item => ({
                    product_id: item.item_id,
                    supplier_id: item.supplier_id || null,
                    requested_quantity: item.requested_quantity,
                    estimated_unit_price: item.estimated_price,
                    item_remarks: item.remarks || null,
                }))
            };

            const response = await api.post('/purchase-requests', payload);
            
            if (response.data.success) {
                alert.success(`Purchase request ${response.data.data.pr_number} saved as draft`);
                setPrItems([]);
                setGeneralRemarks('');
                setPriority('Normal');
            }
        } catch (error: any) {
            console.error('Failed to save draft:', error);
            alert.error(error.response?.data?.message || 'Failed to save draft');
        } finally {
            setLoading(false);
        }
    };

    const submitForApproval = async () => {
        if (prItems.length === 0) {
            alert.error('Please add at least one item to the purchase request');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                priority: priority,
                status: 'Pending Approval',
                general_remarks: generalRemarks,
                items: prItems.map(item => ({
                    product_id: item.item_id,
                    supplier_id: item.supplier_id || null,
                    requested_quantity: item.requested_quantity,
                    estimated_unit_price: item.estimated_price,
                    item_remarks: item.remarks || null,
                    is_suggested: suggestedItems.some(s => s.id === item.item_id),
                    suggestion_reason: item.current_stock === 0 ? 'Zero Stock' : 
                                       item.current_stock <= items.find(i => i.id === item.item_id)?.reorder_level! ? 'Low Stock' : null
                }))
            };

            const response = await api.post('/purchase-requests', payload);
            
            if (response.data.success) {
                alert.success(`Purchase request ${response.data.data.pr_number} submitted for approval`);
                setPrItems([]);
                setGeneralRemarks('');
                setPriority('Normal');
                fetchInventoryData(); // Refresh inventory
            }
        } catch (error: any) {
            console.error('Failed to submit:', error);
            alert.error(error.response?.data?.message || 'Failed to submit purchase request');
        } finally {
            setLoading(false);
        }
    };

    const getStockStatusColor = (current: number, reorder: number) => {
        if (current === 0) return 'text-red-600 bg-red-50';
        if (current <= reorder) return 'text-orange-600 bg-orange-50';
        return 'text-green-600 bg-green-50';
    };

    const getPriorityColor = (p: string) => {
        if (p === 'Emergency') return 'bg-red-500';
        if (p === 'Urgent') return 'bg-orange-500';
        return 'bg-blue-500';
    };

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Create Purchase Request</h1>
                            <p className="text-sm text-gray-600">Request medicines and supplies for your pharmacy</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Normal">Normal Priority</option>
                                <option value="Urgent">Urgent</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                            <div className={`px-3 py-1 rounded-full text-white text-sm ${getPriorityColor(priority)}`}>
                                {priority}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-blue-700 mb-1">
                                <ShoppingCart className="w-5 h-5" />
                                <span className="text-sm font-medium">Items in PR</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">{prItems.length}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-green-700 mb-1">
                                <Package className="w-5 h-5" />
                                <span className="text-sm font-medium">Est. Total</span>
                            </div>
                            <p className="text-2xl font-bold text-green-900">
                                LKR {calculateTotal().toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-orange-700 mb-1">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Suggested Items</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-900">{suggestedItems.length}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-purple-700 mb-1">
                                <TrendingUp className="w-5 h-5" />
                                <span className="text-sm font-medium">Zero Stock</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-900">
                                {suggestedItems.filter(i => i.current_stock === 0).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Suggested Items */}
                    {showSuggestions && suggestedItems.length > 0 && (
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-gray-900">Reorder Suggestions</h2>
                                    <button
                                        onClick={() => setShowSuggestions(false)}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Hide
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {suggestedItems.map((item: any) => (
                                        <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 text-sm">{item.item_name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStockStatusColor(item.current_stock, item.reorder_level)}`}>
                                                            Stock: {item.current_stock}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            Reorder: {item.reorder_level}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => addItemToPR(item, item.suggested_quantity)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Add to PR"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-600 space-y-1">
                                                <p>Monthly Usage: {item.monthly_consumption} {item.unit}</p>
                                                <p className="font-medium text-green-600">Suggested Qty: {item.suggested_quantity} {item.unit}</p>
                                                {item.last_supplier && (
                                                    <p>Last Supplier: {item.last_supplier}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PR Items List */}
                    <div className={showSuggestions ? 'lg:col-span-2' : 'lg:col-span-3'}>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-gray-900">Purchase Request Items</h2>
                                {!showSuggestions && suggestedItems.length > 0 && (
                                    <button
                                        onClick={() => setShowSuggestions(true)}
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        Show Suggestions ({suggestedItems.length})
                                    </button>
                                )}
                            </div>

                            {prItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-2">No items added yet</p>
                                    <p className="text-sm text-gray-400">Add items from suggestions or create manually</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {prItems.map((item, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="grid grid-cols-12 gap-4">
                                                <div className="col-span-3">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Item</label>
                                                    <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                                                    <p className="text-xs text-gray-500">Current: {item.current_stock} {item.unit}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity*</label>
                                                    <input
                                                        type="number"
                                                        value={item.requested_quantity}
                                                        onChange={(e) => updatePRItem(index, 'requested_quantity', parseInt(e.target.value))}
                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                        min="1"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Est. Price</label>
                                                    <input
                                                        type="number"
                                                        value={item.estimated_price}
                                                        onChange={(e) => updatePRItem(index, 'estimated_price', parseFloat(e.target.value))}
                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Supplier*</label>
                                                    <select
                                                        value={item.supplier_id}
                                                        onChange={(e) => updatePRItem(index, 'supplier_id', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select Supplier</option>
                                                        {suppliers.map(s => (
                                                            <option key={s.id} value={s.id}>{s.supplier_name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-span-1 flex items-end">
                                                    <button
                                                        onClick={() => removeItemFromPR(index)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="col-span-11">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                                                    <input
                                                        type="text"
                                                        value={item.remarks}
                                                        onChange={(e) => updatePRItem(index, 'remarks', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Optional notes for this item..."
                                                    />
                                                </div>
                                                <div className="col-span-1 flex items-center justify-end">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        LKR {(item.requested_quantity * item.estimated_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* General Remarks */}
                                    <div className="border-t pt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">General Remarks / Justification</label>
                                        <textarea
                                            value={generalRemarks}
                                            onChange={(e) => setGeneralRemarks(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Add any additional notes for the purchase request..."
                                        />
                                    </div>

                                    {/* Total */}
                                    <div className="border-t pt-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Estimated Total Amount</p>
                                            <p className="text-xs text-gray-500">{prItems.length} items</p>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            LKR {calculateTotal().toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                        <button
                                            onClick={saveDraft}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save as Draft
                                        </button>
                                        <button
                                            onClick={submitForApproval}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            <Send className="w-4 h-4" />
                                            Submit for Approval
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseRequest;
