import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
    X, Plus, Trash2, AlertCircle, TrendingUp, 
    Package, Send, Save, Search, CheckCircle, AlertTriangle, Loader2, Barcode
} from 'lucide-react';
import alert from '../../utils/alert';

interface InventoryItem {
    id: string;
    item_name: string;
    item_code?: string;
    barcode?: string;
    generic_name?: string;
    brand_name?: string;
    current_stock: number;
    reorder_level: number;
    monthly_consumption: number;
    last_purchase_price?: number;
    last_supplier?: string;
    supplier_id: string;
    supplier_name?: string;
    unit: string;
    pending_po_qty?: number;
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
    match_type?: 'barcode' | 'code' | 'name';
}

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
}

interface Supplier {
    id: string;
    supplier_name: string;
    email?: string;
    contact_person: string;
    phone: string;
    delivery_lead_time: number;
}

interface CreatePRModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingPR?: any; // Existing PR data for editing
    isResubmitMode?: boolean; // For clarification response resubmission
}

export const CreatePRModal: React.FC<CreatePRModalProps> = ({ isOpen, onClose, onSuccess, editingPR, isResubmitMode = false }) => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [prItems, setPrItems] = useState<PRItem[]>([]);
    const [suggestedItems, setSuggestedItems] = useState<InventoryItem[]>([]);
    const [priority, setPriority] = useState<'Normal' | 'Urgent' | 'Emergency'>('Normal');
    const [generalRemarks, setGeneralRemarks] = useState('');
    const [clarificationResponse, setClarificationResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [activeTab, setActiveTab] = useState<'suggested' | 'manual'>('suggested');
    const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isEditMode = !!editingPR;

    useEffect(() => {
        if (isOpen) {
            fetchInventoryData();
            fetchSuppliers();
            
            // Pre-fill form if editing
            if (editingPR) {
                loadExistingPRData();
            } else {
                // Reset form for new PR
                resetForm();
            }
        }
    }, [isOpen, editingPR]);

    useEffect(() => {
        if (items.length > 0) {
            generateSuggestions(items);
        }
    }, [items]);

    const fetchInventoryData = async () => {
        setItemsLoading(true);
        try {
            const response = await axios.get('/api/pharmacist-user-get-products');
            console.log('API Response:', response.data);
            if (response.data.status === 200 && response.data.products) {
                const mappedItems = response.data.products
                    .map((p: any) => ({
                        id: p.id,
                        item_name: p.item_name,
                        item_code: p.item_code || '',
                        barcode: p.barcode || '',
                        generic_name: p.generic_name || '',
                        brand_name: p.brand_name || '',
                        current_stock: p.current_stock || 0,
                        reorder_level: p.reorder_level || 10,
                        monthly_consumption: p.monthly_consumption || 0,
                        last_purchase_price: p.unit_cost || 0,
                        last_supplier: p.supplier_name || '',
                        supplier_id: p.supplier_id || '',
                        supplier_name: p.supplier_name || '',
                        unit: p.unit || 'units',
                        pending_po_qty: 0,
                        stock_status: (p.current_stock || 0) === 0 ? 'out_of_stock' : 
                                      (p.current_stock || 0) <= (p.reorder_level || 10) ? 'low_stock' : 'in_stock'
                    }));
                setItems(mappedItems);
                console.log('Loaded inventory items:', mappedItems.length);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
            alert.error('Failed to load inventory data');
        } finally {
            setItemsLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get('/api/get-pharmacist-suppliers');
            const supplierData = Array.isArray(response.data) 
                ? response.data 
                : (response.data.data || response.data.suppliers || []);
            
            const mapped = supplierData.map((s: any) => ({
                id: s.id,
                supplier_name: s.supplier_name || s.name,
                email: s.email || s.supplier_email || '',
                contact_person: s.contact_person || '',
                phone: s.contact_number || s.phone || '',
                delivery_lead_time: s.delivery_lead_time || 7
            }));
            setSuppliers(mapped);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            alert.error('Failed to load suppliers');
        }
    };

    const generateSuggestions = (inventoryItems: InventoryItem[]) => {
        const suggestions = inventoryItems.filter(item => {
            const isZeroStock = item.current_stock === 0;
            const isLowStock = item.current_stock > 0 && item.current_stock <= item.reorder_level;
            const isFastMoving = item.monthly_consumption > 50;
            
            return isZeroStock || isLowStock || isFastMoving;
        });

        const suggestionsWithQty = suggestions.map(item => {
            const leadTimeMonths = 0.5;
            const safetyStock = Math.ceil(item.reorder_level * 0.2);
            const suggested = Math.ceil(
                (item.monthly_consumption * leadTimeMonths) + 
                safetyStock - 
                item.current_stock - 
                item.pending_po_qty
            );
            
            return {
                ...item,
                suggested_quantity: Math.max(suggested, item.reorder_level),
                suggestion_reason: item.current_stock === 0 ? 'Out of Stock' :
                                   item.current_stock <= item.reorder_level ? 'Low Stock' : 'Fast Moving'
            };
        });

        setSuggestedItems(suggestionsWithQty as any);
    };

    const getSuggestionTag = (reason: string) => {
        switch (reason) {
            case 'Out of Stock':
                return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-300">🔴 Out of Stock</span>;
            case 'Low Stock':
                return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-300">⚠️ Low Stock</span>;
            case 'Fast Moving':
                return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300">📈 Fast Moving</span>;
            default:
                return null;
        }
    };

    const addSuggestedItemToPR = async (item: any) => {
        // Check for duplicate
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
            requested_quantity: item.suggested_quantity,
            unit: item.unit,
            estimated_price: item.last_purchase_price,
            remarks: '',
            supplier_id: item.supplier_id || '',
            supplier_name: item.supplier_name || '',
            suggested_quantity: item.suggested_quantity,
            suggestion_reason: item.suggestion_reason
        };

        setPrItems([...prItems, newItem]);
        alert.success(`${item.item_name} added to PR`);
    };

    // Advanced search with debouncing
    const performAdvancedSearch = useCallback(async (query: string) => {
        // If empty query, clear search results (will show all items)
        if (query.length === 0) {
            setSearchResults([]);
            return;
        }

        // For very short queries (1 character), filter locally from items
        if (query.length < 2) {
            const localFiltered = items.filter(item => 
                item.item_name.toLowerCase().includes(query.toLowerCase()) ||
                (item.item_code && item.item_code.toLowerCase().includes(query.toLowerCase()))
            ).map(item => ({
                ...item,
                stock_status: item.current_stock === 0 ? 'out_of_stock' : 
                              item.current_stock <= item.reorder_level ? 'low_stock' : 'in_stock'
            }));
            setSearchResults(localFiltered as any);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await axios.get('/api/purchase-requests/search-items', {
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
    }, [items]);

    // Debounced search handler
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer (300ms debounce)
        debounceTimerRef.current = setTimeout(() => {
            performAdvancedSearch(value);
        }, 300);
    };

    // Barcode scanner handler
    const handleBarcodeInput = (barcode: string) => {
        setBarcodeInput(barcode);
        // Auto-search with barcode
        performAdvancedSearch(barcode);
    };

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const addManualItemToPR = async (item: InventoryItem) => {
        // Check for duplicate
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
            supplier_id: item.supplier_id || '',
            supplier_name: item.supplier_name || ''
        };

        setPrItems([...prItems, newItem]);
        setSearchTerm('');
        setBarcodeInput('');
        setSearchResults([]);
        
        // Auto-select if single barcode match
        if (item.match_type === 'barcode') {
            alert.success(`${item.item_name} added via barcode scan`);
        } else {
            alert.success(`${item.item_name} added to PR`);
        }
    };

    const removeItemFromPR = (index: number) => {
        setPrItems(prItems.filter((_, i) => i !== index));
    };

    const updatePRItem = (index: number, field: keyof PRItem, value: any) => {
        const updated = [...prItems];
        updated[index] = { ...updated[index], [field]: value };
        setPrItems(updated);
    };

    const validateQuantity = (item: PRItem, quantity: number): string | null => {
        if (quantity <= 0) {
            return 'Quantity must be greater than zero';
        }

        // Warn if unusually high (>3x monthly consumption)
        const maxSuggested = items.find(i => i.id === item.item_id)?.monthly_consumption || 0;
        if (maxSuggested > 0 && quantity > maxSuggested * 3) {
            return `⚠️ Unusually high quantity (avg monthly: ${maxSuggested})`;
        }

        return null;
    };

    const resetForm = () => {
        setPrItems([]);
        setGeneralRemarks('');
        setPriority('Normal');
        setSelectedSupplier('');
        setSearchTerm('');
        setActiveTab('suggested');
        setClarificationResponse('');
    };

    const loadExistingPRData = () => {
        if (!editingPR) return;

        setPriority(editingPR.priority);
        setSelectedSupplier(editingPR.supplier_id || '');
        setGeneralRemarks(editingPR.general_remarks || '');
        
        // Map existing items to PRItem format
        const mappedItems = editingPR.items.map((item: any) => ({
            item_id: item.product_id || item.product?.id,
            item_name: item.product?.item_name || item.item_name,
            current_stock: 0, // Will be updated when inventory loads
            reorder_level: 0,
            requested_quantity: item.requested_quantity,
            unit: item.product?.unit || 'units',
            estimated_price: item.estimated_unit_price || 0,
            remarks: item.item_remarks || '',
            suggestion_reason: item.suggestion_reason || undefined
        }));
        
        setPrItems(mappedItems);
    };

    const calculateTotal = () => {
        return prItems.reduce((sum, item) => 
            sum + (item.requested_quantity * item.estimated_price), 0
        );
    };

    const validateForm = (): boolean => {
        if (!selectedSupplier) {
            alert.error('Please select a supplier');
            return false;
        }

        if (prItems.length === 0) {
            alert.error('Please add at least one item to the purchase request');
            return false;
        }

        // Check for zero quantities
        const hasZeroQty = prItems.some(item => item.requested_quantity <= 0);
        if (hasZeroQty) {
            alert.error('All items must have quantity greater than zero');
            return false;
        }

        return true;
    };

    const handleSubmit = async (status: 'Draft' | 'Pending Approval') => {
        if (!validateForm()) return;

        // For resubmit mode, require a clarification response
        if (isResubmitMode && !clarificationResponse.trim()) {
            alert.error('Please provide a response to the clarification request');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                priority: priority,
                status: status,
                supplier_id: selectedSupplier, // Single supplier for entire PR
                general_remarks: generalRemarks,
                items: prItems.map(item => ({
                    product_id: item.item_id,
                    supplier_id: item.supplier_id || selectedSupplier, // Use item's supplier, fallback to PR-level
                    requested_quantity: item.requested_quantity,
                    estimated_unit_price: item.estimated_price,
                    item_remarks: item.remarks || null,
                    is_suggested: !!item.suggestion_reason,
                    suggestion_reason: item.suggestion_reason || null
                }))
            };

            let response;
            if (isResubmitMode && editingPR) {
                // Resubmit after clarification
                response = await axios.post(`/api/purchase-requests/${editingPR.id}/resubmit`, {
                    ...payload,
                    clarification_response: clarificationResponse
                });
            } else if (isEditMode) {
                // Update existing PR
                response = await axios.put(`/api/purchase-requests/${editingPR.id}`, payload);
            } else {
                // Create new PR
                response = await axios.post('/api/purchase-requests', payload);
            }
            
            if (response.data.success) {
                const prNumber = response.data.data.pr_number;
                let message;
                if (isResubmitMode) {
                    message = `Purchase request ${prNumber} resubmitted for approval successfully`;
                } else if (isEditMode) {
                    message = `Purchase request ${prNumber} updated successfully`;
                } else {
                    message = status === 'Draft' 
                        ? `Purchase request ${prNumber} saved as draft`
                        : `Purchase request ${prNumber} submitted for approval. Supplier notification sent.`;
                }
                
                alert.success(message);
                
                // Reset form
                resetForm();
                
                onSuccess(); // Refresh parent list
                onClose(); // Close modal
            }
        } catch (error: any) {
            console.error('Failed to save PR:', error);
            const action = isResubmitMode ? 'resubmit' : (isEditMode ? 'update' : 'create');
            alert.error(error.response?.data?.message || `Failed to ${action} purchase request`);
        } finally {
            setLoading(false);
        }
    };

    const getStockStatusColor = (current: number, reorder: number) => {
        if (current === 0) return 'text-red-600 bg-red-50';
        if (current <= reorder) return 'text-orange-600 bg-orange-50';
        return 'text-green-600 bg-green-50';
    };

    const getStockStatusIcon = (status?: string) => {
        switch (status) {
            case 'out_of_stock':
                return <span className="text-red-600">🔴</span>;
            case 'low_stock':
                return <span className="text-orange-600">🟡</span>;
            case 'in_stock':
            default:
                return <span className="text-green-600">🟢</span>;
        }
    };

    const getPriorityColor = (p: string) => {
        if (p === 'Emergency') return 'bg-red-500';
        if (p === 'Urgent') return 'bg-orange-500';
        return 'bg-blue-500';
    };

    const filteredItems = items.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.item_code && item.item_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isOpen) return null;

    const selectedSupplierObj = suppliers.find(s => s.id === selectedSupplier);

    // Determine modal title
    const getModalTitle = () => {
        if (isResubmitMode) {
            return `Respond to Clarification - ${editingPR?.pr_number}`;
        }
        if (isEditMode) {
            return `Edit Purchase Request ${editingPR?.pr_number}`;
        }
        return 'Create New Purchase Request';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Package className={`w-6 h-6 ${isResubmitMode ? 'text-orange-600' : 'text-blue-600'}`} />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {getModalTitle()}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {isResubmitMode 
                                    ? 'Review the clarification request and update your purchase request'
                                    : 'Request medicines and supplies from supplier'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* Clarification Request Banner (only in resubmit mode) */}
                    {isResubmitMode && editingPR && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-orange-800 mb-2">Clarification Requested by Branch Admin</h3>
                                    <div className="bg-white rounded p-3 border border-orange-200 text-sm text-gray-700 mb-3">
                                        {editingPR.general_remarks?.split('\n').map((line: string, idx: number) => (
                                            <p key={idx} className="mb-1">{line}</p>
                                        )) || 'Please review and update your purchase request.'}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-orange-800 mb-1">
                                            Your Response <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={clarificationResponse}
                                            onChange={(e) => setClarificationResponse(e.target.value)}
                                            placeholder="Explain your changes or respond to the admin's questions..."
                                            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Priority and Supplier Selection */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Supplier Selection - MANDATORY */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Supplier <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedSupplier}
                                    onChange={(e) => setSelectedSupplier(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">-- Select Supplier --</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.supplier_name} 
                                            {supplier.delivery_lead_time && ` (Lead: ${supplier.delivery_lead_time} days)`}
                                        </option>
                                    ))}
                                </select>
                                {selectedSupplierObj && (
                                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                                        <p>📞 {selectedSupplierObj.phone}</p>
                                        {selectedSupplierObj.email && <p>📧 {selectedSupplierObj.email}</p>}
                                        {selectedSupplierObj.contact_person && <p>👤 {selectedSupplierObj.contact_person}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Normal">Normal</option>
                                        <option value="Urgent">Urgent</option>
                                        <option value="Emergency">Emergency</option>
                                    </select>
                                    <div className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${getPriorityColor(priority)}`}>
                                        {priority}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center gap-2 text-blue-700 mb-1">
                                <Package className="w-4 h-4" />
                                <span className="text-xs font-medium">Items</span>
                            </div>
                            <p className="text-xl font-bold text-blue-900">{prItems.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                            <div className="flex items-center gap-2 text-green-700 mb-1">
                                <span className="text-xs font-medium">Est. Total</span>
                            </div>
                            <p className="text-lg font-bold text-green-900">
                                LKR {calculateTotal().toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                            <div className="flex items-center gap-2 text-orange-700 mb-1">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">Suggested</span>
                            </div>
                            <p className="text-xl font-bold text-orange-900">{suggestedItems.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
                            <div className="flex items-center gap-2 text-red-700 mb-1">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-xs font-medium">Zero Stock</span>
                            </div>
                            <p className="text-xl font-bold text-red-900">
                                {suggestedItems.filter(i => i.current_stock === 0).length}
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('suggested')}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeTab === 'suggested'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Suggested Items ({suggestedItems.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeTab === 'manual'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Add Manually
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Suggested Items or Manual Add */}
                        <div className="lg:col-span-1">
                            {activeTab === 'suggested' ? (
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-orange-600" />
                                        Reorder Suggestions
                                    </h3>
                                    {suggestedItems.length === 0 ? (
                                        <div className="text-center py-8">
                                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">All stock levels are healthy!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                            {suggestedItems.map((item: any) => (
                                                <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-400 transition-all hover:shadow-md">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1 pr-2">
                                                            <p className="font-medium text-gray-900 text-sm mb-1">{item.item_name}</p>
                                                            {getSuggestionTag(item.suggestion_reason)}
                                                        </div>
                                                        <button
                                                            onClick={() => addSuggestedItemToPR(item)}
                                                            disabled={prItems.some(pr => pr.item_id === item.id)}
                                                            className={`p-1.5 rounded transition-colors ${
                                                                prItems.some(pr => pr.item_id === item.id)
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                            }`}
                                                            title={prItems.some(pr => pr.item_id === item.id) ? "Already added" : "Add to PR"}
                                                        >
                                                            {prItems.some(pr => pr.item_id === item.id) ? (
                                                                <CheckCircle className="w-5 h-5" />
                                                            ) : (
                                                                <Plus className="w-5 h-5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded">
                                                        <div className="flex justify-between">
                                                            <span>Current Stock:</span>
                                                            <span className={`font-medium ${item.current_stock === 0 ? 'text-red-600' : item.current_stock <= item.reorder_level ? 'text-orange-600' : 'text-green-600'}`}>
                                                                {item.current_stock} {item.unit}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Reorder Level:</span>
                                                            <span className="font-medium">{item.reorder_level} {item.unit}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Monthly Usage:</span>
                                                            <span className="font-medium">{item.monthly_consumption} {item.unit}</span>
                                                        </div>
                                                        <div className="flex justify-between pt-1 border-t border-gray-300">
                                                            <span className="font-semibold text-green-700">Suggested Qty:</span>
                                                            <span className="font-bold text-green-700">{item.suggested_quantity} {item.unit}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Search className="w-5 h-5 text-blue-600" />
                                        Advanced Item Search
                                    </h3>
                                    
                                    {/* Search Input */}
                                    <div className="mb-3 space-y-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                placeholder="Search by name, code, barcode, generic name..."
                                                value={searchTerm}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                autoComplete="off"
                                            />
                                            {searchLoading && (
                                                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                                            )}
                                        </div>
                                        
                                        {/* Barcode Input */}
                                        <div className="relative">
                                            <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Scan or enter barcode..."
                                                value={barcodeInput}
                                                onChange={(e) => handleBarcodeInput(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                                                autoComplete="off"
                                            />
                                        </div>
                                        
                                        <p className="text-xs text-gray-500">
                                            💡 All items shown below. Type to filter by name, code, barcode, generic name, or brand name.
                                        </p>
                                    </div>
                                    
                                    {/* Search Results / All Items */}
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                        {(searchLoading || itemsLoading) ? (
                                            <div className="text-center py-8">
                                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                                                <p className="text-sm text-gray-600">
                                                    {itemsLoading ? 'Loading inventory...' : 'Searching...'}
                                                </p>
                                            </div>
                                        ) : (
                                            (() => {
                                                // Determine which items to display
                                                const displayItems = (searchTerm.length > 0 || barcodeInput.length > 0) 
                                                    ? searchResults 
                                                    : items;
                                                
                                                if (displayItems.length === 0) {
                                                    return (searchTerm.length > 0 || barcodeInput.length > 0) ? (
                                                        <div className="text-center py-8">
                                                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                            <p className="text-sm text-gray-600 font-medium">No items found</p>
                                                            <p className="text-xs text-gray-500 mt-1">Try different search terms or check spelling</p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                            <p className="text-sm text-gray-600 font-medium">No items available</p>
                                                            <p className="text-xs text-gray-500 mt-1">No active products found in inventory</p>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <>
                                                        {/* Items count indicator */}
                                                        <div className="flex items-center justify-between mb-2 px-1">
                                                            <span className="text-xs text-gray-500">
                                                                {(searchTerm.length > 0 || barcodeInput.length > 0) 
                                                                    ? `Found ${displayItems.length} item(s)` 
                                                                    : `Showing all ${displayItems.length} item(s)`}
                                                            </span>
                                                            {!(searchTerm.length > 0 || barcodeInput.length > 0) && (
                                                                <span className="text-xs text-blue-600">Scroll to browse or type to filter</span>
                                                            )}
                                                        </div>
                                                        {displayItems.map((item: any) => {
                                                            const isAdded = prItems.some(pr => pr.item_id === item.id);
                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => addManualItemToPR(item)}
                                                                    disabled={isAdded}
                                                                    className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-all ${
                                                                        isAdded
                                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                                                                            : 'hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 hover:shadow-md'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                {getStockStatusIcon(item.stock_status)}
                                                                                <p className="font-semibold text-gray-900 truncate">{item.item_name}</p>
                                                                            </div>
                                                                            
                                                                            <div className="space-y-1">
                                                                                {item.generic_name && (
                                                                                    <p className="text-xs text-gray-600">
                                                                                        <span className="font-medium">Generic:</span> {item.generic_name}
                                                                                    </p>
                                                                                )}
                                                                                {item.brand_name && (
                                                                                    <p className="text-xs text-gray-600">
                                                                                        <span className="font-medium">Brand:</span> {item.brand_name}
                                                                                    </p>
                                                                                )}
                                                                                <div className="flex items-center gap-3 text-xs">
                                                                                    {item.item_code && (
                                                                                        <span className="text-gray-600">
                                                                                            <span className="font-medium">Code:</span> {item.item_code}
                                                                                        </span>
                                                                                    )}
                                                                                    {item.barcode && (
                                                                                        <span className="text-gray-600">
                                                                                            <span className="font-medium">Barcode:</span> {item.barcode}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-3 mt-2">
                                                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                                                        item.stock_status === 'out_of_stock' ? 'bg-red-100 text-red-700' :
                                                                                        item.stock_status === 'low_stock' ? 'bg-orange-100 text-orange-700' :
                                                                                        'bg-green-100 text-green-700'
                                                                                    }`}>
                                                                                        Stock: {item.current_stock} {item.unit}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-500">
                                                                                        Reorder: {item.reorder_level} {item.unit}
                                                                                    </span>
                                                                                </div>
                                                                                {item.match_type === 'barcode' && (
                                                                                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded mt-1">
                                                                                        ✓ Barcode Match
                                                                                    </span>
                                                                                )}
                                                                                {item.match_type === 'code' && (
                                                                                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded mt-1">
                                                                                        ✓ Code Match
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-shrink-0">
                                                                            {isAdded ? (
                                                                                <CheckCircle className="w-5 h-5 text-gray-400" />
                                                                            ) : (
                                                                                <Plus className="w-5 h-5 text-blue-600" />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </>
                                                );
                                            })()
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: PR Items List */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Purchase Request Items</h3>
                                {prItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-600 font-medium mb-1">No items added yet</p>
                                        <p className="text-sm text-gray-500">Add items from suggestions or search manually</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                        {prItems.map((item, index) => {
                                            const warning = validateQuantity(item, item.requested_quantity);
                                            return (
                                                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">{item.item_name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStockStatusColor(item.current_stock, item.reorder_level)}`}>
                                                                    Stock: {item.current_stock} {item.unit}
                                                                </span>
                                                                {item.suggestion_reason && getSuggestionTag(item.suggestion_reason)}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItemFromPR(index)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                            title="Remove"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="text-xs text-gray-600 block mb-1">Quantity *</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.requested_quantity}
                                                                onChange={(e) => updatePRItem(index, 'requested_quantity', parseInt(e.target.value) || 0)}
                                                                className={`w-full px-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 ${
                                                                    warning && warning.includes('⚠️') ? 'border-orange-400' : 'border-gray-300'
                                                                }`}
                                                            />
                                                            {warning && (
                                                                <p className="text-xs text-orange-600 mt-1">{warning}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-600 block mb-1">Est. Price (LKR)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={item.estimated_price}
                                                                onChange={(e) => updatePRItem(index, 'estimated_price', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-600 block mb-1">Line Total</label>
                                                            <p className="text-sm font-bold text-green-700 pt-1.5">
                                                                LKR {(item.requested_quantity * item.estimated_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <label className="text-xs text-gray-600 block mb-1">Remarks</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Optional item-specific notes..."
                                                            value={item.remarks}
                                                            onChange={(e) => updatePRItem(index, 'remarks', e.target.value)}
                                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* General Remarks */}
                            {prItems.length > 0 && (
                                <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">General Remarks</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Optional general notes for this purchase request..."
                                        value={generalRemarks}
                                        onChange={(e) => setGeneralRemarks(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {prItems.length > 0 && (
                                <p className="font-medium">
                                    Total Estimated Cost: <span className="text-green-700 text-lg font-bold">
                                        LKR {calculateTotal().toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                    </span>
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            {!isResubmitMode && (
                                <button
                                    onClick={() => handleSubmit('Draft')}
                                    disabled={loading || prItems.length === 0}
                                    className="px-5 py-2.5 text-gray-700 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Draft
                                </button>
                            )}
                            <button
                                onClick={() => handleSubmit('Pending Approval')}
                                disabled={loading || prItems.length === 0 || (isResubmitMode && !clarificationResponse.trim())}
                                className={`px-5 py-2.5 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
                                    isResubmitMode 
                                        ? 'bg-orange-600 hover:bg-orange-700' 
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                <Send className="w-4 h-4" />
                                {loading 
                                    ? 'Submitting...' 
                                    : isResubmitMode 
                                        ? 'Resubmit for Approval' 
                                        : 'Submit for Approval'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
