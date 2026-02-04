import Swal from "sweetalert2";

export const DoctorScheduleDeleteConfirmationAlert = (): Promise<boolean> => {
    return new Promise((resolve) => {
        Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to delete this schedule? This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        }).then((result) => {
            resolve(result.isConfirmed);
        });
    });
};
