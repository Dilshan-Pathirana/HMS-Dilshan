import {Link} from "react-router-dom";

const English = () => {
    return (
        <div className="min-h-screen  bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-12">
                <section className="mb-16">
                    <h2 className="text-3xl font-semibold text-gray-800 mb-6">
                        Welcome to Cure Health Care International (Pvt) Ltd
                        (CHC)
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Cure Health Care International (Pvt) Ltd, commonly known
                        as CHC, is an innovative and rapidly growing company in
                        Sri Lanka’s healthcare sector. We are dedicated to
                        revolutionizing healthcare through cutting-edge
                        technology, research, and product development while
                        maintaining the highest standards of quality and
                        affordability. Our mission is to enhance and transform
                        Sri Lanka’s healthcare landscape by introducing
                        holistic, natural, and effective treatment solutions.
                        CHC is a registered business entity with a strong focus
                        on homeopathy, advanced hospital management solutions,
                        and healthcare product manufacturing.
                    </p>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <p className="text-lg font-semibold mb-2">
                            📍 Headquarters
                        </p>
                        <p className="text-gray-600">
                            "Dhamsith", Heelogama, Nikaweratiya, Sri Lanka
                        </p>
                    </div>
                </section>

                <section className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <div className="flex items-center mb-4">
                            <div className="bg-blue-100 p-3 rounded-full mr-4">
                                <svg
                                    className="w-6 h-6 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-semibold">
                                Our Vision
                            </h3>
                        </div>
                        <p className="text-gray-600">
                            To be the leading innovator in Sri Lanka’s
                            healthcare sector, bringing affordable and
                            sustainable health solutions to every citizen while
                            integrating modern technology with natural medical
                            sciences.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <div className="flex items-center mb-4">
                            <div className="bg-green-100 p-3 rounded-full mr-4">
                                <svg
                                    className="w-6 h-6 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-semibold">
                                Our Mission
                            </h3>
                        </div>
                        <ul className="text-gray-600 list-disc list-inside space-y-2">
                            <li>
                                To promote and develop homeopathy as a
                                recognized and widely accepted medical practice
                                in Sri Lanka.
                            </li>
                            <li>
                                To introduce state-of-the-art digital healthcare
                                solutions, making medical services more
                                accessible, efficient, and seamless.
                            </li>
                            <li>
                                To manufacture and distribute high-quality
                                homeopathic and healthcare products, ensuring
                                safety, affordability, and sustainability.
                            </li>
                            <li>
                                To bridge the gap between doctors and patients
                                through advanced hospital management and patient
                                engagement systems.
                            </li>
                        </ul>
                        <div className="mt-4">
                            <Link
                                to="/about-us/mission"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 font-medium hover:underline"
                            >
                                See More
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="mb-16">
                    <h2 className="text-3xl font-semibold text-gray-800 mb-8">
                        Key Initiatives
                    </h2>

                    <div className="bg-blue-50 p-8 rounded-lg mb-8">
                        <h3 className="text-2xl font-semibold mb-4">
                            www.cure.lk – Sri Lanka’s First Homeopathy Doctor &
                            Patient Platform
                        </h3>
                        <p className="text-gray-600 mb-6">
                            One of our flagship projects,{" "}
                            <strong>www.cure.lk</strong>, is Sri Lanka’s first
                            and only digital platform designed exclusively for
                            homeopathy doctors and patients. Developed by a team
                            of skilled Sri Lankan software engineers, this
                            indigenous solution provides a seamless and
                            efficient hospital management system.
                        </p>
                        <div className="bg-white p-6 rounded-lg">
                            <h4 className="font-semibold mb-2">
                                Key Features of www.cure.lk
                            </h4>
                            <ul className="list-disc pl-5 space-y-2 text-gray-600">
                                <li>
                                    ✅ Doctor Appointment Scheduling – A smart
                                    system that allows patients to book
                                    consultations effortlessly.
                                </li>
                                <li>
                                    ✅ Hospital Management System (HMS) – An
                                    all-in-one solution for clinics and
                                    hospitals to manage patient records,
                                    billing, prescriptions, and reports.
                                </li>
                                <li>
                                    ✅ Homeopathy Awareness & Education – We
                                    promote natural and holistic treatments
                                    among Sri Lankan citizens through digital
                                    platforms.
                                </li>
                                <li>
                                    ✅ Secure & User-Friendly Interface –
                                    Designed for easy access and navigation for
                                    both doctors and patients.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-green-50 p-8 rounded-lg">
                        <h3 className="text-2xl font-semibold mb-4">
                            Healthcare Product Manufacturing & Research
                        </h3>
                        <p className="text-gray-600 mb-6">
                            At CHC, we take pride in our manufacturing facility
                            in Nikaweratiya, where we research, develop, and
                            produce high-quality, natural, and effective
                            homeopathic products.
                        </p>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg text-center">
                                <p className="font-semibold mb-2">
                                    ✔ Medicated Shampoo
                                </p>
                                <p className="text-sm text-gray-600">
                                    Specially formulated for scalp health and
                                    fungal infections.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-lg text-center">
                                <p className="font-semibold mb-2">
                                    ✔ Herbal Hair Oil
                                </p>
                                <p className="text-sm text-gray-600">
                                    A natural solution for hair growth and scalp
                                    nourishment.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-lg text-center">
                                <p className="font-semibold mb-2">
                                    ✔ Creams for Pain Relief
                                </p>
                                <p className="text-sm text-gray-600">
                                    Provides symptomatic relief for muscular and
                                    joint pains.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-lg text-center">
                                <p className="font-semibold mb-2">
                                    ✔ Medicated Soap
                                </p>
                                <p className="text-sm text-gray-600">
                                    Formulated with anti-fungal and
                                    antibacterial properties.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-lg text-center">
                                <p className="font-semibold mb-2">
                                    ✔ Non-Medicated Homeopathic Sugar Globules
                                </p>
                                <p className="text-sm text-gray-600">
                                    Essential carriers for homeopathic remedies.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-16">
                    <h2 className="text-3xl font-semibold text-gray-800 mb-8">
                        Why Choose CHC?
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            "🔹 A Pioneer in Homeopathy & Digital Healthcare – We are the first company in Sri Lanka to offer a comprehensive digital platform for homeopathy doctors and patients.",
                            "🔹 Innovative & Research-Based Solutions – Our cutting-edge research & development (R&D) division focuses on creating effective and sustainable healthcare products.",
                            "🔹 Affordable & Natural Treatments – We believe that quality healthcare should be accessible to everyone, and our natural homeopathic solutions provide safe, side-effect-free treatment options.",
                            "🔹 Technology-Driven Healthcare Solutions – From appointment scheduling to clinic management, we empower doctors with advanced digital tools.",
                            "🔹 Commitment to Public Health & Awareness – We actively educate and promote homeopathy in Sri Lanka, ensuring holistic and sustainable healthcare growth.",
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                            >
                                <p className="font-semibold text-gray-800">
                                    {item}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-gray-800 text-white p-8 rounded-lg mb-16">
                    <h2 className="text-2xl font-semibold mb-4">
                        Our Commitment to the Future
                    </h2>
                    <p className="mb-4">
                        At CHC, we are committed to expanding our services,
                        developing new products, and leveraging technology to
                        make homeopathy and natural medicine more accessible to
                        the people of Sri Lanka.
                    </p>
                    <p className="mb-4">
                        We envision a future where traditional medicine and
                        modern technology come together to create a sustainable
                        and effective healthcare ecosystem for all.
                    </p>
                    <p className="font-semibold text-lg">
                        🌿 Experience the Future of Natural & Holistic
                        Healthcare with CHC! 🌿
                    </p>
                </section>

                <section className="bg-blue-600 text-white p-8 rounded-lg">
                    <h2 className="text-2xl font-semibold mb-6">
                        Get in Touch
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <p className="mb-2">
                                📍 Address: "Dhamsith", Heelogama, Nikaweratiya,
                                Sri Lanka
                            </p>
                            <p className="mb-2">📧 Email: info@cure.lk</p>
                            <p>📞 Phone: +94 740055513</p>
                        </div>
                        <div>
                            <p className="mb-4">🌐 Visit our platform:</p>
                            <a
                                href="https://www.cure.lk"
                                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold inline-block"
                            >
                                www.cure.lk
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default English;
