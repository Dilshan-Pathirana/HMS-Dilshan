import { useState } from "react";
import NavBar from "../../NavBar.tsx";
import Footer from "../../Footer.tsx";

const Mission = () => {
    const [language, setLanguage] = useState("en");

    return (
        <>
            <NavBar />

            <div className="flex justify-end mt-20 p-4 bg-gray-100">
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
                            ? "Our Mission – Cure Health Care International (Pvt) Ltd (CHC)"
                            : language === "si"
                              ? "අපගේ මෙහෙවර – Cure Health Care International (Pvt) Ltd (CHC)"
                              : "எங்கள் இலக்கு – Cure Health Care International (Pvt) Ltd (CHC)"}
                    </h1>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {language === "en" && (
                    <>
                        <p className="text-gray-600 mb-6">
                            At Cure Health Care International (Pvt) Ltd (CHC),
                            our mission is to revolutionize the healthcare
                            sector in Sri Lanka by integrating technology,
                            research, and development into homeopathic medicine
                            and healthcare services.
                        </p>
                        <h3 className="text-2xl font-semibold mb-4">
                            What We Strive For
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                ✅ Providing Accessible and Affordable
                                Healthcare
                            </li>
                            <li>✅ Bringing Innovation to Homeopathy</li>
                            <li>✅ Enhancing Doctor-Patient Connectivity</li>
                            <li>✅ Sustainable and Natural Healthcare</li>
                            <li>✅ Expanding Homeopathy Awareness</li>
                        </ul>
                    </>
                )}

                {language === "si" && (
                    <>
                        <p className="text-gray-600 mb-6">
                            Cure Health Care International (Pvt) Ltd (CHC) හි
                            අපගේ මෙහෙවර වන්නේ ශ්‍රී ලංකාවේ සෞඛ්‍ය ක්ෂේම භාවිතය
                            තාක්ෂණය, පර්යේෂණ සහ සංවර්ධනය සමඟ ඒකාබද්ධ කර
                            ප්‍රාණවත්, සාමාන්‍ය සහ අධුනාතන සෞඛ්‍ය සේවා සැපයීමයි.
                        </p>
                        <h3 className="text-2xl font-semibold mb-4">
                            අපි ව්‍යාපෘතිය මඟින් කරා යන අරමුණු
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                ✅ ආර්ථික සහ ප්‍රවේශ ලාභය ඇති සෞඛ්‍ය සේවා සැලසීම
                            </li>
                            <li>
                                ✅ ඉන්නෝවේෂන් හෝමියෝපති සෞඛ්‍ය ක්ෂේමයට එකතු
                                කිරීම
                            </li>
                            <li>✅ වෛද්‍ය - රෝගී සම්බන්ධතා වැඩිදියුණු කිරීම</li>
                            <li>
                                ✅ ස්වභාවික හා දීර්ඝ කාලීන සෞඛ්‍යය වැඩිදියුණු
                                කිරීම
                            </li>
                            <li>
                                ✅ හෝමියෝපති ප්‍රතිකාර පිළිබඳ අවබෝධය වර්ධනය
                                කිරීම
                            </li>
                        </ul>
                    </>
                )}

                {language === "ta" && (
                    <>
                        <p className="text-gray-600 mb-6">
                            Cure Health Care International (Pvt) Ltd (CHC)
                            நிறுவனம் இலங்கையில் மருத்துவம், ஆராய்ச்சி மற்றும்
                            தொழில்நுட்பத்துடன் இணைந்து வளர்ச்சி பெற்ற, தற்காலிக
                            மற்றும் இயற்கை சுகாதார சேவைகளை வழங்குகின்றது.
                        </p>
                        <h3 className="text-2xl font-semibold mb-4">
                            எங்கள் நோக்கம்
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>✅ முழுமையான மற்றும் மலிவு மருத்துவ சேவைகள்</li>
                            <li>
                                ✅ ஹோமியோபதிக்கு புதிய கண்டுபிடிப்புகள்
                                சேர்க்கிறது
                            </li>
                            <li>
                                ✅ மருத்துவர்களும் நோயாளிகளும் இணைந்து செயல்பட
                            </li>
                            <li>
                                ✅ இயற்கை மற்றும் நீண்ட கால ஆரோக்கியத்தை
                                மேம்படுத்துதல்
                            </li>
                            <li>
                                ✅ ஹோமியோபதி சிகிச்சையைப் பற்றிய விழிப்புணர்வு
                                ஏற்படுத்துதல்
                            </li>
                        </ul>
                    </>
                )}
            </div>

            <Footer />
        </>
    );
};

export default Mission;
