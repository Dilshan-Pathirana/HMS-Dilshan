import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    PDFDownloadLink,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { PurchasingInvoiceProps } from "../../../utils/types/pos/IPurchasing.ts";

const styles = StyleSheet.create({
    page: {
        padding: 50,
        backgroundColor: "#ffffff",
    },
    header: {
        marginBottom: 30,
    },
    companyName: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
    },
    companyDetails: {
        fontSize: 10,
        color: "#666666",
        marginBottom: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    section: {
        marginBottom: 20,
    },
    row: {
        flexDirection: "row",
        marginBottom: 8,
    },
    label: {
        width: "40%",
        fontSize: 12,
        color: "#666666",
    },
    value: {
        width: "60%",
        fontSize: 12,
    },
    table: {
        marginTop: 20,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f0f0f0",
        padding: 8,
        marginBottom: 8,
    },
    tableRow: {
        flexDirection: "row",
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#eeeeee",
    },
    col1: {
        width: "40%",
        fontSize: 12,
    },
    col2: {
        width: "20%",
        fontSize: 12,
        textAlign: "center",
    },
    col3: {
        width: "20%",
        fontSize: 12,
        textAlign: "center",
    },
    col4: {
        width: "20%",
        fontSize: 12,
        textAlign: "right",
    },
    total: {
        marginTop: 20,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5,
    },
    totalLabel: {
        fontSize: 12,
        color: "#666666",
    },
    totalValue: {
        fontSize: 12,
        fontWeight: "bold",
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 50,
        right: 50,
        textAlign: "center",
        fontSize: 10,
        color: "#666666",
    },
});

const PurchasingInvoiceDocument: React.FC<PurchasingInvoiceProps> = ({
    purchasing,
}) => {
    const currentDate = format(new Date(), "MMMM dd, yyyy 'at' HH:mm");
    const total = purchasing.products.reduce(
        (sum, product) => sum + parseFloat(product.price) * product.qty,
        0,
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.companyName}>CURE</Text>
                    <Text style={styles.companyDetails}>Company Address</Text>
                    <Text style={styles.companyDetails}>
                        City, Country, ZIP
                    </Text>
                    <Text style={styles.companyDetails}>
                        Phone: (123) 456-7890
                    </Text>
                    <Text style={styles.companyDetails}>
                        Email: info@company.com
                    </Text>
                </View>

                <Text style={styles.title}>PURCHASE INVOICE</Text>

                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Invoice Number:</Text>
                        <Text style={styles.value}>
                            {purchasing.invoice_id}
                        </Text>
                    </View>
                    {/* <View style={styles.row}>
                        <Text style={styles.label}>Bill ID:</Text>
                        <Text style={styles.value}>{purchasing.bill_id}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>User ID:</Text>
                        <Text style={styles.value}>{purchasing.user_id}</Text>
                    </View> */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Date:</Text>
                        <Text style={styles.value}>{currentDate}</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>Item Name</Text>
                        <Text style={styles.col2}>SKU</Text>
                        <Text style={styles.col3}>Quantity</Text>
                        <Text style={styles.col4}>Price</Text>
                    </View>
                    {purchasing.products.map((product, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.col1}>{product.item_name}</Text>
                            <Text style={styles.col2}>{product.item_code}</Text>
                            <Text style={styles.col3}>{product.qty}</Text>
                            <Text style={styles.col4}>LKR {product.price}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.total}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                        <Text style={styles.totalValue}>
                            LKR {total.toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Discount:</Text>
                        <Text style={styles.totalValue}>
                            LKR {purchasing.discount_amount}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount:</Text>
                        <Text style={styles.totalValue}>
                            LKR {purchasing.total_amount}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Amount Received:</Text>
                        <Text style={styles.totalValue}>
                            LKR {purchasing.amount_received}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Remaining Amount:</Text>
                        <Text style={styles.totalValue}>
                            LKR {purchasing.remain_amount}
                        </Text>
                    </View>
                </View>

                <Text style={styles.footer}>
                    Thank you for your purchase. This is a computer-generated
                    invoice.
                </Text>
            </Page>
        </Document>
    );
};

const InvoicePDF: React.FC<PurchasingInvoiceProps> = ({ purchasing }) => {
    return (
        <PDFDownloadLink
            document={<PurchasingInvoiceDocument purchasing={purchasing} />}
            fileName={`invoice-${purchasing.invoice_id}-${format(new Date(), "yyyy-MM-dd")}.pdf`}
            className="bg-primary-500 py-2.5 px-6 rounded-md text-white flex items-center gap-2 hover:bg-primary-500 transition-colors"
        >
            Download Invoice
        </PDFDownloadLink>
    );
};

export default InvoicePDF;
