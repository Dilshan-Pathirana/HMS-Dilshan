import Swal from 'sweetalert2';

export const ScheduleCancellationApprovalAlert = async (): Promise<boolean> => {
    const result = await Swal.fire({
        title: 'Approve Cancellation?',
        text: 'This will approve the schedule cancellation and cancel all related appointments for this date.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10B981',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel',
    });
    return result.isConfirmed;
};
