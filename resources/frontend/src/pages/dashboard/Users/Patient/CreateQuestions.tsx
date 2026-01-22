import React, { useEffect, useState } from "react";
import axios from "axios";
import alert from "../../../../utils/alert.ts";
import {
    IDoctorOption,
    IQuestionFormData,
} from "../../../../utils/types/CreateQuestions/ICreateQuestions.ts";
import CreateQuestionForm from "../../../../components/Patient/CreateQuestionForm.tsx";
import {questionFormInitialState} from "../../../../utils/form/formFieldsAttributes/QuestionsCreate.ts";

const CreateQuestions = () => {
    const [formData, setFormData] = useState<IQuestionFormData>(
        questionFormInitialState,
    );
    const [doctorOptions, setDoctorOptions] = useState<IDoctorOption[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<IDoctorOption | null>(
        null,
    );
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await axios.get("api/get-doctors");
                if (response.status === 200) {
                    const options = response.data.doctors.map(
                        (doctor: any) => ({
                            value: doctor.user_id,
                            label: `Dr. ${doctor.first_name} ${doctor.last_name}`,
                        }),
                    );
                    setDoctorOptions(options);
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    alert.warn("Failed to fetch doctors: " + error.message);
                } else {
                    alert.warn("Failed to fetch doctors.");
                }
            }
        };
        fetchDoctors();
    }, []);

    const handleInputChange = (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleDoctorChange = (selectedOption: IDoctorOption | null) => {
        setSelectedDoctor(selectedOption);
        setFormData({
            ...formData,
            doctor_id: selectedOption ? selectedOption.value : "",
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const submitData = {
            ...formData,
            order: parseInt(formData.order),
            status: parseInt(formData.status),
        };

        try {
            const response = await axios.post(
                "api/add-main-question",
                submitData,
            );

            if (response.status === 200) {
                alert.success(
                    response.data.message ||
                        "Main question created successfully!",
                );
                setFormData(questionFormInitialState);
                setSelectedDoctor(null);
                setErrors({});
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                setErrors(error.response.data.error || {});
            } else {
                alert.warn(
                    "Failed to create main question: " +
                        (error as Error).message,
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4">
            <CreateQuestionForm
                formData={formData}
                doctorOptions={doctorOptions}
                selectedDoctor={selectedDoctor}
                errors={errors}
                isLoading={isLoading}
                onInputChange={handleInputChange}
                onDoctorChange={handleDoctorChange}
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default CreateQuestions;
