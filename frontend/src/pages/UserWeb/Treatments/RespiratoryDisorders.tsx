import { useState } from "react";
import NavBar from "../NavBar.tsx";
import Footer from "../Footer.tsx";

const RespiratoryDisorders = () => {
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
                            ? "Specialized Treatments – Respiratory Disorders"
                            : language === "si"
                              ? "විශේෂිත ප්‍රතිකාර – ශ්වසන රෝග"
                              : "சிறப்பு சிகிச்சைகள் – சுவாச கோளாறுகள்"}
                    </h1>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {language === "en" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            Understanding Respiratory Disorders
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            Respiratory disorders affect the lungs and airways,
                            making breathing difficult and impacting overall
                            health. Common respiratory conditions include:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 Asthma</li>
                            <li>
                                🔹 Chronic Obstructive Pulmonary Disease (COPD)
                            </li>
                            <li>🔹 Allergic Rhinitis</li>
                            <li>🔹 Bronchitis</li>
                            <li>🔹 Pneumonia</li>
                            <li>🔹 Sinusitis</li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            Causes of Respiratory Disorders
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 Air pollution and environmental toxins</li>
                            <li>
                                🔹 Allergens like dust, pollen, and pet dander
                            </li>
                            <li>🔹 Smoking and passive smoking</li>
                            <li>🔹 Viral and bacterial infections</li>
                            <li>🔹 Genetic predisposition</li>
                            <li>🔹 Weakened immune system</li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            How Homeopathy Helps in Respiratory Disorders
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>
                                ✅ Reduces the frequency and severity of attacks
                                (e.g., asthma, allergies)
                            </li>
                            <li>
                                ✅ Improves lung capacity and breathing
                                efficiency
                            </li>
                            <li>
                                ✅ Addresses the root cause rather than
                                suppressing symptoms
                            </li>
                            <li>
                                ✅ Completely natural and free from harmful side
                                effects
                            </li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            Why Choose Homeopathy for Respiratory Health?
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>
                                🔹 Personalized Treatment – Remedies are
                                tailored based on individual health history.
                            </li>
                            <li>
                                🔹 No Steroids or Chemical Drugs – 100% natural,
                                with no dependency issues.
                            </li>
                            <li>
                                🔹 Long-Term Relief – Strengthens lung function
                                and immunity.
                            </li>
                            <li>
                                🔹 Safe for All Ages – Suitable for children,
                                adults, and elderly patients.
                            </li>
                        </ul>
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
                    </>
                )}

                {language === "si" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            ශ්වසන රෝග පිළිබඳව ඔබ දැනුවත්ද?
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            ශ්වසන රෝග යනු පෙටිකා සහ ශරීරයේ වායු මාර්ගයන්ට බලපාන
                            රෝග වේ. මෙම රෝගය හේතුවෙන් ආකාශමය ගැටළු සහ මූලික
                            ක්‍රියාවලි අපහසුතා ඇතිවිය හැක.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            සාමාන්‍ය ශ්වසන රෝග
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 ආතමාව (Asthma)</li>
                            <li>🔹 දිගුකාලීන පළලෝෂිත ශ්වසන රෝග (COPD)</li>
                            <li>🔹 ආසාත්මික ශවසන රෝග (Allergic Rhinitis)</li>
                            <li>🔹 බ්‍රොන්කයිටිස් (Bronchitis)</li>
                            <li>🔹 නියුමෝනියාව (Pneumonia)</li>
                            <li>🔹 සයිනසයිටිස් (Sinusitis)</li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            ශ්වසන රෝග වල හේතු
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 දූෂිත වාතය සහ රසායනික දුෂණය</li>
                            <li>
                                🔹 දූවිලි, මල්පොතු, සත්ත්ව රෝම ආදී ආසාත්මිකතා
                            </li>
                            <li>🔹 දුම්පානය සහ අන්‍ය පිරිස් විසින් හෙරෙයීම</li>
                            <li>🔹 වෛරස් සහ බැක්ටීරියා ආසාදන</li>
                            <li>🔹 ජනනීය හේතු</li>
                            <li>🔹 ක්‍රමය තුළ ප්‍රතිශක්ති අඩු වීම</li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            හෝමියෝපතිව ශ්වසන රෝග වලට විසඳුම්
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>✅ නියුමෝනියාව, ආතමාව වැනි ගැටළු අඩු කරයි</li>
                            <li>✅ ශරීරයේ ප්‍රතිශක්ති පද්ධතිය ශක්තිමත් කරයි</li>
                            <li>
                                ✅ දිරුම් සහ වාතය මාර්ගය සෙරෙම ශක්තිමත් කරයි
                            </li>
                            <li>✅ රසායනික ඖෂධ රහිතව ස්වභාවිකව සන්සුන් කරයි</li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            💡 නියමට ශ්වසනයේ නිදහස ලබාගන්න!
                        </h3>
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
                    </>
                )}

                {language === "ta" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            சுவாச கோளாறுகள் பற்றிய அறிமுகம்
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            சுவாச கோளாறுகள் என்பது நுரையீரல் மற்றும்
                            காற்றுப்பாதைகளை பாதிக்கும் நோய்கள் ஆகும். இதனால்
                            சுவாசிக்க முடியாத நிலை, இருமல், மூச்சுத்திணறல் போன்ற
                            பிரச்சினைகள் ஏற்படலாம்.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            சாதாரண சுவாச கோளாறுகள்
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 ஆஸ்துமா (Asthma)</li>
                            <li>🔹 கலந்த சுவாச குறைபாடு நோய் (COPD)</li>
                            <li>🔹 அலர்ஜிக் ரைனிடிஸ் (Allergic Rhinitis)</li>
                            <li>🔹 ப்ரோன்கைட்டிஸ் (Bronchitis)</li>
                            <li>🔹 நிமோனியா (Pneumonia)</li>
                            <li>🔹 சைனஸைட்டிஸ் (Sinusitis)</li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            சுவாச கோளாறுகளின் காரணங்கள்
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 காற்று மாசு மற்றும் ரசாயன கழிவுகள்</li>
                            <li>
                                🔹 தூசி, பூப்பொடி மற்றும் மிருகக் கூந்தல்
                                அலர்ஜிகள்
                            </li>
                            <li>
                                🔹 புகைபிடித்தல் மற்றும் இரண்டாம் நிலை
                                புகைபிடிப்புகள்
                            </li>
                            <li>
                                🔹 நுண்ணுயிர் தொற்றுகள் (விஷான்கள் மற்றும்
                                பாக்டீரியா)
                            </li>
                            <li>🔹 தோட்டாக உள்ள மரபணு காரணிகள்</li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            ஹோமியோபதி சிகிச்சை எப்படி உதவுகிறது?
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>✅ நுரையீரல் திறனை மேம்படுத்துகிறது</li>
                            <li>✅ நோய்க்கு அடிப்படை காரணத்தை நீக்குகிறது</li>
                            <li>
                                ✅ காற்றுப்பாதை முற்றிலும் இயல்பாக செயல்பட
                                உதவுகிறது
                            </li>
                            <li>
                                ✅ கைமருந்துகள் மற்றும் ஸ்டெராய்டுகள் இல்லாத
                                இயற்கை முறைகள்
                            </li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            💡 மூச்சுத் திணறலுக்கு விடை – ஹோமியோபதி!
                        </h3>
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
                    </>
                )}
            </div>

            <Footer/>
        </>
    );
};

export default RespiratoryDisorders;
