import NavBar from "./NavBar.tsx";
import HeroSection from "./HeroSection.tsx";
import image1 from "../../assets/image1.svg";
import image2 from "../../assets/image2.svg";
import Footer from "./Footer.tsx";
import SpecialisedTreatments from "./SpecialisedTreatments.tsx";
import ChatWidget from "../../components/chatbot/ChatWidget.tsx";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { RootState } from "../../store.tsx";

const Dashboard = () => {
    const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
    const navigate = useNavigate();
    const isAuthenticated = useTypedSelector(
        (state) => state.auth.isAuthenticated,
    );
    const userRole = useTypedSelector((state) => state.auth.userRole);

    useEffect(() => {
        if (isAuthenticated && userRole === 1) {
            navigate("/dashboard");
        }

        if (isAuthenticated && userRole === 7) {
            navigate("/pharmacy-dashboard/");
        }
    }, [isAuthenticated, userRole]);
    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />
            <HeroSection />
            <div className="bg-blue-600 text-white flex flex-col md:flex-row justify-around py-8 text-center space-y-6 md:space-y-0">
                <div className="text-center">
                    <h3 className="text-4xl font-bold">24/7</h3>
                    <p className="text-lg">Online Support</p>
                </div>
                <div className="text-center">
                    <h3 className="text-4xl font-bold">20+</h3>
                    <p className="text-lg">Doctors</p>
                </div>
                <div className="text-center">
                    <h3 className="text-4xl font-bold">100+</h3>
                    <p className="text-lg">Active Patients</p>
                </div>
            </div>
            <SpecialisedTreatments />

            <section className="py-16 px-6 md:px-12 flex flex-col md:flex-row items-center">
                <div className="w-full md:w-1/2">
                    <img
                        src={image1}
                        alt="homeopathi"
                        className="w-full rounded-xl shadow-lg"
                    />
                </div>
                <div className="w-full md:w-1/2 mt-8 md:mt-0 md:pl-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        Why You Choose Us?
                    </h2>
                    <ul className="space-y-4 text-gray-600">
                        <li className="flex items-center">
                            <span className="text-blue-600 mr-2">✔</span>
                            Trusted Homeopathic Experts – Your Health, Our
                            Priority!
                        </li>
                        <li className="flex items-center">
                            <span className="text-blue-600 mr-2">✔</span>
                            Safe, Natural, and Effective Remedies Tailored for
                            You!
                        </li>
                        <li className="flex items-center">
                            <span className="text-blue-600 mr-2">✔</span>
                            Holistic Healing with No Harmful Side Effects!
                        </li>
                        <li className="flex items-center">
                            <span className="text-blue-600 mr-2">✔</span>
                            Easily Accessible, Reliable, and Affordable
                            Healthcare!
                        </li>
                        <li className="flex items-center">
                            <span className="text-blue-600 mr-2">✔</span>
                            Combining Tradition with Modern Expertise for Better
                            Health!
                        </li>
                        <li className="flex items-center">
                            <span className="text-blue-600 mr-2">✔</span>
                            Gentle Yet Powerful Treatments for Long-Lasting
                            Wellness!
                        </li>
                        <li className="flex items-center">
                            <span className="text-blue-600 mr-2">✔</span>
                            Root-Cause Treatments for a Healthier, Happier Life!
                        </li>
                    </ul>
                    <Link
                        to="/why-choose-us"
                        className="text-blue-600 font-semibold mt-6 inline-block"
                    >
                        Learn More →
                    </Link>
                </div>
            </section>

            <section className="py-16 px-6 md:px-12 bg-gray-50">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                    Latest Blog Posts
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                        <img
                            src={image1}
                            alt="Blog Post 1"
                            className="w-full h-48 object-cover"
                        />
                        <div className="p-6 flex-grow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                Understanding Homeopathy for Better Health
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Homeopathy is a holistic system of medicine that
                                treats the individual as a whole...
                            </p>
                            <div className="mt-auto">
                                <a
                                    href="/blog/understanding-homeopathy"
                                    target="_blank"
                                    className="text-blue-600 font-semibold float-right"
                                >
                                    Read More →
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                        <img
                            src={image2}
                            alt="Blog Post 2"
                            className="w-full h-48 object-cover"
                        />
                        <div className="p-6 flex-grow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                The Role of Nutrition in Holistic Healing
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Nutrition plays a crucial role in supporting the
                                body’s natural healing processes...
                            </p>
                            <div className="mt-auto">
                                <a
                                    href="/blog/role-of-nutrition"
                                    target="_blank"
                                    className="text-blue-600 font-semibold float-right"
                                >
                                    Read More →
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                        <img
                            src={image1}
                            alt="Blog Post 3"
                            className="w-full h-48 object-cover"
                        />
                        <div className="p-6 flex-grow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                How Homeopathy Supports Mental Health
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Mental health is as important as physical
                                health. Discover how homeopathy can support
                                mental well-being...
                            </p>
                            <div className="mt-auto">
                                <a
                                    href="/blog/homeopathy-mental-health"
                                    target="_blank"
                                    className="text-blue-600 font-semibold float-right"
                                >
                                    Read More →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 px-6 md:px-12 flex flex-col md:flex-row items-center">
                <div className="w-full md:w-1/2">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        The Future of{" "}
                        <span className="text-blue-600">Quality Health</span>
                    </h2>
                    <p className="text-gray-600 mb-4">
                        At Cure.lk, we believe in a holistic approach to
                        well-being. Homeopathy, a time-tested system of natural
                        healing, is redefining how we perceive health and
                        wellness.
                    </p>
                    <p className="text-gray-600 mb-4">
                        As we move toward a future that prioritizes
                        sustainability and well-being, homeopathy provides a
                        pathway to true healing by addressing root causes and
                        restoring balance to the body.
                    </p>
                    <p className="text-gray-600 mb-6">
                        Experience the benefits of natural, personalized care
                        for a healthier tomorrow.
                    </p>
                    <Link
                        to="/about-us"
                        className="text-blue-600 font-semibold mt-6 inline-block"
                    >
                        Learn More →
                    </Link>
                </div>
                <div className="w-full md:w-1/2 flex justify-center">
                    <img
                        src={image2}
                        alt="homeopathi"
                        className="w-full max-w-md rounded-xl shadow-lg"
                    />
                </div>
            </section>

            <Footer />
            <ChatWidget />
        </div>
    );
};

export default Dashboard;
