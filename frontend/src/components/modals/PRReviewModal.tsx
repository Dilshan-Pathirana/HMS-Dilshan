import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from "../../utils/api/axios";
import {
    X, Plus, Trash2, CheckCircle, XCircle,
    MessageSquare, Edit, Save, Search, Loader2
} from 'lucide-react';
import alert from '../../utils/alert';

interface PRItem {
    item_id: string;
    item_name: string;
    current_stock: number;
    reorder_level: number;
    requested_quantity: number;
    unit: string;
    estimated_price: number;
    remarks: string;
    supplier_id?: string;
    supplier_name?: string;
    suggested_quantity?: number;
    suggestion_reason?: string;
    is_suggested?: boolean;
}

interface InventoryItem {
    id: string;
    item_name: string;
    item_code?: string;
    barcode?: string;
    current_stock: number;
    reorder_level: number;
    last_purchase_price?: number;
    supplier_id: string;
    supplier_name?: string;
    unit: string;
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
    match_type?: 'barcode' | 'code' | 'name';
}

interface Supplier {
    id: string;
    supplier_name: string;
    email?: string;
    contact_person: string;
    phone: string;
}

interface PRReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchaseRequest: any;
}

export const PRReviewModal: React.FC<PRReviewModalProps> = ({ isOpen, onClose, purchaseRequest }) => {
    const [prItems, setPrItems] = useState<PRItem[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [priority, setPriority] = useState<'Normal' | 'Urgent' | 'Emergency'>('Normal');
    const [adminRemarks, setAdminRemarks] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Search for adding items
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Action dialogs
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showClarifyDialog, setShowClarifyDialog] = useState(false);
    const [actionRemarks, setActionRemarks] = useState('');

    useEffect(() => {
        if (isOpen && purchaseRequest) {
            loadPRData();
            fetchSuppliers();
        }
    }, [isOpen, purchaseRequest]);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const loadPRData = () => {
        setSelectedSupplier(purchaseRequest.supplier_id || '');
        setPriority(purchaseRequest.priority);
        
        const items = purchaseRequest.items.map((item: any) => ({
            item_id: item.product_id,
            item_name: item.product?.item_name || 'Unknown Item',
            current_stock: item.product?.stock?.current_stock || 0,
            reorder_level: item.product?.stock?.reorder_level || 0,
            requested_quantity: item.requested_quantity,
            unit: item.product?.stock?.unit || 'units',
            estimated_price: item.estimated_unit_price,
            remarks: item.item_remarks || '',
            supplier_id: item.supplier_id || item.supplier?.id || null,
            supplier_name: item.supplier?.supplier_name || null,
            suggested_quantity: item.suggested_quantity,
            suggestion_reason: item.suggestion_reason,
            is_suggested: item.is_suggested
        }));
        
        setPrItems(items);
        
        // If no PR-level supplier but items have suppliers, use the first item's supplier
        if (!purchaseRequest.supplier_id && items.length > 0 && items[0].supplier_id) {
            setSelectedSupplier(items[0].supplier_id);
        }
    };

    const fetchSuppliers = async () => {
        try {
            // Try branch admin endpoint first, fall back to super admin endpoint
            let response;
            try {
                response = await api.get('/branch-admin/suppliers');
            } catch {
                // Fallback to super admin endpoint if branch admin endpoint fails
                response = await api.get('/pharmacy/suppliers');
            }
            
            if (response.data.status === 200) {
                // API may return data in 'data' or 'suppliers' field
                const supplierData = response.data.data || response.data.suppliers || [];
                setSuppliers(supplierData);
            }
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
        }
    };

    const performAdvancedSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await api.get('/branch-admin/purchase-requests/search-items', {
                params: { search: query }
            });

            if (response.data.success) {
                setSearchResults(response.data.data);
            }
        } catch (error) {
            console.error('Error searching items:', error);
            alert.error('Failed to search items');
        } finally {
            setSearchLoading(false);
        }
    }, []);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            performAdvancedSearch(value);
        }, 300);
    };

    const addItemToPR = async (item: InventoryItem) => {
        if (prItems.some(pr => pr.item_id === item.id)) {
            alert.warning('Item already added to purchase request');
            return;
        }

        // Check supplier mismatch
        if (selectedSupplier && item.supplier_id && item.supplier_id !== selectedSupplier) {
            const supplierName = suppliers.find(s => s.id === selectedSupplier)?.supplier_name || 'selected supplier';
            const itemSupplierName = item.supplier_name || 'another supplier';
            
            const confirmed = await alert.confirm(
                `Supplier Mismatch Warning`,
                `This item (${item.item_name}) belongs to "${itemSupplierName}" but your PR is for "${supplierName}". Do you want to add it anyway?`,
                'warning'
            );
            
            if (!confirmed) {
                return;
            }
        }

        const newItem: PRItem = {
            item_id: item.id,
            item_name: item.item_name,
            current_stock: item.current_stock,
            reorder_level: item.reorder_level,
            requested_quantity: item.reorder_level || 1,
            unit: item.unit,
            estimated_price: item.last_purchase_price || 0,
            remarks: '',
            supplier_id: item.supplier_id || selectedSupplier,
            supplier_name: item.supplier_name
        };

        setPrItems([...prItems, newItem]);
        setSearchTerm('');
        setSearchResults([]);
        alert.success(`${item.item_name} added to PR`);
    };

    const removeItemFromPR = (index: number) => {
        setPrItems(prItems.filter((_, i) => i !== index));
    };

    const updatePRItem = (index: number, field: keyof PRItem, value: any) => {
        const updated = [...prItems];
        updated[index] = { ...updated[index], [field]: value };
        setPrItems(updated);
    };

    const handleSaveChanges = async () => {
        if (prItems.length === 0) {
            alert.error('At least one item is required');
            return;
        }

        if (!selectedSupplier) {
            alert.error('Please select a supplier');
            return;
        }

        setLoading(true);
        try {
            const response = await api.put(`/branch-admin/purchase-requests/${purchaseRequest.id}/update`, {
                supplier_id: selectedSupplier,
                priority: priority,
                admin_remarks: adminRemarks,
                items: prItems.map(item => ({
                    item_id: item.item_id,
                    requested_quantity: item.requested_quantity,
                    estimated_price: item.estimated_price,
                    remarks: item.remarks,
                    supplier_id: item.supplier_id || selectedSupplier,
                    suggested_quantity: item.suggested_quantity,
                    suggestion_reason: item.suggestion_reason,
                    is_suggested: item.is_suggested
                }))
            });

            if (response.data.success) {
                alert.success('Purchase request updated successfully');
                setIsEditing(false);
                // Reload PR data
                const updatedPR = response.data.data;
                purchaseRequest.items = updatedPR.items;
                purchaseRequest.supplier_id = updatedPR.supplier_id;
                purchaseRequest.priority = updatedPR.priority;
                purchaseRequest.total_items = updatedPR.total_items;
                purchaseRequest.total_estimated_cost = updatedPR.total_estimated_cost;
                loadPRData();
            }
        } catch (error: any) {
            console.error('Failed to update PR:', error);
            alert.error(error.response?.data?.message || 'Failed to update purchase request');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setLoading(true);
        try {
            const response = await api.post(`/branch-admin/purchase-requests/${purchaseRequest.id}/approve`, {
                approval_remarks: actionRemarks
            });

            if (response.data.success) {
                alert.success('Purchase request approved successfully');
                onClose();
            }
        } catch (error: any) {
            console.error('Failed to approve PR:', error);
            alert.error(error.response?.data?.message || 'Failed to approve purchase request');
        } finally {
            setLoading(false);
            setShowApproveDialog(false);
            setActionRemarks('');
        }
    };

    const handleReject = async () => {
        if (!actionRemarks || actionRemarks.length < 10) {
            alert.error('Rejection reason must be at least 10 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post(`/branch-admin/purchase-requests/${purchaseRequest.id}/reject`, {
                rejection_reason: actionRemarks
            });

            if (response.data.success) {
                alert.success('Purchase request rejected');
                onClose();
            }
        } catch (error: any) {
            console.error('Failed to reject PR:', error);
            alert.error(error.response?.data?.message || 'Failed to reject purchase request');
        } finally {
            setLoading(false);
            setShowRejectDialog(false);
            setActionRemarks('');
        }
    };

    const handleRequestClarification = async () => {
        if (!actionRemarks || actionRemarks.length < 10) {
            alert.error('Clarification request must be at least 10 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post(`/branch-admin/purchase-requests/${purchaseRequest.id}/clarify`, {
                clarification_request: actionRemarks
            });

            if (response.data.success) {
                alert.success('Clarification requested successfully');
                onClose();
            }
        } catch (error: any) {
            console.error('Failed to request clarification:', error);
            alert.error(error.response?.data?.message || 'Failed to request clarification');
        } finally {
            setLoading(false);
            setShowClarifyDialog(false);
            setActionRemarks('');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const getTotalCost = () => {
        return prItems.reduce((sum, item) => sum + (item.requested_quantity * item.estimated_price), 0);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Review Purchase Request</h2>
                        <p className="text-blue-100 text-sm mt-1">
                            {purchaseRequest.pr_number} • Created by {purchaseRequest.creator.first_name} {purchaseRequest.creator.last_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-primary-600 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* PR Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Supplier *</label>
                            <select
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.target.value)}
                                disabled={!isEditing}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-100"
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>{supplier.supplier_name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Priority *</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                disabled={!isEditing}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-100"
                            >
                                <option value="Normal">Normal</option>
                                <option value="Urgent">Urgent</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Total Items</label>
                            <div className="px-4 py-2 bg-neutral-100 border border-neutral-300 rounded-lg font-semibold">
                                {prItems.length} items
                            </div>
                        </div>
                    </div>

                    {/* Admin Remarks */}
                    {isEditing && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Admin Remarks (Optional)</label>
                            <textarea
                                value={adminRemarks}
                                onChange={(e) => setAdminRemarks(e.target.value)}
                                placeholder="Add any remarks or notes about your changes..."
                                rows={2}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    )}

                    {/* Original Remarks */}
                    {purchaseRequest.general_remarks && (
                        <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                            <h3 className="font-semibold text-neutral-800 mb-2">Request Remarks</h3>
                            <p className="text-neutral-700 text-sm whitespace-pre-wrap">{purchaseRequest.general_remarks}</p>
                        </div>
                    )}

                    {/* Add Item Search (Only in Edit Mode) */}
                    {isEditing && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Add Item</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search by name, code, or barcode..."
                                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                {searchLoading && (
                                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-500 animate-spin" />
                                )}
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mt-2 border border-neutral-300 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg">
                                    {searchResults.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => addItemToPR(item)}
                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-neutral-800">{item.item_name}</p>
                                                    <p className="text-sm text-neutral-600">
                                                        Code: {item.item_code || 'N/A'} | Stock: {item.current_stock} {item.unit}
                                                    </p>
                                                </div>
                                                <Plus className="w-5 h-5 text-primary-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-neutral-800 mb-3">Items ({prItems.length})</h3>
                        <div className="border border-neutral-300 rounded-lg overflow-hidden overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Item</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Supplier</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Stock</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Unit Price</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Total</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Remarks</th>
                                        {isEditing && <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {prItems.map((item, index) => (
                                        <tr key={index} className={item.is_suggested ? 'bg-blue-50' : ''}>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-neutral-800">{item.item_name}</p>
                                                    {item.suggestion_reason && (
                                                        <p className="text-xs text-primary-500">💡 {item.suggestion_reason}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {isEditing ? (
                                                    <select
                                                        value={item.supplier_id || ''}
                                                        onChange={(e) => updatePRItem(index, 'supplier_id', e.target.value)}
                                                        className="w-full px-2 py-1 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
                                                    >
                                                        <option value="">Select Supplier</option>
                                                        {suppliers.map(s => (
                                                            <option key={s.id} value={s.id}>{s.supplier_name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={item.supplier_name ? 'text-neutral-700' : 'text-neutral-400 italic'}>
                                                        {item.supplier_name || suppliers.find(s => s.id === item.supplier_id)?.supplier_name || 'Not specified'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-neutral-600">
                                                {item.current_stock} / {item.reorder_level}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.requested_quantity}
                                                    onChange={(e) => updatePRItem(index, 'requested_quantity', parseInt(e.target.value) || 0)}
                                                    disabled={!isEditing}
                                                    className="w-20 px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
                                                    min="1"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.estimated_price}
                                                    onChange={(e) => updatePRItem(index, 'estimated_price', parseFloat(e.target.value) || 0)}
                                                    disabled={!isEditing}
                                                    className="w-24 px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-neutral-800">
                                                {formatCurrency(item.requested_quantity * item.estimated_price)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.remarks}
                                                    onChange={(e) => updatePRItem(index, 'remarks', e.target.value)}
                                                    disabled={!isEditing}
                                                    placeholder="Optional"
                                                    className="w-full px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100 text-sm"
                                                />
                                            </td>
                                            {isEditing && (
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => removeItemFromPR(index)}
                                                        className="p-1 text-error-600 hover:bg-error-50 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Total */}
                        <div className="mt-4 flex justify-end">
                            <div className="bg-neutral-50 px-6 py-3 rounded-lg border border-neutral-300">
                                <p className="text-sm text-neutral-600">Total Estimated Cost</p>
                                <p className="text-2xl font-bold text-neutral-800">{formatCurrency(getTotalCost())}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-neutral-200 px-6 py-4 bg-neutral-50 flex items-center justify-between">
                    <div>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit PR
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={loading}
                                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        loadPRData();
                                        setAdminRemarks('');
                                    }}
                                    disabled={loading}
                                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-neutral-500 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowClarifyDialog(true)}
                                disabled={loading}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Request Clarification
                            </button>
                            <button
                                onClick={() => setShowRejectDialog(true)}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                Reject
                            </button>
                            <button
                                onClick={() => setShowApproveDialog(true)}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Approve Dialog */}
            {showApproveDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-neutral-800 mb-4">Approve Purchase Request</h3>
                        <p className="text-neutral-600 mb-4">
                            Are you sure you want to approve this purchase request ({purchaseRequest.pr_number})?
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Approval Remarks (Optional)</label>
                            <textarea
                                value={actionRemarks}
                                onChange={(e) => setActionRemarks(e.target.value)}
                                placeholder="Add any approval notes..."
                                rows={3}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowApproveDialog(false);
                                    setActionRemarks('');
                                }}
                                disabled={loading}
                                className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded-lg hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                {loading ? 'Approving...' : 'Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Dialog */}
            {showRejectDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-neutral-800 mb-4">Reject Purchase Request</h3>
                        <p className="text-neutral-600 mb-4">
                            Please provide a reason for rejecting this purchase request ({purchaseRequest.pr_number}).
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Rejection Reason *</label>
                            <textarea
                                value={actionRemarks}
                                onChange={(e) => setActionRemarks(e.target.value)}
                                placeholder="Minimum 10 characters..."
                                rows={4}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                required
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowRejectDialog(false);
                                    setActionRemarks('');
                                }}
                                disabled={loading}
                                className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded-lg hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                {loading ? 'Rejecting...' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clarification Dialog */}
            {showClarifyDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-neutral-800 mb-4">Request Clarification</h3>
                        <p className="text-neutral-600 mb-4">
                            Send this purchase request back for clarification ({purchaseRequest.pr_number}).
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Clarification Request *</label>
                            <textarea
                                value={actionRemarks}
                                onChange={(e) => setActionRemarks(e.target.value)}
                                placeholder="What needs to be clarified? (Minimum 10 characters)..."
                                rows={4}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                                required
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowClarifyDialog(false);
                                    setActionRemarks('');
                                }}
                                disabled={loading}
                                className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded-lg hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestClarification}
                                disabled={loading}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                {loading ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
