import { useState } from "react";
import NavBar from "../NavBar.tsx";
import Footer from "../Footer.tsx";

const HormonalDisorders = () => {
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
                            ? "Specialized Treatments – Hormonal Disorders"
                            : language === "si"
                              ? "විශේෂිත ප්‍රතිකාර – හෝමෝන අසමතුලිතතා"
                              : "சிறப்பு சிகிச்சைகள் – ஹார்மோன் சமநிலை மாற்றங்கள்"}
                    </h1>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {language === "en" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            Understanding Hormonal Disorders
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            Hormonal disorders occur when there is an imbalance
                            in the body's endocrine system, which regulates
                            vital functions such as metabolism, growth,
                            reproduction, and mood stabilization.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            Common Causes of Hormonal Disorders
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 Genetic factors</li>
                            <li>🔹 Chronic stress and lifestyle choices</li>
                            <li>🔹 Poor diet and lack of exercise</li>
                            <li>🔹 Environmental toxins</li>
                            <li>🔹 Autoimmune conditions</li>
                        </ul>
                    </>
                )}

                {language === "si" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            හෝමෝන අසමතුලිතතා ගැන ඔබ දැනුවත්ද?
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            හෝමෝන අසමතුලිතතා යනු ශරීරයේ අන්ත: සිරා පද්ධතියේ
                            ගැටළු නිසා සිදුවන තත්ත්වයකි. මෙය ශරීරයේ මූලික
                            ක්‍රියාවලි පාලනය කරන හෝමෝන වල අධිකත්වය හෝ අවමතාවය
                            නිසා සිදුවයි.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            හෝමෝන ගැටළු සඳහා සාමාන්‍ය හේතු
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 ජනනාන්තර හෝමෝන විකෘති</li>
                            <li>🔹 මඳ ස්තීතිකය සහ ආහාර ශීලීන්</li>
                            <li>🔹 අසංතෘප්ත ආහාර හා ව්‍යායාම අඩු කිරීම</li>
                            <li>🔹 විෂ ප්‍රභව සහ රසායනික දුෂණය</li>
                            <li>
                                🔹 අනාන්තර රෝග සහ ප්‍රතිශක්ති ක්‍රමය අසමතුලිත
                                වීම
                            </li>
                        </ul>
                    </>
                )}

                {language === "ta" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            ஹார்மோன்கள் ஏன் சீர்குலைகின்றன?
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            மனித உடலில் உள்ள உட்புற சுரப்பிகள் முக்கியமான
                            உடலுறுப்பு செயல்பாடுகளை கட்டுப்படுத்தும் ஹார்மோன்களை
                            வெளியிடுகின்றன. ஹார்மோன்கள் சீராக இருக்கும் போது
                            உடல் ஆரோக்கியமாக இருக்கும்.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            ஹார்மோன் சமநிலைக்கு பாதிப்பு ஏற்படுத்தும் காரணிகள்
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 தீமையான வாழ்க்கை முறைகள்</li>
                            <li>
                                🔹 உணவு பழக்கவழக்கங்கள் மற்றும் உடற்பயிற்சி
                                பற்றாக்குறை
                            </li>
                            <li>🔹 மன அழுத்தம் மற்றும் வேலை பளு அதிகரிப்பு</li>
                            <li>
                                🔹 இயற்கைச் சூழலில் உள்ள ரசாயனங்கள் மற்றும் மாசு
                            </li>
                            <li>🔹 இயற்கை ரீதியான வயது மாறுதல்</li>
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

export default HormonalDisorders;
