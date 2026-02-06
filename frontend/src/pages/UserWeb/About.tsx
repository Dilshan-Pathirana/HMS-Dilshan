import { useState } from "react";
import NavBar from "./NavBar.tsx";
import Footer from "./Footer.tsx";
import image1 from "../../assets/image1.svg"; // reused image for now

const About = () => {
    return (
        <div className="bg-neutral-50 min-h-screen">
            <NavBar />

            <div className="relative pt-32 pb-20 px-6 md:px-12 bg-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-50 skew-x-12 transform origin-top-right pointer-events-none" />
                <div className="relative z-10 text-center max-w-4xl mx-auto">
                    <span className="text-primary-600 font-semibold tracking-wider text-sm uppercase mb-4 block">About Us</span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-neutral-900 mb-6 leading-tight">
                        We Are Dedicated To <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">Your Well-being</span>
                    </h1>
                    <p className="text-xl text-neutral-600 leading-relaxed">
                        At Cure.lk, we are committed to providing holistic, natural, and effective healthcare solutions.
                        Our mission is to empower you to live a healthier, happier life through the power of homeopathy.
                    </p>
                </div>
            </div>

            <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="w-full md:w-1/2 relative">
                        <div className="absolute inset-0 bg-secondary-200 rounded-3xl rotate-3 opacity-20 transform scale-105" />
                        <img
                            src={image1}
                            alt="About Cure.lk"
                            className="relative w-full rounded-3xl shadow-2xl z-10"
                        />
                    </div>
                    <div className="w-full md:w-1/2 space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Our Story</h2>
                            <p className="text-neutral-600 leading-relaxed text-lg">
                                Founded with a vision to make holistic healthcare accessible to everyone, Cure.lk brings together
                                experienced practitioners and modern technology. We believe in treating the person, not just the disease.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-4 text-xl font-bold">
                                    M
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-2">Our Mission</h3>
                                <p className="text-neutral-500">To provide safe, effective, and personalized homeopathic care.</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-600 mb-4 text-xl font-bold">
                                    V
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-2">Our Vision</h3>
                                <p className="text-neutral-500">A world where natural healing is the first choice for wellness.</p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <h3 className="text-xl font-bold text-neutral-900 mb-4">Why Choose Cure.lk?</h3>
                            <ul className="space-y-3">
                                {[
                                    "Certified and experienced professionals",
                                    "Personalized treatment plans",
                                    "100% natural and safe remedies",
                                    "Comprehensive support and care"
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center text-neutral-600">
                                        <span className="w-5 h-5 rounded-full bg-success-100 text-success-600 flex items-center justify-center text-xs mr-3 font-bold">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
