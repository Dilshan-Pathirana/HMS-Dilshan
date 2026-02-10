import React, { useState } from "react";
import { Activity } from "lucide-react";

import DoctorCreatedDisease from "./DoctorCreatedDisease";
import DoctorDiseaseTable from "./DoctorDiseaseTable";

type TabKey = "all" | "create";

interface DoctorDiseasesPageProps {
    initialTab?: TabKey;
}

const DoctorDiseasesPage: React.FC<DoctorDiseasesPageProps> = ({ initialTab = "all" }) => {
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
    const [refreshFlag, setRefreshFlag] = useState<boolean>(false);

    const handleCreated = () => {
        setRefreshFlag((prev) => !prev);
    };

    return (
        <div className="bg-neutral-50/50 min-h-screen font-sans p-6">
            <div className="flex justify-between items-start gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-sm">
                            <Activity className="w-6 h-6 text-primary-600" />
                        </div>
                        Doctor Diseases
                    </h1>
                    <p className="text-neutral-500 mt-1 ml-14">Create and manage doctor diseases</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-3 mb-6">
                <div className="flex flex-wrap gap-2">
                    {([
                        { key: "all", label: "All Diseases" },
                        { key: "create", label: "Create Diseases" },
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

            <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-4">
                {activeTab === "all" ? (
                    <DoctorDiseaseTable refreshDiseases={refreshFlag} />
                ) : (
                    <DoctorCreatedDisease onCreated={handleCreated} />
                )}
            </div>
        </div>
    );
};

export default DoctorDiseasesPage;
