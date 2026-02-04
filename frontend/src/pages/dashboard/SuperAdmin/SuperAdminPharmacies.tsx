import React, { useState, useEffect } from 'react';
import api from "../../../utils/api/axios";
import {
    Building2,
    Plus,
    Search,
    Edit2,
    Trash2,
    Package,
    AlertTriangle,
    Check,
    X,
    RefreshCw,
    MapPin,
    Phone,
    Mail,
    Settings,
    TrendingDown,
    Truck,
    Box
} from 'lucide-react';

// Tab type
type MainTab = 'pharmacies' | 'inventory' | 'suppliers';

// Types
interface Branch {
    id: string;
    center_name: string;
    city?: string;
    address?: string;
}

interface Pharmacy {
    id: number;
    branch_id: string | null;
    name: string;
    pharmacy_code: string;
    license_number: string;
    license_expiry_date: string | null;
    location: string | null;
    phone: string | null;
    email: string | null;
    status: 'active' | 'inactive';
    branch?: {
        center_name: string;
    } | null;
    inventory_count?: number;
    low_stock_count?: number;
    operating_hours?: Record<string, string> | null;
}

interface PharmacyFormData {
    pharmacy_name: string;
    pharmacy_code: string;
    license_number: string;
    license_expiry_date: string;
    phone: string;
    email: string;
    location_in_branch: string;
    is_active: boolean;
    branch_id: string;
}

interface InventoryItem {
    id: number;
    medication_name: string;
    generic_name: string;
    dosage_form: string;
    strength: string;
    manufacturer: string;
    batch_number: string;
    expiration_date: string;
    quantity_in_stock: number;
    reorder_level: number;
    unit_cost: number;
    selling_price: number;
    storage_location: string;
    is_active: boolean;
}

// Global Product interface (from products table)
interface Product {
    id: string;
    supplier_id: string;
    supplier_name: string;
    item_code: string;
    barcode: string;
    item_name: string;
    generic_name: string;
    brand_name: string;
    category: string;
    unit: string;
    current_stock: number;
    min_stock: number;
    reorder_level: number;
    reorder_quantity: number;
    unit_cost: number;
    unit_selling_price: number;
    expiry_date: string;
    stock_status: string;
    product_store_location: string;
    stock_update_date: string;
    damaged_unit: string;
    warranty_serial: string;
    warranty_duration: string;
    warranty_type: string;
    discount_type: string;
    discount_amount: number;
    discount_percentage: number;
}

// Supplier interface
interface Supplier {
    id: string;
    supplier_name: string;
    contact_person: string;
    contact_number: string;
    contact_email: string;
    supplier_address: string;
    supplier_city: string;
    supplier_type: string;
    status?: 'active' | 'inactive';
}

// Product form data
interface ProductFormData {
    supplier_id: string;
    item_code: string;
    barcode: string;
    item_name: string;
    generic_name: string;
    brand_name: string;
    category: string;
    unit: string;
    current_stock: number;
    min_stock: number;
    reorder_level: number;
    reorder_quantity: number;
    unit_cost: number;
    unit_selling_price: number;
    expiry_date: string;
    product_store_location: string;
    warranty_serial: string;
    warranty_duration: string;
    warranty_type: string;
}

// Branch stock item for a product
interface BranchStockItem {
    branch_id: string;
    branch_name: string;
    city: string;
    has_stock: boolean;
    stock_id: string | null;
    current_stock: number;
    unit: string;
    unit_cost: number;
    unit_selling_price: number;
    min_stock: number;
    reorder_level: number;
    expiry_date: string | null;
    product_store_location: string;
}

// Branch stock form data
interface BranchStockFormData {
    branch_id: string;
    unit: string;
    current_stock: number;
    min_stock: number;
    reorder_level: number;
    unit_cost: number;
    unit_selling_price: number;
    expiry_date: string;
    product_store_location: string;
}

// Supplier form data
interface SupplierFormData {
    supplier_name: string;
    contact_person: string;
    contact_number: string;
    contact_email: string;
    supplier_address: string;
    supplier_city: string;
    supplier_country: string;
    supplier_type: string;
    products_supplied: string;
    delivery_time: string;
    payment_terms: string;
    bank_details: string;
    rating: string;
    discounts_agreements: string;
    return_policy: string;
    note: string;
}

// Tab type - reserved for future use
// type TabType = 'all' | 'create' | 'allocate' | 'manage';

