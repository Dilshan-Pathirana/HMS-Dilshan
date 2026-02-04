import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import "jspdf-autotable";
import Swal from "sweetalert2";
import api from "../../../../utils/api/axios";
import axios from "axios";
import { Product } from "../../../../utils/types/pos/IProduct.ts";
import { AppDispatch, RootState } from "../../../../store.tsx";
import {
    updateQuantity,
    removeFromCart,
} from "../../../../utils/slices/cart/cartSlice.ts";
import { useDispatch, useSelector } from "react-redux";
import alert from "../../../../utils/alert.ts";
import SalesProductGrid from "../../Common/SalesSection/SalesProductGrid.tsx";
import { getAllProducts } from "../../../../utils/api/pharmacy/PharmacyPOS/Common/GetAllProducts.ts";
import { purchasingProductSuperAdmin } from "../../../../utils/api/pharmacy/PharmacyPOS/SuperAdminPharmacyPOS/SuperAdminPurchasingProduct.ts";
import SalesShoppingCart from "../../Common/SalesSection/ShoppingCart/SalesShoppingCart.tsx";
import PaymentModal from "../../Common/SalesSection/PaymentModal/PaymentModal.tsx";
import BillModal from "../../Common/BillModal.tsx";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import { getAllPatientUsers } from "../../../../utils/api/user/PatientsUsers.ts";
import {
    IBillPurchasing,
    ICustomerDetailsForBill,
} from "../../../../utils/types/pos/IBillModalprops.ts";
import { customerDetailsFiledAttributes } from "../../../../utils/form/formFieldsAttributes/POS.ts";
import SalesHeader from "../../Common/SalesSection/POSHeader.tsx";
import { IPatientDetailsForSales } from "../../../../utils/types/users/IPatient.ts";
import { AuthState } from "../../../../utils/types/auth";
import {
    getCustomerName,
    getDiscountProductVise,
    useProductFilter,
} from "../../Common/CommonFunctionalities.ts";
import { ConfirmAlert } from "../../../../assets/Common/Alert/ConfirmAlert.tsx";

