import axios from "axios";

export const updateSalaryStatus = async ({
    id,
    status,
}: {
    id: string;
    status: string;
}) => {
    return await axios.put(`/api/update-staff-salary-pay/${id}`, { status });
};
