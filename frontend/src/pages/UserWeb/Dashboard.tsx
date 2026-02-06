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
import { Button } from "../../components/ui/Button";

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
        <div className="bg-neutral-50 min-h-screen">
            <NavBar />
            <HeroSection />

            {/* Stats Section */}
            <div className="relative z-10 -mt-10 px-6 max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row justify-around py-10 px-4 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
                    <div className="text-center p-4">
                        <h3 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">24/7</h3>
                        <p className="text-neutral-500 font-medium mt-1">Online Support</p>
                    </div>
                    <div className="text-center p-4">
                        <h3 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">20+</h3>
                        <p className="text-neutral-500 font-medium mt-1">Specialist Doctors</p>
                    </div>
                    <div className="text-center p-4">
                        <h3 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">100+</h3>
                        <p className="text-neutral-500 font-medium mt-1">Active Patients</p>
                    </div>
                </div>
            </div>

            <SpecialisedTreatments />

            <section className="py-20 px-6 md:px-12 flex flex-col md:flex-row items-center max-w-7xl mx-auto gap-12">
                <div className="w-full md:w-1/2 relative group">
                    <div className="absolute inset-0 bg-primary-600 rounded-2xl rotate-3 opacity-20 group-hover:rotate-2 transition-transform duration-500" />
                    <img
                        src={image1}
                        alt="Homeopathy"
                        className="relative w-full rounded-2xl shadow-lg transform transition-transform duration-500 group-hover:-translate-y-2"
                    />
                </div>
                <div className="w-full md:w-1/2">
                    <span className="text-primary-600 font-semibold tracking-wider text-sm uppercase mb-2 block">Why Choose Us</span>
                    <h2 className="text-4xl font-bold text-neutral-900 mb-6 leading-tight">
                        Experience the Power of <br />
                        <span className="text-primary-600">Holistic Healing</span>
                    </h2>
                    <ul className="space-y-4">
                        {[
                            "Trusted Homeopathic Experts – Your Health, Our Priority!",
                            "Safe, Natural, and Effective Remedies Tailored for You!",
                            "Holistic Healing with No Harmful Side Effects!",
                            "Easily Accessible, Reliable, and Affordable Healthcare!",
                            "Combining Tradition with Modern Expertise for Better Health!",
                            "Gentle Yet Powerful Treatments for Long-Lasting Wellness!",
                            "Root-Cause Treatments for a Healthier, Happier Life!"
                        ].map((item, idx) => (
                            <li key={idx} className="flex items-start text-neutral-600">
                                <div className="mt-1 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 mr-3">
                                    <span className="text-xs font-bold">✔</span>
                                </div>
                                <span className="leading-relaxed">{item}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-10">
                        <Link to="/why-choose-us">
                            <Button size="lg" className="rounded-full shadow-primary hover:shadow-primary-hover">
                                Learn More <span className="ml-2">→</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-20 px-6 md:px-12 bg-neutral-100/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-primary-600 font-semibold tracking-wider text-sm uppercase">Medical Insights</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2">Latest Blog Posts</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                img: image1,
                                title: "Understanding Homeopathy for Better Health",
                                desc: "Homeopathy is a holistic system of medicine that treats the individual as a whole...",
                                link: "/blog/understanding-homeopathy"
                            },
                            {
                                img: image2,
                                title: "The Role of Nutrition in Holistic Healing",
                                desc: "Nutrition plays a crucial role in supporting the body’s natural healing processes...",
                                link: "/blog/role-of-nutrition"
                            },
                            {
                                img: image1,
                                title: "How Homeopathy Supports Mental Health",
                                desc: "Mental health is as important as physical health. Discover how homeopathy can support...",
                                link: "/blog/homeopathy-mental-health"
                            }
                        ].map((post, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-md border border-neutral-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                                <div className="h-48 overflow-hidden">
                                    <img
                                        src={post.img}
                                        alt={post.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>
                                <div className="p-6 flex-grow flex flex-col">
                                    <h3 className="text-xl font-bold text-neutral-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="text-neutral-500 mb-4 line-clamp-3 text-sm leading-relaxed">
                                        {post.desc}
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-neutral-100">
                                        <a
                                            href={post.link}
                                            target="_blank"
                                            className="inline-flex items-center text-primary-600 font-semibold text-sm hover:text-primary-700 hover:translate-x-1 transition-all"
                                        >
                                            Read More <span className="ml-1">→</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 px-6 md:px-12 flex flex-col md:flex-row items-center max-w-7xl mx-auto gap-12">
                <div className="w-full md:w-1/2">
                    <span className="text-primary-600 font-semibold tracking-wider text-sm uppercase mb-2 block">Our Vision</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6 leading-tight">
                        The Future of <br />
                        <span className="text-primary-600">Quality Health</span>
                    </h2>
                    <p className="text-neutral-600 mb-4 text-lg leading-relaxed">
                        At Cure.lk, we believe in a holistic approach to
                        well-being. Homeopathy, a time-tested system of natural
                        healing, is redefining how we perceive health and
                        wellness.
                    </p>
                    <p className="text-neutral-600 mb-6 text-lg leading-relaxed">
                        Experience the benefits of natural, personalized care
                        for a healthier tomorrow.
                    </p>
                    <Link to="/about-us">
                        <Button variant="outline" size="lg" className="rounded-full">
                            Learn More <span className="ml-2">→</span>
                        </Button>
                    </Link>
                </div>
                <div className="w-full md:w-1/2 flex justify-center relative">
                    <div className="absolute inset-0 bg-secondary-500 rounded-2xl -rotate-3 opacity-10 scale-95" />
                    <img
                        src={image2}
                        alt="Vision"
                        className="relative w-full max-w-lg rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300"
                    />
                </div>
            </section>

            <Footer />
            <ChatWidget />
        </div>
    );
};

export default Dashboard;
