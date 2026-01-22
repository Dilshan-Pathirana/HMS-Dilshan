import Swal from "sweetalert2";

export const AppointmentCancelConfirmationAlert = (): Promise<boolean> => {
    return new Promise((resolve) => {
        Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to Cancel this appointment? This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, Cancel it!",
            cancelButtonText: "Cancel",
        }).then((result) => {
            resolve(result.isConfirmed);
        });
    });
};
