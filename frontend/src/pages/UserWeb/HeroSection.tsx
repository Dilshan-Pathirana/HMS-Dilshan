import DoctorFilterWeb from "./AppointmentSchedule/DoctorFilterWeb.tsx";

const HeroSection = () => {
    return (
        <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-12 text-center md:text-left bg-gray-50 min-h-[400px]">
            <div className="w-full space-y-6">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                    Sample Text Test, Choose the Best<br />
                    <span className="text-blue-600">Your Doctor, Your Way!</span>
                </h2>
                <p className="text-gray-600 text-lg">
                    Easily connect with certified Homeopathic professionals and get the
                    healthcare support you need.
                </p>
                <DoctorFilterWeb />
            </div>
        </section>
    );
};

export default HeroSection;
