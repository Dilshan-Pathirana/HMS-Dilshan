import NavBar from "./NavBar.tsx";
import Footer from "./Footer.tsx";

const AppointmentBookingTerms = () => {
    return (
        <>
            <NavBar />
            <div className="container mx-auto px-6 mt-20 py-12">
                <section className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Appointment Booking Terms & Conditions – Cure Homeopathic Medical Center
                    </h2>
                    <p className="text-gray-600 mb-6">
                        By proceeding with your appointment booking and payment on www.cure.lk, you agree to the following terms and conditions:
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        1. Non-Refundable Payments
                    </h3>
                    <ul className="list-disc pl-6 mb-4 text-gray-600">
                        <li className="mb-2">
                            All payments made through this system are strictly non-refundable, under any circumstance.
                        </li>
                        <li className="mb-2">
                            These charges are applicable only for appointment scheduling and government-related fees, and do not include consultation fees, medicine costs, hospital service charges, or any other fees that may be incurred at the medical center.
                        </li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        2. Rescheduling Policy
                    </h3>
                    <ul className="list-disc pl-6 mb-4 text-gray-600">
                        <li className="mb-2">
                            Patients are allowed only one (1) opportunity to reschedule their appointment within 30 days, subject to availability.
                        </li>
                        <li className="mb-2">
                            No additional charges will be applied for the first rescheduling. Any further requests will not be entertained.
                        </li>
                        <li className="mb-2">
                            Rescheduling must be done at least 24 hours prior to the originally scheduled appointment time.
                        </li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        3. Doctor-Initiated Cancellations
                    </h3>
                    <ul className="list-disc pl-6 mb-4 text-gray-600">
                        <li className="mb-2">
                            If the doctor cancels the appointment for any reason, patients will be allowed to reschedule their appointment up to two (2) times within the next 30 days at no additional cost.
                        </li>
                        <li className="mb-2">
                            No refunds will be issued in such cases, and patients must select an alternative available time slot within the specified rescheduling window.
                        </li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        4. Booking and Confirmation
                    </h3>
                    <ul className="list-disc pl-6 mb-4 text-gray-600">
                        <li className="mb-2">
                            Your appointment will be confirmed only after successful completion of the payment process.
                        </li>
                        <li className="mb-2">
                            A unique booking reference number will be generated and sent to you via email/SMS, which must be presented at the reception upon arrival.
                        </li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        5. Login Requirement
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Visitors must be logged in to proceed with the booking and payment process. If not logged in, you will be redirected to the login/registration page.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        6. Appointment Time Disclaimer
                    </h3>
                    <p className="text-gray-600 mb-4">
                        The time allocated for appointments is an estimated slot, and delays may occur due to medical emergencies or unforeseen circumstances.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        7. Digital Receipts
                    </h3>
                    <p className="text-gray-600 mb-4">
                        For digital receipts and booking confirmations, a valid email address must be provided at the time of booking. Alternatively, users can access their receipts under the "My Appointments" section on the Cure website.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        8. Technical & Payment Gateway Issues
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Cure Homeopathic Medical Center is not responsible for any failures due to technical issues, including payment gateway downtimes or user connectivity problems.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        9. Privacy & Data Handling
                    </h3>
                    <p className="text-gray-600 mb-4">
                        By proceeding, you acknowledge and agree to the terms outlined in our Privacy Policy, including how we collect, use, and share your personal information.
                    </p>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                        <p className="text-blue-800 font-medium">
                            Please read these terms carefully before continuing. By clicking "Proceed to Payment," you confirm that you have read, understood, and agreed to the above terms and conditions.
                        </p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        වෛද්‍ය වේලාව වෙන් කිරීමේ නියම සහ කොන්දේසි – Cure හෝමියෝපැති වෛද්‍ය මධ්‍යස්ථානය
                    </h2>
                    <p className="text-gray-600 mb-6">
                        www.cure.lk හරහා ඔබගේ වෛද්‍ය වේලාව වෙන් කර ගෙවීම් කිරීමේ ක්‍රියාවලිය ආරම්භ කිරීමෙන්, ඔබ පහත නියමයන්ට එකඟ වන බව දක්වයි:
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        1.	ආපසු ගෙවීම් නොකෙරේ
                    </h3>
                    <ul className="list-disc pl-6 mb-4 text-gray-600">
                        <li className="mb-2">
                            මෙම පද්ධතිය හරහා සිදු කරන සියළු ගෙවීම් කිසිඳු අවස්ථාවකදී ආපසු ලබාදීමකට යටත් නොවේ.
                        </li>
                        <li className="mb-2">
                            මෙය වෙන් කිරීමේ ගාස්තු සහ රජයේ අදාළ ගාස්තු සඳහා පමණක් වන අතර, රෝහල් ගාස්තු, ඖෂධ ගාස්තු, වෛද්‍ය උපදෙස් ගාස්තු හෝ වෙනත් කිසිදු ගාස්තු සඳහා මෙය අදාළ නොවේ.
                        </li>
                        <li className="mb-2">
                            මුල්වේවී නිවේදනය කළ නියමිත වෛද්‍ය හමුවට පැය 24 කට පෙර අවම වශයෙන් කාලය වෙනස් කිරීම් සිදු කළ යුතුය
                        </li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        2.	වේලාව යළි සකස් කිරීමේ ප්‍රතිපත්තිය
                    </h3>
                    <ul className="list-disc pl-6 mb-4 text-gray-600">
                        <li className="mb-2">
                            රෝගීන්ට එක වරක් පමණක් එම වර්ෂයේම මාසය තුළ, ඔවුන්ගේ වේලාව යළි සකස් කිරීමට ඉඩ ලබා දේ.
                        </li>
                        <li className="mb-2">
                            මෙයට අමතර ගාස්තු කිසිවක් අය නොකෙරේ. එයට අමතර යළි සකස් කිරීම් පිළිගනු නොලැබේ.
                        </li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        3.	වෛද්‍යයා විසින් වේලාව අවලංගු කිරීම
                    </h3>
                    <ul className="list-disc pl-6 mb-4 text-gray-600">
                        <li className="mb-2">
                            වෛද්‍යවරයා විසින් වේලාව අවලංගු කරන අවස්ථාවක, රෝගීන්ට දිගු දින 30ක කාලය තුළ දවස් 2 වතාවක් පමණක් වෙනත් වේලාවකට යළි සකස් කිරීමේ හැකියාව ලබා දේ.
                        </li>
                        <li className="mb-2">
                            ආපසු ගෙවීම් කිසිදු අවස්ථාවකදී සිදු නොවේ. රෝගීන්ට මෙම කාලසීමාව තුළ ලබා ඇති වේලා සූචි අනුව තෝරාගැනීමක් සිදු කළ යුතුය.
                        </li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        4.	වෙන් කිරීම සහ තහවුරු කිරීම
                    </h3>
                    <ul className="list-disc pl-6 mb-4 text-gray-600">
                        <li className="mb-2">
                            ගෙවීම සාර්ථකව නිම වීමෙන් පසුව ඔබගේ වේලාව තහවුරු වේ.
                        </li>
                        <li className="mb-2">
                            ඔබට වෙන් කිරීමේ අංකයක් ලබාදෙනු ලැබේ, එය රෝහල්ගත වීමේදී දැක්විය යුතුය
                        </li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        5.	පිවිසුම අවශ්‍ය වේ
                    </h3>
                    <p className="text-gray-600 mb-4">
                        ගෙවීමේ ක්‍රියාවලියට පිවිසීමට පෙර, පරිශීලකයා පිවිසුමට ලොග් වීමක් සිදුකර තිබිය යුතුය. එසේ නොවන්නේනම්, ඔවුන් ලොග් වීමේ හෝ ලියාපදිංචි පිටුවට යොමුවනු ඇත.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        6.	වෙන් කළ වේලාවේ පරීක්ෂණය
                    </h3>
                    <p className="text-gray-600 mb-4">
                        ඔබට ලබාදෙන වේලාව සම්භාව්‍ය වේලාවක් වන අතර, සෞඛ්‍ය හදිසි තත්ත්වයන් හේතුවෙන් පමණක් ප්‍රමාද විය හැකිය.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        7.	ඩිජිටල් රිසිට් ලබාගැනීම
                    </h3>
                    <p className="text-gray-600 mb-4">
                        වෙන් කිරීමේ තොරතුරු සහ රිසිට්පත් සඳහා වලංගු විද්‍යුත් තැපෑලක් ලබාදිය යුතුය. විකල්ප වශයෙන්, “මගේ වෙන්කිරීම්” මෙනුව හරහා මෙම තොරතුරු ලබාගත හැකිය.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        8.	තාක්ෂණික හෝ ගෙවීම් ගේට්වේ ගැටලු
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Cure වෛද්‍ය මධ්‍යස්ථානය කිසිඳු තාක්ෂණික ගැටලුවකට හෝ ගෙවීම් ගේට්වේ වල අපව්‍රුත්තියකට වගකිවයුතු නොවේ.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        9.	පෞද්ගලික තොරතුරු සහ රහස්‍යතාවය
                    </h3>
                    <p className="text-gray-600 mb-4">
                        ඔබ විසින් ලබාදෙන සියලුම තොරතුරු අපගේ රහස්‍යතා ප්‍රතිපත්තිය යටතේ ක්‍රියාත්මක වේ. මෙම ගිවිසුම අනුගමනය කිරීමෙන් ඔබ තොරතුරු සැකසීම සඳහා එකඟතාවය දැක්වීමක් කරයි.
                    </p>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                        <p className="text-blue-800 font-medium">
                            කරුණාකර මෙම නියමයන් සම්පුර්ණයෙන් කියවීමෙන් පසු “ගෙවීමට පිවිසෙන්න” බොත්තම ඔබා ඔබ මෙම නියමයන්ට එකඟ වන බව තහවුරු කරන්න.
                        </p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        மருத்துவ முன்பதிவு விதிமுறைகள் மற்றும் நிபந்தனைகள் – Cure ஹோமியோபதிக் மருத்துவ மையம்
                    </h2>
                    <p className="text-gray-600 mb-6">
                        www.cure.lk மூலமாக நீங்கள் உங்கள் டாக்டர் சந்திப்பை முன்பதிவு செய்து பணம் செலுத்தும் முன், கீழ்க்கண்ட நிபந்தனைகளை ஏற்கின்றீர்கள்:
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        1. பணம் திருப்பி வழங்கப்படமாட்டாது
                    </h3>
                    <ul className="list-disc pl-6 mb-4 text-gray-600">
                        <li className="mb-2">
                            இந்த தளத்தின் வாயிலாக செய்யப்படும் அனைத்து பணப் பரிமாற்றங்களும் எந்த சந்தர்ப்பத்திலும் திருப்பி வழங்கப்படாது.
                        </li>
                        <li className="mb-2">
                            இந்தக் கட்டணங்கள் மருத்துவ சந்திப்பு முன்பதிவிற்கும், அரசாங்கத்தால் விதிக்கப்பட்ட கட்டணங்களுக்கும் மட்டும் பொருந்தும். மருத்துவ ஆலோசனைக்கான கட்டணம், மருந்து செலவுகள், மருத்துவமனை கட்டணங்கள் அல்லது பிற செலவுகள் இதில் சேர்க்கப்படவில்லை.
                        </li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        2. முன்பதிவை மாற்றும் கொள்கை
                    </h3>
                    <ul className="list-disc pl-6 mb-4 text-gray-600">
                        <li className="mb-2">
                            நோயாளிகளுக்கு ஒருமுறை மட்டும், அதே மாதத்துக்குள், அவர்கள் முன்பதிவை இலவசமாக மாற்றும் அனுமதி வழங்கப்படும்.
                        </li>
                        <li className="mb-2">
                            இதற்காக கூடுதல் கட்டணம் எதுவும் வசூலிக்கப்படாது. மேலும் மாற்றங்களை அனுமதிக்க முடியாது.
                        </li>
                        <li className="mb-2">
                            முதல் முறை திட்டமிடப்பட்ட சந்திப்புக்கு குறைந்தது 24 மணி நேரத்திற்கு முன்பே நேர மாற்றம் செய்யப்பட வேண்டும்.
                        </li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        3. மருத்துவரால் சந்திப்பு ரத்து செய்யப்படும் நிலைமை
                    </h3>
                    <ul className="list-disc pl-6 mb-4 text-gray-600">
                        <li className="mb-2">
                            ஒரு டாக்டர் சந்திப்பை மருத்துவர் ரத்து செய்தால், நோயாளிக்கு அடுத்த 30 நாட்களுக்குள் இரண்டு (2) முறை வேறு நேரத்திற்கு மாற்றும் அனுமதி வழங்கப்படும்.
                        </li>
                        <li className="mb-2">
                            பணம் திருப்பித் தரப்படாது. நோயாளி, குறிப்பிட்ட காலத்துக்குள் கிடைக்கும் கால அட்டவணையை வைத்து புதிய நேரத்தை தேர்வு செய்ய வேண்டும்.
                        </li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        4. முன்பதிவும் உறுதிப்படுத்தலும்
                    </h3>
                    <ul className="list-disc pl-6 mb-4 text-gray-600">
                        <li className="mb-2">
                            பணம் செலுத்தல் வெற்றிகரமாக முடிந்த பிறகே உங்கள் சந்திப்பு உறுதியாகும்.
                        </li>
                        <li className="mb-2">
                            உங்களுக்கு ஒரு முன்பதிவு குறிப்பு எண் வழங்கப்படும். மருத்துவமனைக்கு வந்தபோது இதை காட்ட வேண்டும்.
                        </li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        5. உள்நுழைவு தேவைப்படுகிறது
                    </h3>
                    <p className="text-gray-600 mb-4">
                        பணம் செலுத்தும் செயல்முறையைத் தொடர, பயனர் உள்நுழைந்திருக்க வேண்டும். உள்நுழையவில்லை என்றால், உள்நுழைவு அல்லது பதிவு பக்கத்திற்குத் திருப்பி விடப்படுவீர்கள்.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        6. சந்திப்பு நேரம் பற்றி அறிவிப்பு
                    </h3>
                    <p className="text-gray-600 mb-4">
                        வழங்கப்படும் சந்திப்பு நேரம் ஒரு தற்காலிக மதிப்பீடு மட்டுமே, இது அவசர மருத்துவ சூழ்நிலைகளால் மாற்றமடையலாம்.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        7. மின்னணு ரசீது
                    </h3>
                    <p className="text-gray-600 mb-4">
                        மின்னணு ரசீதுகளைப் பெற, நீங்கள் செல்லுபடியாகும் மின்னஞ்சல் முகவரியை வழங்க வேண்டும். மாற்றாக, "என் சந்திப்புகள்" பகுதியில் உங்களுடைய முன்பதிவுகளை பார்வையிடலாம்.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        8. தொழில்நுட்ப அல்லது கட்டண வழித்தடத் தோல்விகள்
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Cure மருத்துவ மையம் எந்தவொரு தொழில்நுட்ப பிழைகளுக்கும் அல்லது பணப் பரிமாற்ற வழித்தடச் சிக்கல்களுக்கும் பொறுப்பல்ல.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        9. தனிப்பட்ட தகவல்கள் மற்றும் ரகசியத்தன்மை
                    </h3>
                    <p className="text-gray-600 mb-4">
                        நீங்கள் வழங்கும் அனைத்து தகவல்களும் எங்களது தனியுரிமைக் கொள்கை ஏற்பாக செயல்படுத்தப்படும். இதை ஏற்கின்றதன் மூலம், உங்கள் தரவுகளை எங்களால் செயலாக்க அனுமதிக்கிறீர்கள்.
                    </p>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                        <p className="text-blue-800 font-medium">
                            மேலுள்ள நிபந்தனைகளை முழுமையாக படித்ததற்கு பிறகு "பணம் செலுத்தவும்" என்பதைக் கிளிக் செய்வதன் மூலம், நீங்கள் இவை அனைத்தையும் ஏற்கின்றீர்கள் என்பதை உறுதிப்படுத்துகிறீர்கள்.
                        </p>
                    </div>
                </section>
            </div>
            <Footer />
        </>
    );
};

export default AppointmentBookingTerms;
