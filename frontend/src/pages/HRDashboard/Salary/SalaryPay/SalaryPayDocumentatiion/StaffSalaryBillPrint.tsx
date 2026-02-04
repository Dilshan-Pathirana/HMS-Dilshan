import React from "react";
import { IStaffSalaryPay } from "../../../../../utils/types/Salary/IStaffSalaryPay";


const numberToWords = (num: number): string => {
    const a = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
    ];
    const b = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
    ];

    if (num === 0) return "Zero";
    if (num < 20) return a[num];
    if (num < 100)
        return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");
    if (num < 1000)
        return (
            a[Math.floor(num / 100)] +
            " Hundred" +
            (num % 100 === 0 ? "" : " " + numberToWords(num % 100))
        );
    if (num < 1000000)
        return (
            numberToWords(Math.floor(num / 1000)) +
            " Thousand" +
            (num % 1000 === 0 ? "" : " " + numberToWords(num % 1000))
        );
    if (num < 1000000000)
        return (
            numberToWords(Math.floor(num / 1000000)) +
            " Million" +
            (num % 1000000 === 0 ? "" : " " + numberToWords(num % 1000000))
        );

    return "Amount Too Large";
};

interface StaffSalarySlipProps {
    salaryPay: IStaffSalaryPay;
}

const StaffSalarySlip: React.FC<StaffSalarySlipProps> = ({ salaryPay }) => {
    const paidSalary = parseFloat(salaryPay.paid_salary_amount);
    const paidSalaryInWords = numberToWords(Math.floor(paidSalary)) + " Only";

    return (
        <div
            style={{
                width: "210mm",
                padding: "20px",
                fontFamily: "Arial, sans-serif",
                fontSize: "12px",
                lineHeight: "1.6em",
                textAlign: "left",
                margin: "auto",
                border: "1px solid #000",
                borderRadius: "5px",
                backgroundColor: "#fff",
            }}
        >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: "5px 0", fontSize: "18px" }}>CURE HEALTH CARE</h2>
                <p style={{ margin: "2px 0", fontSize: "12px" }}>First Street, Sri Lanka</p>
                <p style={{ margin: "2px 0", fontSize: "12px" }}>Phone: +94-70 345 6789</p>
                <p style={{ margin: "2px 0", fontSize: "12px", fontStyle: "italic" }}>Salary Slip</p>
                <hr style={{ margin: "10px 0", borderTop: "1px solid #000" }} />
            </div>

            <div style={{ marginBottom: "10px" }}>
                <p>
                    <strong>Employee Name:</strong> {salaryPay.user_first_name} {salaryPay.user_last_name}
                </p>
                <p>
                    <strong>Designation:</strong> Staff
                </p>
                <p>
                    <strong>Month & Year:</strong> {salaryPay.month}
                </p>
            </div>

            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "10px",
                    textAlign: "left",
                }}
            >
                <thead>
                <tr>
                    <th
                        style={{
                            border: "1px solid #000",
                            padding: "5px",
                            textAlign: "center",
                            backgroundColor: "#f5f5f5",
                        }}
                    >
                        Earnings
                    </th>
                    <th
                        style={{
                            border: "1px solid #000",
                            padding: "5px",
                            textAlign: "center",
                            backgroundColor: "#f5f5f5",
                        }}
                    >
                        Amount (LKR)
                    </th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td style={{ border: "1px solid #000", padding: "5px" }}>Basic Salary</td>
                    <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>
                        {parseFloat(salaryPay.basic_salary_amount).toFixed(2)}
                    </td>
                </tr>
                <tr>
                    <td style={{ border: "1px solid #000", padding: "5px" }}>Allowance</td>
                    <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>
                        {parseFloat(salaryPay.allocation_amount).toFixed(2)}
                    </td>
                </tr>
                <tr>
                    <td style={{ border: "1px solid #000", padding: "5px" }}>OT (Over Time)</td>
                    <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>
                        {parseFloat(salaryPay.total_ot_amount).toFixed(2)}
                    </td>
                </tr>
                </tbody>
                <tfoot>
                <tr>
                    <td style={{ border: "1px solid #000", padding: "5px", fontWeight: "bold" }}>
                        Total Earnings
                    </td>
                    <td
                        style={{
                            border: "1px solid #000",
                            padding: "5px",
                            textAlign: "right",
                            fontWeight: "bold",
                        }}
                    >
                        {(
                            parseFloat(salaryPay.allocation_amount) +
                            parseFloat(salaryPay.total_ot_amount)
                        ).toFixed(2)}
                    </td>
                </tr>
                <tr>
                    <td
                        colSpan={3}
                        style={{
                            border: "1px solid #000",
                            padding: "5px",
                            fontWeight: "bold",
                            textAlign: "right",
                        }}
                    >
                        Net Salary
                    </td>
                    <td
                        style={{
                            border: "1px solid #000",
                            padding: "5px",
                            textAlign: "right",
                            fontWeight: "bold",
                        }}
                    >
                        {paidSalary.toFixed(2)}
                    </td>
                </tr>
                </tfoot>
            </table>

            <div style={{ marginBottom: "10px" }}>
                <p>
                    <strong>Amount in Words:</strong> {paidSalaryInWords}
                </p>
                <p>
                    <strong>Date:</strong> ___________________
                </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                <div>
                    <p>Signature of Employee: _______________________</p>
                </div>
                <div>
                    <p>Director: _______________________</p>
                </div>
            </div>
        </div>
    );
};

export default StaffSalarySlip;
