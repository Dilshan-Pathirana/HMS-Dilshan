import { useState } from "react";
import NavBar from "../NavBar.tsx";
import Footer from "../Footer.tsx";

const GastrointestinalDisorders = () => {
    const [language, setLanguage] = useState("en");

    return (
        <>
            <NavBar />

            <div className="flex justify-end p-4 mt-20 bg-neutral-100">
                <button
                    className={`px-4 py-2 rounded-md mx-1 ${language === "en" ? "bg-primary-500 text-white" : "bg-white text-black border"}`}
                    onClick={() => setLanguage("en")}
                >
                    English
                </button>
                <button
                    className={`px-4 py-2 rounded-md mx-1 ${language === "si" ? "bg-primary-500 text-white" : "bg-white text-black border"}`}
                    onClick={() => setLanguage("si")}
                >
                    සිංහල
                </button>
                <button
                    className={`px-4 py-2 rounded-md mx-1 ${language === "ta" ? "bg-primary-500 text-white" : "bg-white text-black border"}`}
                    onClick={() => setLanguage("ta")}
                >
                    தமிழ்
                </button>
            </div>

            <section className="bg-primary-500 text-white mt-10 py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl font-bold mb-4">
                        {language === "en"
                            ? "Specialized Treatments – Gastrointestinal Disorders"
                            : language === "si"
                              ? "විශේෂිත ප්‍රතිකාර – ජීආයි (GI) රෝග"
                              : "சிறப்பு சிகிச்சைகள் – மழுகியல் கோளாறுகள் (GI Disorders)"}
                    </h1>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {language === "en" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            Understanding Gastrointestinal Disorders
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            Gastrointestinal (GI) disorders affect the digestive
                            system, causing discomfort, pain, and long-term
                            health complications. The digestive system is
                            responsible for breaking down food, absorbing
                            nutrients, and eliminating waste.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            Common Causes of Gastrointestinal Disorders
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>
                                🔹 Unhealthy Diet – Processed food, low fiber,
                                and excessive sugar disrupt digestion.
                            </li>
                            <li>
                                🔹 Stress & Anxiety – Mental health directly
                                affects gut health.
                            </li>
                            <li>
                                🔹 Infections & Bacteria – Harmful microbes like
                                H. pylori can lead to ulcers.
                            </li>
                            <li>
                                🔹 Poor Lifestyle Habits – Alcohol, smoking, and
                                lack of exercise contribute to GI issues.
                            </li>
                            <li>
                                🔹 Food Allergies & Intolerances – Lactose and
                                gluten intolerance can trigger digestive
                                problems.
                            </li>
                            <li>
                                🔹 Medications & Overuse of Antibiotics – Can
                                disrupt gut flora and digestion.
                            </li>
                        </ul>
                    </>
                )}

                {language === "si" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            ජීආයි (GI) රෝග පිළිබඳව
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            ජීආයි (GI) රෝග මඟින් ජීර්ණ පද්ධතියට බලපායි. ජීර්ණ
                            පද්ධතිය ආහාර ජීර්ණය කර, පෝෂණීය ද්‍රව්‍ය හඳුනාගෙන,
                            අපද්‍රව්‍ය ඉවත් කිරීමේ කාර්යය කරයි.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            ජීආයි (GI) රෝග සඳහා සාමාන්‍ය හේතු
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>
                                🔹 අහිතකර ආහාර – අධික සීනි, ඉතාමත් සීනි සහිත
                                ආහාර.
                            </li>
                            <li>🔹 මානසික පීඩනය සහ ආතතික තත්වයන්.</li>
                            <li>
                                🔹 බැක්ටීරියා සහ ආසාදන – H. pylori වැනි
                                මයික්‍රෝබ්ස්.
                            </li>
                            <li>🔹 අවශ්‍යය ව්‍යායාම නොකරීම.</li>
                            <li>
                                🔹 ආහාරයට ඇති සංවේදීතාවය – ලැක්ටෝස් සහ ග්ලූටන්.
                            </li>
                            <li>🔹 අධික ඖෂධ භාවිතය.</li>
                        </ul>
                    </>
                )}

                {language === "ta" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            மழுகியல் கோளாறுகள் (GI Disorders)
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            மழுகியல் கோளாறுகள் செரிமானக் கோளாறுகளை ஏற்படுத்தும்,
                            வயிற்றுவலி மற்றும் வாயு பிரச்சினைகளை உருவாக்கும்.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            மழுகியல் கோளாறுகளுக்கான முக்கிய காரணிகள்
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>
                                🔹 முறையற்ற உணவுமுறை – அதிக கார்போஹைட்ரேட்டுகள்.
                            </li>
                            <li>🔹 மன அழுத்தம் மற்றும் பதற்றம்.</li>
                            <li>
                                🔹 பாக்டீரியா மற்றும் தொற்றுகள் – H. pylori.
                            </li>
                            <li>🔹 அதிக அல்கஹால் மற்றும் புகையிலை பழக்கம்.</li>
                            <li>
                                🔹 உணவுசார் ஒவ்வாமைகள் – லாக்டோஸ் மற்றும்
                                குளூட்டன்.
                            </li>
                            <li>🔹 அதிக மருந்து பயன்பாடு.</li>
                        </ul>
                    </>
                )}

                <div className="mt-6 text-center">
                    <a
                        href="https://www.cure.lk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold inline-block"
                    >
                        📞 Book an Appointment Today at www.cure.lk
                    </a>
                </div>
            </div>

            <Footer/>
        </>
    );
};

export default GastrointestinalDisorders;
