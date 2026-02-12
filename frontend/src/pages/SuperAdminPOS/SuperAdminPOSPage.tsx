import { useState, useEffect } from "react";
import api from "../../utils/api/axios";
import alert from "../../utils/alert";
import {
    ShoppingCart, Search, Plus, Minus, Trash2,
    User, DollarSign, CreditCard, Smartphone,
    QrCode, AlertCircle, Building2, Receipt,
    Package, RefreshCw, Tag, Gift, Percent,
    CheckCircle, X
} from "lucide-react";
import { useBranchContext } from "../../context/POS/BranchContext";
import BranchSelector from "../../components/pharmacyPOS/Common/BranchSelector";

interface ServiceItem {
    id: string;
    service: string;
    amount: number;
    product_id?: string;
    quantity?: number;
    stock?: number;
    unitPrice?: number;
    originalPrice?: number;
    batchId?: string;
    batchNumber?: string;
    discount?: {
        type: 'percentage' | 'fixed';
        value: number;
        amount: number;
    };
}

interface PatientInfo {
    id?: string;
    name: string;
    phone: string;
}

interface Patient {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
}

interface Product {
    id: string;
    item_name: string;
    item_code: string;
    selling_price: number;
    stock: number;
    category?: string;
    batch_price?: number;
    batch_id?: string;
    batch_number?: string;
    expiry_date?: string;
}

interface Cashier {
    id: string;
    name: string;
    email: string;
    branch_name: string;
}

interface ActiveOffer {
    id: string;
    name: string;
    description?: string;
    scope: 'item' | 'category' | 'bill';
    type: 'percentage' | 'fixed';
    value: number;
    value_display: string;
    product?: string;
    product_id?: string;
    category?: string;
    valid_until?: string;
    min_purchase?: number;
    cashier_can_apply: boolean;
}

interface BillDiscount {
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
}

/**
 * Super Admin POS Page
 *
 * Allows Super Admin to create transactions on behalf of any branch.
 * - Select a branch from dropdown (uses BranchContext)
 * - Select a cashier from the branch (optional - defaults to admin)
 * - Create sales transactions for the selected branch
 */
