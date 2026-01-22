import ClipLoader from "react-spinners/ClipLoader";
import { SpinnerProps } from "../../utils/types/common/Spinner";
import React from "react";

const Spinner: React.FC<SpinnerProps> = ({ isLoading }) => {
    if (!isLoading) return null;

    return (
        <div className="absolute inset-0 flex justify-center items-center bg-gray-200 bg-opacity-50 z-50">
            <ClipLoader color="#3B82F6" loading={isLoading} size={50} />
        </div>
    );
};

export default Spinner;