export default function SuperAdminSalesPage() {
    const dispatch = useDispatch<AppDispatch>();
    const cart = useSelector((state: RootState) => state.cart.items);
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [products, setProducts] = useState<Product[]>([]);
    const [patientsDetails, setPatientsDetails] = useState<
        IPatientDetailsForSales[]
    >([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [amountReceived, setAmountReceived] = useState<string>("");
    const [total, setTotal] = useState<number>(0);
    const [totalDiscount, setTotalDiscount] = useState<number>(0);
    const [netTotal, setNetTotal] = useState<number>(0);
    const [customerDetails, setCustomerDetails] =
        useState<ICustomerDetailsForBill>(customerDetailsFiledAttributes);
    const [change, setChange] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isReachedMaximumStock, setIsReachedMaximumStock] =
        useState<boolean>(false);
    const [maximumReachedProduct, setMaximumReachedProduct] =
        useState<string>("");
    const userRole = useSelector(
        (state: { auth: AuthState }) => state.auth.userRole,
    );

    useEffect(() => {
        fetchAllProducts().then();
        fetchAllPatients().then();
    }, []);

    useEffect(() => {
        const { grossTotal, totalDiscount } = cart.reduce(
            (acc, item) => {
                const itemSubtotal =
                    item.unit_selling_price * (item.quantity || 0);

                let itemDiscount = 0;
                if (
                    item.discount_type === "percentage" &&
                    item.discount_percentage
                ) {
                    itemDiscount =
                        itemSubtotal * (item.discount_percentage / 100);
                } else if (
                    item.discount_type === "amount" &&
                    item.discount_amount
                ) {
                    itemDiscount = item.discount_amount * (item.quantity || 0);
                }

                return {
                    grossTotal: acc.grossTotal + itemSubtotal,
                    totalDiscount: acc.totalDiscount + itemDiscount,
                };
            },
            { grossTotal: 0, totalDiscount: 0 },
        );

        setTotal(grossTotal);
        setTotalDiscount(totalDiscount);
        setNetTotal(grossTotal - totalDiscount);
    }, [cart]);

    const fetchAllProducts = async () => {
        try {
            const response = await getAllProducts(userRole);

            if (response?.data.status === 200) {
                setProducts(response.data.products);
                setIsLoading(false);
            } else {
                alert.warn("Failed to fetch product list.");
                setIsLoading(false);
            }
        } catch (error) {
            setIsLoading(false);
            if (axios.isAxiosError(error)) {
                alert.warn("Failed to fetch product list: " + error.message);
            } else {
                alert.warn("Failed to fetch product list.");
            }
        }
    };

    const fetchAllPatients = async () => {
        try {
            const response = await getAllPatientUsers();

            if (response.data.status === 200) {
                setPatientsDetails(response.data.patients);
                setIsLoading(false);
            } else {
                alert.warn("Failed to fetch patients.");
                setIsLoading(false);
            }
        } catch (error) {
            setIsLoading(false);
            if (axios.isAxiosError(error)) {
                alert.warn("Failed to fetch patients: " + error.message);
            } else {
                alert.warn("Failed to fetch patients.");
            }
        }
    };

    const handleUpdateQuantity = (id: string, newQuantity: number) => {
        if (newQuantity <= 0) return;

        dispatch(updateQuantity({ id, quantity: newQuantity }));

        const relatedProduct = products.find((product) => product.id === id);
        if (!relatedProduct) return;

        const currentQuantity = relatedProduct.current_stock;
        const isMaximumReached = currentQuantity <= newQuantity;

        setIsReachedMaximumStock(isMaximumReached);
        if (isMaximumReached) {
            setMaximumReachedProduct(id);
        }
    };

    const handleRemoveFromCart = (id: string) => {
        dispatch(removeFromCart(id));
        setIsReachedMaximumStock(false);
    };

    const openPaymentModal = () => {
        setIsPaymentModalOpen(true);
        setAmountReceived("");
        setChange(0);
    };

    const closePaymentModal = () => {
        setIsPaymentModalOpen(false);
    };

    const handleNumpadClick = (value: string) => {
        if (value === "backspace") {
            setAmountReceived((prev) => prev.slice(0, -1));
        } else if (value === "clear") {
            setAmountReceived("");
        } else {
            setAmountReceived((prev) => prev + value);
        }
    };

    const processPayment = async () => {
        const receivedAmount = parseFloat(amountReceived);
        if (receivedAmount >= netTotal) {
            const billDetails = {
                products: cart.map((item) => ({
                    product_id: item.id,
                    qty: item.quantity || 1,
                    price: item.unit_selling_price,
                    discount_amount: getDiscountProductVise(item),
                })),
                cashier_id: userId,
                total_discount_amount: totalDiscount,
                total_amount: total,
                net_total: netTotal,
                amount_received: receivedAmount,
                remain_amount: receivedAmount - total,
                customer_id: customerDetails.customer_id,
                customer_name: customerDetails.customer_name,
                contact_number: customerDetails.contact_number,
            };

            const isConfirmed = await ConfirmAlert(
                "Is everything okay?",
                "Do you really want to complete this bill?",
            );

            if (isConfirmed) {
                await storePurchase(billDetails, receivedAmount);
            }
        } else {
            Swal.fire({
                icon: "error",
                title: "Insufficient Amount",
                text: "The amount received is less than the total.",
                confirmButtonText: "OK",
            });
        }
    };

    const storePurchase = async (
        billDetails: IBillPurchasing,
        receivedAmount: number,
    ) => {
        try {
            const response = await purchasingProductSuperAdmin(billDetails);

            if (response.data.status === 200) {
                alert.success(
                    response.data.message || "Order successfully saved!",
                );
                setChange(receivedAmount - netTotal);
                setIsPaymentModalOpen(false);
                setIsBillModalOpen(true);
            } else {
                alert.error("Failed to save order. Please try again.");
            }
        } catch (error: any) {
            alert.error("Error saving order: " + error.message);
        }
    };

    const closeBillModal = () => {
        setIsBillModalOpen(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <SalesHeader
                patientsDetails={patientsDetails}
                customerDetails={customerDetails}
                setCustomerDetails={setCustomerDetails}
                setIsReachedMaximumStock={setIsReachedMaximumStock}
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-lg font-medium mb-4">
                            Product Search
                        </h2>
                        <div className="relative mb-4">
                            <input
                                type="text"
                                placeholder="Search by Name / SKU / Barcode..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-10 py-2 border rounded-lg"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        </div>
                        <SalesProductGrid
                            filteredProducts={useProductFilter(
                                products,
                                searchTerm,
                            )}
                        />
                    </div>

                    <SalesShoppingCart
                        cart={cart}
                        total={total}
                        totalDiscount={totalDiscount}
                        netTotal={netTotal}
                        isReachedMaximumStock={isReachedMaximumStock}
                        maximumReachedProduct={maximumReachedProduct}
                        handleUpdateQuantity={handleUpdateQuantity}
                        handleRemoveFromCart={handleRemoveFromCart}
                        onProcessPayment={openPaymentModal}
                    />
                </div>
            </main>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                total={total}
                totalDiscount={totalDiscount}
                netTotal={netTotal}
                amountReceived={amountReceived}
                setAmountReceived={setAmountReceived}
                handleNumpadClick={handleNumpadClick}
                processPayment={processPayment}
                closeModal={closePaymentModal}
            />

            <BillModal
                isOpen={isBillModalOpen}
                cart={cart}
                total={total}
                totalDiscount={totalDiscount}
                netTotal={netTotal}
                amountReceived={amountReceived}
                change={change}
                customerName={getCustomerName(customerDetails, patientsDetails)}
                setCustomerDetails={setCustomerDetails}
                closeModal={closeBillModal}
                dispatch={dispatch}
            />

            <Spinner isLoading={isLoading} />
        </div>
    );
}