const SuperAdminPharmacies: React.FC = () => {
    // Main tab state
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('pharmacies');
    
    // State
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // Search and filter
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('');
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // Selected pharmacy for operations
    const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
    
    // Form data
    const [formData, setFormData] = useState<PharmacyFormData>({
        pharmacy_name: '',
        pharmacy_code: '',
        license_number: '',
        license_expiry_date: '',
        phone: '',
        email: '',
        location_in_branch: '',
        is_active: true,
        branch_id: ''
    });
    
    // Allocation form
    const [allocateBranchId, setAllocateBranchId] = useState('');
    
    // Inventory state for manage view
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);

    // Global Products (Inventory Items) state
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productFilterCategory, setProductFilterCategory] = useState('');
    const [showProductModal, setShowProductModal] = useState(false);
    const [showProductEditModal, setShowProductEditModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [productFormData, setProductFormData] = useState<ProductFormData>({
        supplier_id: '',
        item_code: '',
        barcode: '',
        item_name: '',
        generic_name: '',
        brand_name: '',
        category: '',
        unit: 'pcs',
        current_stock: 0,
        min_stock: 0,
        reorder_level: 10,
        reorder_quantity: 50,
        unit_cost: 0,
        unit_selling_price: 0,
        expiry_date: '',
        product_store_location: '',
        warranty_serial: '',
        warranty_duration: '',
        warranty_type: ''
    });

    // Branch-specific stock management state
    const [productFilterBranch, setProductFilterBranch] = useState('');
    const [showBranchStockModal, setShowBranchStockModal] = useState(false);
    const [branchStockList, setBranchStockList] = useState<BranchStockItem[]>([]);
    const [branchStockLoading, setBranchStockLoading] = useState(false);
    const [selectedBranchForEdit, setSelectedBranchForEdit] = useState<BranchStockItem | null>(null);
    const [branchStockFormData, setBranchStockFormData] = useState<BranchStockFormData>({
        branch_id: '',
        unit: 'pcs',
        current_stock: 0,
        min_stock: 0,
        reorder_level: 10,
        unit_cost: 0,
        unit_selling_price: 0,
        expiry_date: '',
        product_store_location: ''
    });

    // Supplier management state
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [supplierFilterType, setSupplierFilterType] = useState('');
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showSupplierEditModal, setShowSupplierEditModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [showSupplierDeleteConfirm, setShowSupplierDeleteConfirm] = useState(false);
    const [supplierFormData, setSupplierFormData] = useState<SupplierFormData>({
        supplier_name: '',
        contact_person: '',
        contact_number: '',
        contact_email: '',
        supplier_address: '',
        supplier_city: '',
        supplier_country: '',
        supplier_type: 'general',
        products_supplied: '',
        delivery_time: '',
        payment_terms: '',
        bank_details: '',
        rating: '',
        discounts_agreements: '',
        return_policy: '',
        note: ''
    });

    // Load data on mount
    useEffect(() => {
        loadPharmacies();
        loadBranches();
    }, []);

    // Auto-dismiss messages
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const loadPharmacies = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/v1/pharmacies');
            if (response.data.success) {
                setPharmacies(response.data.data.pharmacies || []);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load pharmacies');
        } finally {
            setLoading(false);
        }
    };

    const loadBranches = async () => {
        try {
            const response = await api.get('/api/v1/branches');
            if (response.data.success) {
                // API returns data directly as array, not as data.branches
                const branchData = Array.isArray(response.data.data) 
                    ? response.data.data 
                    : (response.data.data.branches || []);
                setBranches(branchData);
            }
        } catch (err) {
            console.error('Failed to load branches:', err);
        }
    };

    const loadPharmacyInventory = async (pharmacyId: number) => {
        try {
            setInventoryLoading(true);
            const response = await api.get(`/api/v1/pharmacies/${pharmacyId}/inventory`);
            if (response.data.success) {
                setInventory(response.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load inventory:', err);
            setInventory([]);
        } finally {
            setInventoryLoading(false);
        }
    };

    // Load global products (optionally with branch-specific stock data)
    const loadProducts = async (branchId?: string) => {
        try {
            setProductsLoading(true);
            const url = branchId 
                ? `/pharmacy/products-branch?branch_id=${branchId}`
                : '/pharmacy/products';
            const response = await api.get(url);
            if (response.data.status === 200 && response.data.products) {
                setProducts(response.data.products);
            }
        } catch (err: any) {
            console.error('Failed to load products:', err);
        } finally {
            setProductsLoading(false);
        }
    };

    // Load branch-specific stock for a product
    const loadProductBranchStock = async (productId: string) => {
        try {
            setBranchStockLoading(true);
            const response = await api.get(`/product/${productId}/branch-stock`);
            if (response.data.status === 200) {
                setBranchStockList(response.data.branch_stock || []);
            }
        } catch (err: any) {
            console.error('Failed to load branch stock:', err);
            setError('Failed to load branch stock data');
        } finally {
            setBranchStockLoading(false);
        }
    };

    // Open branch stock management modal
    const openBranchStockModal = (product: Product) => {
        setSelectedProduct(product);
        setShowBranchStockModal(true);
        loadProductBranchStock(product.id);
    };

    // Update branch stock
    const handleUpdateBranchStock = async () => {
        if (!selectedProduct || !branchStockFormData.branch_id) return;

        try {
            setBranchStockLoading(true);
            const response = await api.post(`/product/${selectedProduct.id}/branch-stock`, branchStockFormData);
            if (response.data.status === 200) {
                setSuccessMessage(response.data.message || 'Branch stock updated successfully');
                loadProductBranchStock(selectedProduct.id);
                setSelectedBranchForEdit(null);
                // Reload products if branch filter is active
                if (productFilterBranch) {
                    loadProducts(productFilterBranch);
                }
            } else {
                setError(response.data.message || 'Failed to update branch stock');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update branch stock');
        } finally {
            setBranchStockLoading(false);
        }
    };

    // Open edit form for a specific branch's stock
    const openBranchStockEdit = (branchStock: BranchStockItem) => {
        setSelectedBranchForEdit(branchStock);
        setBranchStockFormData({
            branch_id: branchStock.branch_id,
            unit: branchStock.unit || 'pcs',
            current_stock: branchStock.current_stock || 0,
            min_stock: branchStock.min_stock || 0,
            reorder_level: branchStock.reorder_level || 10,
            unit_cost: branchStock.unit_cost || 0,
            unit_selling_price: branchStock.unit_selling_price || 0,
            expiry_date: branchStock.expiry_date || '',
            product_store_location: branchStock.product_store_location || ''
        });
    };

    // Load suppliers for product form
    const loadSuppliers = async () => {
        try {
            const response = await api.get('/pharmacy/suppliers');
            if (response.data.status === 200 && response.data.suppliers) {
                setSuppliers(response.data.suppliers);
            }
        } catch (err) {
            console.error('Failed to load suppliers:', err);
        }
    };

    // Load products when inventory tab is active
    useEffect(() => {
        if (activeMainTab === 'inventory') {
            loadProducts(productFilterBranch || undefined);
            loadSuppliers();
        }
    }, [activeMainTab]);

    // Reload products when branch filter changes
    useEffect(() => {
        if (activeMainTab === 'inventory') {
            loadProducts(productFilterBranch || undefined);
        }
    }, [productFilterBranch]);

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = 
            product.item_name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            product.item_code?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            product.generic_name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            product.brand_name?.toLowerCase().includes(productSearchTerm.toLowerCase());
        
        const matchesCategory = !productFilterCategory || product.category === productFilterCategory;
        
        return matchesSearch && matchesCategory;
    });

    // Get unique categories from products
    const productCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

    // Reset product form
    const resetProductForm = () => {
        setProductFormData({
            supplier_id: '',
            item_code: '',
            barcode: '',
            item_name: '',
            generic_name: '',
            brand_name: '',
            category: '',
            unit: 'pcs',
            current_stock: 0,
            min_stock: 0,
            reorder_level: 10,
            reorder_quantity: 50,
            unit_cost: 0,
            unit_selling_price: 0,
            expiry_date: '',
            product_store_location: '',
            warranty_serial: '',
            warranty_duration: '',
            warranty_type: ''
        });
    };

    // Create new product
    const handleCreateProduct = async () => {
        if (!productFormData.supplier_id || !productFormData.item_code || !productFormData.item_name) {
            setError('Supplier, Item Code, and Item Name are required');
            return;
        }

        try {
            setProductsLoading(true);
            const response = await api.post('/pharmacy/products', productFormData);
            if (response.data.status === 200) {
                setSuccessMessage('Product created successfully and synced to all pharmacies');
                setShowProductModal(false);
                resetProductForm();
                loadProducts();
            } else {
                setError(response.data.message || 'Failed to create product');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create product');
        } finally {
            setProductsLoading(false);
        }
    };

    // Update product
    const handleUpdateProduct = async () => {
        if (!selectedProduct) return;

        try {
            setProductsLoading(true);
            const response = await api.post(`/pharmacy/products/${selectedProduct.id}`, productFormData);
            if (response.data.status === 200) {
                setSuccessMessage('Product updated successfully');
                setShowProductEditModal(false);
                setSelectedProduct(null);
                resetProductForm();
                loadProducts();
            } else {
                setError(response.data.message || 'Failed to update product');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update product');
        } finally {
            setProductsLoading(false);
        }
    };

    // Open product edit modal
    const openProductEditModal = (product: Product) => {
        setSelectedProduct(product);
        setProductFormData({
            supplier_id: product.supplier_id || '',
            item_code: product.item_code || '',
            barcode: product.barcode || '',
            item_name: product.item_name || '',
            generic_name: product.generic_name || '',
            brand_name: product.brand_name || '',
            category: product.category || '',
            unit: product.unit || 'pcs',
            current_stock: product.current_stock || 0,
            min_stock: product.min_stock || 0,
            reorder_level: product.reorder_level || 10,
            reorder_quantity: product.reorder_quantity || 50,
            unit_cost: product.unit_cost || 0,
            unit_selling_price: product.unit_selling_price || 0,
            expiry_date: product.expiry_date || '',
            product_store_location: product.product_store_location || '',
            warranty_serial: product.warranty_serial || '',
            warranty_duration: product.warranty_duration || '',
            warranty_type: product.warranty_type || ''
        });
        setShowProductEditModal(true);
    };

    // Product stats
    const productStats = {
        total: products.length,
        inStock: products.filter(p => (p.current_stock || 0) > (p.min_stock || 0)).length,
        lowStock: products.filter(p => (p.current_stock || 0) <= (p.min_stock || 0) && (p.current_stock || 0) > 0).length,
        outOfStock: products.filter(p => (p.current_stock || 0) === 0).length
    };

    // ========== SUPPLIER MANAGEMENT FUNCTIONS ==========
    
    // Load suppliers when tab is active
    useEffect(() => {
        if (activeMainTab === 'suppliers') {
            loadSuppliersForTab();
        }
    }, [activeMainTab]);

    // Load suppliers for supplier tab (reuse existing suppliers state)
    const loadSuppliersForTab = async () => {
        try {
            setSuppliersLoading(true);
            const response = await api.get('/pharmacy/suppliers');
            if (response.data.status === 200 && response.data.suppliers) {
                setSuppliers(response.data.suppliers);
            }
        } catch (err) {
            console.error('Failed to load suppliers:', err);
            setError('Failed to load suppliers');
        } finally {
            setSuppliersLoading(false);
        }
    };

    // Filter suppliers
    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch = 
            supplier.supplier_name?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
            supplier.contact_person?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
            supplier.supplier_city?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
            supplier.contact_email?.toLowerCase().includes(supplierSearchTerm.toLowerCase());
        
        const matchesType = !supplierFilterType || supplier.supplier_type === supplierFilterType;
        
        return matchesSearch && matchesType;
    });

    // Get unique supplier types
    const supplierTypes = [...new Set(suppliers.map(s => s.supplier_type).filter(Boolean))].sort();

    // Reset supplier form
    const resetSupplierForm = () => {
        setSupplierFormData({
            supplier_name: '',
            contact_person: '',
            contact_number: '',
            contact_email: '',
            supplier_address: '',
            supplier_city: '',
            supplier_country: '',
            supplier_type: 'general',
            products_supplied: '',
            delivery_time: '',
            payment_terms: '',
            bank_details: '',
            rating: '',
            discounts_agreements: '',
            return_policy: '',
            note: ''
        });
    };

    // Create supplier
    const handleCreateSupplier = async () => {
        if (!supplierFormData.supplier_name) {
            setError('Supplier name is required');
            return;
        }

        try {
            setSuppliersLoading(true);
            const response = await api.post('/pharmacy/suppliers', supplierFormData);
            if (response.data.status === 200) {
                setSuccessMessage('Supplier created successfully');
                setShowSupplierModal(false);
                resetSupplierForm();
                loadSuppliersForTab();
                loadSuppliers(); // Also reload for product form dropdown
            } else {
                setError(response.data.message || 'Failed to create supplier');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create supplier');
        } finally {
            setSuppliersLoading(false);
        }
    };

    // Update supplier
    const handleUpdateSupplier = async () => {
        if (!selectedSupplier) return;

        try {
            setSuppliersLoading(true);
            const response = await api.post(`/pharmacy/suppliers/${selectedSupplier.id}`, supplierFormData);
            if (response.data.status === 200) {
                setSuccessMessage('Supplier updated successfully');
                setShowSupplierEditModal(false);
                setSelectedSupplier(null);
                resetSupplierForm();
                loadSuppliersForTab();
                loadSuppliers();
            } else {
                setError(response.data.message || 'Failed to update supplier');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update supplier');
        } finally {
            setSuppliersLoading(false);
        }
    };

    // Delete supplier
    const handleDeleteSupplier = async () => {
        if (!selectedSupplier) return;

        try {
            setSuppliersLoading(true);
            const response = await api.delete(`/delete-supplier/${selectedSupplier.id}`);
            if (response.data.status === 200) {
                setSuccessMessage('Supplier deleted successfully');
                setShowSupplierDeleteConfirm(false);
                setSelectedSupplier(null);
                loadSuppliersForTab();
                loadSuppliers();
            } else {
                setError(response.data.message || 'Failed to delete supplier');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete supplier');
        } finally {
            setSuppliersLoading(false);
        }
    };

    // Open supplier edit modal
    const openSupplierEditModal = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setSupplierFormData({
            supplier_name: supplier.supplier_name || '',
            contact_person: supplier.contact_person || '',
            contact_number: supplier.contact_number || '',
            contact_email: supplier.contact_email || '',
            supplier_address: supplier.supplier_address || '',
            supplier_city: supplier.supplier_city || '',
            supplier_country: (supplier as any).supplier_country || '',
            supplier_type: supplier.supplier_type || 'general',
            products_supplied: (supplier as any).products_supplied || '',
            delivery_time: (supplier as any).delivery_time || '',
            payment_terms: (supplier as any).payment_terms || '',
            bank_details: (supplier as any).bank_details || '',
            rating: (supplier as any).rating || '',
            discounts_agreements: (supplier as any).discounts_agreements || '',
            return_policy: (supplier as any).return_policy || '',
            note: (supplier as any).note || ''
        });
        setShowSupplierEditModal(true);
    };

    // Supplier stats
    const supplierStats = {
        total: suppliers.length,
        pharmaceutical: suppliers.filter(s => s.supplier_type === 'pharmaceutical').length,
        medical: suppliers.filter(s => s.supplier_type === 'medical').length,
        general: suppliers.filter(s => s.supplier_type === 'general' || !s.supplier_type).length
    };

    // ========== END SUPPLIER MANAGEMENT ==========

    // Filter pharmacies
    const filteredPharmacies = pharmacies.filter(pharmacy => {
        const matchesSearch = 
            pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pharmacy.pharmacy_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (pharmacy.branch?.center_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesBranch = !filterBranch || pharmacy.branch_id === filterBranch;
        const matchesStatus = !filterStatus || pharmacy.status === filterStatus;
        
        return matchesSearch && matchesBranch && matchesStatus;
    });

    // Reset form
    const resetForm = () => {
        setFormData({
            pharmacy_name: '',
            pharmacy_code: '',
            license_number: '',
            license_expiry_date: '',
            phone: '',
            email: '',
            location_in_branch: '',
            is_active: true,
            branch_id: ''
        });
    };

    // Create pharmacy
    const handleCreate = async () => {
        if (!formData.pharmacy_name || !formData.pharmacy_code) {
            setError('Pharmacy name and code are required');
            return;
        }

        try {
            setLoading(true);
            const payload: any = {
                ...formData,
                name: formData.pharmacy_name,
                location: formData.location_in_branch,
                contact_number: formData.phone,
                status: formData.is_active ? 'active' : 'inactive'
            };

            // If no branch selected, create without branch assignment
            if (!formData.branch_id) {
                delete payload.branch_id;
            }

            const response = await api.post('/api/v1/pharmacies', payload);
            if (response.data.success) {
                setSuccessMessage('Pharmacy created successfully');
                setShowCreateModal(false);
                resetForm();
                loadPharmacies();
            }
        } catch (err: any) {
            setError(err.response?.data?.errors?.pharmacy_code?.[0] || 
                     err.response?.data?.message || 
                     'Failed to create pharmacy');
        } finally {
            setLoading(false);
        }
    };

    // Update pharmacy
    const handleUpdate = async () => {
        if (!selectedPharmacy) return;

        try {
            setLoading(true);
            const payload = {
                ...formData,
                name: formData.pharmacy_name,
                location: formData.location_in_branch,
                contact_number: formData.phone,
                status: formData.is_active ? 'active' : 'inactive'
            };

            const response = await api.put(`/api/v1/pharmacies/${selectedPharmacy.id}`, payload);
            if (response.data.success) {
                setSuccessMessage('Pharmacy updated successfully');
                setShowEditModal(false);
                setSelectedPharmacy(null);
                resetForm();
                loadPharmacies();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update pharmacy');
        } finally {
            setLoading(false);
        }
    };

    // Allocate pharmacy to branch
    const handleAllocate = async () => {
        if (!selectedPharmacy || !allocateBranchId) {
            setError('Please select a branch');
            return;
        }

        try {
            setLoading(true);
            const response = await api.put(`/api/v1/pharmacies/${selectedPharmacy.id}`, {
                branch_id: allocateBranchId
            });
            if (response.data.success) {
                setSuccessMessage(`Pharmacy allocated to branch successfully`);
                setShowAllocateModal(false);
                setSelectedPharmacy(null);
                setAllocateBranchId('');
                loadPharmacies();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to allocate pharmacy');
        } finally {
            setLoading(false);
        }
    };

    // Toggle pharmacy status
    const handleToggleStatus = async (pharmacy: Pharmacy) => {
        try {
            const newStatus = pharmacy.status === 'active' ? 'inactive' : 'active';
            const response = await api.put(`/api/v1/pharmacies/${pharmacy.id}`, {
                is_active: newStatus === 'active'
            });
            if (response.data.success) {
                setSuccessMessage(`Pharmacy ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
                loadPharmacies();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update pharmacy status');
        }
    };

    // Delete pharmacy
    const handleDelete = async () => {
        if (!selectedPharmacy) return;

        // Check if pharmacy has inventory
        if ((selectedPharmacy.inventory_count || 0) > 0) {
            setError('Cannot delete pharmacy with active inventory. Please disable it instead.');
            setShowDeleteConfirm(false);
            return;
        }

        try {
            setLoading(true);
            const response = await api.delete(`/api/v1/pharmacies/${selectedPharmacy.id}`);
            if (response.data.success) {
                setSuccessMessage('Pharmacy deleted successfully');
                setShowDeleteConfirm(false);
                setSelectedPharmacy(null);
                loadPharmacies();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete pharmacy');
        } finally {
            setLoading(false);
        }
    };

    // Open edit modal with pharmacy data
    const openEditModal = (pharmacy: Pharmacy) => {
        setSelectedPharmacy(pharmacy);
        setFormData({
            pharmacy_name: pharmacy.name,
            pharmacy_code: pharmacy.pharmacy_code,
            license_number: pharmacy.license_number || '',
            license_expiry_date: pharmacy.license_expiry_date || '',
            phone: pharmacy.phone || '',
            email: pharmacy.email || '',
            location_in_branch: pharmacy.location || '',
            is_active: pharmacy.status === 'active',
            branch_id: pharmacy.branch_id || ''
        });
        setShowEditModal(true);
    };

    // Open allocate modal
    const openAllocateModal = (pharmacy: Pharmacy) => {
        setSelectedPharmacy(pharmacy);
        setAllocateBranchId(pharmacy.branch_id || '');
        setShowAllocateModal(true);
    };

    // Open manage modal
    const openManageModal = (pharmacy: Pharmacy) => {
        setSelectedPharmacy(pharmacy);
        loadPharmacyInventory(pharmacy.id);
        setShowManageModal(true);
    };

    // Stats calculation
    const stats = {
        total: pharmacies.length,
        active: pharmacies.filter(p => p.status === 'active').length,
        inactive: pharmacies.filter(p => p.status === 'inactive').length,
        unassigned: pharmacies.filter(p => !p.branch_id).length,
        lowStock: pharmacies.reduce((sum, p) => sum + (p.low_stock_count || 0), 0)
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pharmacy Management</h1>
                    <p className="text-gray-500 mt-1">Centralized control for all pharmacy operations</p>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveMainTab('pharmacies')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                            activeMainTab === 'pharmacies'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Building2 className="w-5 h-5" />
                        Pharmacies
                    </button>
                    <button
                        onClick={() => setActiveMainTab('inventory')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                            activeMainTab === 'inventory'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Box className="w-5 h-5" />
                        Inventory Items
                    </button>
                    <button
                        onClick={() => setActiveMainTab('suppliers')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                            activeMainTab === 'suppliers'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Truck className="w-5 h-5" />
                        Suppliers
                    </button>
                </nav>
            </div>

            {/* Messages */}
            {successMessage && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                    <Check className="w-5 h-5" />
                    {successMessage}
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Tab Content */}
            {activeMainTab === 'pharmacies' && (
                <>
                    {/* Pharmacy Header with Create Button */}
                    <div className="flex items-center justify-end">
                        <button
                            onClick={() => {
                                resetForm();
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all shadow-md"
                        >
                            <Plus className="w-5 h-5" />
                            Create Pharmacy
                        </button>
                    </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Pharmacies</p>
                            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Check className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active</p>
                            <p className="text-xl font-bold text-emerald-600">{stats.active}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Inactive</p>
                            <p className="text-xl font-bold text-gray-600">{stats.inactive}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <MapPin className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Unassigned</p>
                            <p className="text-xl font-bold text-amber-600">{stats.unassigned}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Low Stock Items</p>
                            <p className="text-xl font-bold text-red-600">{stats.lowStock}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search pharmacies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <select
                        value={filterBranch}
                        onChange={(e) => setFilterBranch(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">All Branches</option>
                        <option value="unassigned">Unassigned</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as '' | 'active' | 'inactive')}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button
                        onClick={loadPharmacies}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Pharmacies Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : filteredPharmacies.length === 0 ? (
                    <div className="text-center py-12">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No pharmacies found</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                            Create your first pharmacy
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Pharmacy
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Branch
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Inventory
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredPharmacies.map((pharmacy) => (
                                    <tr key={pharmacy.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{pharmacy.name}</p>
                                                <p className="text-sm text-gray-500">{pharmacy.pharmacy_code}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {pharmacy.branch ? (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-700">{pharmacy.branch.center_name}</span>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                    Unassigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(pharmacy)}
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    pharmacy.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {pharmacy.status === 'active' ? (
                                                    <Check className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <X className="w-3 h-3 mr-1" />
                                                )}
                                                {pharmacy.status}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1">
                                                    <Package className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-700">{pharmacy.inventory_count || 0} items</span>
                                                </div>
                                                {(pharmacy.low_stock_count || 0) > 0 && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        {pharmacy.low_stock_count} low
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                {pharmacy.phone && (
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <Phone className="w-3 h-3" />
                                                        {pharmacy.phone}
                                                    </div>
                                                )}
                                                {pharmacy.email && (
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <Mail className="w-3 h-3" />
                                                        {pharmacy.email}
                                                    </div>
                                                )}
                                                {!pharmacy.phone && !pharmacy.email && (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openManageModal(pharmacy)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Manage Pharmacy"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(pharmacy)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openAllocateModal(pharmacy)}
                                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="Allocate to Branch"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedPharmacy(pharmacy);
                                                        setShowDeleteConfirm(true);
                                                    }}
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
                    </div>
                )}
            </div>
                </>
            )}

            {/* Inventory Tab - Full Implementation */}
            {activeMainTab === 'inventory' && (
                <>
                    {/* Header with Create Button */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500">Manage global inventory items across all pharmacies</p>
                        </div>
                        <button
                            onClick={() => {
                                resetProductForm();
                                setShowProductModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all shadow-md"
                        >
                            <Plus className="w-5 h-5" />
                            Add Inventory Item
                        </button>
                    </div>

                    {/* Product Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Box className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Items</p>
                                    <p className="text-xl font-bold text-gray-900">{productStats.total}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <Check className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">In Stock</p>
                                    <p className="text-xl font-bold text-emerald-600">{productStats.inStock}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <TrendingDown className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Low Stock</p>
                                    <p className="text-xl font-bold text-amber-600">{productStats.lowStock}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Out of Stock</p>
                                    <p className="text-xl font-bold text-red-600">{productStats.outOfStock}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, code, or brand..."
                                        value={productSearchTerm}
                                        onChange={(e) => setProductSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <select
                                value={productFilterBranch}
                                onChange={(e) => setProductFilterBranch(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">All Branches (Global)</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.center_name} {branch.city ? `- ${branch.city}` : ''}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={productFilterCategory}
                                onChange={(e) => setProductFilterCategory(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">All Categories</option>
                                {productCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => loadProducts(productFilterBranch || undefined)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                        {productFilterBranch && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
                                <Building2 className="w-4 h-4" />
                                <span>
                                    Showing stock & pricing for: <strong>{branches.find(b => b.id === productFilterBranch)?.center_name || 'Selected Branch'}</strong>
                                </span>
                                <button
                                    onClick={() => setProductFilterBranch('')}
                                    className="ml-auto text-blue-600 hover:text-blue-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Products Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {productsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-12">
                                <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No inventory items found</p>
                                <button
                                    onClick={() => setShowProductModal(true)}
                                    className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                                >
                                    Add your first item
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Stock</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cost</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredProducts.slice(0, 50).map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{product.item_name}</p>
                                                        <p className="text-xs text-gray-500">{product.generic_name || product.brand_name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-mono text-gray-600">{product.item_code}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                        {product.category || 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {product.supplier_name || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`font-medium ${
                                                        (product.current_stock || 0) === 0 ? 'text-red-600' :
                                                        (product.current_stock || 0) <= (product.min_stock || 0) ? 'text-amber-600' :
                                                        'text-gray-900'
                                                    }`}>
                                                        {product.current_stock || 0} {product.unit}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-gray-600">
                                                    Rs. {Number(product.unit_cost || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                                    Rs. {Number(product.unit_selling_price || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {(product.current_stock || 0) === 0 ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Out</span>
                                                    ) : (product.current_stock || 0) <= (product.min_stock || 0) ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">Low</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">OK</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openBranchStockModal(product)}
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                            title="Manage Branch Stock"
                                                        >
                                                            <Building2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openProductEditModal(product)}
                                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Edit Item"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredProducts.length > 50 && (
                                    <div className="px-4 py-3 text-center text-sm text-gray-500 bg-gray-50 border-t">
                                        Showing first 50 of {filteredProducts.length} items
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Product Create Modal */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Add New Inventory Item</h2>
                            <p className="text-sm text-gray-500 mt-1">This item will be available across all pharmacies</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Supplier Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Supplier <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={productFormData.supplier_id}
                                    onChange={(e) => setProductFormData({ ...productFormData, supplier_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.supplier_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Item Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={productFormData.item_code}
                                        onChange={(e) => setProductFormData({ ...productFormData, item_code: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g., ITM001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                                    <input
                                        type="text"
                                        value={productFormData.barcode}
                                        onChange={(e) => setProductFormData({ ...productFormData, barcode: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Barcode"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={productFormData.category}
                                        onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g., Medicine"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Item Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={productFormData.item_name}
                                        onChange={(e) => setProductFormData({ ...productFormData, item_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Item name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                                    <input
                                        type="text"
                                        value={productFormData.generic_name}
                                        onChange={(e) => setProductFormData({ ...productFormData, generic_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Generic name"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                                    <input
                                        type="text"
                                        value={productFormData.brand_name}
                                        onChange={(e) => setProductFormData({ ...productFormData, brand_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Brand name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <select
                                        value={productFormData.unit}
                                        onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="pcs">Pieces</option>
                                        <option value="box">Box</option>
                                        <option value="bottle">Bottle</option>
                                        <option value="pack">Pack</option>
                                        <option value="strip">Strip</option>
                                        <option value="tablet">Tablet</option>
                                        <option value="capsule">Capsule</option>
                                        <option value="ml">ML</option>
                                        <option value="kg">KG</option>
                                        <option value="g">Gram</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                                    <input
                                        type="number"
                                        value={productFormData.current_stock}
                                        onChange={(e) => setProductFormData({ ...productFormData, current_stock: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                                    <input
                                        type="number"
                                        value={productFormData.min_stock}
                                        onChange={(e) => setProductFormData({ ...productFormData, min_stock: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                                    <input
                                        type="number"
                                        value={productFormData.reorder_level}
                                        onChange={(e) => setProductFormData({ ...productFormData, reorder_level: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Qty</label>
                                    <input
                                        type="number"
                                        value={productFormData.reorder_quantity}
                                        onChange={(e) => setProductFormData({ ...productFormData, reorder_quantity: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (Rs.)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={productFormData.unit_cost}
                                        onChange={(e) => setProductFormData({ ...productFormData, unit_cost: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (Rs.)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={productFormData.unit_selling_price}
                                        onChange={(e) => setProductFormData({ ...productFormData, unit_selling_price: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={productFormData.expiry_date}
                                        onChange={(e) => setProductFormData({ ...productFormData, expiry_date: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
                                <input
                                    type="text"
                                    value={productFormData.product_store_location}
                                    onChange={(e) => setProductFormData({ ...productFormData, product_store_location: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g., Shelf A, Row 3"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowProductModal(false);
                                    resetProductForm();
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProduct}
                                disabled={productsLoading}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50"
                            >
                                {productsLoading ? 'Creating...' : 'Create Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Edit Modal */}
            {showProductEditModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Edit Inventory Item</h2>
                            <p className="text-sm text-gray-500 mt-1">Changes will reflect across all pharmacies</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Same form fields as create, but for editing */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                                <select
                                    value={productFormData.supplier_id}
                                    onChange={(e) => setProductFormData({ ...productFormData, supplier_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.supplier_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
                                    <input
                                        type="text"
                                        value={productFormData.item_code}
                                        disabled
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={productFormData.category}
                                        onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <select
                                        value={productFormData.unit}
                                        onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="pcs">Pieces</option>
                                        <option value="box">Box</option>
                                        <option value="bottle">Bottle</option>
                                        <option value="pack">Pack</option>
                                        <option value="strip">Strip</option>
                                        <option value="tablet">Tablet</option>
                                        <option value="capsule">Capsule</option>
                                        <option value="ml">ML</option>
                                        <option value="kg">KG</option>
                                        <option value="g">Gram</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                    <input
                                        type="text"
                                        value={productFormData.item_name}
                                        onChange={(e) => setProductFormData({ ...productFormData, item_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                                    <input
                                        type="text"
                                        value={productFormData.generic_name}
                                        onChange={(e) => setProductFormData({ ...productFormData, generic_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                                    <input
                                        type="number"
                                        value={productFormData.min_stock}
                                        onChange={(e) => setProductFormData({ ...productFormData, min_stock: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                                    <input
                                        type="number"
                                        value={productFormData.reorder_level}
                                        onChange={(e) => setProductFormData({ ...productFormData, reorder_level: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={productFormData.unit_cost}
                                        onChange={(e) => setProductFormData({ ...productFormData, unit_cost: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={productFormData.unit_selling_price}
                                        onChange={(e) => setProductFormData({ ...productFormData, unit_selling_price: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
                                <input
                                    type="text"
                                    value={productFormData.product_store_location}
                                    onChange={(e) => setProductFormData({ ...productFormData, product_store_location: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowProductEditModal(false);
                                    setSelectedProduct(null);
                                    resetProductForm();
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateProduct}
                                disabled={productsLoading}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50"
                            >
                                {productsLoading ? 'Updating...' : 'Update Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Branch Stock Management Modal */}
            {showBranchStockModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Branch Stock Management</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {selectedProduct.item_name} ({selectedProduct.item_code})
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowBranchStockModal(false);
                                        setSelectedProduct(null);
                                        setSelectedBranchForEdit(null);
                                        setBranchStockList([]);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {branchStockLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                                </div>
                            ) : selectedBranchForEdit ? (
                                /* Edit Form for selected branch */
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <button
                                            onClick={() => setSelectedBranchForEdit(null)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <h3 className="font-semibold text-gray-900">
                                            Edit Stock for: {selectedBranchForEdit.branch_name}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                                            <input
                                                type="number"
                                                value={branchStockFormData.current_stock}
                                                onChange={(e) => setBranchStockFormData({ ...branchStockFormData, current_stock: Number(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                                            <input
                                                type="number"
                                                value={branchStockFormData.min_stock}
                                                onChange={(e) => setBranchStockFormData({ ...branchStockFormData, min_stock: Number(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (Rs.)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={branchStockFormData.unit_cost}
                                                onChange={(e) => setBranchStockFormData({ ...branchStockFormData, unit_cost: Number(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (Rs.)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={branchStockFormData.unit_selling_price}
                                                onChange={(e) => setBranchStockFormData({ ...branchStockFormData, unit_selling_price: Number(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                            <select
                                                value={branchStockFormData.unit}
                                                onChange={(e) => setBranchStockFormData({ ...branchStockFormData, unit: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="pcs">Pieces</option>
                                                <option value="box">Box</option>
                                                <option value="bottle">Bottle</option>
                                                <option value="pack">Pack</option>
                                                <option value="strip">Strip</option>
                                                <option value="tablet">Tablet</option>
                                                <option value="capsule">Capsule</option>
                                                <option value="ml">ML</option>
                                                <option value="kg">KG</option>
                                                <option value="g">Gram</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                                            <input
                                                type="number"
                                                value={branchStockFormData.reorder_level}
                                                onChange={(e) => setBranchStockFormData({ ...branchStockFormData, reorder_level: Number(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
                                            <input
                                                type="text"
                                                value={branchStockFormData.product_store_location}
                                                onChange={(e) => setBranchStockFormData({ ...branchStockFormData, product_store_location: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            onClick={() => setSelectedBranchForEdit(null)}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdateBranchStock}
                                            disabled={branchStockLoading}
                                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50"
                                        >
                                            {branchStockLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Branch Stock List */
                                <div className="space-y-4">
                                    <div className="text-sm text-gray-500 mb-4">
                                        Click on a branch to set specific stock levels and pricing for that location.
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {branchStockList.map((branchStock) => (
                                            <div
                                                key={branchStock.branch_id}
                                                onClick={() => openBranchStockEdit(branchStock)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                                                    branchStock.has_stock 
                                                        ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400' 
                                                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-400'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className={`w-5 h-5 ${branchStock.has_stock ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                        <span className="font-semibold text-gray-900">{branchStock.branch_name}</span>
                                                    </div>
                                                    {branchStock.has_stock ? (
                                                        <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">Configured</span>
                                                    ) : (
                                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Not Set</span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500 mb-3">{branchStock.city || 'No location'}</div>
                                                
                                                {branchStock.has_stock ? (
                                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                                        <div>
                                                            <p className="text-gray-500">Stock</p>
                                                            <p className={`font-semibold ${
                                                                branchStock.current_stock === 0 ? 'text-red-600' :
                                                                branchStock.current_stock <= branchStock.min_stock ? 'text-amber-600' :
                                                                'text-gray-900'
                                                            }`}>
                                                                {branchStock.current_stock} {branchStock.unit}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Cost</p>
                                                            <p className="font-semibold text-gray-900">Rs. {Number(branchStock.unit_cost || 0).toFixed(2)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Price</p>
                                                            <p className="font-semibold text-emerald-600">Rs. {Number(branchStock.unit_selling_price || 0).toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">Click to set stock & pricing</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {branchStockList.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p>No branches available</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Suppliers Tab - Full Implementation */}
            {activeMainTab === 'suppliers' && (
                <>
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Supplier Management</h2>
                            <p className="text-gray-500">Manage all suppliers across all branches</p>
                        </div>
                        <button
                            onClick={() => {
                                resetSupplierForm();
                                setShowSupplierModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all shadow-md"
                        >
                            <Plus className="w-5 h-5" />
                            Add Supplier
                        </button>
                    </div>

                    {/* Supplier Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Truck className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Suppliers</p>
                                    <p className="text-xl font-bold text-gray-900">{supplierStats.total}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Package className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Pharmaceutical</p>
                                    <p className="text-xl font-bold text-purple-600">{supplierStats.pharmaceutical}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <Box className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Medical Equipment</p>
                                    <p className="text-xl font-bold text-emerald-600">{supplierStats.medical}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Settings className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">General</p>
                                    <p className="text-xl font-bold text-gray-600">{supplierStats.general}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search suppliers..."
                                        value={supplierSearchTerm}
                                        onChange={(e) => setSupplierSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <select
                                value={supplierFilterType}
                                onChange={(e) => setSupplierFilterType(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">All Types</option>
                                <option value="pharmaceutical">Pharmaceutical</option>
                                <option value="medical">Medical Equipment</option>
                                <option value="general">General</option>
                                {supplierTypes.filter(t => !['pharmaceutical', 'medical', 'general'].includes(t)).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <button
                                onClick={loadSuppliersForTab}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${suppliersLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Suppliers Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {suppliersLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                            </div>
                        ) : filteredSuppliers.length === 0 ? (
                            <div className="text-center py-12">
                                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No suppliers found</p>
                                <button
                                    onClick={() => setShowSupplierModal(true)}
                                    className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                                >
                                    Add your first supplier
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact Person</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact Info</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredSuppliers.map((supplier) => (
                                            <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <Truck className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{supplier.supplier_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {supplier.contact_person || '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm space-y-1">
                                                        {supplier.contact_number && (
                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                <Phone className="w-3 h-3" />
                                                                {supplier.contact_number}
                                                            </div>
                                                        )}
                                                        {supplier.contact_email && (
                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                <Mail className="w-3 h-3" />
                                                                {supplier.contact_email}
                                                            </div>
                                                        )}
                                                        {!supplier.contact_number && !supplier.contact_email && '—'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-gray-600">
                                                        {supplier.supplier_city && (
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {supplier.supplier_city}
                                                            </div>
                                                        )}
                                                        {supplier.supplier_address && (
                                                            <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">{supplier.supplier_address}</p>
                                                        )}
                                                        {!supplier.supplier_city && !supplier.supplier_address && '—'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        supplier.supplier_type === 'pharmaceutical' ? 'bg-purple-100 text-purple-700' :
                                                        supplier.supplier_type === 'medical' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {supplier.supplier_type || 'General'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openSupplierEditModal(supplier)}
                                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSupplier(supplier);
                                                                setShowSupplierDeleteConfirm(true);
                                                            }}
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
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Supplier Create Modal */}
            {showSupplierModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Add New Supplier</h2>
                            <p className="text-sm text-gray-500 mt-1">Create a new supplier for all pharmacies</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Column 1 - Basic Information */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide border-b pb-2">Basic Information</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Supplier Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={supplierFormData.supplier_name}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Full name of the supplier company"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.contact_person}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_person: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Name of primary contact person"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.contact_number}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_number: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Phone number for reaching the supplier"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={supplierFormData.contact_email}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Contact email for communication"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.supplier_address}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_address: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Full address of the supplier's main office"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City/Region</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.supplier_city}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_city: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="City or region"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.supplier_country}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_country: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Supplier's country of origin"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Type</label>
                                        <select
                                            value={supplierFormData.supplier_type}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="general">General</option>
                                            <option value="pharmaceutical">Pharmaceutical</option>
                                            <option value="medical">Medical Equipment</option>
                                            <option value="laboratory">Laboratory</option>
                                            <option value="consumables">Consumables</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Products Supplied</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.products_supplied}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, products_supplied: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="List or reference to products supplied"
                                        />
                                    </div>
                                </div>
                                
                                {/* Column 2 - Business Terms */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide border-b pb-2">Business Terms</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.delivery_time}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, delivery_time: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Average delivery time (e.g., 3 days)"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.payment_terms}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, payment_terms: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Terms for payments (e.g., Net 30)"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Details</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.bank_details}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, bank_details: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Optional account details for payments"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.rating}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, rating: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Supplier rating based on performance"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discounts/Agreements</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.discounts_agreements}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, discounts_agreements: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Any discounts or special agreements"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Return Policy</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.return_policy}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, return_policy: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Policy regarding returns of products"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                        <textarea
                                            value={supplierFormData.note}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, note: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 h-24"
                                            placeholder="Any additional notes or comments"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowSupplierModal(false);
                                    resetSupplierForm();
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateSupplier}
                                disabled={suppliersLoading}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50"
                            >
                                {suppliersLoading ? 'Creating...' : 'Create Supplier'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Supplier Edit Modal */}
            {showSupplierEditModal && selectedSupplier && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Edit Supplier</h2>
                            <p className="text-sm text-gray-500 mt-1">Update supplier information</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Column 1 - Basic Information */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide border-b pb-2">Basic Information</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Supplier Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={supplierFormData.supplier_name}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Full name of the supplier company"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.contact_person}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_person: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Name of primary contact person"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.contact_number}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_number: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Phone number for reaching the supplier"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={supplierFormData.contact_email}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Contact email for communication"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.supplier_address}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_address: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Full address of the supplier's main office"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City/Region</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.supplier_city}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_city: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="City or region"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.supplier_country}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_country: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Supplier's country of origin"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Type</label>
                                        <select
                                            value={supplierFormData.supplier_type}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="general">General</option>
                                            <option value="pharmaceutical">Pharmaceutical</option>
                                            <option value="medical">Medical Equipment</option>
                                            <option value="laboratory">Laboratory</option>
                                            <option value="consumables">Consumables</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Products Supplied</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.products_supplied}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, products_supplied: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="List or reference to products supplied"
                                        />
                                    </div>
                                </div>
                                
                                {/* Column 2 - Business Terms */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide border-b pb-2">Business Terms</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.delivery_time}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, delivery_time: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Average delivery time (e.g., 3 days)"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.payment_terms}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, payment_terms: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Terms for payments (e.g., Net 30)"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Details</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.bank_details}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, bank_details: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Optional account details for payments"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.rating}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, rating: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Supplier rating based on performance"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discounts/Agreements</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.discounts_agreements}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, discounts_agreements: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Any discounts or special agreements"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Return Policy</label>
                                        <input
                                            type="text"
                                            value={supplierFormData.return_policy}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, return_policy: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Policy regarding returns of products"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                        <textarea
                                            value={supplierFormData.note}
                                            onChange={(e) => setSupplierFormData({ ...supplierFormData, note: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 h-24"
                                            placeholder="Any additional notes or comments"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowSupplierEditModal(false);
                                    setSelectedSupplier(null);
                                    resetSupplierForm();
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateSupplier}
                                disabled={suppliersLoading}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50"
                            >
                                {suppliersLoading ? 'Updating...' : 'Update Supplier'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Supplier Delete Confirmation */}
            {showSupplierDeleteConfirm && selectedSupplier && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md m-4">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Supplier</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <strong>{selectedSupplier.supplier_name}</strong>? 
                                This will remove all associated data.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowSupplierDeleteConfirm(false);
                                        setSelectedSupplier(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteSupplier}
                                    disabled={suppliersLoading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {suppliersLoading ? 'Deleting...' : 'Delete Supplier'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {showCreateModal ? 'Create New Pharmacy' : 'Edit Pharmacy'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pharmacy Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.pharmacy_name}
                                        onChange={(e) => setFormData({ ...formData, pharmacy_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Enter pharmacy name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pharmacy Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.pharmacy_code}
                                        onChange={(e) => setFormData({ ...formData, pharmacy_code: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g., PHM001"
                                        disabled={showEditModal}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        License Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.license_number}
                                        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="License number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        License Expiry Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.license_expiry_date}
                                        onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Phone number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Email address"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location in Branch
                                </label>
                                <input
                                    type="text"
                                    value={formData.location_in_branch}
                                    onChange={(e) => setFormData({ ...formData, location_in_branch: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g., Ground Floor, Building A"
                                />
                            </div>

                            {showCreateModal && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Assign to Branch (Optional)
                                    </label>
                                    <select
                                        value={formData.branch_id}
                                        onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Leave Unassigned</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        You can assign a branch later from the allocation menu
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">
                                    Active Status
                                </label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setShowEditModal(false);
                                    setSelectedPharmacy(null);
                                    resetForm();
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={showCreateModal ? handleCreate : handleUpdate}
                                disabled={loading}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : showCreateModal ? 'Create Pharmacy' : 'Update Pharmacy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Allocate Modal */}
            {showAllocateModal && selectedPharmacy && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md m-4">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Allocate Pharmacy to Branch</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">Pharmacy</p>
                                <p className="font-medium text-gray-900">{selectedPharmacy.name}</p>
                                <p className="text-sm text-gray-500">{selectedPharmacy.pharmacy_code}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Branch
                                </label>
                                <select
                                    value={allocateBranchId}
                                    onChange={(e) => setAllocateBranchId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select a branch...</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedPharmacy.branch_id && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-sm text-amber-700">
                                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                                        This pharmacy is currently assigned to <strong>{selectedPharmacy.branch?.center_name}</strong>. 
                                        Selecting a new branch will reassign it.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowAllocateModal(false);
                                    setSelectedPharmacy(null);
                                    setAllocateBranchId('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAllocate}
                                disabled={loading || !allocateBranchId}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Allocating...' : 'Allocate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Pharmacy Modal */}
            {showManageModal && selectedPharmacy && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden m-4">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Manage Pharmacy</h2>
                                <p className="text-gray-500">{selectedPharmacy.name} ({selectedPharmacy.pharmacy_code})</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowManageModal(false);
                                    setSelectedPharmacy(null);
                                    setInventory([]);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm text-gray-600">Total Items</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">{inventory.length}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-5 h-5 text-emerald-600" />
                                        <span className="text-sm text-gray-600">In Stock</span>
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                                        {inventory.filter(i => i.quantity_in_stock > i.reorder_level).length}
                                    </p>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="w-5 h-5 text-amber-600" />
                                        <span className="text-sm text-gray-600">Low Stock</span>
                                    </div>
                                    <p className="text-2xl font-bold text-amber-600 mt-1">
                                        {inventory.filter(i => i.quantity_in_stock <= i.reorder_level && i.quantity_in_stock > 0).length}
                                    </p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                        <span className="text-sm text-gray-600">Out of Stock</span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-600 mt-1">
                                        {inventory.filter(i => i.quantity_in_stock === 0).length}
                                    </p>
                                </div>
                            </div>

                            {/* Inventory Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b">
                                    <h3 className="font-semibold text-gray-900">Inventory Items</h3>
                                </div>
                                {inventoryLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
                                    </div>
                                ) : inventory.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">No inventory items found</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Item</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Form</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Batch</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Expiry</th>
                                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Qty</th>
                                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Price</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {inventory.slice(0, 20).map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-gray-900">{item.medication_name}</p>
                                                            <p className="text-xs text-gray-500">{item.generic_name}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {item.dosage_form} {item.strength}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {item.batch_number}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`font-medium ${
                                                                item.quantity_in_stock === 0 ? 'text-red-600' :
                                                                item.quantity_in_stock <= item.reorder_level ? 'text-amber-600' :
                                                                'text-gray-900'
                                                            }`}>
                                                                {item.quantity_in_stock}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                                                            Rs. {Number(item.selling_price || 0).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {item.quantity_in_stock === 0 ? (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Out</span>
                                                            ) : item.quantity_in_stock <= item.reorder_level ? (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">Low</span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">OK</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {inventory.length > 20 && (
                                            <div className="px-4 py-3 text-center text-sm text-gray-500 bg-gray-50 border-t">
                                                Showing first 20 of {inventory.length} items
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedPharmacy && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md m-4">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Delete Pharmacy</h2>
                                    <p className="text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-gray-600">
                                Are you sure you want to delete <strong>{selectedPharmacy.name}</strong>?
                            </p>
                            {(selectedPharmacy.inventory_count || 0) > 0 && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-sm text-amber-700">
                                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                                        This pharmacy has {selectedPharmacy.inventory_count} inventory items. 
                                        You must remove or transfer all inventory before deleting.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setSelectedPharmacy(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading || (selectedPharmacy.inventory_count || 0) > 0}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Deleting...' : 'Delete Pharmacy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPharmacies;
