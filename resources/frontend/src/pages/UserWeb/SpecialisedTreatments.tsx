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
        <section className="py-16 px-6 md:px-12 text-center w-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Specialised Treatments
            </h2>

            <div className="max-w-full mx-auto">
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
                        <div key={index} className="px-2">
                            <div className="h-56 w-full bg-white p-6 rounded-xl shadow-md border flex flex-col justify-center items-center text-center transform transition-all duration-300 hover:bg-blue-100 hover:shadow-lg gap-4">
                                <div className="text-blue-600 text-5xl mb-4">
                                    {treatment.icon}
                                </div>
                                <h3 className="text-lg font-bold">
                                    {treatment.title}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    {treatment.desc}
                                </p>
                                <Link
                                    to={treatment.route}
                                    className="text-blue-600 underline font-semibold hover:text-blue-800 transition duration-300"
                                >
                                    Read More
                                </Link>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>
        </section>
    );
};

export default SpecialisedTreatments;
