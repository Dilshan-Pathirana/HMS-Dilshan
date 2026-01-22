import { useState } from "react";
import NavBar from "../NavBar.tsx";
import Footer from "../Footer.tsx";

const FertilityProblems = () => {
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
                            ? "Specialized Treatments – Fertility Problems"
                            : language === "si"
                              ? "විශේෂිත ප්‍රතිකාර – වඳභාව ගැටළු"
                              : "சிறப்பு சிகிச்சைகள் – கருப்பைச்சிதைவு மற்றும் குழந்தையின்மை"}
                    </h1>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {language === "en" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            Understanding Fertility Problems
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Fertility problems affect both men and women,
                            leading to difficulties in conceiving naturally.
                            This condition has become increasingly common due to
                            lifestyle factors, stress, and underlying health
                            issues.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            Causes of Fertility Issues
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                🔹 Hormonal Imbalances (PCOS, Thyroid disorders)
                            </li>
                            <li>🔹 Irregular Menstrual Cycles</li>
                            <li>
                                🔹 Male Infertility – Low sperm count & poor
                                motility
                            </li>
                            <li>🔹 Lifestyle & Environmental Factors</li>
                            <li>
                                🔹 Medical Conditions (Endometriosis, Fibroids)
                            </li>
                        </ul>
                    </>
                )}

                {language === "si" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            වඳභාව ගැටළු පිළිබඳව
                        </h2>
                        <p className="text-gray-600 mb-6">
                            පිරිමි සහ ගැහැණු දෙපාර්ශවයටම බලපාන වඳභාව ගැටළු,
                            ස්වභාවිකව ගැබ් ගැනීම අපහසු කරයි. ආහාර සන්සුන්,
                            ආතතිය, හෝමෝන ගැටළු වැනි කරුණු නිසා මෙය වැඩි විය හැක.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            වඳභාවයට හේතු
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                🔹 හෝමෝන අසමතුලිතතාව (PCOS, තයිරොයිඩ් ගැටළු)
                            </li>
                            <li>🔹 අක්‍රමික මසික රීතිය</li>
                            <li>🔹 පුරුෂ වඳභාවය – අඩු ශුක්‍රාණු ප්‍රමාණය</li>
                            <li>🔹 ජීවිත ශෛලිය සහ පාරිසරික බලපෑම්</li>
                            <li>🔹 වෛද්‍යමය ගැටළු (අන්ත්‍රාජාතීය ආසාදන)</li>
                        </ul>
                    </>
                )}

                {language === "ta" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            கருப்பைச்சிதைவு மற்றும் குழந்தையின்மை
                        </h2>
                        <p className="text-gray-600 mb-6">
                            பெண்கள் மற்றும் ஆண்களில் கருப்பைச்சிதைவு மற்றும்
                            குழந்தையின்மை பிரச்சினைகள் இயற்கையாக கருத்தரிக்க
                            முடியாத நிலைக்கு வழிவகுக்கின்றன.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            கருப்பைச்சிதைவு மற்றும் குழந்தையின்மைக்கான காரணங்கள்
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                🔹 ஹார்மோன் மாற்றங்கள் (PCOS, தைராய்டு
                                கோளாறுகள்)
                            </li>
                            <li>🔹 மாதவிடாய் சீர்குலைவு</li>
                            <li>
                                🔹 ஆண்கள் கருப்பைச்சிதைவு – குறைந்த விந்தணு
                                எண்ணிக்கை
                            </li>
                            <li>
                                🔹 வாழ்க்கை முறைகள் – புகைப்பிடித்தல், மன
                                அழுத்தம்
                            </li>
                            <li>
                                🔹 மருத்துவக் காரணிகள் – குழந்தையின்மை தொடர்பான
                                நோய்கள்
                            </li>
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

            <Footer/>
        </>
    );
};

export default FertilityProblems;
