import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
    FaUserMd,
    FaLungs,
    FaBaby,
    FaBone,
    FaStethoscope,
    FaHandsWash,
    FaTint,
    FaBrain,
} from "react-icons/fa";

const SpecialisedTreatments = () => {
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        arrows: true,
        responsive: [
            {
                breakpoint: 1280,
                settings: {
                    slidesToShow: 3,
                },
            },
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                },
            },
        ],
    };

    return (
        <section className="py-20 px-6 md:px-12 bg-neutral-50 w-full relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="text-primary-600 font-semibold tracking-wider text-sm uppercase mb-3 block">Our Expertise</span>
                    <h2 className="text-4xl font-extrabold text-neutral-900 mb-4">
                        Specialised Treatments
                    </h2>
                    <p className="text-neutral-600 max-w-2xl mx-auto text-lg">
                        We offer comprehensive homeopathic care for a wide range of conditions,
                        providing natural and effective solutions for your well-being.
                    </p>
                </div>

                <div className="px-4 md:px-8">
                    <Slider {...settings}>
                        {[
                            {
                                icon: <FaUserMd />,
                                title: "Hormonal Disorders",
                                desc: "Specialized care for hormonal imbalances.",
                                route: "/specialised-treatments/hormonal-disorders",
                            },
                            {
                                icon: <FaLungs />,
                                title: "Respiratory Disorders",
                                desc: "Treatments for lung and breathing issues.",
                                route: "/specialised-treatments/respiratory-disorders",
                            },
                            {
                                icon: <FaBaby />,
                                title: "Fertility Problems",
                                desc: "Support for reproductive health.",
                                route: "/specialised-treatments/fertility-problems",
                            },
                            {
                                icon: <FaBone />,
                                title: "Bone & Joint Disorders",
                                desc: "Solutions for arthritis and joint pain.",
                                route: "/specialised-treatments/bone-joint-disorders",
                            },
                            {
                                icon: <FaStethoscope />,
                                title: "Gastrointestinal Disorders",
                                desc: "Digestive system treatments and care.",
                                route: "/specialised-treatments/gastrointestinal-disorders",
                            },
                            {
                                icon: <FaHandsWash />,
                                title: "Skin & Hair Disorders",
                                desc: "Treatment for skin and hair issues.",
                                route: "/specialised-treatments/skinHair-disorders",
                            },
                            {
                                icon: <FaTint />,
                                title: "Vascular Disorders",
                                desc: "Treating blood circulation problems.",
                                route: "/specialised-treatments/vascular-disorders",
                            },
                            {
                                icon: <FaBrain />,
                                title: "Psychiatric Disorders",
                                desc: "Mental health support and therapies.",
                                route: "/specialised-treatments/psychiatric-disorders",
                            },
                        ].map((treatment, index) => (
                            <div key={index} className="px-3 pb-8 pt-2">
                                <div className="h-64 w-full bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-between items-center text-center transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary-100 group">
                                    <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 text-3xl mb-4 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300">
                                        {treatment.icon}
                                    </div>
                                    <div className="flex-grow flex flex-col items-center">
                                        <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                                            {treatment.title}
                                        </h3>
                                        <p className="text-neutral-500 text-sm leading-relaxed mb-4">
                                            {treatment.desc}
                                        </p>
                                    </div>
                                    <Link
                                        to={treatment.route}
                                        className="text-primary-600 font-semibold text-sm hover:text-primary-700 transition-colors flex items-center gap-1 group-hover:gap-2 duration-300"
                                    >
                                        Learn More <span>→</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>
        </section>
    );
};

export default SpecialisedTreatments;
