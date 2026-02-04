import React, { useState, useEffect } from 'react';
import api from "../../../utils/api/axios";
import { ArrowLeft, Plus, Package, Search, Edit, Trash2, X, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import SupplierCreateFormForAdmin from './products/productCreate/SupplierCreateFormForAdmin';

// Static data for dropdowns
const categories = [
    { value: "Medicine", label: "Medicine" },
    { value: "Device", label: "Device" },
    { value: "General Item", label: "General Item" },
];

const units = [
    { value: "Tablet", label: "Tablet" },
    { value: "Capsule", label: "Capsule" },
    { value: "Sachet", label: "Sachet" },
    { value: "mL (Milliliter)", label: "mL (Milliliter)" },
    { value: "L (Liter)", label: "L (Liter)" },
    { value: "mg (Milligram)", label: "mg (Milligram)" },
    { value: "g (Gram)", label: "g (Gram)" },
    { value: "mcg (Microgram)", label: "mcg (Microgram)" },
    { value: "IU (International Unit)", label: "IU (International Unit)" },
    { value: "Bottle", label: "Bottle" },
    { value: "Tube", label: "Tube" },
    { value: "Pack/Box", label: "Pack/Box" },
    { value: "Unit/Units", label: "Unit/Units" },
    { value: "Vial", label: "Vial" },
    { value: "Ampoule", label: "Ampoule" },
    { value: "Drop(s)", label: "Drop(s)" },
    { value: "Piece", label: "Piece" },
    { value: "Set", label: "Set" },
    { value: "Kit", label: "Kit" },
    { value: "Pair", label: "Pair" },
    { value: "Roll", label: "Roll" },
    { value: "Sheet", label: "Sheet" },
    { value: "Meter", label: "Meter" },
    { value: "cm (Centimeter)", label: "cm (Centimeter)" },
];

const warrantyDurations = [
    { value: "01 Month", label: "01 Month" },
    { value: "03 Months", label: "03 Months" },
    { value: "06 Months", label: "06 Months" },
    { value: "01 Year", label: "01 Year" },
    { value: "02 Years", label: "02 Years" },
    { value: "03 Years", label: "03 Years" },
    { value: "05 Years", label: "05 Years" },
    { value: "Lifetime", label: "Lifetime" },
];

const warrantyTypes = [
    { value: "express_warranty", label: "Express Warranty" },
    { value: "implied_warranty", label: "Implied Warranty" },
    { value: "limited_warranty", label: "Limited Warranty" },
    { value: "full_warranty", label: "Full Warranty" },
    { value: "lifetime_warranty", label: "Lifetime Warranty" },
    { value: "extended_warranty", label: "Extended Warranty" },
    { value: "manufacturers_warranty", label: "Manufacturer's Warranty" },
    { value: "seller_dealer_warranty", label: "Seller or Dealer Warranty" },
];

interface InventoryItem {
    id: number;
    pharmacy_id: number;
    medicine_name: string;
    generic_name: string;
    batch_number: string;
    quantity: number;
    unit: string;
    unit_price: number;
    expiry_date: string;
    supplier: string;
    reorder_level: number;
}

interface Supplier {
    id: number | string;
    supplier_name: string;
    contact_person?: string;
    contact_number?: string;
}

interface PharmacyInventoryManagerProps {
    pharmacyId: number;
    pharmacyName: string;
    onBack: () => void;
}

// Form data interfaces for each step
interface ProductInfoData {
    sku: string;
    item_name: string;
    barcode: string;
    generic_name: string;
    brand_name: string;
    category: string;
    unit: string;
}

interface SupplierData {
    supplier_id: string;
    supplier_name: string;
}

interface WarrantyData {
    warranty_serial: string;
    warranty_duration: string;
    warranty_start_date: string;
    warranty_expiration_date: string;
    warranty_type: string;
}

interface StockData {
    batch_number: string;
    quantity_in_stock: string;
    minimum_stock_level: string;
    reorder_level: string;
    reorder_quantity: string;
    unit_cost: string;
    selling_price: string;
    expiry_date: string;
    date_of_entry: string;
    stock_status: string;
    stock_update_date: string;
    damaged_stock: string;
    stock_location: string;
}

const PharmacyInventoryManager: React.FC<PharmacyInventoryManagerProps> = ({ pharmacyId, pharmacyName, onBack }) => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'low_stock' | 'expiring'>('all');
    const [isAddingSupplier, setIsAddingSupplier] = useState(false);

    // Multi-step form state
    const [currentStep, setCurrentStep] = useState(1);
    const [productInfo, setProductInfo] = useState<ProductInfoData>({
        sku: '',
        item_name: '',
        barcode: '',
        generic_name: '',
        brand_name: '',
        category: '',
        unit: '',
    });
    const [supplierData, setSupplierData] = useState<SupplierData>({
        supplier_id: '',
        supplier_name: '',
    });
    const [warrantyData, setWarrantyData] = useState<WarrantyData>({
        warranty_serial: '',
        warranty_duration: '',
        warranty_start_date: '',
        warranty_expiration_date: '',
        warranty_type: '',
    });
    const [stockData, setStockData] = useState<StockData>({
        batch_number: '',
        quantity_in_stock: '',
        minimum_stock_level: '',
        reorder_level: '10',
        reorder_quantity: '',
        unit_cost: '',
        selling_price: '',
        expiry_date: '',
        date_of_entry: new Date().toISOString().split('T')[0],
        stock_status: 'In Stock',
        stock_update_date: new Date().toISOString().split('T')[0],
        damaged_stock: '',
        stock_location: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchInventory();
        fetchSuppliers();
    }, [pharmacyId, filter]);

    const fetchSuppliers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('api/get-suppliers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Suppliers API response:', response.data);

            if (response.data.status === 200 && response.data.suppliers) {
                // Handle both array and object responses
                const suppliersData = response.data.suppliers;
                const suppliersArray = Array.isArray(suppliersData)
                    ? suppliersData
                    : Object.values(suppliersData);
                setSuppliers(suppliersArray as Supplier[]);
                console.log('Suppliers set:', suppliersArray);
            } else if (response.data?.data) {
                const dataArray = Array.isArray(response.data.data)
                    ? response.data.data
                    : Object.values(response.data.data);
                setSuppliers(dataArray as Supplier[]);
            } else if (Array.isArray(response.data)) {
                setSuppliers(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch suppliers:', err);
        }
    };

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = `http://127.0.0.1:8000/api/v1/pharmacy-inventory?pharmacy_id=${pharmacyId}`;

            if (filter === 'low_stock') {
                url += '&low_stock=true';
            } else if (filter === 'expiring') {
                url += '&expiring=true';
            }

            const response = await api.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setInventory(response.data.data.inventory || []);
            }
        } catch (err: any) {
            console.error('Error fetching inventory:', err);
            setError('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const validateStep = (step: number): boolean => {
        const errors: Record<string, string> = {};

        if (step === 1) {
            if (!productInfo.sku.trim()) errors.sku = 'SKU is required';
            if (!productInfo.item_name.trim()) errors.item_name = 'Item name is required';
            if (!productInfo.category) errors.category = 'Category is required';
            if (!productInfo.unit) errors.unit = 'Unit is required';
        } else if (step === 2) {
            if (!supplierData.supplier_id) errors.supplier_id = 'Please select a supplier';
        } else if (step === 4) {
            if (!stockData.batch_number.trim()) errors.batch_number = 'Batch number is required';
            if (!stockData.quantity_in_stock) errors.quantity_in_stock = 'Quantity is required';
            if (!stockData.unit_cost) errors.unit_cost = 'Unit cost is required';
            if (!stockData.selling_price) errors.selling_price = 'Selling price is required';
            if (!stockData.reorder_level) errors.reorder_level = 'Reorder level is required';
            if (!stockData.expiry_date) errors.expiry_date = 'Expiry date is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Find existing product by name or SKU to get current quantity
    const findExistingProduct = (): InventoryItem | null => {
        if (!productInfo.item_name.trim() && !productInfo.sku.trim()) return null;

        return inventory.find(item => {
            const nameMatch = productInfo.item_name.trim().toLowerCase() === item.medicine_name?.toLowerCase();
            // Note: SKU is not stored in DB currently, but keeping for future compatibility
            return nameMatch;
        }) || null;
    };

    const handleNextStep = () => {
        if (validateStep(currentStep)) {
            const nextStep = Math.min(currentStep + 1, 4);

            // When moving to Step 4, check if product already exists and pre-fill quantity
            if (nextStep === 4) {
                const existingProduct = findExistingProduct();
                if (existingProduct) {
                    setStockData(prev => ({
                        ...prev,
                        quantity_in_stock: existingProduct.quantity?.toString() || '0',
                        // Also pre-fill other fields from existing product if available
                        unit_cost: existingProduct.unit_price ? existingProduct.unit_price.toString() : prev.unit_cost,
                        reorder_level: existingProduct.reorder_level?.toString() || prev.reorder_level,
                    }));
                    setSuccess(`Found existing product "${existingProduct.medicine_name}" with current stock: ${existingProduct.quantity || 0}`);
                    setTimeout(() => setSuccess(null), 5000);
                } else {
                    // Reset quantity if it's a new product
                    setStockData(prev => ({
                        ...prev,
                        quantity_in_stock: '',
                    }));
                }
            }

            setCurrentStep(nextStep);
        }
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const resetForm = () => {
        setCurrentStep(1);
        setProductInfo({
            sku: '',
            item_name: '',
            barcode: '',
            generic_name: '',
            brand_name: '',
            category: '',
            unit: '',
        });
        setSupplierData({
            supplier_id: '',
            supplier_name: '',
        });
        setWarrantyData({
            warranty_serial: '',
            warranty_duration: '',
            warranty_start_date: '',
            warranty_expiration_date: '',
            warranty_type: '',
        });
        setStockData({
            batch_number: '',
            quantity_in_stock: '',
            minimum_stock_level: '',
            reorder_level: '10',
            reorder_quantity: '',
            unit_cost: '',
            selling_price: '',
            expiry_date: '',
            date_of_entry: new Date().toISOString().split('T')[0],
            stock_status: 'In Stock',
            stock_update_date: new Date().toISOString().split('T')[0],
            damaged_stock: '',
            stock_location: '',
        });
        setFormErrors({});
        setSelectedItem(null);
    };

    const handleSubmit = async () => {
        if (!validateStep(4)) return;

        setError(null);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                pharmacy_id: pharmacyId,
                // Product Info
                sku: productInfo.sku,
                medicine_name: productInfo.item_name,
                generic_name: productInfo.generic_name,
                brand_name: productInfo.brand_name,
                barcode: productInfo.barcode,
                category: productInfo.category,
                dosage_form: productInfo.unit,
                // Supplier
                supplier: supplierData.supplier_name,
                supplier_id: supplierData.supplier_id,
                // Warranty (optional)
                warranty_serial: warrantyData.warranty_serial,
                warranty_duration: warrantyData.warranty_duration,
                warranty_start_date: warrantyData.warranty_start_date || null,
                warranty_expiration_date: warrantyData.warranty_expiration_date || null,
                warranty_type: warrantyData.warranty_type,
                // Stock Info
                batch_number: stockData.batch_number,
                quantity: parseInt(stockData.quantity_in_stock) || 0,
                minimum_stock_level: parseInt(stockData.minimum_stock_level) || 0,
                reorder_level: parseInt(stockData.reorder_level) || 10,
                reorder_quantity: parseInt(stockData.reorder_quantity) || 0,
                unit_price: parseFloat(stockData.unit_cost) || 0,
                selling_price: parseFloat(stockData.selling_price) || 0,
                expiry_date: stockData.expiry_date || null,
                date_of_entry: stockData.date_of_entry,
                stock_status: stockData.stock_status,
                stock_update_date: stockData.stock_update_date,
                damaged_stock: stockData.damaged_stock,
                storage_location: stockData.stock_location,
            };

            let response;
            if (showEditModal && selectedItem) {
                response = await api.put(`http://127.0.0.1:8000/api/v1/pharmacy-inventory/${selectedItem.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                response = await api.post('http://127.0.0.1:8000/api/v1/pharmacy-inventory', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (response.data.status === 200 || response.data.success) {
                setSuccess(response.data.message || (showEditModal ? 'Product updated successfully!' : 'Product added successfully!'));
                setTimeout(() => {
                    setSuccess(null);
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                    fetchInventory();
                }, 1500);
            } else {
                setError(response.data.message || 'Failed to save product');
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(', ')
                : err.response?.data?.message || 'Failed to save product';
            setError(errorMsg);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const token = localStorage.getItem('token');
            await api.delete(`http://127.0.0.1:8000/api/v1/pharmacy-inventory/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Product deleted successfully!');
            setTimeout(() => setSuccess(null), 2000);
            fetchInventory();
        } catch (err: any) {
            setError('Failed to delete product');
        }
    };

    const handleEdit = (item: InventoryItem) => {
        setSelectedItem(item);
        setProductInfo({
            sku: '',
            item_name: item.medicine_name,
            barcode: '',
            generic_name: item.generic_name || '',
            brand_name: '',
            category: '',
            unit: item.unit || '',
        });
        setSupplierData({
            supplier_id: '',
            supplier_name: item.supplier || '',
        });
        setStockData({
            batch_number: '',
            quantity_in_stock: item.quantity.toString(),
            minimum_stock_level: '',
            reorder_level: item.reorder_level.toString(),
            reorder_quantity: '',
            unit_cost: item.unit_price.toString(),
            selling_price: item.unit_price.toString(),
            expiry_date: item.expiry_date,
            date_of_entry: new Date().toISOString().split('T')[0],
            stock_status: 'In Stock',
            stock_update_date: new Date().toISOString().split('T')[0],
            damaged_stock: '',
            stock_location: '',
        });
        setCurrentStep(1);
        setShowEditModal(true);
    };

    const filteredInventory = inventory.filter(item =>
        item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const isLowStock = (item: InventoryItem) => item.quantity <= item.reorder_level;
    const isExpiring = (item: InventoryItem) => {
        const expiryDate = new Date(item.expiry_date);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
    };

    const handleSupplierSelect = (supplierId: string) => {
        const selected = suppliers.find(s => s.id === supplierId);
        setSupplierData({
            supplier_id: supplierId,
            supplier_name: selected?.supplier_name || '',
        });
        setFormErrors(prev => ({ ...prev, supplier_id: '' }));
    };

    const goToAddSupplier = () => {
        setIsAddingSupplier(true);
    };

    // Step indicator component
    const StepIndicator = () => (
        <div className="flex items-center justify-center mb-6">
            {[1, 2, 3, 4].map((step) => (
                <React.Fragment key={step}>
                    <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all ${currentStep === step
                                ? 'bg-blue-600 text-white'
                                : currentStep > step
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                            }`}
                    >
                        {currentStep > step ? <Check className="w-5 h-5" /> : step}
                    </div>
                    {step < 4 && (
                        <div className={`w-16 h-1 mx-1 ${currentStep > step ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    // Step 1: Product Information
    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Code / SKU *</label>
                    <input
                        type="text"
                        value={productInfo.sku}
                        onChange={(e) => setProductInfo({ ...productInfo, sku: e.target.value })}
                        placeholder="Enter unique SKU"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.sku ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.sku && <p className="text-red-500 text-sm mt-1">{formErrors.sku}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input
                        type="text"
                        value={productInfo.item_name}
                        onChange={(e) => setProductInfo({ ...productInfo, item_name: e.target.value })}
                        placeholder="Enter product name"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.item_name ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.item_name && <p className="text-red-500 text-sm mt-1">{formErrors.item_name}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Barcode</label>
                    <input
                        type="text"
                        value={productInfo.barcode}
                        onChange={(e) => setProductInfo({ ...productInfo, barcode: e.target.value })}
                        placeholder="Enter item barcode"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                    <input
                        type="text"
                        value={productInfo.generic_name}
                        onChange={(e) => setProductInfo({ ...productInfo, generic_name: e.target.value })}
                        placeholder="Enter generic name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                    <input
                        type="text"
                        value={productInfo.brand_name}
                        onChange={(e) => setProductInfo({ ...productInfo, brand_name: e.target.value })}
                        placeholder="Enter brand name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                        value={productInfo.category}
                        onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${formErrors.category ? 'border-red-500' : 'border-gray-300'}`}
                    >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                    {formErrors.category && <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>}
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Units *</label>
                    <select
                        value={productInfo.unit}
                        onChange={(e) => setProductInfo({ ...productInfo, unit: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${formErrors.unit ? 'border-red-500' : 'border-gray-300'}`}
                    >
                        <option value="">Select Unit</option>
                        {units.map((unit) => (
                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                        ))}
                    </select>
                    {formErrors.unit && <p className="text-red-500 text-sm mt-1">{formErrors.unit}</p>}
                </div>
            </div>
        </div>
    );

    // Step 2: Supplier Selection
    const renderStep2 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Supplier Information</h3>

            {/* Supplier Create Form Popup */}
            {isAddingSupplier && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Add New Supplier</h3>
                            <button
                                type="button"
                                onClick={() => setIsAddingSupplier(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <SupplierCreateFormForAdmin
                                setIsAddingSupplier={setIsAddingSupplier}
                                fetchSuppliers={fetchSuppliers}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Supplier *</label>
                <select
                    value={supplierData.supplier_id}
                    onChange={(e) => handleSupplierSelect(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${formErrors.supplier_id ? 'border-red-500' : 'border-gray-300'}`}
                >
                    <option value="">Select a Supplier</option>
                    {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                            {supplier.supplier_name} {supplier.contact_person ? `(${supplier.contact_person})` : ''}
                        </option>
                    ))}
                </select>
                {formErrors.supplier_id && <p className="text-red-500 text-sm mt-1">{formErrors.supplier_id}</p>}
            </div>

            {supplierData.supplier_id && (
                <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">Selected:</span> {supplierData.supplier_name}
                    </p>
                </div>
            )}

            <div className="border-t pt-4 mt-6">
                <p className="text-sm text-gray-600 mb-3">Can't find the supplier you're looking for?</p>
                <button
                    type="button"
                    onClick={goToAddSupplier}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add New Supplier
                </button>
            </div>
        </div>
    );

    // Step 3: Warranty Information (Optional)
    const renderStep3 = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Warranty Information</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">All fields in this section are optional. Skip if not applicable.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Serial/Code</label>
                    <input
                        type="text"
                        value={warrantyData.warranty_serial}
                        onChange={(e) => setWarrantyData({ ...warrantyData, warranty_serial: e.target.value })}
                        placeholder="Enter warranty serial/code"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Duration</label>
                    <select
                        value={warrantyData.warranty_duration}
                        onChange={(e) => setWarrantyData({ ...warrantyData, warranty_duration: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="">Select warranty duration</option>
                        {warrantyDurations.map((wd) => (
                            <option key={wd.value} value={wd.value}>{wd.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Start Date</label>
                    <input
                        type="date"
                        value={warrantyData.warranty_start_date}
                        onChange={(e) => setWarrantyData({ ...warrantyData, warranty_start_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiration Date</label>
                    <input
                        type="date"
                        value={warrantyData.warranty_expiration_date}
                        onChange={(e) => setWarrantyData({ ...warrantyData, warranty_expiration_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Type</label>
                    <select
                        value={warrantyData.warranty_type}
                        onChange={(e) => setWarrantyData({ ...warrantyData, warranty_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="">Select warranty type</option>
                        {warrantyTypes.map((wt) => (
                            <option key={wt.value} value={wt.value}>{wt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );

    // Step 4: Stock Information
    const renderStep4 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
                    <input
                        type="text"
                        value={stockData.batch_number}
                        onChange={(e) => setStockData({ ...stockData, batch_number: e.target.value })}
                        placeholder="Enter batch number"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.batch_number ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.batch_number && <p className="text-red-500 text-sm mt-1">{formErrors.batch_number}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity in Stock *</label>
                    <input
                        type="number"
                        min="0"
                        value={stockData.quantity_in_stock}
                        onChange={(e) => setStockData({ ...stockData, quantity_in_stock: e.target.value })}
                        placeholder="Enter quantity in stock"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.quantity_in_stock ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.quantity_in_stock && <p className="text-red-500 text-sm mt-1">{formErrors.quantity_in_stock}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
                    <input
                        type="number"
                        min="0"
                        value={stockData.minimum_stock_level}
                        onChange={(e) => setStockData({ ...stockData, minimum_stock_level: e.target.value })}
                        placeholder="Enter minimum stock level"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level *</label>
                    <input
                        type="number"
                        min="0"
                        value={stockData.reorder_level}
                        onChange={(e) => setStockData({ ...stockData, reorder_level: e.target.value })}
                        placeholder="Enter reorder level"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.reorder_level ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.reorder_level && <p className="text-red-500 text-sm mt-1">{formErrors.reorder_level}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
                    <input
                        type="number"
                        min="0"
                        value={stockData.reorder_quantity}
                        onChange={(e) => setStockData({ ...stockData, reorder_quantity: e.target.value })}
                        placeholder="Enter reorder quantity"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (Rs.) *</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={stockData.unit_cost}
                        onChange={(e) => setStockData({ ...stockData, unit_cost: e.target.value })}
                        placeholder="Enter unit cost"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.unit_cost ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.unit_cost && <p className="text-red-500 text-sm mt-1">{formErrors.unit_cost}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (Rs.) *</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={stockData.selling_price}
                        onChange={(e) => setStockData({ ...stockData, selling_price: e.target.value })}
                        placeholder="Enter selling price"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.selling_price ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.selling_price && <p className="text-red-500 text-sm mt-1">{formErrors.selling_price}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                    <input
                        type="date"
                        value={stockData.expiry_date}
                        onChange={(e) => setStockData({ ...stockData, expiry_date: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.expiry_date ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.expiry_date && <p className="text-red-500 text-sm mt-1">{formErrors.expiry_date}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Entry</label>
                    <input
                        type="date"
                        value={stockData.date_of_entry}
                        onChange={(e) => setStockData({ ...stockData, date_of_entry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                    <select
                        value={stockData.stock_status}
                        onChange={(e) => setStockData({ ...stockData, stock_status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                        <option value="Discontinued">Discontinued</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Update Date</label>
                    <input
                        type="date"
                        value={stockData.stock_update_date}
                        onChange={(e) => setStockData({ ...stockData, stock_update_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Location</label>
                    <input
                        type="text"
                        value={stockData.stock_location}
                        onChange={(e) => setStockData({ ...stockData, stock_location: e.target.value })}
                        placeholder="Enter stock location"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Damaged/Defective Stock</label>
                    <textarea
                        rows={2}
                        value={stockData.damaged_stock}
                        onChange={(e) => setStockData({ ...stockData, damaged_stock: e.target.value })}
                        placeholder="Enter details and quantity of damaged items"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            default: return renderStep1();
        }
    };

    return (
        <div className="p-6 mt-16 ml-64 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Pharmacy Inventory</p>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    {pharmacyName}
                                </h1>
                            </div>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowAddModal(true); }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, batch, or supplier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                All Products
                            </button>
                            <button
                                onClick={() => setFilter('low_stock')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'low_stock' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Low Stock
                            </button>
                            <button
                                onClick={() => setFilter('expiring')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'expiring' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Expiring Soon
                            </button>
                        </div>
                    </div>
                </div>

                {/* Inventory Table */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredInventory.length === 0 ? (
                        <div className="p-12 text-center">
                            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                            <p className="text-gray-500">Add products to this pharmacy's inventory.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredInventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{item.medicine_name}</div>
                                            {item.generic_name && (
                                                <div className="text-sm text-gray-500">{item.generic_name}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{item.batch_number}</td>
                                        <td className="px-6 py-4">
                                            <span className={`font-medium ${isLowStock(item) ? 'text-orange-600' : 'text-gray-900'}`}>
                                                {item.quantity}
                                            </span>
                                            <span className="text-sm text-gray-500 ml-1">{item.unit}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">LKR {parseFloat(String(item.unit_price || 0)).toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm ${isExpiring(item) ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                                                {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{item.supplier || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                {isLowStock(item) && (
                                                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">Low Stock</span>
                                                )}
                                                {isExpiring(item) && (
                                                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Expiring</span>
                                                )}
                                                {!isLowStock(item) && !isExpiring(item) && (
                                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">OK</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Multi-Step Add/Edit Modal */}
                {(showAddModal || showEditModal) && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {showEditModal ? 'Edit Product' : 'Add New Product'}
                                    </h2>
                                    <p className="text-sm text-gray-500">Step {currentStep} of 4</p>
                                </div>
                                <button
                                    onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Step Indicator */}
                                <StepIndicator />

                                {/* Success/Error in Modal */}
                                {success && (
                                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
                                        <Check className="w-5 h-5" />
                                        {success}
                                    </div>
                                )}
                                {error && (
                                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                {/* Current Step Content */}
                                {renderCurrentStep()}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-8 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={currentStep === 1 ? () => { setShowAddModal(false); setShowEditModal(false); resetForm(); } : handlePrevStep}
                                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        {currentStep === 1 ? 'Cancel' : 'Back'}
                                    </button>

                                    {currentStep < 4 ? (
                                        <button
                                            type="button"
                                            onClick={handleNextStep}
                                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            <Check className="w-4 h-4" />
                                            {showEditModal ? 'Update Product' : 'Create Product'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PharmacyInventoryManager;
