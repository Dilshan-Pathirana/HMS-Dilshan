import { useState } from "react";
import NavBar from "../NavBar.tsx";
import Footer from "../Footer.tsx";

const PsychiatricDisorders = () => {
    const [language, setLanguage] = useState("en");

    return (
        <>
            <NavBar />

            <div className="flex justify-end p-4 mt-20 bg-gray-100">
                <button
                    className={`px-4 py-2 rounded-md mx-1 ${language === "en" ? "bg-blue-600 text-white" : "bg-white text-black border"}`}
                    onClick={() => setLanguage("en")}
                >
                    English
                </button>
                <button
                    className={`px-4 py-2 rounded-md mx-1 ${language === "si" ? "bg-blue-600 text-white" : "bg-white text-black border"}`}
                    onClick={() => setLanguage("si")}
                >
                    සිංහල
                </button>
                <button
                    className={`px-4 py-2 rounded-md mx-1 ${language === "ta" ? "bg-blue-600 text-white" : "bg-white text-black border"}`}
                    onClick={() => setLanguage("ta")}
                >
                    தமிழ்
                </button>
            </div>

            <section className="bg-blue-600 text-white mt-10 py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl font-bold mb-4">
                        {language === "en"
                            ? "Specialized Treatments – Psychiatric Disorders"
                            : language === "si"
                              ? "මානසික ආබාධ – විශේෂිත ප්‍රතිකාර"
                              : "சிறப்பு சிகிச்சைகள் – மனநலம் சார்ந்த கோளாறுகள்"}
                    </h1>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {language === "en" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            Understanding Psychiatric Disorders
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Psychiatric disorders are mental health conditions
                            that affect emotions, thoughts, and behavior. They
                            can range from mild anxiety and depression to severe
                            conditions like schizophrenia and bipolar disorder.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            Common Causes of Psychiatric Disorders
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                🔹 Chemical Imbalance in the Brain – Disrupts
                                neurotransmitter function.
                            </li>
                            <li>
                                🔹 Genetics – Family history of mental health
                                conditions.
                            </li>
                            <li>
                                🔹 Trauma & Emotional Stress – Leads to anxiety,
                                PTSD, or depression.
                            </li>
                            <li>
                                🔹 Lifestyle Factors – Poor diet, lack of sleep,
                                and substance abuse.
                            </li>
                            <li>
                                🔹 Hormonal Changes – Affects mood and emotional
                                stability.
                            </li>
                            <li>
                                🔹 Neurological Conditions – Conditions like
                                dementia can contribute to psychiatric symptoms.
                            </li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-4">
                            How Homeopathy Helps with Psychiatric Disorders
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                ✅ Restoring chemical balance in the brain
                                naturally
                            </li>
                            <li>
                                ✅ Calming the nervous system and reducing
                                stress levels
                            </li>
                            <li>
                                ✅ Enhancing mood stability and emotional
                                well-being
                            </li>
                            <li>
                                ✅ Improving focus, concentration, and cognitive
                                function
                            </li>
                            <li>
                                ✅ Providing a non-addictive treatment option
                            </li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            Why Homeopathy is the Best Choice?
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                🔹 No Side Effects – Free from chemical
                                dependency and drowsiness.
                            </li>
                            <li>
                                🔹 Treats the Root Cause – Addresses imbalances
                                instead of suppressing symptoms.
                            </li>
                            <li>
                                🔹 Holistic Healing – Improves both mental and
                                physical health.
                            </li>
                            <li>
                                🔹 Safe for All Ages – Suitable for children,
                                adults, and elderly individuals.
                            </li>
                        </ul>
                        <div className="mt-6 text-center">
                            <a
                                href="https://www.cure.lk"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold inline-block"
                            >
                                📞 Book an Appointment Today at www.cure.lk
                            </a>
                        </div>
                    </>
                )}

                {language === "si" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            මානසික ආබාධ පිළිබඳ හැඳින්වීම
                        </h2>
                        <p className="text-gray-600 mb-6">
                            මානසික ආබාධ යනු මනස, හැසිරීම, හා චේතනාවලියන්ට බලපාන
                            ගැටළු වන අතර එය මානුසික ආතතිය, ආතතවය, මතභේදය, සහ
                            මෝඩයෙකු වැනි ගැටළු ඇති කළ හැක.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            මානසික ආබාධ සඳහා සාමාන්‍ය හේතු
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                🔹 මස්තානීය රසායනික වියළීම – මස්තානීය පණුකඩු
                                කාර්යය බාධා කරයි.
                            </li>
                            <li>🔹 ජනිතීය හේතු – පවුලේ ආත්මසන්ධානය.</li>
                            <li>
                                🔹 භීෂණ සිදුවීම් සහ ආතත ව්‍යායාම – ආතතික
                                තත්ත්වයන් ඇති කරයි.
                            </li>
                            <li>
                                🔹 ජීවන රටාව – ව්‍යායාම අඩුවීම, අසහනකාරී ආහාර
                                පුරුදු, සහ මත්ද්‍රව්‍ය භාවිතය.
                            </li>
                            <li>
                                🔹 හෝමෝන ආපසු නිසි මට්ටමට පත් වීම – මානසික
                                සන්සුන් බව ඇති කරයි.
                            </li>
                        </ul>
                        <div className="mt-6 text-center">
                            <a
                                href="https://www.cure.lk"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold inline-block"
                            >
                                📞 Book an Appointment Today at www.cure.lk
                            </a>
                        </div>
                    </>
                )}

                {language === "ta" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            மனநலம் சார்ந்த கோளாறுகள்
                        </h2>
                        <p className="text-gray-600 mb-6">
                            மனநலம் சார்ந்த கோளாறுகள் மனதின் செயல்பாடுகளை
                            பாதிக்கக்கூடிய நோய்கள் ஆகும். இதனால் மனச்சோர்வு,
                            கவலை, பைப்பிளர் கோளாறு, மன அழுத்தம் போன்ற நிலைமைகள்
                            ஏற்படலாம்.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            மனநலம் கோளாறுகளுக்கான பொதுவான காரணிகள்
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>🔹 மூளையின் நரம்பணுக்களின் சமநிலையற்ற நிலை</li>
                            <li>🔹 பரம்பரை காரணிகள்</li>
                            <li>🔹 மன அழுத்தம் மற்றும் வாழ்க்கை முறைகள்</li>
                            <li>🔹 தீவிர மன அழுத்தம்</li>
                            <li>
                                🔹 உணவுப் பழக்கம் மற்றும் உடற்பயிற்சி குறைபாடு
                            </li>
                        </ul>
                        <div className="mt-6 text-center">
                            <a
                                href="https://www.cure.lk"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold inline-block"
                            >
                                📞 Book an Appointment Today at www.cure.lk
                            </a>
                        </div>
                    </>
                )}
            </div>

            <Footer/>
        </>
    );
};

export default PsychiatricDisorders;
