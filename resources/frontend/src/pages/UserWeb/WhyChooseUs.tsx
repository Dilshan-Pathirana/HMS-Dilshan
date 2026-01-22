import { useState } from "react";
import NavBar from "./NavBar.tsx";
import Footer from "./Footer.tsx";

const WhyChooseUs = () => {
    const [language, setLanguage] = useState("english");

    return (
        <>
            <NavBar />
            <section className="py-16 px-6 mt-10 md:px-12 text-center w-full">
                <div className="flex justify-end mb-6">
                    <button
                        className={`px-4 py-2 rounded-lg text-white font-semibold shadow-md transition ${language === "english" ? "bg-blue-600" : "bg-gray-400"}`}
                        onClick={() => setLanguage("english")}
                    >
                        English
                    </button>
                    <button
                        className={`ml-4 px-4 py-2 rounded-lg text-white font-semibold shadow-md transition ${language === "sinhala" ? "bg-blue-600" : "bg-gray-400"}`}
                        onClick={() => setLanguage("sinhala")}
                    >
                        සිංහල
                    </button>
                </div>

                {language === "english" ? (
                    <>
                        <h1 className="text-4xl font-bold text-gray-900 mb-8">Why Choose Us?</h1>
                        <p className="text-gray-700 max-w-3xl mx-auto mb-8">
                            At <strong>Cure.lk</strong>, we are dedicated to providing safe, effective, and natural homeopathic solutions tailored to your health needs. Our approach to healing focuses on treating the root cause of ailments rather than just managing symptoms.
                        </p>
                        <div className="max-w-5xl mx-auto text-left">
                            <ul className="space-y-6">
                                {[
                                    { title: "Trusted Homeopathic Experts – Your Health, Our Priority!", desc: "Our team consists of highly qualified and certified homeopathic professionals with years of experience in natural healing. We follow globally accepted homeopathic practices to ensure you receive the best possible care." },
                                    { title: "Safe, Natural, and Effective Remedies Tailored for You!", desc: "Our remedies are derived from pure, plant-based, and mineral sources, ensuring they work harmoniously with your body without harmful chemicals or synthetic ingredients." },
                                    { title: "Certified Professionals Providing Personalized Care!", desc: "Our certified homeopathic doctors take the time to understand your symptoms, lifestyle, and medical history to create a personalized treatment plan that works for you." },
                                    { title: "Holistic Healing with No Harmful Side Effects!", desc: "Unlike conventional medicine, which often comes with undesirable side effects, homeopathy stimulates your body’s natural healing ability without causing harm. Our treatments are safe for children, adults, and even pregnant women." },
                                    { title: "Easily Accessible, Reliable, and Affordable Healthcare!", desc: "Our services are designed to be affordable and convenient, allowing you to connect with certified homeopathic doctors and get expert advice from the comfort of your home." },
                                    { title: "Combining Tradition with Modern Expertise for Better Health!", desc: "Our approach blends centuries-old homeopathic wisdom with modern medical insights, ensuring that you receive the most effective and scientifically backed treatments available today." },
                                    { title: "Gentle Yet Powerful Treatments for Long-Lasting Wellness!", desc: "Homeopathy does not just suppress symptoms—it treats the underlying cause of illness to promote long-term health and immunity." },
                                    { title: "Healing You Naturally – One Remedy at a Time!", desc: "We focus on a natural, holistic approach to healing. Whether you are dealing with chronic conditions, acute illnesses, or general wellness concerns, our treatments offer a non-invasive, drug-free solution." },
                                    { title: "Your Wellness Journey Starts with the Right Care!", desc: "We are committed to guiding you through every step of your health and wellness journey, ensuring continuous support for optimal well-being." },
                                    { title: "Root-Cause Treatments for a Healthier, Happier Life!", desc: "Instead of just masking symptoms, our treatments work to eliminate the root cause of health issues, helping you achieve lasting relief and a healthier, happier life." }
                                ].map((item, index) => (
                                    <li key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                        <h3 className="text-xl font-semibold text-blue-600">{item.title}</h3>
                                        <p className="text-gray-700 mt-2">{item.desc}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="text-center mt-8">
                            <h2 className="text-2xl font-bold text-gray-900">Experience the Power of Homeopathy Today!</h2>
                            <p className="text-gray-700 mt-4 max-w-3xl mx-auto">
                                If you're looking for a natural, effective, and holistic approach to healthcare, <a href="https://www.Cure.lk" className="text-blue-600 font-semibold">www.Cure.lk</a> is the right choice for you. Connect with our experienced homeopathic doctors today and take the first step toward better health and wellness!
                            </p>
                            <p className="mt-4 font-semibold">📞 Contact Us Today! 🌐 Visit <a href="https://www.Cure.lk" className="text-blue-600">Cure.lk</a></p>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-4xl font-bold text-gray-900 mb-8">අපව තෝරාගැනීමට හේතු</h1>
                        <p className="text-lg text-gray-700 max-w-5xl mx-auto text-left mb-6">
                            www.Cure.lk වෙතින් ඔබට ලැබිය හැක්කේ නිරෝගී, ක්‍රියාකාරී සහ ස්වාභාවික හෝමියෝපතික විසඳුම් පමණි. අපගේ ප්‍රතිකාර ක්‍රමවේදය
                            ලක්ෂණ පාලනයට නොව, රෝගවල මූලික හේතුව සොයා ප්‍රතිකාර කිරීම යන්න මත පදනම්ව ඇත. එබැවින්, ඔබේ සෞඛ්‍යය සඳහා
                            අපව ඇයි තෝරාගත යුත්තේ දැයි බලන්න!
                        </p>
                        <div className="max-w-5xl mx-auto text-left">
                            <ul className="space-y-6">
                                {[
                                    { title: "විශ්වාසනීය හෝමියෝපතික වෛද්‍යවරු – ඔබේ සෞඛ්‍යය, අපගේ ප්‍රමුඛතාවය!", desc: "අපගේ වෛද්‍යවරුන් අධි පුහුණු සහ සහතික කළ වෘත්තිකයන් වේ. ඔවුන්ට හෝමියෝපති වෛද්‍ය ක්ෂේත්‍රයේ වසර ගණනක පළපුරුද්ද ඇති අතර, ඔබට ඉහළම ප්‍රමිතියේ ප්‍රතිකාර ලබාදීමට කැප වී සිටියි." },
                                    { title: "සුරක්ෂිත, ස්වාභාවික සහ ක්‍රියාකාරී ප්‍රතිකාර – ඔබටම වෙන්ව!", desc: "අපගේ සෞඛ්‍ය සේවාවන් පැළෑටි, ඛණිජ සහ ස්වාභාවික සංයෝග වලින් සාදා ඇත. එබැවින්, එය ඔබේ ශරීරයට හානි නොකරම බෙහෙවින් ප්‍රතිලාභ ලබාදිය හැක." },
                                    { title: "සහතික කළ වෛද්‍යවරුන් විසින් පුද්ගලීය සලකා බැලීම!", desc: "එක් එක් පුද්ගලයාගේ සෞඛ්‍ය අවශ්‍යතා අද්විතීයයි. එබැවින්, අපගේ වෛද්‍යවරු ඔබේ රෝග ලක්ෂණ, ජීවිත ශෛලිය සහ වෛද්‍ය ඉතිහාසය අවබෝධ කර, ඔබටම සුදුසු පුද්ගලීය ප්‍රතිකාර සැලසුම් ලබාදේ." },
                                    { title: "අහිතකර අතුරු ආබාධ නැති සම්පූර්ණ සෞඛ්‍ය ප්‍රතිකාර!", desc: "සාම්ප්‍රදායික බෙහෙත් වලින් විය හැකි අතුරු ආබාධ නොමැතිව, හෝමියෝපති ප්‍රතිකාර ශරීරයේ ස්වාභාවික සෞඛ්‍යය පුනරුජීවනය කිරීමට උපකාරී වේ." },
                                    { title: "පහසු, විශ්වාසනීය සහ ආර්ථික සෞඛ්‍ය සේවාවන්!", desc: "සෑම කෙනෙකුටම ගුණාත්මක වෛද්‍ය සේවාවන් ලබා ගැනීමට හැකි විය යුතුය යන්න අපි විශ්වාස කරමු. එබැවින්, අපගේ සේවාවන් සැමට පහසුවෙන් සහ මිල සනාථව ලබාගත හැකි ලෙස සැලසුම් කර ඇත." },
                                    { title: "සම්ප්‍රදාය සහ නවීන වෛද්‍ය විද්‍යාව සමඟ එකතුවී සෞඛ්‍ය සෙරෙනී!", desc: "අපගේ ප්‍රතිකාර ක්‍රමවේදය සරල හෝමියෝපති ප්‍රතිකාරවලට පමණක් සීමාවීමේ අතුරුදහන් වී නොමැත. එයට අලුත්ම වෛද්‍ය ක්‍රමවේද සහ නවීන විද්‍යාත්මක පදනම්ද එකතු වේ." },
                                    { title: "මෘදු නමුත් බලවත් ප්‍රතිකාර – දිගුකාලීන සෞඛ්‍යයට!", desc: "සාම්ප්‍රදායික බෙහෙත් මෙන් රෝග ලක්ෂණ මකා දැමීමට පමණක් නොව, හෝමියෝපති ප්‍රතිකාරය ශරීරය ස්වාභාවිකව සුව කරන ක්‍රියාවලිය උත්සාහ කරයි." },
                                    { title: "ස්වාභාවිකව සුව වන්න – එක් එක් ප්‍රතිකාරයක් මගින්!", desc: "ඔබේ ශරීරය ජෛව රසායනික බෙහෙත් වලට අධික අයදුම් කර නොමැතිව, ස්වාභාවිකව සන්සුන් වීමට හා සුවය ලබා ගැනීමට උපකාරී වන ප්‍රතිකාර අප ලබා දෙමු." },
                                    { title: "ඔබේ සෞඛ්‍ය ගමනට නිවැරදි වෛද්‍ය උපදේශනය!", desc: "ඔබේ සෞඛ්‍යය හා සම්බන්ධ එක් එක් පියවරේදී, නිවැරදි උපදේශනය ලබාදීමට අපි කැපවී සිටිමු. සෑම වරක්ම, ඔබේ සෞඛ්‍යය සැලකිලිමත් හා පරික්ෂාකාරී ලෙස රැකබලා ගැනීම අපගේ ලක්ෂ්‍යයයි." },
                                    { title: "මූලික හේතුව ප්‍රතිකාර කරමින් සන්සුන් සහ සන්සිඳු ජීවිතයක්!", desc: "අපගේ ප්‍රතිකාර ක්‍රමවේදය රෝගවල මූලික හේතුව නිවාරනය කිරීම සඳහා සැලසුම් කර ඇත, එය ඔබේ සන්සුන් සහ සන්සිඳු ජීවිතය සඳහා නව ආරම්භයක් බවට පත්වේ." }
                                ].map((item, index) => (
                                    <li key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                        <h3 className="text-xl font-semibold text-blue-600">{item.title}</h3>
                                        <p className="text-gray-700 mt-2">{item.desc}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="text-center mt-8">
                            <p className="text-lg font-semibold text-gray-800">අදම හෝමියෝපති සෞඛ්‍ය ප්‍රතිලාභ අත්විඳින්න!</p>
                            <p className="text-gray-700">ඔබේ සෞඛ්‍යය, ස්වභාවිකව සහ සෞඛ්‍යදායකව සන්සුන් වීමට කැමති නම්, <a href="https://www.cure.lk" className="text-blue-600 font-bold">www.Cure.lk</a> ඔබේ නිවැරදි තේරීමයි!</p>
                            <p className="text-gray-700 mt-2">📞 අප අමතන්න! 🌐 <a href="https://www.cure.lk" className="text-blue-600 font-bold">www.Cure.lk</a> වෙත පිවිසෙන්න</p>
                        </div>
                    </>
                )}
            </section>
            <Footer />
        </>
    );
};

export default WhyChooseUs;
