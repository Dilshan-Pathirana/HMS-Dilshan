import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface SalaryData {
    user_first_name: string;
    user_last_name: string;
    branch_center_name: string;
    paid_salary_amount: string;
    month: string;
    status: string;
    basic_salary_amount: string;
    allocation_amount: string;
    total_ot_amount: string;
    total_hours_worked: string;
}

export const exportToExcel = (data: SalaryData[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Salary Data");
    XLSX.writeFile(workbook, "StaffSalaryData.xlsx");
};

export const exportToPDF = (data: SalaryData[]) => {
    const doc = new jsPDF();
    const columns = [
        "No.",
        "First Name",
        "Last Name",
        "Branch",
        "Paid Salary",
        "Month",
        "Status",
        "Basic Salary",
        "Allocation Amount",
        "Total OT Amount",
        "Total Hours Worked",
    ];

    const rows = data.map((item, index) => [
        index + 1,
        item.user_first_name,
        item.user_last_name,
        item.branch_center_name,
        item.paid_salary_amount,
        item.month,
        item.status,
        item.basic_salary_amount,
        item.allocation_amount,
        item.total_ot_amount,
        item.total_hours_worked,
    ]);

    doc.autoTable({
        head: [columns],
        body: rows,
        startY: 20,
    });

    doc.save("StaffSalaryData.pdf");
};
