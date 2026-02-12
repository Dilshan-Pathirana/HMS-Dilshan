import React, { useState } from "react";
import { HeartPulse } from "lucide-react";

import CreateQuestions from "./CreateQuestions";
import GetAllQuestions from "./GetAllQuestions";

type TabKey = "all" | "create";

interface PatientQuestionsPageProps {
    initialTab?: TabKey;
}

const PatientQuestionsPage: React.FC<PatientQuestionsPageProps> = ({ initialTab = "all" }) => {
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
    const [refreshFlag, setRefreshFlag] = useState<boolean>(false);

    const triggerRefresh = () => setRefreshFlag((prev) => !prev);

    return (
        <div className="bg-neutral-50/50 min-h-screen font-sans p-3 sm:p-6">
            <div className="flex justify-between items-start gap-4 mb-4 sm:mb-8">
                <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-sm">
                            <HeartPulse className="w-6 h-6 text-primary-600" />
                        </div>
                        Patient Section
                    </h1>
                    <p className="text-neutral-500 mt-1 ml-0 sm:ml-14">Create and manage questions</p>
                </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-3xl shadow-sm border border-neutral-200 p-2 sm:p-3 mb-4 sm:mb-6">
                <div className="flex flex-wrap gap-2">
                    {([
                        { key: "all", label: "All Questions" },
                        { key: "create", label: "Create Questions" },
                    ] as Array<{ key: TabKey; label: string }>).map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                                activeTab === t.key
                                    ? "bg-neutral-900 text-white border-neutral-900"
                                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-3xl shadow-sm border border-neutral-200 p-2 sm:p-4">
                {activeTab === "all" ? (
                    <GetAllQuestions refreshQuestions={refreshFlag} triggerRefresh={triggerRefresh} />
                ) : (
                    <CreateQuestions onCreated={triggerRefresh} />
                )}
            </div>
        </div>
    );
};

export default PatientQuestionsPage;
