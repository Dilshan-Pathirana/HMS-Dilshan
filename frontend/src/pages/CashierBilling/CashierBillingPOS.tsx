import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api/axios";
import { 
    ShoppingCart, Search, Plus, Minus, Trash2, ArrowLeft, 
    User, Phone, DollarSign, CreditCard, Smartphone,
    QrCode, Save, AlertCircle, Receipt,
    Package, RefreshCw
} from "lucide-react";
import { BranchBadge } from "../../components/pharmacyPOS/Common/BranchSelector";
import { usePOSApi } from "../../hooks/usePOSApi";

interface ServiceItem {
    id: string;
    service: string;
    amount: number;
    product_id?: string;
    quantity?: number;
    stock?: number;
    unitPrice?: number;
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
}

interface BranchInfo {
    name: string;
    address: string;
    city: string;
    phone: string;
}

const CashierBillingPOS = () => {
    const navigate = useNavigate();
    const posApi = usePOSApi();
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
    const [isEodLocked, setIsEodLocked] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<Product[]>([]);
    const [isLoadingInventory, setIsLoadingInventory] = useState(false);
    const [branchInfo, setBranchInfo] = useState<BranchInfo>({ name: "", address: "", city: "", phone: "" });
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [lowStockWarning, setLowStockWarning] = useState<Array<{name: string; code: string; current_stock: number; reorder_level: number}> | null>(null);

    useEffect(() => {
        checkEodStatus();
        loadInventoryItems();
    }, []);

    useEffect(() => {
        if (patientSearch.length >= 2 && !isWalkIn) {
            searchPatients();
        } else {
            setShowPatientDropdown(false);
        }
    }, [patientSearch, isWalkIn]);

    useEffect(() => {
        if (productSearch.length >= 2) {
            searchProducts();
        } else {
            setShowProductDropdown(false);
        }
    }, [productSearch]);

    const checkEodStatus = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await api.get(
                posApi.dashboardStats,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.status === 200) {
                setIsEodLocked(response.data.data.is_eod_locked);
                // Store branch info for receipt
                const branch = response.data.data.branch;
                if (branch) {
                    setBranchInfo({
                        name: branch.name || 'CURE HOSPITAL',
                        address: branch.address || '',
                        city: branch.city || '',
                        phone: branch.phone || '',
                    });
                }
            }
        } catch (err) {
            console.error("Error checking EOD status:", err);
        }
    };

    const searchPatients = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await api.get(
                `${posApi.searchPatients}?q=${patientSearch}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data) {
                setPatients(response.data);
                setShowPatientDropdown(true);
            }
        } catch (err) {
            console.error("Error searching patients:", err);
        }
    };

    const selectPatient = (patient: Patient) => {
        setPatientInfo({
            id: patient.id,
            name: `${patient.first_name} ${patient.last_name}`,
            phone: patient.phone || "",
        });
        setPatientSearch(`${patient.first_name} ${patient.last_name}`);
        setShowPatientDropdown(false);
    };

    const handleWalkInToggle = (walkIn: boolean) => {
        setIsWalkIn(walkIn);
        if (walkIn) {
            setPatientInfo({ name: "Walk-in Customer", phone: "" });
            setPatientSearch("Walk-in Customer");
            setShowPatientDropdown(false);
        } else {
            setPatientInfo({ name: "", phone: "" });
            setPatientSearch("");
        }
    };

    const loadInventoryItems = async () => {
        setIsLoadingInventory(true);
        try {
            const token = localStorage.getItem("authToken");
            const response = await api.get(
                posApi.inventoryList,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data) {
                // Handle both array response and {status, data} response
                const items = Array.isArray(response.data) ? response.data : response.data.data;
                setInventoryItems(items || []);
            }
        } catch (err) {
            console.error("Error loading inventory:", err);
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
            };
            setServiceItems([...serviceItems, newItem]);
        }
        setError("");
    };

    const searchProducts = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await api.get(
                `${posApi.searchProducts}?q=${productSearch}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data) {
                // Handle both array response and {status, data} response
                const items = Array.isArray(response.data) ? response.data : response.data.data;
                setProducts(items || []);
                setShowProductDropdown(true);
            }
        } catch (err) {
            console.error("Error searching products:", err);
        }
    };

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

    const addServiceItem = () => {
        const selectedProduct = (window as any).selectedProduct;
        
        // Cashiers MUST select products from database - cannot manually enter items/prices
        if (!selectedProduct) {
            setError("Please select a product from the list. Manual item entry is not allowed.");
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
        };

        setServiceItems([...serviceItems, newItem]);
        setCurrentService({ service: "", amount: "", quantity: "1" });
        setProductSearch("");
        setIsProductFromDB(false);
        delete (window as any).selectedProduct;
        setError("");
    };

    const removeServiceItem = (id: string) => {
        setServiceItems(serviceItems.filter(item => item.id !== id));
    };

    const updateItemQuantity = (id: string, delta: number) => {
        setServiceItems(serviceItems.map(item => {
            if (item.id !== id) return item;
            
            const currentQty = item.quantity || 1;
            const newQty = currentQty + delta;
            
            // Don't allow quantity below 1
            if (newQty < 1) return item;
            
            // Check stock limit
            if (item.stock !== undefined && newQty > item.stock) {
                setError(`Only ${item.stock} units available in stock`);
                return item;
            }
            
            const unitPrice = item.amount / currentQty;
            return { ...item, quantity: newQty, amount: unitPrice * newQty };
        }));
    };

    const calculateTotal = () => {
        return serviceItems.reduce((sum, item) => sum + item.amount, 0);
    };

    const calculateBalance = () => {
        const total = calculateTotal();
        const paid = parseFloat(paidAmount) || 0;
        return total - paid;
    };

    const printReceipt = (transactionData: any, items: ServiceItem[], total: number, paid: number, patientName: string, patientPhone: string) => {
        const balance = total - paid;
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB');
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receipt - ${transactionData?.receipt_number || ''}</title>
    <style>
        @page {
            size: 58mm auto;
            margin: 0;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            width: 58mm;
            padding: 2mm;
            line-height: 1.3;
        }
        .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 3mm;
            margin-bottom: 2mm;
        }
        .header h1 {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 1mm;
        }
        .header p {
            font-size: 8px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            margin-bottom: 1mm;
        }
        .divider {
            border-top: 1px dashed #000;
            margin: 2mm 0;
        }
        .items-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 9px;
            border-bottom: 1px solid #000;
            padding-bottom: 1mm;
            margin-bottom: 1mm;
        }
        .item-row {
            margin-bottom: 1.5mm;
        }
        .item-name {
            font-size: 9px;
            font-weight: bold;
        }
        .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            padding-left: 2mm;
        }
        .totals {
            border-top: 1px dashed #000;
            margin-top: 2mm;
            padding-top: 2mm;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 1mm;
        }
        .total-row.grand {
            font-weight: bold;
            font-size: 11px;
            border-top: 1px solid #000;
            padding-top: 1mm;
            margin-top: 1mm;
        }
        .footer {
            text-align: center;
            margin-top: 3mm;
            padding-top: 2mm;
            border-top: 1px dashed #000;
            font-size: 8px;
        }
        .footer p {
            margin-bottom: 1mm;
        }
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${branchInfo.name || 'CURE HOSPITAL'}</h1>
        <p>${branchInfo.address}${branchInfo.city ? ', ' + branchInfo.city : ''}</p>
        <p>Tel: ${branchInfo.phone || 'N/A'}</p>
    </div>

    <div class="info-row">
        <span>Date: ${dateStr}</span>
        <span>Time: ${timeStr}</span>
    </div>
    <div class="info-row">
        <span>Rcpt#: ${transactionData?.receipt_number || 'N/A'}</span>
    </div>
    <div class="info-row">
        <span>Inv#: ${transactionData?.invoice_number || 'N/A'}</span>
    </div>
    <div class="info-row">
        <span>Patient: ${patientName}</span>
    </div>
    ${patientPhone ? `<div class="info-row"><span>Phone: ${patientPhone}</span></div>` : ''}
    <div class="info-row">
        <span>Type: ${transactionData?.transaction_type || 'OPD'}</span>
        <span>Pay: ${transactionData?.payment_method || 'CASH'}</span>
    </div>

    <div class="divider"></div>

    <div class="items-header">
        <span>Item</span>
        <span>Amount</span>
    </div>

    ${items.map(item => `
        <div class="item-row">
            <div class="item-name">${item.service}</div>
            <div class="item-details">
                <span>${item.quantity || 1} x Rs.${((item.amount / (item.quantity || 1))).toFixed(2)}</span>
                <span>Rs.${item.amount.toFixed(2)}</span>
            </div>
        </div>
    `).join('')}

    <div class="totals">
        <div class="total-row">
            <span>Sub Total:</span>
            <span>Rs.${total.toFixed(2)}</span>
        </div>
        <div class="total-row grand">
            <span>TOTAL:</span>
            <span>Rs.${total.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Paid:</span>
            <span>Rs.${paid.toFixed(2)}</span>
        </div>
        ${balance !== 0 ? `
        <div class="total-row">
            <span>${balance > 0 ? 'Balance Due:' : 'Change:'}</span>
            <span>Rs.${Math.abs(balance).toFixed(2)}</span>
        </div>
        ` : ''}
    </div>

    <div class="footer">
        <p>Thank you for your visit!</p>
        <p>Trusted care for every illness.</p>
        <p><strong>www.cure.lk</strong></p>
        <p>--- ${now.getFullYear()} ---</p>
    </div>
</body>
</html>
        `;

        // Open print window
        const printWindow = window.open('', '_blank', 'width=250,height=600');
        if (printWindow) {
            printWindow.document.write(receiptHTML);
            printWindow.document.close();
            
            // Wait for content to load then print
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                // Close after print dialog
                printWindow.onafterprint = () => {
                    printWindow.close();
                };
            };
            
            // Fallback: trigger print after a short delay
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validation
        if (serviceItems.length === 0) {
            setError("Please add at least one service item");
            return;
        }
        if (!paidAmount || parseFloat(paidAmount) < 0) {
            setError("Please enter valid paid amount");
            return;
        }

        // Use Walk-in Customer as default if no patient name
        const finalPatientName = patientInfo.name?.trim() || "Walk-in Customer";

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("authToken");
            
            // Clean service details for backend
            const cleanServiceDetails = serviceItems.map(item => ({
                id: item.id,
                service: item.service,
                amount: item.amount,
                quantity: item.quantity || 1,
                product_id: item.product_id || null,
            }));

            const requestData = {
                transaction_type: transactionType,
                patient_id: patientInfo.id || null,
                patient_name: finalPatientName,
                patient_phone: patientInfo.phone?.trim() || null,
                service_details: cleanServiceDetails,
                total_amount: calculateTotal(),
                paid_amount: parseFloat(paidAmount),
                payment_method: paymentMethod,
                remarks: remarks?.trim() || null,
            };

            console.log("Sending transaction data:", JSON.stringify(requestData, null, 2));

            const response = await api.post(
                posApi.transactions,
                requestData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 201) {
                const transactionData = response.data.data;
                const invoiceNum = transactionData?.invoice_number || '';
                const receiptNum = transactionData?.receipt_number || '';
                
                // Check for low stock warnings
                if (response.data.low_stock_warning) {
                    setLowStockWarning(response.data.low_stock_warning);
                }
                
                // Print receipt immediately
                printReceipt(
                    transactionData,
                    serviceItems,
                    calculateTotal(),
                    parseFloat(paidAmount),
                    finalPatientName,
                    patientInfo.phone || ''
                );
                
                setSuccess(`Transaction completed successfully! Invoice: ${invoiceNum}, Receipt: ${receiptNum}`);
                
                // Reload inventory to reflect updated stock
                loadInventoryItems();
                
                // Reset form after showing success message (don't clear low stock warning immediately)
                setTimeout(() => {
                    setPatientInfo({ name: "Walk-in Customer", phone: "" });
                    setPatientSearch("Walk-in Customer");
                    setIsWalkIn(true);
                    setServiceItems([]);
                    setPaidAmount("");
                    setRemarks("");
                    setTransactionType("OPD");
                    setPaymentMethod("CASH");
                    setSuccess("");
                    setProductSearch("");
                    setProducts([]);
                    setShowProductDropdown(false);
                    setIsProductFromDB(false);
                    setCurrentService({ service: "", amount: "", quantity: "1" });
                }, 3000);
                
                // Clear low stock warning after a longer delay
                setTimeout(() => {
                    setLowStockWarning(null);
                }, 10000);
            }
        } catch (err: any) {
            console.error("Error creating transaction:", err);
            console.error("Response data:", err.response?.data);
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                setError(Object.values(errors).flat().join(", "));
            } else {
                setError(err.response?.data?.message || "Failed to create transaction");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isEodLocked) {
        return (
            <div className="p-6 space-y-6 bg-neutral-50 min-h-screen">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg mr-4">
                                <AlertCircle className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-yellow-800">EOD Locked</h2>
                        </div>
                        <p className="text-yellow-700 mb-4">
                            Today's End of Day has been submitted and locked. No new transactions can be created.
                        </p>
                        <button
                            onClick={() => navigate("/pos")}
                            className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const total = calculateTotal();
    const paid = parseFloat(paidAmount) || 0;
    const balance = calculateBalance();

    return (
        <div className="p-6 space-y-6 bg-neutral-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/pos")}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Receipt className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Point of Sale</h1>
                                <p className="text-emerald-100 text-sm">Create new billing transaction</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <BranchBadge className="text-white bg-white/20" />
                        <div className="flex items-center gap-2 text-sm bg-white/20 px-4 py-2 rounded-lg">
                            <ShoppingCart className="h-5 w-5" />
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-error-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-error-500" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-green-700">{success}</p>
                </div>
            )}

            {/* Low Stock Warning */}
            {lowStockWarning && lowStockWarning.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
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

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Transaction Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Transaction Type */}
                    <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Transaction Type</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {["OPD", "LAB", "PHARMACY", "SERVICE"].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setTransactionType(type)}
                                    className={`p-4 rounded-lg border-2 transition ${
                                        transactionType === type
                                            ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-blue-50 text-emerald-700"
                                            : "border-neutral-200 hover:border-neutral-300"
                                    }`}
                                >
                                    <span className="font-medium">{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Patient Information */}
                    <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            Patient Information
                        </h2>

                        {/* Walk-in Toggle */}
                        <div className="mb-4 flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => handleWalkInToggle(false)}
                                className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                                    !isWalkIn
                                        ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-blue-50 text-emerald-700"
                                        : "border-neutral-200 hover:border-neutral-300"
                                }`}
                            >
                                Registered Patient
                            </button>
                            <button
                                type="button"
                                onClick={() => handleWalkInToggle(true)}
                                className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                                    isWalkIn
                                        ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-blue-50 text-emerald-700"
                                        : "border-neutral-200 hover:border-neutral-300"
                                }`}
                            >
                                Walk-in Customer
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Patient Search/Name */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    {isWalkIn ? "Customer Name (Optional)" : "Patient Name"}
                                </label>
                                {!isWalkIn ? (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3.5 h-5 w-5 text-neutral-400" />
                                            <input
                                                type="text"
                                                value={patientSearch}
                                                onChange={(e) => {
                                                    setPatientSearch(e.target.value);
                                                    setPatientInfo({ ...patientInfo, name: e.target.value });
                                                }}
                                                onFocus={() => patientSearch.length >= 2 && setShowPatientDropdown(true)}
                                                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                placeholder="Search patient name..."
                                            />
                                        </div>
                                        {showPatientDropdown && patients.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {patients.map((patient, index) => (
                                                    <button
                                                        key={`${patient.id}-${index}`}
                                                        type="button"
                                                        onClick={() => selectPatient(patient)}
                                                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <div className="font-medium text-neutral-900">
                                                            {patient.first_name} {patient.last_name}
                                                        </div>
                                                        <div className="text-sm text-neutral-500">
                                                            {patient.phone} {patient.email && `• ${patient.email}`}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <input
                                        type="text"
                                        value={patientInfo.name}
                                        onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="Enter name (optional)"
                                    />
                                )}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Phone Number (Optional)
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 h-5 w-5 text-neutral-400" />
                                    <input
                                        type="tel"
                                        value={patientInfo.phone}
                                        onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="07XXXXXXXX (optional)"
                                        disabled={!isWalkIn && patientInfo.id !== undefined}
                                    />
                                </div>
                                {!isWalkIn && patientInfo.id && (
                                    <p className="text-xs text-neutral-500 mt-1">Phone from patient record</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Purchased Items */}
                    <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg">
                                <ShoppingCart className="h-4 w-4 text-white" />
                            </div>
                            Purchased Items
                        </h2>
                        
                        {/* Add Item Form */}
                        <div className="grid grid-cols-12 gap-3 mb-4">
                            {/* Product Search - Must select from database */}
                            <div className="col-span-12 md:col-span-5 relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-neutral-400" />
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onChange={(e) => {
                                            setProductSearch(e.target.value);
                                            // Clear selection when user types
                                            if (isProductFromDB) {
                                                setIsProductFromDB(false);
                                                setCurrentService({ service: "", amount: "", quantity: "1" });
                                                delete (window as any).selectedProduct;
                                            }
                                        }}
                                        onFocus={() => productSearch.length >= 2 && setShowProductDropdown(true)}
                                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="Search and select product..."
                                    />
                                </div>
                                {showProductDropdown && products.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {products.map((product, index) => (
                                            <button
                                                key={`${product.id}-${index}`}
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

                            {/* Price - Always read-only for cashiers */}
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
                                                            onClick={() => updateItemQuantity(item.id, -1)}
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
                                                            onClick={() => updateItemQuantity(item.id, 1)}
                                                            disabled={item.stock !== undefined && (item.quantity || 1) >= item.stock}
                                                            className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-100 hover:bg-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                        >
                                                            <Plus className="h-3.5 w-3.5 text-emerald-600" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-neutral-700 text-right">
                                                    Rs. {(item.amount / (item.quantity || 1)).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-neutral-900 text-right font-medium">
                                                    Rs. {item.amount.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeServiceItem(item.id)}
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

                        {/* Available Inventory List */}
                        <div className="mt-6 pt-6 border-t border-neutral-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-md font-semibold text-neutral-700 flex items-center gap-2">
                                    <Package className="h-5 w-5 text-emerald-600" />
                                    Available Inventory
                                </h3>
                                <button
                                    type="button"
                                    onClick={loadInventoryItems}
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
                                    {inventoryItems.map((item, index) => (
                                        <button
                                            key={`${item.id}-${index}`}
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

                    {/* Remarks */}
                    <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Remarks (Optional)
                        </label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            placeholder="Add any additional notes..."
                        />
                    </div>
                </div>

                {/* Right Column - Payment & Summary */}
                <div className="space-y-6">
                    {/* Payment Summary */}
                    <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6 sticky top-6">
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Payment Summary</h2>
                        
                        <div className="space-y-3 mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-600">Total Amount:</span>
                                <span className="font-bold text-2xl text-neutral-800">Rs. {total.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-neutral-700 mb-3">
                                Payment Method *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: "CASH", icon: DollarSign, label: "Cash", color: "from-green-500 to-emerald-600" },
                                    { value: "CARD", icon: CreditCard, label: "Card", color: "from-blue-500 to-cyan-600" },
                                    { value: "ONLINE", icon: Smartphone, label: "Online", color: "from-purple-500 to-pink-600" },
                                    { value: "QR", icon: QrCode, label: "QR Code", color: "from-orange-500 to-amber-600" },
                                ].map((method) => (
                                    <button
                                        key={method.value}
                                        type="button"
                                        onClick={() => setPaymentMethod(method.value)}
                                        className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                                            paymentMethod === method.value
                                                ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-blue-50"
                                                : "border-neutral-200 hover:border-neutral-300"
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg ${paymentMethod === method.value ? `bg-gradient-to-br ${method.color}` : 'bg-neutral-100'}`}>
                                            <method.icon className={`h-5 w-5 ${paymentMethod === method.value ? 'text-white' : 'text-neutral-600'}`} />
                                        </div>
                                        <span className="text-xs font-medium">{method.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Paid Amount */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Paid Amount *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(e.target.value)}
                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-lg font-semibold"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {/* Balance/Change */}
                        {paid > 0 && (
                            <div className={`p-4 rounded-xl mb-6 ${
                                balance < 0 
                                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200" 
                                    : balance > 0 
                                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200"
                                    : "bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200"
                            }`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                        {balance < 0 ? "Change:" : balance > 0 ? "Balance Due:" : "Payment Status:"}
                                    </span>
                                    <span className={`text-lg font-bold ${
                                        balance < 0 ? "text-green-700" : balance > 0 ? "text-yellow-700" : "text-blue-700"
                                    }`}>
                                        {balance < 0 ? `Rs. ${Math.abs(balance).toLocaleString()}` : 
                                         balance > 0 ? `Rs. ${balance.toLocaleString()}` : "Paid in Full"}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                type="submit"
                                disabled={isSubmitting || serviceItems.length === 0}
                                className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white py-4 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-medium"
                            >
                                <Save className="h-5 w-5" />
                                {isSubmitting ? "Processing..." : "Complete Transaction"}
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => {
                                    if (serviceItems.length > 0) {
                                        setShowCancelConfirm(true);
                                    } else {
                                        navigate("/pos/pos");
                                    }
                                }}
                                className="w-full bg-neutral-100 text-neutral-700 py-3 rounded-lg hover:bg-neutral-200 transition border border-neutral-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 animate-fade-in">
                        <div className="flex items-center justify-center mb-4">
                            <div className="bg-yellow-100 rounded-full p-3">
                                <AlertCircle className="h-8 w-8 text-yellow-600" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-center text-neutral-900 mb-2">Cancel Transaction?</h3>
                        <p className="text-center text-neutral-600 mb-6">
                            You have {serviceItems.length} item{serviceItems.length !== 1 ? 's' : ''} in the cart. Are you sure you want to cancel and clear the cart?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="flex-1 bg-neutral-100 text-neutral-700 py-3 px-4 rounded-lg hover:bg-neutral-200 transition font-medium"
                            >
                                Keep Cart
                            </button>
                            <button
                                onClick={() => {
                                    setServiceItems([]);
                                    setCurrentService({ service: "", amount: "", quantity: "1" });
                                    setPatientInfo({ name: "Walk-in Customer", phone: "" });
                                    setPatientSearch("Walk-in Customer");
                                    setIsWalkIn(true);
                                    setPaidAmount("");
                                    setRemarks("");
                                    setShowCancelConfirm(false);
                                    navigate("/pos/pos");
                                }}
                                className="flex-1 bg-error-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition font-medium"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierBillingPOS;
