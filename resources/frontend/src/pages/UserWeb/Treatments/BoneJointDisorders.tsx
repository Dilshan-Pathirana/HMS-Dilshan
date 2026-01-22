import { useState } from "react";
import NavBar from "../NavBar.tsx";
import Footer from "../Footer.tsx";

const BoneJointDisorders = () => {
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
                            ? "Specialized Treatments – Bone & Joint Disorders"
                            : language === "si"
                              ? "විශේෂිත ප්‍රතිකාර – අස්ථි සහ සන්ධි රෝග"
                              : "சிறப்பு சிகிச்சைகள் – எலும்பு மற்றும் மூட்டு நோய்கள்"}
                    </h1>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {language === "en" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            Understanding Bone & Joint Disorders
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Bone and joint disorders affect millions worldwide,
                            causing pain, stiffness, and reduced mobility. These
                            conditions can be due to aging, lifestyle habits,
                            injuries, or underlying medical conditions like
                            arthritis and osteoporosis.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            Common Causes of Bone & Joint Problems
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>🔹 Osteoarthritis & Rheumatoid Arthritis</li>
                            <li>🔹 Osteoporosis</li>
                            <li>🔹 Gout</li>
                            <li>🔹 Injuries & Fractures</li>
                            <li>🔹 Autoimmune Disorders</li>
                            <li>🔹 Nutritional Deficiencies</li>
                        </ul>
                    </>
                )}

                {language === "si" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            අස්ථි සහ සන්ධි රෝග පිළිබඳව
                        </h2>
                        <p className="text-gray-600 mb-6">
                            අස්ථි සහ සන්ධි රෝග ලොව පුරා මිලියන ගණනක් මිනිසුන්ට
                            බලපායි. වයස්වැඩිවීම, අනතුරු, හෝමෝන ගැටළු, ආහාරය, හෝ
                            අන්තිම පරිසර බලපෑම් නිසා මෙම ගැටළු මතු විය හැක.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            අස්ථි සහ සන්ධි ගැටළු සඳහා හේතු
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>🔹 අස්ථි හා සන්ධි ප්‍රතිශක්ති ගැටළු</li>
                            <li>🔹 අස්ථි සුළණු වීම</li>
                            <li>🔹 ගවුට් රෝගය</li>
                            <li>🔹 අනතුරු සහ අස්ථි බිඳීම</li>
                            <li>🔹 ප්‍රතිශක්ති ආබාධ</li>
                            <li>🔹 පෝෂණ අඩුපාඩු</li>
                        </ul>
                    </>
                )}

                {language === "ta" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            எலும்பு மற்றும் மூட்டு நோய்கள் – அறிமுகம்
                        </h2>
                        <p className="text-gray-600 mb-6">
                            எலும்பு மற்றும் மூட்டு பிரச்சினைகள் வலி, கடினமான
                            இயக்கம், மற்றும் வீக்கத்தை ஏற்படுத்தும். இது வயது,
                            பான்மைகள், உடல் பராமரிப்பு தவறுகள், மற்றும் மருத்துவ
                            காரணிகளால் ஏற்படலாம்.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            எலும்பு மற்றும் மூட்டு பிரச்சினைகளுக்கான காரணங்கள்
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                🔹 ஆஸ்டியோ ஆர்த்ரைடிஸ் & ருமாட்டாய்ட்
                                ஆர்த்ரைடிஸ்
                            </li>
                            <li>🔹 ஆஸ்டியோபரோசிஸ்</li>
                            <li>🔹 கவுட்</li>
                            <li>🔹 அகசிகிச்சை மற்றும் காயங்கள்</li>
                            <li>🔹 தன்னியக்க நோய்கள்</li>
                            <li>🔹 உணவுசார் குறைபாடுகள்</li>
                        </ul>
                    </>
                )}

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
            </div>

            <Footer />
        </>
    );
};

export default BoneJointDisorders;
