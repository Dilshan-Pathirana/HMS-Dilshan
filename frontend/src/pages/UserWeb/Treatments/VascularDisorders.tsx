import { useState } from "react";
import NavBar from "../NavBar.tsx";
import Footer from "../Footer.tsx";

const VascularDisorders = () => {
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
                            ? "Specialized Treatments – Vascular Disorders"
                            : language === "si"
                              ? "රුධිරවාහිනී රෝග"
                              : "இரத்த நாளமண்டல குறைபாடுகள்"}
                    </h1>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {language === "en" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            Understanding Vascular Disorders
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Vascular disorders affect the body's circulatory
                            system, including arteries, veins, and capillaries.
                            These conditions can lead to poor blood circulation,
                            clot formation, and life-threatening complications
                            such as stroke, heart disease, and varicose veins.
                            The vascular system plays a vital role in delivering
                            oxygen and nutrients to tissues, and any disruption
                            can severely impact overall health.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            Common Causes of Vascular Disorders
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                🔹 High Blood Pressure (Hypertension) – Puts
                                excess strain on arteries.
                            </li>
                            <li>
                                🔹 Diabetes – Damages blood vessels over time.
                            </li>
                            <li>
                                🔹 High Cholesterol – Leads to plaque buildup
                                and artery blockage.
                            </li>
                            <li>
                                🔹 Smoking & Alcohol Consumption – Weakens blood
                                vessels and increases clot risk.
                            </li>
                            <li>
                                🔹 Genetics – Family history of heart disease or
                                varicose veins.
                            </li>
                            <li>
                                🔹 Sedentary Lifestyle – Lack of physical
                                activity slows circulation.
                            </li>
                            <li>
                                🔹 Obesity – Increases pressure on blood
                                vessels, reducing blood flow.
                            </li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            The Science Behind Vascular Disorders
                        </h3>
                        <p className="text-gray-600 mb-6">
                            The vascular system consists of blood vessels that
                            transport blood, oxygen, and nutrients throughout
                            the body. When arteries become narrowed, blocked, or
                            weakened, they fail to supply adequate blood to
                            organs, leading to tissue damage and chronic
                            illnesses.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            How Homeopathy Helps with Vascular Disorders
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                ✅ Enhancing blood circulation and preventing
                                clot formation
                            </li>
                            <li>✅ Reducing inflammation in blood vessels</li>
                            <li>
                                ✅ Balancing blood pressure and cholesterol
                                levels naturally
                            </li>
                            <li>
                                ✅ Strengthening arterial walls to prevent
                                rupture
                            </li>
                            <li>
                                ✅ Supporting heart health without chemical
                                drugs
                            </li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            Why Homeopathy is the Best Choice?
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                🔹 No Side Effects – Safe and natural treatment.
                            </li>
                            <li>
                                🔹 Holistic Approach – Focuses on overall
                                vascular health, not just symptoms.
                            </li>
                            <li>
                                🔹 Prevents Disease Progression – Reduces risks
                                of stroke and heart attacks.
                            </li>
                            <li>
                                🔹 Suitable for All Ages – Can be taken
                                alongside conventional medicine.
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
                            රුධිරවාහිනී රෝග
                        </h2>
                        <p className="text-gray-600 mb-6">
                            රුධිරවාහිනී (Vascular) රෝග නම්, ශරීරයේ රුධිර සැරිසරණ
                            පද්ධතිය ආශ්‍රිතව ඇතිවන රෝග වේ. මෙය ආරෝග්‍යයට දැඩි
                            බලපෑම් ඇති කළ හැකි අතර, ආත්මයානන්තර රුධිර අවහිරතා,
                            උස රුධිර පීඩනය, හෘදයාබාධ, සහ නාසික වාහිනී රෝග වැනි
                            ගැටළු ඇතිකරයි.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            රුධිරවාහිනී රෝග සඳහා ප්‍රධාන හේතු
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                🔹 අධි රුධිර පීඩනය – රුධිර නාල මත අධික පීඩනයක්
                                ඇති කරයි.
                            </li>
                            <li>
                                🔹 මුත්‍රු පීඩනය සහ බෙදාස්‍රාවා පීඩනය – රුධිර
                                නාල හානියට පත් කරයි.
                            </li>
                            <li>
                                🔹 මෝදකය සහ කොලෙස්ටරෝල් වැඩීම – රුධිර නාල අවහිර
                                කරයි.
                            </li>
                            <li>
                                🔹 ධූම්පානය සහ මත්පැන් පිපෙවීම – රුධිරනාල දුර්වල
                                කරයි.
                            </li>
                            <li>🔹 ජනිතීය හේතු – පවුලේ පසුබැසීමක්.</li>
                            <li>
                                🔹 වියලි ජීවන රටාව – ශරීර අභ්‍යන්තර සිරසන්භූත
                                වේ.
                            </li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            හෝමියෝපති ප්‍රතිකාරය කෙසේ උපකාරී වේද?
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>✅ රුධිර සැරිසරණය වඩාත් සක්‍රීය කරයි</li>
                            <li>
                                ✅ රුධිර නාලවල ඉදිමුම් සහ ආතතික තත්වයන් පහදයි
                            </li>
                            <li>
                                ✅ හෘදයාබාධය වැලැක්වීමේ හැකියාව ඉහළ දැමිය හැක
                            </li>
                            <li>✅ පිළිස්සීම් සහ රුධිර අවහිරතා අවම කරයි</li>
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
                            இரத்த நாளமண்டல குறைபாடுகள்
                        </h2>
                        <p className="text-gray-600 mb-6">
                            இரத்த நாளமண்டல குறைபாடுகள் என்பது, உடலின் இரத்த
                            சுற்றுநிரல் அமைப்பை பாதிக்கும் நிலைகளைக்
                            குறிக்கிறது. இது தசைகளுக்குத் தேவையான ஆக்சிஜன்
                            மற்றும் ஊட்டச்சத்துகளை கடத்துவதில் சிக்கல்களை
                            ஏற்படுத்தி, மூளை காயம், இதய நோய் மற்றும்
                            முதுகெலும்பு பிரச்சினைகள் போன்ற அலைபாய்வு
                            விளைவுகளுக்கு வழி வகுக்கின்றன.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            இரத்த நாளமண்டல குறைபாடுகளின் காரணங்கள்
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                🔹 உயர் இரத்த அழுத்தம் – இது நரம்புகள் மீது அதிக
                                சுமையை ஏற்படுத்துகிறது.
                            </li>
                            <li>
                                🔹 சர்க்கரை நோய் – இது நரம்புகளை சேதப்படுத்தும்.
                            </li>
                            <li>
                                🔹 அதிக கொழுப்பு – இதனால் இரத்த நாளங்களில்
                                திடம்செய்து இரத்தக் குழுக்கள் உண்டாகின்றன.
                            </li>
                            <li>
                                🔹 புகையிலை மற்றும் மது – இதனால் ரத்த நாளங்கள்
                                பலவீனமாகின்றன.
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

export default VascularDisorders;
