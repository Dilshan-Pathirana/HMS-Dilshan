import { FiUser, FiMapPin, FiPlay } from "react-icons/fi";
import { DoctorSessionProps } from "../../../../utils/types/DoctorSession/IDoctorSession.ts";

const DoctorSessionCardList: React.FC<DoctorSessionProps> = ({
    sessions,
    onStartSession,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
                <div
                    key={session.id}
                    className="bg-white rounded-lg shadow-md border border-neutral-200 p-6 hover:shadow-lg transition-shadow duration-200"
                >
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <FiUser className="text-primary-500 mr-3 text-lg" />
                            <div>
                                <h3 className="font-semibold text-neutral-900 text-lg">
                                    {session.patient_first_name}{" "}
                                    {session.patient_last_name}
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <FiMapPin className="text-green-500 mr-3 text-lg" />
                            <div>
                                <p className="font-medium text-neutral-900">
                                    {session.branch_center_name}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={() => onStartSession(session)}
                                className="w-full flex items-center justify-center px-4 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors duration-200 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            >
                                <FiPlay className="mr-2" />
                                Start Session
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DoctorSessionCardList;
