import React, { useState, useEffect } from 'react';
import api from "../../../utils/api/axios";
import Select from 'react-select';
import { X } from 'lucide-react';
import alert from '../../../utils/alert';

interface InventoryEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    item: any;
}

const InventoryEditModal: React.FC<InventoryEditModalProps> = ({ isOpen, onClose, onSuccess, item }) => {
    const [formData, setFormData] = useState({
        item_code: '',
        barcode: '',
        item_name: '',
        generic_name: '',
        brand_name: '',
        category: '',
        unit: '',
        current_stock: '',
        reorder_level: '',
        unit_selling_price: '',
        expiry_date: '',
        supplier_id: '',
    });
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const categories = [
        { value: "Medicine", label: "Medicine" },
        { value: "Device", label: "Device" },
        { value: "General Product", label: "General Product" },
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
        { value: "unit/units", label: "Unit/Units" },
        { value: "Vial", label: "Vial" },
        { value: "Ampoule", label: "Ampoule" },
        { value: "Drop(s)", label: "Drop(s)" },
    ];

    useEffect(() => {
        if (isOpen && item) {
            console.log('=== EDIT MODAL OPENED ===');
            console.log('Item data:', item);
            console.log('Supplier ID from item:', item.supplier_id);
            console.log('Supplier name from item:', item.supplier);
            
            setFormData({
                item_code: item.batch_number || '',
                barcode: item.barcode || '',
                item_name: item.medicine_name || '',
                generic_name: item.generic_name || '',
                brand_name: item.brand_name || '',
                category: item.category || '',
                unit: item.unit || '',
                current_stock: item.quantity?.toString() || '',
                reorder_level: item.reorder_level?.toString() || '',
                unit_selling_price: item.unit_price?.toString() || '',
                expiry_date: item.expiry_date || '',
                supplier_id: item.supplier_id || '',
            });
            
            fetchSuppliers();
        }
    }, [item, isOpen]);

    const fetchSuppliers = async () => {
        try {
            console.log('Fetching suppliers...');
            const response = await api.get('/pharmacy/suppliers');
            console.log('Suppliers response:', response.data);
            
            if (response.data) {
                // Handle different response structures
                const supplierData = Array.isArray(response.data) 
                    ? response.data 
                    : (response.data.data || response.data.suppliers || []);
                
                console.log('Parsed supplier data:', supplierData);
                console.log('Number of suppliers:', supplierData.length);
                setSuppliers(supplierData);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            setSuppliers([]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post(`/pharmacist-update-product/${item.id}`, formData);
            
            if (response.data.status === 200) {
                alert.success('Product updated successfully!');
                onSuccess();
                onClose();
            } else {
                alert.error('Failed to update product');
            }
        } catch (error: any) {
            console.error('Error updating product:', error);
            alert.error(error.response?.data?.message || 'Failed to update product');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-neutral-800">Edit Product</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Information Section */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold text-neutral-800 mb-4 pb-2 border-b border-neutral-200">
                                Product Information
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Item Code / SKU <span className="text-error-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="item_code"
                                value={formData.item_code}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Barcode
                            </label>
                            <input
                                type="text"
                                name="barcode"
                                value={formData.barcode}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Item Name <span className="text-error-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="item_name"
                                value={formData.item_name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Generic Name
                            </label>
                            <input
                                type="text"
                                name="generic_name"
                                value={formData.generic_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Brand Name
                            </label>
                            <input
                                type="text"
                                name="brand_name"
                                value={formData.brand_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Category <span className="text-error-500">*</span>
                            </label>
                            <Select
                                value={categories.find(cat => cat.value === formData.category)}
                                onChange={(option) => handleSelectChange('category', option?.value || '')}
                                options={categories}
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Unit <span className="text-error-500">*</span>
                            </label>
                            <Select
                                value={units.find(unit => unit.value === formData.unit)}
                                onChange={(option) => handleSelectChange('unit', option?.value || '')}
                                options={units}
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>

                        {/* Stock Information Section */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-semibold text-neutral-800 mb-4 pb-2 border-b border-neutral-200">
                                Stock Information
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Current Stock <span className="text-error-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="current_stock"
                                value={formData.current_stock}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Reorder Level <span className="text-error-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="reorder_level"
                                value={formData.reorder_level}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Unit Selling Price (LKR) <span className="text-error-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="unit_selling_price"
                                value={formData.unit_selling_price}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Expiry Date <span className="text-error-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="expiry_date"
                                value={formData.expiry_date}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Supplier Information Section */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-semibold text-neutral-800 mb-4 pb-2 border-b border-neutral-200">
                                Supplier Information
                            </h3>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Supplier {Array.isArray(suppliers) && suppliers.length > 0 && (
                                    <span className="text-xs text-neutral-500">({suppliers.length} available)</span>
                                )}
                            </label>
                            <Select
                                value={(() => {
                                    if (!Array.isArray(suppliers) || suppliers.length === 0) {
                                        console.log('No suppliers available yet');
                                        return null;
                                    }
                                    
                                    console.log('=== MATCHING SUPPLIER ===');
                                    console.log('Looking for supplier_id:', formData.supplier_id);
                                    console.log('Supplier_id type:', typeof formData.supplier_id);
                                    console.log('Available suppliers:', suppliers.map(s => ({ id: s.id, name: s.supplier_name })));
                                    
                                    const selected = suppliers.find(sup => {
                                        const match = String(sup.id) === String(formData.supplier_id);
                                        console.log(`Comparing ${sup.id} (${typeof sup.id}) === ${formData.supplier_id} (${typeof formData.supplier_id}): ${match}`);
                                        return match;
                                    });
                                    
                                    console.log('Found supplier:', selected);
                                    return selected || null;
                                })()}
                                onChange={(option) => {
                                    console.log('Supplier changed to:', option);
                                    handleSelectChange('supplier_id', option?.id || '');
                                }}
                                options={Array.isArray(suppliers) ? suppliers : []}
                                getOptionLabel={(option) => option.supplier_name || option.name || 'Unknown'}
                                getOptionValue={(option) => String(option.id)}
                                className="react-select-container"
                                classNamePrefix="react-select"
                                placeholder={suppliers.length === 0 ? "Loading suppliers..." : "Select a supplier"}
                                isClearable
                                isSearchable
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-neutral-200">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Updating...' : 'Update Product'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-neutral-200 text-neutral-700 px-6 py-3 rounded-lg hover:bg-neutral-300 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryEditModal;
