import {
    FaEnvelope,
    FaHome,
    FaIdCard,
    FaPhone,
    FaUserCircle,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { RootState } from "../../store.tsx";
import useFetchPatientDetails from "../../utils/api/PatientAppointment/FetchPatientDetails";
import SignOutButton from "../../components/dashboard/sideBar/common/SignOutButton.tsx";

const UserDetails = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const { userDetails, loading, error } = useFetchPatientDetails(userId);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-600">
                Loading patient details...
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-500 mt-6">{error}</div>;
    }

    return (
        <div className="w-full max-w-xs mx-auto p-5 bg-white rounded-lg shadow-sm border border-gray-100 mt-4">
            <div className="flex flex-col items-center">
                <div className="relative mb-4">
                    <FaUserCircle className="text-indigo-500 text-5xl" />
                </div>

                <h2 className="text-xl font-semibold text-gray-800 text-center">
                    {userDetails.firstName} {userDetails.lastName}
                </h2>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                    Patient
                </span>
            </div>

            <div className="mt-5 space-y-3">
                <div className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors">
                    <FaPhone className="text-indigo-500 text-sm flex-shrink-0" />
                    <div className="ml-3">
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm text-gray-800">
                            {userDetails.phone || "Not provided"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors">
                    <FaEnvelope className="text-indigo-500 text-sm flex-shrink-0" />
                    <div className="ml-3">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-800">
                            {userDetails.email || "Not provided"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors">
                    <FaIdCard className="text-indigo-500 text-sm flex-shrink-0" />
                    <div className="ml-3">
                        <p className="text-xs text-gray-500">NIC</p>
                        <p className="text-sm text-gray-800">
                            {userDetails.nic || "Not provided"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors">
                    <FaHome className="text-indigo-500 text-sm flex-shrink-0" />
                    <div className="ml-3">
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm text-gray-800">
                            {userDetails.address || "Not provided"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
                <SignOutButton />
            </div>
        </div>
    );
};

export default UserDetails;
