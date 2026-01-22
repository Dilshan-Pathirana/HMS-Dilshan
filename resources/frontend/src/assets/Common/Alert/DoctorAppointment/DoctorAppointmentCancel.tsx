import Swal from "sweetalert2";

export class AlertService {
    static async showCancelConfirmation(date: string) {
        return await Swal.fire({
            title: "Cancel All Appointments",
            text: `Are you sure you want to cancel all appointments for ${date}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, cancel them!",
            cancelButtonText: "No, keep them",
        });
    }

    static async showSuccessAlert() {
        return await Swal.fire({
            title: "Success!",
            text: `Successfully Schedule cancelled Request `,
            icon: "success",
            confirmButtonColor: "#10b981",
        });
    }

    static async showErrorAlert(message: string = "Failed to cancel appointments. Please try again.") {
        return await Swal.fire({
            title: "Error!",
            text: message,
            icon: "error",
            confirmButtonColor: "#dc2626",
        });
    }
}
