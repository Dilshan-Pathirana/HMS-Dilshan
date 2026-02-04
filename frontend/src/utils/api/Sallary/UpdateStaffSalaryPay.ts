import api from "../axios";

export const updateSalaryStatus = async ({
    id,
    status,
}: {
    id: string;
    status: string;
}) => {
    return await api.put(`/update-staff-salary-pay/${id}`, { status });
};
