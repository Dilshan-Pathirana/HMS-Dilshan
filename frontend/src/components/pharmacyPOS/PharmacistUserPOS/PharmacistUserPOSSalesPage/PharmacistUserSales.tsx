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
import Spinner from "../../../../assets/Common/Spinner.tsx";
import { getAllProducts } from "../../../../utils/api/pharmacy/PharmacyPOS/PharmacistUserPOS/PharmacistUserGetAllProducts.ts";
import { purchasingProductPharmacistUser } from "../../../../utils/api/pharmacy/PharmacyPOS/PharmacistUserPOS/PharmacistUserPurchasingProduct.ts";
import {
    IBillPurchasing,
    ICustomerDetailsForBill,
} from "../../../../utils/types/pos/IBillModalprops.ts";
import { customerDetailsFiledAttributes } from "../../../../utils/form/formFieldsAttributes/POS.ts";
import { getAllPatientUsersForPharmacist } from "../../../../utils/api/user/PatientsUsers.ts";
import SalesHeader from "../../Common/SalesSection/POSHeader.tsx";
import { IPatientDetailsForSales } from "../../../../utils/types/users/IPatient.ts";
import BillModal from "../../Common/BillModal.tsx";
import SalesProductGrid from "../../Common/SalesSection/SalesProductGrid.tsx";
import SalesShoppingCart from "../../Common/SalesSection/ShoppingCart/SalesShoppingCart.tsx";
import PaymentModal from "../../Common/SalesSection/PaymentModal/PaymentModal.tsx";
import {
    getCustomerName,
    getDiscountProductVise,
    useProductFilter,
} from "../../Common/CommonFunctionalities.ts";
import { ConfirmAlert } from "../../../../assets/Common/Alert/ConfirmAlert.tsx";

export default function PharmacistUserSalesPage() {
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
            const response = await getAllProducts();

            if (response.data.status === 200) {
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
            const response = await getAllPatientUsersForPharmacist();

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
            const response = await purchasingProductPharmacistUser(billDetails);

            if (response.data.status === 200) {
                alert.success(
                    response.data.message || "Order successfully saved!",
                );
                setChange(receivedAmount - total);
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
        <div className="flex flex-col min-h-screen bg-neutral-50/50">
            {/* Header */}
            <SalesHeader
                patientsDetails={patientsDetails}
                customerDetails={customerDetails}
                setCustomerDetails={setCustomerDetails}
                setIsReachedMaximumStock={setIsReachedMaximumStock}
            />

            <main className="flex-1 p-6 overflow-hidden h-[calc(100vh-100px)]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                    {/* Left Column: Product Search & Grid */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 h-full">
                        {/* Search Bar Area */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products by name or code..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800 placeholder:text-neutral-400 font-medium"
                                    autoFocus
                                />
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            </div>
                        </div>

                        {/* Product Grid Area */}
                        <div className="flex-1 bg-neutral-100/50 rounded-2xl p-1 overflow-hidden">
                            <SalesProductGrid
                                filteredProducts={useProductFilter(
                                    products,
                                    searchTerm,
                                )}
                            />
                        </div>
                    </div>

                    {/* Right Column: Shopping Cart */}
                    <div className="lg:col-span-5 xl:col-span-4 h-full">
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
