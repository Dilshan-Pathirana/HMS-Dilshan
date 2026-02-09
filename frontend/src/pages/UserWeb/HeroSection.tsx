import DoctorFilterWeb from "./AppointmentSchedule/DoctorFilterWeb.tsx";

const HeroSection = () => {
    return (
        <section className="relative px-6 md:px-12 py-20 text-center md:text-left bg-gradient-to-br from-primary-50 via-white to-secondary-50 min-h-[500px] flex items-center overflow-hidden">
            {/* Background Element */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-100/40 to-transparent skew-x-12 transform origin-top-right pointer-events-none" />

            <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                <div className="w-full space-y-8">
                    <div className="space-y-4">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm tracking-wide">
                            Trusted Healthcare Provider
                        </span>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 leading-tight tracking-tight">
                            Search Smart, Choose the Best<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">
                                Your Doctor, Your Way!
                            </span>
                        </h1>
                        <p className="text-neutral-600 text-xl max-w-2xl leading-relaxed">
                            Easily connect with certified Homeopathic professionals and get the personalized healthcare support you need, anytime, anywhere.
                        </p>
                    </div>

                    <div className="w-full">
                        <DoctorFilterWeb />
                    </div>

                    <div className="flex items-center gap-6 text-sm text-neutral-500 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-success-500" />
                            <span>Verified Doctors</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary-500" />
                            <span>Instant Booking</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-secondary-500" />
                            <span>24/7 Support</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
