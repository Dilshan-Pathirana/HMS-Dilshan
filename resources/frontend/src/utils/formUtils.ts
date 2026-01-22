export const appendFormData = (data: Record<string, any>): FormData => {
    const formDataToSend = new FormData();

    Object.keys(data).forEach((key) => {
        const value = data[key];
        if (value !== null) {
            formDataToSend.append(key, value);
        }
    });

    return formDataToSend;
};