const SuperAdminPOSPage = () => {
    // Use shared branch context
    const { selectedBranch, getActiveBranchId } = useBranchContext();

    // Cashier selection (specific to this page)
    const [cashiers, setCashiers] = useState<Cashier[]>([]);
    const [selectedCashier, setSelectedCashier] = useState<string>("");
    const [isLoadingCashiers, setIsLoadingCashiers] = useState(false);

    // Transaction details
    const [transactionType, setTransactionType] = useState("OPD");
    const [patientInfo, setPatientInfo] = useState<PatientInfo>({ name: "Walk-in Customer", phone: "" });
    const [isWalkIn, setIsWalkIn] = useState(true);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [patientSearch, setPatientSearch] = useState("Walk-in Customer");
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
    const [currentService, setCurrentService] = useState({ service: "", amount: "", quantity: "1" });
    const [products, setProducts] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [isProductFromDB, setIsProductFromDB] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [paidAmount, setPaidAmount] = useState("");
    const [remarks, setRemarks] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [inventoryItems, setInventoryItems] = useState<Product[]>([]);
    const [isLoadingInventory, setIsLoadingInventory] = useState(false);
    const [lowStockWarning, setLowStockWarning] = useState<Array<{name: string; code: string; current_stock: number; reorder_level: number}> | null>(null);

    // Enhanced POS features
    const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([]);
    const [showOffersPanel, setShowOffersPanel] = useState(false);
    const [billDiscount, setBillDiscount] = useState<BillDiscount | null>(null);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [manualDiscountType, setManualDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [manualDiscountValue, setManualDiscountValue] = useState('');
    const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<string | null>(null);
    // Pricing strategy (FIFO is default - for future use when manually selecting batches)
    const [_pricingStrategy, _setPricingStrategy] = useState<'fifo' | 'fefo' | 'manual'>('fifo');

    // Load inventory on mount with current branch (if any)
    useEffect(() => {
        const branchId = getActiveBranchId();
        if (branchId) {
            loadInventoryItems(branchId);
        }
    }, []);

    // Load cashiers, inventory and offers when branch changes
    useEffect(() => {
        const branchId = getActiveBranchId();
        if (branchId) {
            loadCashiers(branchId);
            loadInventoryItems(branchId);
            loadActiveOffers(branchId);
            // Clear cart when branch changes to avoid stock mismatches
            setServiceItems([]);
        }
    }, [selectedBranch]);

    // Product search - same as cashier module
    useEffect(() => {
        if (productSearch.length >= 2) {
            searchProducts();
        } else {
            setShowProductDropdown(false);
        }
    }, [productSearch]);

    const loadCashiers = async (branchId: string) => {
        setIsLoadingCashiers(true);
        try {
            const response = await api.get(`/super-admin/pos/cashiers?branch_id=${branchId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setCashiers(response.data.cashiers || []);
        } catch (err) {
            console.error("Error loading cashiers:", err);
        } finally {
            setIsLoadingCashiers(false);
        }
    };

    const loadInventoryItems = async (branchId?: string) => {
        setIsLoadingInventory(true);
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            // Use super admin endpoint with branch filter
            const url = branchId
                ? `/super-admin/pos/inventory-list?branch_id=${branchId}`
                : `/super-admin/pos/inventory-list`;
            const response = await api.get(
                url,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response?.data) {
                setInventoryItems(response.data);
                if (Array.isArray(response.data) && response.data.length === 0) {
                    alert.warn("No inventory items available/found");
                }
            }
        } catch (err) {
            console.error("Error loading inventory:", err);
            setInventoryItems([]);
        } finally {
            setIsLoadingInventory(false);
        }
    };

    const quickAddProduct = (product: Product) => {
        // Check if product already in cart
        const existingItem = serviceItems.find(item => item.product_id === product.id);
        if (existingItem) {
            // Increase quantity
            const newQty = (existingItem.quantity || 1) + 1;
            if (newQty > product.stock) {
                setError(`Only ${product.stock} units available in stock`);
                return;
            }
            const unitPrice = existingItem.amount / (existingItem.quantity || 1);
            setServiceItems(serviceItems.map(item =>
                item.product_id === product.id
                    ? { ...item, quantity: newQty, amount: unitPrice * newQty }
                    : item
            ));
        } else {
            // Add new item
            const newItem: ServiceItem = {
                id: Date.now().toString(),
                service: product.item_name,
                amount: product.selling_price,
                product_id: product.id,
                quantity: 1,
                stock: product.stock,
                unitPrice: product.selling_price,
                originalPrice: product.selling_price
            };
            setServiceItems([...serviceItems, newItem]);
        }
        setError("");
    };

    // Search products - use inventory list with filter
    const searchProducts = async () => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            // Filter from inventory items
            const filtered = inventoryItems.filter(p =>
                p.item_name.toLowerCase().includes(productSearch.toLowerCase()) ||
                p.item_code.toLowerCase().includes(productSearch.toLowerCase())
            );
            setProducts(filtered);
            setShowProductDropdown(filtered.length > 0);
        } catch (err) {
            console.error("Error searching products:", err);
        }
    };

    // Select product from search dropdown - same as cashier module
    const selectProduct = (product: Product) => {
        setCurrentService({
            service: product.item_name,
            amount: product.selling_price.toString(),
            quantity: "1"
        });
        setProductSearch(product.item_name);
        setShowProductDropdown(false);
        setIsProductFromDB(true);
        // Store product details for later use
        (window as any).selectedProduct = product;
    };

    // Add service item - same as cashier module
    const addServiceItem = () => {
        const selectedProduct = (window as any).selectedProduct;

        // Must select products from database
        if (!selectedProduct) {
            setError("Please select a product from the list.");
            return;
        }

        if (!currentService.service || !currentService.amount) {
            setError("Please select a product from the list");
            return;
        }

        const quantity = parseInt(currentService.quantity) || 1;
        const unitPrice = parseFloat(currentService.amount);

        // Check if product already exists in cart
        if (selectedProduct) {
            const existingItem = serviceItems.find(item => item.product_id === selectedProduct.id);
            if (existingItem) {
                const newQty = (existingItem.quantity || 1) + quantity;
                // Check stock
                if (newQty > selectedProduct.stock) {
                    setError(`Only ${selectedProduct.stock} units available in stock. Already ${existingItem.quantity} in cart.`);
                    return;
                }
                // Update existing item
                setServiceItems(serviceItems.map(item =>
                    item.product_id === selectedProduct.id
                        ? { ...item, quantity: newQty, amount: unitPrice * newQty }
                        : item
                ));
                setCurrentService({ service: "", amount: "", quantity: "1" });
                setProductSearch("");
                setIsProductFromDB(false);
                delete (window as any).selectedProduct;
                setError("");
                return;
            }
        }

        // Check stock if product selected (new item)
        if (selectedProduct && quantity > selectedProduct.stock) {
            setError(`Only ${selectedProduct.stock} units available in stock`);
            return;
        }

        const newItem: ServiceItem = {
            id: Date.now().toString(),
            service: currentService.service,
            amount: unitPrice * quantity,
            product_id: selectedProduct?.id,
            quantity: quantity,
            stock: selectedProduct?.stock,
            unitPrice: unitPrice,
            originalPrice: unitPrice
        };

        setServiceItems([...serviceItems, newItem]);
        setCurrentService({ service: "", amount: "", quantity: "1" });
        setProductSearch("");
        setIsProductFromDB(false);
        delete (window as any).selectedProduct;
        setError("");
    };

    const loadActiveOffers = async (branchId: string) => {
        try {
            const response = await api.get(`/super-admin/enhanced-pos/discounts/active-offers?branch_id=${branchId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (response.data.success) {
                setActiveOffers(response.data.data || []);
                if (Array.isArray(response.data.data) && response.data.data.length === 0) {
                    alert.warn("No active offers available/found");
                }
            }
        } catch (err) {
            console.error("Error loading active offers:", err);
            setActiveOffers([]);
        }
    };

    // Apply discount to an item
    const applyItemDiscount = (itemId: string, discountType: 'percentage' | 'fixed', discountValue: number) => {
        setServiceItems(prevItems => prevItems.map(item => {
            if (item.id === itemId) {
                const originalPrice = item.originalPrice || item.unitPrice || 0;
                const quantity = item.quantity || 1;
                let discountAmount = 0;

                if (discountType === 'percentage') {
                    discountAmount = (originalPrice * quantity * discountValue) / 100;
                } else {
                    discountAmount = discountValue * quantity;
                }

                const newAmount = Math.max(0, (originalPrice * quantity) - discountAmount);

                return {
                    ...item,
                    originalPrice: originalPrice,
                    amount: newAmount,
                    discount: {
                        type: discountType,
                        value: discountValue,
                        amount: discountAmount
                    }
                };
            }
            return item;
        }));
        setShowDiscountModal(false);
        setSelectedItemForDiscount(null);
        setManualDiscountValue("");
    };

    // Remove discount from an item
    const removeItemDiscount = (itemId: string) => {
        setServiceItems(prevItems => prevItems.map(item => {
            if (item.id === itemId && item.discount) {
                const originalPrice = item.originalPrice || item.unitPrice || 0;
                const quantity = item.quantity || 1;
                return {
                    ...item,
                    amount: originalPrice * quantity,
                    discount: undefined
                };
            }
            return item;
        }));
    };

    // Apply bill-level discount
    const applyBillLevelDiscount = (discountType: 'percentage' | 'fixed', discountValue: number, discountName?: string) => {
        const subtotal = calculateSubtotal();
        let discountAmount = 0;

        if (discountType === 'percentage') {
            discountAmount = (subtotal * discountValue) / 100;
        } else {
            discountAmount = Math.min(discountValue, subtotal);
        }

        setBillDiscount({
            type: discountType,
            value: discountValue,
            amount: discountAmount,
            name: discountName || `${discountType === 'percentage' ? discountValue + '%' : 'Rs.' + discountValue} off`
        });
        setShowDiscountModal(false);
        setManualDiscountValue("");
    };

    // Remove bill discount
    const removeBillDiscount = () => {
        setBillDiscount(null);
    };

    // Apply offer to cart
    const applyOffer = (offer: ActiveOffer) => {
        if (offer.scope === 'item' && selectedItemForDiscount) {
            applyItemDiscount(selectedItemForDiscount, offer.type as 'percentage' | 'fixed', offer.value);
        } else if (offer.scope === 'bill') {
            applyBillLevelDiscount(offer.type as 'percentage' | 'fixed', offer.value, offer.name);
        } else if (offer.scope === 'category') {
            // Apply to all items in the category
            serviceItems.forEach(item => {
                const product = inventoryItems.find(p => p.id === item.product_id);
                if (product?.category === offer.category) {
                    applyItemDiscount(item.id, offer.type as 'percentage' | 'fixed', offer.value);
                }
            });
        }
    };

    // Calculate subtotal (before discounts)
    const calculateSubtotal = () => {
        return serviceItems.reduce((total, item) => {
            const originalPrice = item.originalPrice || item.unitPrice || 0;
            const quantity = item.quantity || 1;
            return total + (originalPrice * quantity);
        }, 0);
    };

    // Calculate total item discounts
    const calculateItemDiscounts = () => {
        return serviceItems.reduce((total, item) => {
            return total + (item.discount?.amount || 0);
        }, 0);
    };

    const searchPatients = async (searchTerm: string) => {
        if (searchTerm.length < 2 || searchTerm === "Walk-in Customer") return;
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            // Use super admin patient search endpoint
            const response = await api.get(
                `/search-patients?q=${encodeURIComponent(searchTerm)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data) {
                const patientList = Array.isArray(response.data) ? response.data : (response.data.patients || []);
                setPatients(patientList);
                setShowPatientDropdown(true);
            }
        } catch (err) {
            console.error("Error searching patients:", err);
            setPatients([]);
        }
    };

    const calculateTotal = () => {
        const itemsTotal = serviceItems.reduce((total, item) => total + item.amount, 0);
        const billDiscountAmount = billDiscount?.amount || 0;
        return Math.max(0, itemsTotal - billDiscountAmount);
    };

    const calculateChange = () => {
        const paid = parseFloat(paidAmount) || 0;
        return paid - calculateTotal();
    };

    const handleAddProduct = (product: Product, qty: number = 1) => {
        const existingItem = serviceItems.find(item => item.product_id === product.id);
        // Use batch price if available, otherwise selling price
        const unitPrice = product.batch_price || product.selling_price;

        if (existingItem) {
            setServiceItems(serviceItems.map(item =>
                item.product_id === product.id
                    ? {
                        ...item,
                        quantity: (item.quantity || 1) + qty,
                        amount: (item.unitPrice || unitPrice) * ((item.quantity || 1) + qty),
                        originalPrice: item.originalPrice || item.unitPrice || unitPrice
                    }
                    : item
            ));
        } else {
            const newItem: ServiceItem = {
                id: `item-${Date.now()}`,
                service: product.item_name,
                amount: unitPrice * qty,
                product_id: product.id,
                quantity: qty,
                stock: product.stock,
                unitPrice: unitPrice,
                originalPrice: unitPrice,
                batchId: product.batch_id,
                batchNumber: product.batch_number
            };
            setServiceItems([...serviceItems, newItem]);
        }
        setShowProductDropdown(false);
        setProductSearch("");
    };

    const handleAddManualService = () => {
        if (!currentService.service || !currentService.amount) return;
        const newItem: ServiceItem = {
            id: `item-${Date.now()}`,
            service: currentService.service,
            amount: parseFloat(currentService.amount) * parseInt(currentService.quantity || "1"),
            quantity: parseInt(currentService.quantity || "1"),
            unitPrice: parseFloat(currentService.amount)
        };
        setServiceItems([...serviceItems, newItem]);
        setCurrentService({ service: "", amount: "", quantity: "1" });
    };

    const handleUpdateQuantity = (itemId: string, delta: number) => {
        setServiceItems(serviceItems.map(item => {
            if (item.id === itemId) {
                const newQty = Math.max(1, (item.quantity || 1) + delta);
                if (item.stock && newQty > item.stock) return item;
                return {
                    ...item,
                    quantity: newQty,
                    amount: (item.unitPrice || item.amount) * newQty
                };
            }
            return item;
        }));
    };

    const handleRemoveItem = (itemId: string) => {
        setServiceItems(serviceItems.filter(item => item.id !== itemId));
    };

    const handleSubmit = async () => {
        const branchId = getActiveBranchId();
        if (!branchId) {
            setError("Please select a branch first");
            return;
        }

        if (serviceItems.length === 0) {
            setError("Please add at least one item");
            return;
        }

        if (paymentMethod === "CASH" && !paidAmount) {
            setError("Please enter the paid amount for cash payment");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // Calculate discount totals
            const itemDiscountTotal = calculateItemDiscounts();
            const billDiscountTotal = billDiscount?.amount || 0;
            const totalDiscounts = itemDiscountTotal + billDiscountTotal;

            const transactionData = {
                branch_id: branchId,
                cashier_id: selectedCashier || undefined,
                transaction_type: transactionType,
                patient_id: isWalkIn ? null : patientInfo.id,
                patient_name: patientInfo.name,
                patient_phone: patientInfo.phone,
                service_details: serviceItems.map(item => ({
                    product_id: item.product_id,
                    service: item.service,
                    quantity: item.quantity || 1,
                    unit_price: item.unitPrice || (item.amount / (item.quantity || 1)),
                    amount: item.amount
                })),
                total_amount: calculateTotal(),
                paid_amount: parseFloat(paidAmount) || calculateTotal(),
                payment_method: paymentMethod,
                remarks: remarks || ""
            };

            const response = await api.post("/super-admin/pos/transactions", transactionData, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            setSuccess(`Transaction #${response.data.transaction?.invoice_number || ''} created successfully for ${selectedBranch?.pharmacy_name || selectedBranch?.name || 'pharmacy'}`);

            // Reset discounts
            setBillDiscount(null);
            // Check for low stock warnings
            if (response.data.low_stock_warning) {
                setLowStockWarning(response.data.low_stock_warning);
                // Clear warning after 10 seconds
                setTimeout(() => setLowStockWarning(null), 10000);
            }

            // Reload inventory to reflect updated stock
            loadInventoryItems();

            // Reset form
            setServiceItems([]);
            setPatientInfo({ name: "Walk-in Customer", phone: "" });
            setIsWalkIn(true);
            setPatientSearch("Walk-in Customer");
            setPaidAmount("");
            setRemarks("");

        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create transaction");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-neutral-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-800 flex items-center">
                    <ShoppingCart className="w-8 h-8 mr-3 text-primary-500" />
                    Super Admin Point of Sale
                </h1>
                <p className="text-neutral-600 mt-1">Create transactions on behalf of any branch</p>
            </div>

            {/* Branch Selection - Uses shared BranchContext */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex items-center mb-4">
                    <Building2 className="w-5 h-5 text-primary-500 mr-2" />
                    <h2 className="text-lg font-semibold">Select Pharmacy & Cashier</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BranchSelector showLabel={true} />
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Cashier (Optional)</label>
                        <select
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                            value={selectedCashier}
                            onChange={(e) => setSelectedCashier(e.target.value)}
                            disabled={isLoadingCashiers || !selectedBranch}
                        >
                            <option value="">-- Perform as Admin --</option>
                            {cashiers.map(cashier => (
                                <option key={cashier.id} value={cashier.id}>
                                    {cashier.name} ({cashier.email})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {selectedBranch && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Pharmacy:</strong> {selectedBranch.pharmacy_name || selectedBranch.name} |
                            <strong> Address:</strong> {selectedBranch.address}, {selectedBranch.city} |
                            <strong> Phone:</strong> {selectedBranch.phone}
                        </p>
                    </div>
                )}
            </div>

            {selectedBranch && (
                <>
                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-error-50 border border-red-200 rounded-lg flex items-center text-red-700">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
                            <Receipt className="w-5 h-5 mr-2" />
                            {success}
                        </div>
                    )}

                    {/* Low Stock Warning */}
                    {lowStockWarning && lowStockWarning.length > 0 && (
                        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <Package className="h-5 w-5 text-amber-600 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-amber-800 mb-2">⚠️ Low Stock Alert</h4>
                                    <div className="space-y-1">
                                        {lowStockWarning.map((item, idx) => (
                                            <p key={idx} className="text-sm text-amber-700">
                                                <span className="font-medium">{item.name}</span> ({item.code}) -
                                                Only <span className="font-bold text-error-600">{item.current_stock}</span> units left
                                                (Reorder level: {item.reorder_level})
                                            </p>
                                        ))}
                                    </div>
                                    <p className="text-xs text-amber-600 mt-2">
                                        Notifications have been sent to relevant staff. Consider placing a restock order.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setLowStockWarning(null)}
                                    className="text-amber-500 hover:text-amber-700"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Product Selection */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Transaction Type */}
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="text-md font-semibold text-neutral-800 mb-3">Transaction Type</h3>
                                <div className="flex space-x-2">
                                    {["OPD", "PHARMACY", "LAB", "OTHER"].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setTransactionType(type)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                                transactionType === type
                                                    ? "bg-primary-500 text-white"
                                                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Patient Selection */}
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-md font-semibold text-neutral-800 flex items-center">
                                        <User className="w-5 h-5 mr-2 text-neutral-500" />
                                        Patient Information
                                    </h3>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={isWalkIn}
                                            onChange={(e) => {
                                                setIsWalkIn(e.target.checked);
                                                if (e.target.checked) {
                                                    setPatientInfo({ name: "Walk-in Customer", phone: "" });
                                                    setPatientSearch("Walk-in Customer");
                                                }
                                            }}
                                            className="rounded border-neutral-300"
                                        />
                                        <span className="text-sm text-neutral-600">Walk-in Customer</span>
                                    </label>
                                </div>
                                {!isWalkIn && (
                                    <div className="relative">
                                        <div className="flex items-center border rounded-lg px-3 py-2">
                                            <Search className="w-5 h-5 text-neutral-400 mr-2" />
                                            <input
                                                type="text"
                                                value={patientSearch}
                                                onChange={(e) => {
                                                    setPatientSearch(e.target.value);
                                                    setShowPatientDropdown(true);
                                                    searchPatients(e.target.value);
                                                }}
                                                placeholder="Search patient by name, phone, or email..."
                                                className="w-full outline-none"
                                            />
                                        </div>
                                        {showPatientDropdown && patients.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {patients.map(patient => (
                                                    <div
                                                        key={patient.id}
                                                        onClick={() => {
                                                            setPatientInfo({
                                                                id: patient.id,
                                                                name: `${patient.first_name} ${patient.last_name}`,
                                                                phone: patient.phone
                                                            });
                                                            setPatientSearch(`${patient.first_name} ${patient.last_name}`);
                                                            setShowPatientDropdown(false);
                                                        }}
                                                        className="px-4 py-2 hover:bg-neutral-100 cursor-pointer"
                                                    >
                                                        <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                                                        <p className="text-sm text-neutral-500">{patient.phone} • {patient.email}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {patientInfo.id && (
                                    <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                                        <p className="text-sm"><strong>Name:</strong> {patientInfo.name}</p>
                                        <p className="text-sm"><strong>Phone:</strong> {patientInfo.phone || "N/A"}</p>
                                    </div>
                                )}
                            </div>

                            {/* Purchased Items - Same as Cashier Module */}
                            <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                                <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg">
                                        <ShoppingCart className="h-4 w-4 text-white" />
                                    </div>
                                    Purchased Items
                                </h2>

                                {/* Product Search with Qty and Price - Same as Cashier */}
                                <div className="grid grid-cols-12 gap-3 mb-4">
                                    {/* Product Search */}
                                    <div className="col-span-12 md:col-span-5 relative">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3.5 h-5 w-5 text-neutral-400" />
                                            <input
                                                type="text"
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                                onFocus={() => productSearch.length >= 2 && setShowProductDropdown(true)}
                                                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                placeholder="Search and select product..."
                                            />
                                        </div>
                                        {showProductDropdown && products.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {products.map((product) => (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => selectProduct(product)}
                                                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-medium text-neutral-900">{product.item_name}</div>
                                                                <div className="text-sm text-neutral-500">{product.item_code}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-medium text-emerald-600">Rs. {product.selling_price}</div>
                                                                <div className="text-xs text-neutral-500">Stock: {product.stock}</div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quantity */}
                                    <div className="col-span-6 md:col-span-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={currentService.quantity}
                                            onChange={(e) => setCurrentService({ ...currentService, quantity: e.target.value })}
                                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Qty"
                                        />
                                    </div>

                                    {/* Price - Read-only */}
                                    <div className="col-span-6 md:col-span-4">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={currentService.amount}
                                                readOnly={true}
                                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-100 cursor-not-allowed"
                                                placeholder="Select product"
                                            />
                                            {isProductFromDB && (
                                                <div className="absolute right-3 top-3.5 text-xs text-emerald-600 font-medium">
                                                    From DB
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add Button */}
                                    <div className="col-span-12 md:col-span-1">
                                        <button
                                            type="button"
                                            onClick={addServiceItem}
                                            className="w-full h-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Purchased Items List */}
                                {serviceItems.length > 0 ? (
                                    <div className="border border-neutral-200 rounded-xl overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gradient-to-r from-emerald-50 to-blue-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">Item</th>
                                                    <th className="px-4 py-3 text-center text-sm font-medium text-neutral-700">Qty</th>
                                                    <th className="px-4 py-3 text-right text-sm font-medium text-neutral-700">Price</th>
                                                    <th className="px-4 py-3 text-right text-sm font-medium text-neutral-700">Total</th>
                                                    <th className="px-4 py-3 w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {serviceItems.map((item) => (
                                                    <tr key={item.id} className="hover:bg-neutral-50">
                                                        <td className="px-4 py-3 text-sm text-neutral-900">
                                                            {item.service}
                                                            {item.stock !== undefined && (
                                                                <span className="ml-2 text-xs text-neutral-500">
                                                                    (Stock: {item.stock})
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-neutral-700 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateQuantity(item.id, -1)}
                                                                    disabled={(item.quantity || 1) <= 1}
                                                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                                >
                                                                    <Minus className="h-3.5 w-3.5 text-neutral-600" />
                                                                </button>
                                                                <span className="w-8 text-center font-semibold">
                                                                    {item.quantity || 1}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateQuantity(item.id, 1)}
                                                                    disabled={item.stock !== undefined && (item.quantity || 1) >= item.stock}
                                                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-100 hover:bg-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                                >
                                                                    <Plus className="h-3.5 w-3.5 text-emerald-600" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-neutral-700 text-right">
                                                            Rs. {((item.unitPrice || item.amount / (item.quantity || 1))).toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-neutral-900 text-right font-medium">
                                                            Rs. {item.amount.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                className="text-error-600 hover:text-red-800 transition"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-neutral-500 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                                        <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-neutral-400" />
                                        <p>No items added yet</p>
                                    </div>
                                )}

                                {/* Available Inventory List - Same as Cashier Module */}
                                <div className="mt-6 pt-6 border-t border-neutral-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-md font-semibold text-neutral-700 flex items-center gap-2">
                                            <Package className="h-5 w-5 text-emerald-600" />
                                            Available Inventory
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => loadInventoryItems()}
                                            disabled={isLoadingInventory}
                                            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isLoadingInventory ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </button>
                                    </div>

                                    {isLoadingInventory ? (
                                        <div className="text-center py-6">
                                            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-emerald-500" />
                                            <p className="text-sm text-neutral-500 mt-2">Loading inventory...</p>
                                        </div>
                                    ) : inventoryItems.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                                            {inventoryItems.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => quickAddProduct(item)}
                                                    className="p-3 bg-gradient-to-br from-gray-50 to-white border border-neutral-200 rounded-lg hover:border-emerald-400 hover:shadow-md transition-all text-left group"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-neutral-900 truncate group-hover:text-emerald-700">
                                                                {item.item_name}
                                                            </p>
                                                            <p className="text-xs text-neutral-500">{item.item_code}</p>
                                                        </div>
                                                        <div className="text-right ml-2">
                                                            <p className="font-semibold text-emerald-600">
                                                                Rs. {item.selling_price?.toLocaleString() || '0'}
                                                            </p>
                                                            <p className="text-xs text-neutral-500">
                                                                Stock: <span className={item.stock < 10 ? 'text-error-500 font-medium' : 'text-green-600'}>{item.stock}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 opacity-0 group-hover:opacity-100 transition">
                                                        <Plus className="h-3 w-3" /> Click to add
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-neutral-500 bg-neutral-50 rounded-lg">
                                            <Package className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
                                            <p className="text-sm">No inventory items available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Payment Summary */}
                        <div className="space-y-6">
                            {/* Payment Totals Section */}
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="text-md font-semibold text-neutral-800 mb-3 flex items-center">
                                    <DollarSign className="w-5 h-5 mr-2 text-neutral-500" />
                                    Order Summary
                                </h3>

                                {/* Enhanced Totals with Discounts */}
                                <div className="border-t mt-4 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600">Subtotal:</span>
                                        <span>Rs. {calculateSubtotal().toLocaleString()}</span>
                                    </div>

                                    {calculateItemDiscounts() > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Item Discounts:</span>
                                            <span>-Rs. {calculateItemDiscounts().toLocaleString()}</span>
                                        </div>
                                    )}

                                    {billDiscount && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span className="flex items-center">
                                                Bill Discount ({billDiscount.name})
                                                <button
                                                    onClick={removeBillDiscount}
                                                    className="ml-1 text-error-500 hover:text-red-700"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                            <span>-Rs. {billDiscount.amount.toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                        <span>Total:</span>
                                        <span className="text-primary-500">Rs. {calculateTotal().toLocaleString()}</span>
                                    </div>

                                    {/* Add Discount Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedItemForDiscount(null);
                                            setShowDiscountModal(true);
                                        }}
                                        className="w-full mt-2 py-2 px-3 border border-dashed border-green-400 rounded-lg text-green-600 hover:bg-green-50 flex items-center justify-center text-sm"
                                    >
                                        <Percent className="w-4 h-4 mr-2" />
                                        Add Bill Discount
                                    </button>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="text-md font-semibold text-neutral-800 mb-3">Payment Method</h3>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {[
                                        { value: "CASH", icon: <DollarSign className="w-4 h-4" />, label: "Cash" },
                                        { value: "CARD", icon: <CreditCard className="w-4 h-4" />, label: "Card" },
                                        { value: "ONLINE", icon: <Smartphone className="w-4 h-4" />, label: "Online" },
                                        { value: "QR", icon: <QrCode className="w-4 h-4" />, label: "QR Pay" },
                                    ].map(method => (
                                        <button
                                            key={method.value}
                                            onClick={() => setPaymentMethod(method.value)}
                                            className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                                                paymentMethod === method.value
                                                    ? "bg-primary-500 text-white border-primary-500"
                                                    : "bg-white text-neutral-700 border-neutral-200 hover:border-blue-300"
                                            }`}
                                        >
                                            {method.icon}
                                            <span className="text-sm">{method.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {paymentMethod === "CASH" && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm text-neutral-600">Received Amount</label>
                                            <input
                                                type="number"
                                                value={paidAmount}
                                                onChange={(e) => setPaidAmount(e.target.value)}
                                                placeholder="Enter amount"
                                                className="w-full border rounded-lg px-3 py-2 mt-1"
                                            />
                                        </div>
                                        {parseFloat(paidAmount) > 0 && (
                                            <div className={`p-3 rounded-lg ${calculateChange() >= 0 ? "bg-green-50" : "bg-error-50"}`}>
                                                <p className={`text-lg font-bold ${calculateChange() >= 0 ? "text-green-600" : "text-error-600"}`}>
                                                    Change: Rs. {calculateChange().toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-4">
                                    <label className="text-sm text-neutral-600">Remarks (Optional)</label>
                                    <textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Add any notes..."
                                        className="w-full border rounded-lg px-3 py-2 mt-1"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || serviceItems.length === 0}
                                className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 transition-all ${
                                    isSubmitting || serviceItems.length === 0
                                        ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                                        : "bg-primary-500 text-white hover:bg-primary-600"
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Receipt className="w-5 h-5" />
                                        <span>Complete Sale - Rs. {calculateTotal().toLocaleString()}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {!selectedBranch && (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-neutral-600 mb-2">Select a Branch to Continue</h3>
                    <p className="text-neutral-500">Choose a branch from the dropdown above to start creating transactions</p>
                </div>
            )}

            {/* Active Offers Panel */}
            {showOffersPanel && activeOffers.length > 0 && (
                <div className="fixed right-0 top-20 w-80 bg-white shadow-2xl border-l z-50 h-[calc(100vh-5rem)] overflow-y-auto">
                    <div className="p-4 border-b bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold flex items-center">
                                <Gift className="w-5 h-5 mr-2" />
                                Active Offers
                            </h3>
                            <button onClick={() => setShowOffersPanel(false)} className="text-white/80 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {activeOffers.map((offer, idx) => (
                            <div key={idx} className="border rounded-lg p-3 hover:bg-green-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-neutral-800">{offer.name}</p>
                                        <p className="text-sm text-neutral-500">
                                            {offer.type === 'percentage' ? `${offer.value}% off` : `Rs. ${offer.value} off`}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            offer.scope === 'bill' ? 'bg-purple-100 text-purple-700' :
                                            offer.scope === 'item' ? 'bg-blue-100 text-blue-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {offer.scope.toUpperCase()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => applyOffer(offer)}
                                        className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Toggle Offers Button */}
            {activeOffers.length > 0 && !showOffersPanel && (
                <button
                    onClick={() => setShowOffersPanel(true)}
                    className="fixed right-4 bottom-4 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 z-40 flex items-center"
                >
                    <Gift className="w-6 h-6" />
                    <span className="ml-2 bg-error-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {activeOffers.length}
                    </span>
                </button>
            )}

            {/* Discount Modal */}
            {showDiscountModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Percent className="w-5 h-5 mr-2 text-green-600" />
                                {selectedItemForDiscount ? 'Apply Item Discount' : 'Apply Bill Discount'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowDiscountModal(false);
                                    setSelectedItemForDiscount(null);
                                    setManualDiscountValue("");
                                }}
                                className="text-neutral-400 hover:text-neutral-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Discount Presets */}
                        <div className="mb-4">
                            <p className="text-sm text-neutral-600 mb-2">Quick Discounts:</p>
                            <div className="grid grid-cols-4 gap-2">
                                {[5, 10, 15, 20].map(percent => (
                                    <button
                                        key={percent}
                                        onClick={() => {
                                            if (selectedItemForDiscount) {
                                                applyItemDiscount(selectedItemForDiscount, 'percentage', percent);
                                            } else {
                                                applyBillLevelDiscount('percentage', percent);
                                            }
                                        }}
                                        className="py-2 border rounded-lg hover:bg-green-50 hover:border-green-500 text-sm font-medium"
                                    >
                                        {percent}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Manual Discount Entry */}
                        <div className="border-t pt-4">
                            <p className="text-sm text-neutral-600 mb-2">Custom Discount:</p>
                            <div className="flex items-center space-x-2">
                                <select
                                    value={manualDiscountType}
                                    onChange={(e) => setManualDiscountType(e.target.value as 'percentage' | 'fixed')}
                                    className="border rounded-lg px-3 py-2"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed (Rs.)</option>
                                </select>
                                <input
                                    type="number"
                                    value={manualDiscountValue}
                                    onChange={(e) => setManualDiscountValue(e.target.value)}
                                    placeholder="Enter value"
                                    className="flex-1 border rounded-lg px-3 py-2"
                                    min="0"
                                />
                                <button
                                    onClick={() => {
                                        const value = parseFloat(manualDiscountValue);
                                        if (value > 0) {
                                            if (selectedItemForDiscount) {
                                                applyItemDiscount(selectedItemForDiscount, manualDiscountType, value);
                                            } else {
                                                applyBillLevelDiscount(manualDiscountType, value);
                                            }
                                        }
                                    }}
                                    disabled={!manualDiscountValue || parseFloat(manualDiscountValue) <= 0}
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-neutral-300"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>

                        {/* Available Offers */}
                        {activeOffers.filter(o =>
                            selectedItemForDiscount ? o.scope === 'item' : o.scope === 'bill'
                        ).length > 0 && (
                            <div className="border-t mt-4 pt-4">
                                <p className="text-sm text-neutral-600 mb-2 flex items-center">
                                    <Gift className="w-4 h-4 mr-1 text-green-600" />
                                    Available Offers:
                                </p>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {activeOffers
                                        .filter(o => selectedItemForDiscount ? o.scope === 'item' : o.scope === 'bill')
                                        .map((offer, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => applyOffer(offer)}
                                                className="flex justify-between items-center p-2 border rounded-lg hover:bg-green-50 cursor-pointer"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">{offer.name}</p>
                                                    <p className="text-xs text-neutral-500">
                                                        {offer.type === 'percentage' ? `${offer.value}%` : `Rs.${offer.value}`} off
                                                    </p>
                                                </div>
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPOSPage;
