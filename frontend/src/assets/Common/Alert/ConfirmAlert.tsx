import Swal from "sweetalert2";

export const ConfirmAlert = (title: string, text: string): Promise<boolean> => {
    return new Promise((resolve) => {
        Swal.fire({
            title: title,
            text: text,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, Please!",
            cancelButtonText: "Cancel",
        }).then((result) => {
            resolve(result.isConfirmed);
        });
    });
};
