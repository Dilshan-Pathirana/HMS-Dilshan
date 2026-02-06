import { useState } from "react";
import NavBar from "../NavBar.tsx";
import Footer from "../Footer.tsx";

const SkinHairDisorders = () => {
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
                            ? "Specialized Treatments – Skin & Hair Disorders"
                            : language === "si"
                                ? "සංවේදනාත්මක සම සහ කොණ්ඩි ගැටළු"
                                : "தோல் மற்றும் தலைமுடி பிரச்சினைகள்"}
                    </h1>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {language === "en" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            Understanding Skin & Hair Disorders
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            Skin and hair disorders affect millions of people worldwide and can have a significant
                            impact on confidence and overall well-being. The skin is the body's largest organ and serves
                            as a protective barrier, while hair plays a vital role in appearance and health. Any
                            imbalance in the body, whether hormonal, nutritional, or environmental, can lead to various
                            skin and hair conditions.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            Common Causes of Skin & Hair Disorders
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 Hormonal Imbalances – Conditions like PCOS, thyroid disorders, and stress-related
                                hormonal changes.
                            </li>
                            <li>🔹 Nutritional Deficiencies – Lack of vitamins A, B, C, D, and minerals like zinc and
                                iron.
                            </li>
                            <li>🔹 Genetics – Family history of skin diseases like eczema, psoriasis, and alopecia.</li>
                            <li>🔹 Environmental Factors – Pollution, UV radiation, and harsh chemicals in cosmetics.
                            </li>
                            <li>🔹 Autoimmune Diseases – Conditions where the immune system mistakenly attacks healthy
                                cells.
                            </li>
                            <li>🔹 Fungal & Bacterial Infections – Scalp infections, acne, and dandruff-causing
                                bacteria.
                            </li>
                            <li>🔹 Stress & Anxiety – Mental health directly impacts skin and hair health.</li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            The Science Behind Skin & Hair Disorders
                        </h3>
                        <p className="text-neutral-600 mb-6">
                            The skin and scalp require proper hydration, nourishment, and protection to stay healthy.
                            Imbalances in oil production, cell regeneration, and blood circulation can lead to dryness,
                            hair fall, acne, eczema, and other conditions. Conventional treatments often provide
                            temporary relief but fail to address the root cause.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            How Homeopathy Helps with Skin & Hair Disorders
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>✅ Balancing hormones naturally</li>
                            <li>✅ Boosting immune system to fight infections</li>
                            <li>✅ Improving blood circulation for healthy skin and hair</li>
                            <li>✅ Reducing inflammation and itching</li>
                            <li>✅ Nourishing hair follicles to prevent hair fall</li>
                            <li>✅ Detoxifying the body to clear skin issues</li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            Why Homeopathy is the Best Choice?
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 No Harmful Chemicals – 100% natural remedies.</li>
                            <li>🔹 Treats the Root Cause – Unlike conventional creams and shampoos, homeopathy works from
                                within.
                            </li>
                            <li>🔹 Safe for All Ages – Suitable for children, adults, and elderly.</li>
                            <li>🔹 Effective for Chronic Skin Conditions – Provides long-term relief from eczema,
                                psoriasis, and acne.
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
                            සංවේදනාත්මක සම සහ කොණ්ඩි ගැටළු
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            සම සහ කොණ්ඩි ගැටළු බොහෝදෙනෙකුට බලපාන ගැටලුවකි. සම යනු ශරීරයේ විශාලම අවයවය වන අතර එය ආරක්ෂිත
                            ආවරණයකි. කොණ්ඩියද ආරක්ෂණය සහ ප්‍රභවය සඳහා වැදගත් වේ. ශරීරයේ හෝර්මෝන අසුමත, පෝෂණීය අඩුකම, සහ
                            පාරිසරික බලපෑම් මගින් මෙම ගැටළු ඇතිවිය හැක.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            සම සහ කොණ්ඩි ගැටළු ඇතිවීමට හේතු
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 හෝර්මෝන අසුමතතාවය – PCOS, අධි ශීඝ්‍රතල, සහ ආතතික ගැටළු.</li>
                            <li>🔹 පෝෂක හිඟය – විටමින් A, B, C, D සහ සින්ක්, යකඩ වැනි ඛනිජ අඩු වීම.</li>
                            <li>🔹 ජනිතීය හේතු – උණසැසි, එක්සමා, සහ කෙස් ගැලවීම්.</li>
                            <li>🔹 පාරිසරික බලපෑම් – ලෝදුරු, UV කිරණ, සහ රසායනික ද්‍රව්‍ය.</li>
                            <li>🔹 තන්තු ආසාදන සහ බැක්ටීරියා – මුහුණේ කැලැල්, කෙස් කටු, සහ ඉදිමුම්.</li>
                            <li>🔹 මානසික ආතතිය – සම සහ කොණ්ඩියට බලපායි.</li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            හෝමියෝපති ප්‍රතිකාරය කෙසේ උපකාරී වේද?
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>✅ හෝර්මෝන ස්වභාවිකව සමතුලිත කරයි</li>
                            <li>✅ සම්පූර්ණ සෞඛ්‍යය සඳහා ආතතික තත්වයන් පහදයි</li>
                            <li>✅ කෙස්මූල පෝෂණය කර, කොණ්ඩි ගැලවීම වැලැක්වයි</li>
                            <li>✅ දිගුකාලීන ප්‍රතිපල ලබාදෙයි</li>
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

                {language === "ta" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">
                            தோல் மற்றும் தலைமுடி பிரச்சினைகள்
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            தோல் மற்றும் தலைமுடி பிரச்சினைகள் பலருக்கு விளைவிக்கும் பிரச்சினைகள் ஆகும். தோல் என்பது
                            உடலின் மிகப்பெரிய உறுப்பானது மற்றும் அது பாதுகாப்பு கவசமாக செயல்படுகிறது. தலைமுடி தோல்
                            போன்றே தோற்றம் மற்றும் ஆரோக்கியத்தில் முக்கியப் பங்கு வகிக்கிறது. உடலில் உள்ள அனைத்து
                            சமச்சீனங்கள், உணவு பற்றாக்குறைகள் அல்லது சுற்றுச்சூழல் காரணிகள் பல தோல் மற்றும் தலைமுடி
                            பிரச்சினைகளுக்கு வழிவகுக்கலாம்.
                        </p>
                        <h3 className="text-xl font-semibold mb-4">
                            தோல் மற்றும் தலைமுடி பிரச்சினைகளுக்கான காரணங்கள்
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>🔹 ஹார்மோனல் மாற்றங்கள் – PCOS, உரேணைக் குறைபாடுகள் மற்றும் மன அழுத்தம் போன்றவை.</li>
                            <li>🔹 போஷணக் குறைபாடுகள் – A, B, C, D போன்ற வைட்டமின்கள் மற்றும் Zinc, Iron போன்ற
                                கனிமங்கள்.
                            </li>
                            <li>🔹 குடும்ப மரபு – எக்செமா, பசரியாசிஸ், தலைமுடி விழுவதன் போன்ற தோல் பிரச்சினைகளின் குடும்ப
                                வரலாறு.
                            </li>
                            <li>🔹 சுற்றுச்சூழல் காரணிகள் – மாசு, UV கதிர்களும், கால்நடை பொருள்களும்.</li>
                            <li>🔹 சுயமுள்ள நோய்கள் – உடல் பாதுகாப்பு செல்களை தவறாக தாக்குவது.</li>
                        </ul>
                        <h3 className="text-xl font-semibold mb-4">
                            ஹோமியோபதி தோல் மற்றும் தலைமுடி பிரச்சினைகளுக்கு எவ்வாறு உதவுகிறது
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                            <li>✅ துவக்க அமைப்பை தானாகச் சரி செய்கிறது</li>
                            <li>✅ நோய்களை எதிர்கொள்ளும் நோக்கில் உடல் சீர்திருத்தம் செய்கிறது</li>
                            <li>✅ தலை முடி வளர்ச்சிக்கு பூரண ஆதரவு அளிக்கிறது</li>
                            <li>✅ வெளிப்படையான சிகிச்சைகள் கொண்டு பரிசோதனை தேவை</li>
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
            </div>

            <Footer/>
        </>
    );
};

export default SkinHairDisorders;
