import React from "react";
import CureLogo from "../../../assets/cure-logo.png";
import { BillPrintProps } from "../../../utils/types/pos/IBillModalprops.ts";
import {
    calculateFinalPrice,
    showDiscount,
} from "../Common/CommonFunctionalities.ts";
import { Product } from "../../../utils/types/pos/IProduct.ts";

const BillPrint: React.FC<BillPrintProps> = ({
    orderId,
    soldTo,
    date,
    time,
    salesPerson,
    register,
    orderType,
    cart,
    total,
    totalDiscount,
    netTotal,
    amountReceived,
    change,
}) => {
    return (
        <div
            style={{
                width: "58mm",
                padding: "5px",
                fontFamily: "monospace",
                fontSize: "10px",
                lineHeight: "1.4em",
                textAlign: "left",
                margin: "auto",
            }}
        >
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <img
                    src={CureLogo}
                    alt="Cure Logo"
                    style={{
                        height: "40px",
                        marginBottom: "5px",
                        display: "block",
                        marginLeft: "auto",
                        marginRight: "auto",
                    }}
                />
                <h3 style={{ margin: "5px 0", fontSize: "14px" }}>
                    CURE Pharmacy
                </h3>
                <p style={{ margin: "2px 0", fontSize: "10px" }}>
                    First Street, Sri-lanka
                </p>
                <p style={{ margin: "2px 0", fontSize: "10px" }}>
                    Phone: +94-70 345 6789
                </p>
                <hr style={{ margin: "10px 0", borderTop: "1px solid #000" }} />
            </div>
            <div style={{ marginBottom: "10px" }}>
                <p style={{ margin: "2px 0" }}>
                    <strong>Order #:</strong> {orderId}
                </p>
                <p style={{ margin: "2px 0" }}>
                    <strong>Sold To:</strong> {soldTo}
                </p>
                <p style={{ margin: "2px 0" }}>
                    <strong>Date:</strong> {date} <strong>Time:</strong> {time}
                </p>
                <p style={{ margin: "2px 0" }}>
                    <strong>Salesperson:</strong> {salesPerson}
                </p>
                <p style={{ margin: "2px 0" }}>
                    <strong>Register:</strong> {register}
                </p>
                <p style={{ margin: "2px 0" }}>
                    <strong>Order Type:</strong> {orderType}
                </p>
            </div>
            <hr style={{ margin: "10px 0", borderTop: "1px solid #000" }} />
            <table
                style={{
                    width: "100%",
                    marginBottom: "10px",
                    borderCollapse: "collapse",
                }}
            >
                <thead>
                    <tr>
                        <th style={{ textAlign: "left", width: "20%" }}>
                            Item
                        </th>
                        <th style={{ textAlign: "center", width: "15%" }}>
                            Qty
                        </th>
                        <th style={{ textAlign: "right", width: "20%" }}>
                            Price
                        </th>
                        <th style={{ textAlign: "right", width: "20%" }}>
                            Discount
                        </th>
                        <th style={{ textAlign: "right", width: "25%" }}>
                            Total
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {cart.map((item: Product, index) => (
                        <tr key={index}>
                            <td>{item.item_name}</td>
                            <td style={{ textAlign: "center" }}>
                                {item.quantity}
                            </td>
                            <td style={{ textAlign: "right" }}>
                                {item.unit_selling_price.toFixed(2)}
                            </td>
                            <td style={{ textAlign: "right" }}>
                                {showDiscount(item)}
                            </td>
                            <td style={{ textAlign: "right" }}>
                                {calculateFinalPrice(item)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <hr style={{ margin: "10px 0", borderTop: "1px solid #000" }} />
            <div style={{ marginBottom: "10px" }}>
                <p style={{ margin: "2px 0" }}>
                    <strong>Total:</strong> LKR {total.toFixed(2)}
                </p>
                <p style={{ margin: "2px 0" }}>
                    <strong>Discount Total:</strong> LKR{" "}
                    {totalDiscount.toFixed(2)}
                </p>
                <p style={{ margin: "2px 0" }}>
                    <strong>Net Total:</strong> LKR {netTotal.toFixed(2)}
                </p>
                <p style={{ margin: "2px 0" }}>
                    <strong>Amount Received:</strong> LKR{" "}
                    {amountReceived.toFixed(2)}
                </p>
                <p style={{ margin: "2px 0" }}>
                    <strong>Change:</strong> LKR {change.toFixed(2)}
                </p>
            </div>
            <hr style={{ margin: "10px 0", borderTop: "1px solid #000" }} />
            <div style={{ textAlign: "center", marginTop: "10px" }}>
                <p style={{ margin: "2px 0" }}>
                    Thank you for shopping with us!
                </p>
                <p style={{ margin: "2px 0" }}>Visit again!</p>
            </div>
        </div>
    );
};

export default BillPrint;
