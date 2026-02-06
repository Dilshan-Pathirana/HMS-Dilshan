import { useState } from "react";
import NavBar from "./NavBar.tsx";
import Footer from "./Footer.tsx";

const WhyChooseUs = () => {
    const [language, setLanguage] = useState("english");

    return (
        <>
            <NavBar />
            <div className="bg-neutral-50 min-h-screen pt-32 pb-20">
                <div className="container mx-auto px-6">
                    {/* Header */}
                    <div className="text-center mb-16 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent"></div>
                        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 mt-8">
                            {language === "english" ? "Why Choose Us?" : "අපව තෝරාගැනීමට හේතු"}
                        </h1>
                        <div className="flex justify-center mb-10">
                            <div className="bg-white p-1.5 rounded-xl shadow-sm border border-neutral-200 inline-flex">
                                <button
                                    className={`px-6 py-2 rounded-lg font-medium transition-all ${language === "english" ? "bg-primary-600 text-white shadow-md" : "text-neutral-600 hover:bg-neutral-50"}`}
                                    onClick={() => setLanguage("english")}
                                >
                                    English
                                </button>
                                <button
                                    className={`px-6 py-2 rounded-lg font-medium transition-all ${language === "sinhala" ? "bg-primary-600 text-white shadow-md" : "text-neutral-600 hover:bg-neutral-50"}`}
                                    onClick={() => setLanguage("sinhala")}
                                >
                                    සිංහල
                                </button>
                            </div>
                        </div>
                        <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
                            {language === "english" ? (
                                <>
                                    At <strong className="text-primary-600">Cure.lk</strong>, we are dedicated to providing safe, effective, and natural homeopathic solutions tailored to your health needs. Our approach focuses on treating the root cause of ailments.
                                </>
                            ) : (
                                "www.Cure.lk වෙතින් ඔබට ලැබිය හැක්කේ නිරෝගී, ක්‍රියාකාරී සහ ස්වාභාවික හෝමියෝපතික විසඳුම් පමණි."
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                        {/* Content Mapping */}
                        {(language === "english" ? [
                            { title: "Trusted Homeopathic Experts", subtitle: "Your Health, Our Priority!", desc: "Our team consists of highly qualified and certified homeopathic professionals with years of experience." },
                            { title: "Safe & Natural Remedies", subtitle: "Tailored for You!", desc: "Derived from pure, plant-based, and mineral sources, working harmoniously with your body without harmful chemicals." },
                            { title: "Personalized Care", subtitle: "Certified Professionals", desc: "Our doctors take the time to understand your symptoms, lifestyle, and medical history." },
                            { title: "Holistic Healing", subtitle: "No Harmful Side Effects", desc: "Stimulates your body’s natural healing ability without causing harm. Safe for all ages." },
                            { title: "Accessible & Affordable", subtitle: "Reliable Healthcare", desc: "Designed to be affordable and convenient, connect with doctors from home." },
                            { title: "Modern Expertise", subtitle: "Tradition meets Science", desc: "Blending centuries-old wisdom with modern medical insights for effective treatment." },
                            { title: "Long-Lasting Wellness", subtitle: "Gentle Yet Powerful", desc: "Treats the underlying cause of illness to promote long-term health and immunity." },
                            { title: "Natural Approach", subtitle: "One Remedy at a Time", desc: "Non-invasive, drug-free solutions for chronic conditions and general wellness." },
                            { title: "Your Wellness Journey", subtitle: "Starts Here", desc: "We support you through every step of your health journey for optimal well-being." },
                            { title: "Root-Cause Treatments", subtitle: "Healthier, Happier Life", desc: "Eliminating the root cause of health issues for lasting relief." }
                        ] : [
                            { title: "විශ්වාසනීය හෝමියෝපතික වෛද්‍යවරු", subtitle: "ඔබේ සෞඛ්‍යය, අපගේ ප්‍රමුඛතාවය!", desc: "අපගේ වෛද්‍යවරුන් අධි පුහුණු සහ සහතික කළ වෘත්තිකයන් වේ." },
                            { title: "සුරක්ෂිත, ස්වාභාවික ප්‍රතිකාර", subtitle: "ඔබටම වෙන්ව!", desc: "ශරීරයට හානි නොකරම බෙහෙවින් ප්‍රතිලාභ ලබාදිය හැක." },
                            { title: "පුද්ගලීය සලකා බැලීම", subtitle: "සහතික කළ වෛද්‍යවරුන්", desc: "අපගේ වෛද්‍යවරු ඔබේ රෝග ලක්ෂණ සහ ජීවිත ශෛලිය අවබෝධ කර ගනී." },
                            { title: "සම්පූර්ණ සෞඛ්‍ය ප්‍රතිකාර", subtitle: "අහිතකර අතුරු ආබාධ නැත", desc: "ශරීරයේ ස්වාභාවික සෞඛ්‍යය පුනරුජීවනය කිරීමට උපකාරී වේ." },
                            { title: "ආර්ථික සෞඛ්‍ය සේවාවන්", subtitle: "පහසු සහ විශ්වාසනීය", desc: "සැමට පහසුවෙන් සහ මිල සනාථව ලබාගත හැකි ලෙස සැලසුම් කර ඇත." },
                            { title: "සම්ප්‍රදාය සහ නවීනත්වය", subtitle: "එකතුවී සෞඛ්‍ය සෙරෙනී", desc: "අලුත්ම වෛද්‍ය ක්‍රමවේද සහ නවීන විද්‍යාත්මක පදනම්ද එකතු වේ." },
                            { title: "දිගුකාලීන සෞඛ්‍යය", subtitle: "මෘදු නමුත් බලවත්", desc: "ශරීරය ස්වාභාවිකව සුව කරන ක්‍රියාවලිය උත්සාහ කරයි." },
                            { title: "ස්වාභාවිකව සුව වන්න", subtitle: "එක් එක් ප්‍රතිකාරයක් මගින්", desc: "ස්වාභාවිකව සන්සුන් වීමට හා සුවය ලබා ගැනීමට උපකාරී වන ප්‍රතිකාර." },
                            { title: "නිවැරදි වෛද්‍ය උපදේශනය", subtitle: "ඔබේ සෞඛ්‍ය ගමනට", desc: "ඔබේ සෞඛ්‍යය සැලකිලිමත් හා පරික්ෂාකාරී ලෙස රැකබලා ගැනීම." },
                            { title: "මූලික හේතුව ප්‍රතිකාර කරමින්", subtitle: "සන්සුන් ජීවිතයක්", desc: "රෝගවල මූලික හේතුව නිවාරනය කිරීම සඳහා සැලසුම් කර ඇත." }
                        ]).map((item, index) => (
                            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 hover:shadow-lg transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4 text-xl group-hover:bg-primary-100 transition-colors">
                                    ✨
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-1">{item.title}</h3>
                                <h4 className="text-sm font-semibold text-primary-600 mb-3 uppercase tracking-wide">{item.subtitle}</h4>
                                <p className="text-neutral-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 text-center bg-blue-900 rounded-3xl p-10 md:p-16 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">
                                {language === "english" ? "Experience the Power of Homeopathy Today!" : "අදම හෝමියෝපති සෞඛ්‍ය ප්‍රතිලාභ අත්විඳින්න!"}
                            </h2>
                            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                                {language === "english" ? "Connect with our experienced homeopathic doctors today and take the first step toward better health and wellness!" : "ඔබේ සෞඛ්‍යය, ස්වභාවිකව සහ සෞඛ්‍යදායකව සන්සුන් වීමට කැමති නම්, www.Cure.lk ඔබේ නිවැරදි තේරීමයි!"}
                            </p>
                            <a href="/" className="inline-block bg-white text-primary-900 px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                                {language === "english" ? "Get Started Now" : "දැන්ම ආරම්භ කරන්න"}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default WhyChooseUs;
