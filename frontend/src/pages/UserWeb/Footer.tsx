import { FaEnvelope, FaFacebook } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="bg-primary-500 text-neutral-100 mt-9 py-6 px-4 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-center md:text-left mb-4 md:mb-0">
                    <Link to="/" className="hover:opacity-80 transition-opacity">
                        <h3 className="text-lg font-bold">Cure Health Care</h3>
                    </Link>
                    <p className="text-sm mt-2">
                        Natural Healing for a Healthier Tomorrow
                    </p>
                </div>

                <div className="flex justify-center md:justify-end space-x-4">
                    <a
                        href="https://web.facebook.com/people/Cure-Health-Care/100072487485990/"
                        className="text-neutral-100 text-2xl"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <FaFacebook />
                    </a>
                    <a
                        href="mailto:info@cure.lk"
                        className="text-neutral-100 text-2xl"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <FaEnvelope />
                    </a>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <div className="flex space-x-6 text-sm">
                    <a href="/about-us" className="hover:underline">
                        About Us
                    </a>
                    <a href="/privacy-policy" className="hover:underline">
                        Privacy Policy
                    </a>
                    <a href="/about-us/mission" className="hover:underline">
                        Our Mission
                    </a>
                    <a href="/appointment-booking-terms" className="hover:underline">
                        Appointment Booking Terms & Conditions
                    </a>
                </div>
            </div>

            <div className="mt-6 text-center border-t border-white pt-4">
                <p className="text-sm">
                    © 2025 Cure Health Care. All Rights Reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
