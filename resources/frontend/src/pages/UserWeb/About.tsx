import { useState } from "react";
import NavBar from "./NavBar.tsx";
import Footer from "./Footer.tsx";
import English from "./About/English.tsx";
import Sinhala from "./About/Sinhala.tsx";
import Tamil from "./About/Tamil.tsx";

const About = () => {
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
                            ? "About Cure Health Care International"
                            : language === "si"
                              ? "Cure Health Care International ගැන"
                              : "Cure Health Care International பற்றி"}
                    </h1>
                    <p className="text-xl">
                        {language === "en"
                            ? "Revolutionizing Healthcare Through Innovation & Natural Solutions"
                            : language === "si"
                              ? "නවෝත්පාදන සහ ස්වාභාවික විසඳුම් හරහා සෞඛ්‍යය ව්‍යුත්පන්න කිරීම"
                              : "புதிய கண்டுபிடிப்புகள் மற்றும் இயற்கை தீர்வுகளின் மூலம் மருத்துவத்தை முன்னேற்றுதல்"}
                    </p>
                </div>
            </section>

            {language === "en" && <English />}
            {language === "si" && <Sinhala />}
            {language === "ta" && <Tamil />}

            <Footer />
        </>
    );
};

export default About;
