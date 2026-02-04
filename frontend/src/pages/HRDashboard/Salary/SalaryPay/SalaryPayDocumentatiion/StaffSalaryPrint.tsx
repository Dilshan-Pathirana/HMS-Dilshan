import ReactDOMServer from "react-dom/server";
import { IStaffSalaryPay } from "../../../../../utils/types/Salary/IStaffSalaryPay";
import StaffSalarySlip from "../SalaryPayDocumentatiion/StaffSalaryBillPrint";

export const handlePrint = (salaryPay: IStaffSalaryPay): void => {
    const printContent = ReactDOMServer.renderToString(
        <StaffSalarySlip salaryPay={salaryPay} />
    );

    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write(`
        <html>
            <head>
                <title>Salary Bill</title>
                <style>
                    @page {
                        size: A5 landscape;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #fff;
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
        </html>
    `);
        printWindow.document.close();
        printWindow.print();
    }
};
