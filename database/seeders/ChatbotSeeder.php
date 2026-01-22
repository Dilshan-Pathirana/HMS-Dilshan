<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChatbotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing FAQs
        DB::table('chatbot_faqs')->truncate();
        
        // Seed 50 bilingual FAQs
        $faqs = [
            // ==================== GENERAL (1-5) ====================
            [
                'category' => 'general',
                'question_en' => 'What is homeopathy?',
                'answer_en' => "Homeopathy is a natural system of medicine that has been practiced worldwide for over 200 years. It is based on the principle of 'like cures like' — using highly diluted substances to stimulate the body's natural healing response. Homeopathy treats the whole person, not just symptoms.\n\nPlease note: This chatbot provides general information only. Please consult a registered doctor for medical advice.",
                'question_si' => 'හෝමියෝපති යනු කුමක්ද?',
                'answer_si' => "හෝමියෝපති යනු වසර 200 කට වැඩි කාලයක් පුරා ලොව පුරා ක්‍රියාත්මක වන ස්වාභාවික වෛද්‍ය ක්‍රමයකි. එය 'සමාන සමානයෙන් සුව කරයි' යන මූලධර්මය මත පදනම් වේ — ශරීරයේ ස්වාභාවික සුවය උත්තේජනය කිරීමට ඉතා තනුක ද්‍රව්‍ය භාවිතා කරයි. හෝමියෝපති රෝග ලක්ෂණ පමණක් නොව සමස්ත පුද්ගලයාටම ප්‍රතිකාර කරයි.\n\nසටහන: මෙම චැට්බෝට් සාමාන්‍ය තොරතුරු පමණක් ලබාදේ. වෛද්‍ය උපදෙස් සඳහා ලියාපදිංචි වෛද්‍යවරයෙකු හමුවන්න.",
                'keywords' => json_encode(['homeopathy', 'what is', 'explain', 'definition', 'mean', 'about homeopathy', 'හෝමියෝපති', 'කුමක්ද']),
                'is_active' => true,
                'priority' => 100
            ],
            [
                'category' => 'general_homeopathy',
                'question_en' => 'Is homeopathy safe? Are there side effects?',
                'answer_en' => "Homeopathic medicines are generally considered safe when prescribed by a qualified practitioner. They are prepared through a rigorous process of dilution and are non-toxic. Side effects are rare but can occur if a remedy is overused. Always follow the dosage instructions given by your homeopathic doctor.\n\nPlease note: This chatbot provides general information only. Please consult a registered doctor for medical advice.",
                'question_si' => 'හෝමියෝපති ආරක්ෂිතද? අතුරු ආබාධ තිබේද?',
                'answer_si' => "සුදුසුකම් ලත් වෛද්‍යවරයෙකු විසින් නියම කළ විට හෝමියෝපති ඖෂධ සාමාන්‍යයෙන් ආරක්ෂිත ලෙස සැලකේ. ඒවා දැඩි තනුකරණ ක්‍රියාවලියක් හරහා සකස් කර ඇති අතර විෂ නොවේ. ඖෂධයක් අධික ලෙස භාවිතා කළහොත් අතුරු ආබාධ ඇතිවිය හැකි නමුත් දුර්ලභ ය. ඔබේ හෝමියෝපති වෛද්‍යවරයා ලබා දෙන මාත්‍රා උපදෙස් සැමවිටම අනුගමනය කරන්න.\n\nසටහන: මෙම චැට්බෝට් සාමාන්‍ය තොරතුරු පමණක් ලබාදේ. වෛද්‍ය උපදෙස් සඳහා ලියාපදිංචි වෛද්‍යවරයෙකු හමුවන්න.",
                'keywords' => json_encode(['safe', 'safety', 'side effects', 'dangerous', 'risk', 'harmful', 'ආරක්ෂිත', 'අතුරු ආබාධ']),
                'is_active' => true,
                'priority' => 95
            ],
            [
                'category' => 'general_homeopathy',
                'question_en' => 'Are homeopathic medicines natural?',
                'answer_en' => "Yes. Homeopathic medicines are derived from natural sources such as plants, minerals, and sometimes animal products. They undergo a special preparation process called 'potentization' which involves serial dilution and vigorous shaking (succussion). This process is believed to enhance their therapeutic properties while minimizing any potential toxicity.\n\nPlease note: This chatbot provides general information only. Please consult a registered doctor for medical advice.",
                'question_si' => 'හෝමියෝපති ඖෂධ ස්වභාවිකද?',
                'answer_si' => "ඔව්. හෝමියෝපති ඖෂධ පැළෑටි, ඛනිජ, සහ සමහර විට සත්ව නිෂ්පාදන වැනි ස්වාභාවික මූලාශ්‍රවලින් ලබාගනී. ඒවා 'පොටෙන්ටයිසේෂන්' නමින් හැඳින්වෙන විශේෂ සැකසුම් ක්‍රියාවලියකට භාජනය වේ. මෙම ක්‍රියාවලිය ඔවුන්ගේ චිකිත්සක ගුණාංග වැඩි දියුණු කරන අතරම විභව විෂ භාවය අවම කරයි.\n\nසටහන: මෙම චැට්බෝට් සාමාන්‍ය තොරතුරු පමණක් ලබාදේ. වෛද්‍ය උපදෙස් සඳහා ලියාපදිංචි වෛද්‍යවරයෙකු හමුවන්න.",
                'keywords' => json_encode(['natural', 'organic', 'plant', 'mineral', 'ස්වභාවික', 'ස්වාභාවික', 'පැළෑටි']),
                'is_active' => true,
                'priority' => 90
            ],

            // Doctor Information FAQs
            [
                'category' => 'doctor_info',
                'question_en' => 'Which doctors are available in Colombo?',
                'answer_en' => "We have several experienced homeopathic doctors practicing in our Colombo branches. You can view their profiles, areas of specialization, and available time slots by visiting our 'Find a Doctor' page. For personalized recommendations, please contact our helpdesk.\n\nPlease note: This chatbot provides general information only. Please consult a registered doctor for medical advice.",
                'question_si' => 'කොළඹ කුමන වෛද්‍යවරුන් ලබාගත හැකිද?',
                'answer_si' => "අපගේ කොළඹ ශාඛාවල පුහුණුව ලබන පළපුරුදු හෝමියෝපති වෛද්‍යවරු කිහිප දෙනෙක් සිටිති. ඔබට ඔවුන්ගේ පැතිකඩ, විශේෂීකරණ ක්ෂේත්‍ර, සහ ලබාගත හැකි කාල පරාස 'වෛද්‍යවරයෙක් සොයන්න' පිටුව වෙත පිවිසීමෙන් බැලිය හැක. පුද්ගලික නිර්දේශ සඳහා, කරුණාකර අපගේ උදව් මේසය අමතන්න.\n\nසටහන: මෙම චැට්බෝට් සාමාන්‍ය තොරතුරු පමණක් ලබාදේ. වෛද්‍ය උපදෙස් සඳහා ලියාපදිංචි වෛද්‍යවරයෙකු හමුවන්න.",
                'keywords' => json_encode(['colombo', 'doctors', 'available', 'which doctors', 'කොළඹ', 'වෛද්‍යවරුන්', 'ලබාගත හැකි']),
                'is_active' => true,
                'priority' => 85
            ],
            [
                'category' => 'doctor_info',
                'question_en' => 'How can I book an appointment with a specific doctor?',
                'answer_en' => "To book an appointment:\n\n1. Visit our online booking portal or use the Cure.lk app\n2. Select the doctor you prefer\n3. Choose an available date and time slot\n4. Confirm your appointment\n\nAlternatively, you can call our clinic directly to make a booking. Walk-ins are also welcome but subject to availability.\n\nPlease note: This chatbot provides general information only. Please consult a registered doctor for medical advice.",
                'question_si' => 'විශේෂිත වෛද්‍යවරයෙකු සමඟ හමුවීමක් වෙන් කර ගන්නේ කෙසේද?',
                'answer_si' => "හමුවක් වෙන් කිරීමට:\n\n1. අපගේ ඔන්ලයින් බුකින් පෝර්ටලයට හෝ Cure.lk ඇප් එකට පිවිසෙන්න\n2. ඔබ කැමති වෛද්‍යවරයා තෝරන්න\n3. ලබාගත හැකි දිනයක් සහ වේලාවක් තෝරන්න\n4. ඔබේ හමුවීම තහවුරු කරන්න\n\nඒ වෙනුවට, ඔබට බුකිං එකක් කිරීමට අපගේ සායනයට ඍජුව ඇමතීමටද හැකිය. Walk-ins ද සාදරයෙන් පිළිගනු ලැබේ නමුත් ලබා ගත හැකි බවට යටත් වේ.\n\nසටහන: මෙම චැට්බෝට් සාමාන්‍ය තොරතුරු පමණක් ලබාදේ. වෛද්‍ය උපදෙස් සඳහා ලියාපදිංචි වෛද්‍යවරයෙකු හමුවන්න.",
                'keywords' => json_encode(['book', 'appointment', 'schedule', 'reserve', 'booking', 'හමුවක්', 'වෙන් කරන්න', 'බුකින්']),
                'is_active' => true,
                'priority' => 95
            ],

            // Disease/Treatment Capability FAQs
            [
                'category' => 'doctor_capability',
                'question_en' => 'Can homeopathy treat asthma?',
                'answer_en' => "Homeopathy offers supportive treatments that may help manage asthma symptoms and reduce the frequency of attacks. Treatment is individualized based on your unique symptom profile. However, homeopathic treatment should be used in consultation with a qualified doctor and should not replace emergency inhalers or other prescribed medications without medical advice.\n\nPlease note: This chatbot provides general information only. Please consult a registered doctor for medical advice.",
                'question_si' => 'හෝමියෝපතිවලට ඇස්මා ප්‍රතිකාර කළ හැකිද?',
                'answer_si' => "ඇස්මා රෝග ලක්ෂණ කළමනාකරණය කිරීමට සහ ප්‍රහාර සංඛ්‍යාතය අඩු කිරීමට හෝමියෝපති සහාය ප්‍රතිකාර ලබා දෙයි. ප්‍රතිකාරය ඔබේ අද්විතීය රෝග ලක්ෂණ පැතිකඩය මත පදනම්ව තනි පුද්ගල ලෙස සිදු කෙරේ. කෙසේ වෙතත්, හෝමියෝපති ප්‍රතිකාරය සුදුසුකම් ලත් වෛද්‍යවරයෙකු සමඟ උපදේශනය කර භාවිතා කළ යුතු අතර වෛද්‍ය උපදෙස් නොමැතිව හදිසි ආශ්වාසක හෝ වෙනත් නියමිත ඖෂධ ප්‍රතිස්ථාපනය නොකළ යුතුය.\n\nසටහන: මෙම චැට්බෝට් සාමාන්‍ය තොරතුරු පමණක් ලබාදේ. වෛද්‍ය උපදෙස් සඳහා ලියාපදිංචි වෛද්‍යවරයෙකු හමුවන්න.",
                'keywords' => json_encode(['asthma', 'breathing', 'respiratory', 'inhaler', 'ඇස්මා', 'හුස්ම', 'ශ්වසන']),
                'is_active' => true,
                'priority' => 85
            ],
            [
                'category' => 'doctor_capability',
                'question_en' => 'Can homeopathy help with skin diseases?',
                'answer_en' => "Homeopathy is often used for chronic skin conditions such as eczema, psoriasis, acne, and urticaria. Treatment focuses on the underlying causes and individual constitution rather than just suppressing symptoms. A thorough consultation with a homeopathic doctor is necessary for proper evaluation and treatment.\n\nPlease note: This chatbot provides general information only. Please consult a registered doctor for medical advice.",
                'question_si' => 'හෝමියෝපතිවලට සම රෝග සඳහා උදව් කළ හැකිද?',
                'answer_si' => "එක්සීමා, සොරියාසිස්, කුරුලෑ, සහ උර්ටිකේරියා වැනි නිදන්ගත සම රෝග සඳහා හෝමියෝපති බොහෝ විට භාවිතා වේ. ප්‍රතිකාරය රෝග ලක්ෂණ මර්දනය කිරීම වෙනුවට යටින් පවතින හේතු සහ තනි ශරීර ස්වභාවය කෙරෙහි අවධානය යොමු කරයි. නිසි ඇගයීම සහ ප්‍රතිකාර සඳහා හෝමියෝපති වෛද්‍යවරයෙකු සමඟ සවිස්තරාත්මක උපදේශනයක් අවශ්‍ය වේ.\n\nසටහන: මෙම චැට්බෝට් සාමාන්‍ය තොරතුරු පමණක් ලබාදේ. වෛද්‍ය උපදෙස් සඳහා ලියාපදිංචි වෛද්‍යවරයෙකු හමුවන්න.",
                'keywords' => json_encode(['skin', 'eczema', 'psoriasis', 'acne', 'rash', 'dermatology', 'සම', 'කුරුලෑ', 'රෝග']),
                'is_active' => true,
                'priority' => 85
            ],

            // Appointment FAQs
            [
                'category' => 'appointment',
                'question_en' => 'When is the next available appointment?',
                'answer_en' => "Appointment availability varies depending on the doctor and branch. To check the next available slot, please:\n\n1. Visit our online booking page\n2. Select your preferred doctor or 'Any available doctor'\n3. View real-time availability\n\nYou can also call our clinic directly for immediate assistance.\n\nPlease note: This chatbot provides general information only. Please consult a registered doctor for medical advice.",
                'question_si' => 'ඊළඟ ලබාගත හැකි හමුවීම කවදාද?',
                'answer_si' => "වෛද්‍යවරයා සහ ශාඛාව අනුව හමුවීම් ලබාගත හැකි බව වෙනස් වේ. ඊළඟ ලබාගත හැකි කාල පරාසය පරීක්ෂා කිරීමට, කරුණාකර:\n\n1. අපගේ ඔන්ලයින් බුකින් පිටුවට පිවිසෙන්න\n2. ඔබ කැමති වෛද්‍යවරයා හෝ 'ඕනෑම ලබාගත හැකි වෛද්‍යවරයෙක්' තෝරන්න\n3. තත්‍ය කාලීන ලබාගත හැකි බව බලන්න\n\nක්ෂණික සහාය සඳහා ඔබට අපගේ සායනයට ඍජුව ඇමතීමටද හැක.\n\nසටහන: මෙම චැට්බෝට් සාමාන්‍ය තොරතුරු පමණක් ලබාදේ. වෛද්‍ය උපදෙස් සඳහා ලියාපදිංචි වෛද්‍යවරයෙකු හමුවන්න.",
                'keywords' => json_encode(['next', 'available', 'appointment', 'slot', 'when', 'ඊළඟ', 'ලබාගත හැකි', 'හමුවීම', 'කවදා']),
                'is_active' => true,
                'priority' => 90
            ],

            // Administrative FAQs
            [
                'category' => 'hospital_info',
                'question_en' => 'Do you accept walk-in patients?',
                'answer_en' => "Yes, we accept walk-in patients at all our branches. However, priority is given to patients with prior appointments. Walk-in consultations are subject to doctor availability and may require a short wait. For urgent needs, please call ahead to check current wait times.\n\nPlease note: This chatbot provides general information only. Please consult a registered doctor for medical advice.",
                'question_si' => 'ඔබ walk-in රෝගීන් පිළිගන්නවාද?',
                'answer_si' => "ඔව්, අපි අපගේ සියලුම ශාඛාවල walk-in රෝගීන් පිළිගනිමු. කෙසේ වෙතත්, පෙර හමුවීම් ඇති රෝගීන්ට ප්‍රමුඛතාවය ලැබේ. Walk-in උපදේශන වෛද්‍ය ලබාගත හැකි බවට යටත් වන අතර කෙටි රැඳී සිටීමක් අවශ්‍ය විය හැක. හදිසි අවශ්‍යතා සඳහා, වත්මන් රැඳී සිටීමේ කාලය පරීක්ෂා කිරීමට කරුණාකර කල්තියා ඇමතන්න.\n\nසටහන: මෙම චැට්බෝට් සාමාන්‍ය තොරතුරු පමණක් ලබාදේ. වෛද්‍ය උපදෙස් සඳහා ලියාපදිංචි වෛද්‍යවරයෙකු හමුවන්න.",
                'keywords' => json_encode(['walk-in', 'walkin', 'without appointment', 'direct', 'walk in', 'ඇවිත්', 'කෙලින්ම']),
                'is_active' => true,
                'priority' => 80
            ],
            [
                'category' => 'hospital_info',
                'question_en' => 'What are your clinic hours?',
                'answer_en' => "Our clinic hours vary by branch. Generally, most branches operate:\n\n• Weekdays: 8:00 AM – 8:00 PM\n• Saturdays: 8:00 AM – 5:00 PM\n• Sundays: 9:00 AM – 2:00 PM\n\nPlease check our website or contact your preferred branch for exact timings, as hours may differ on holidays.\n\nPlease note: This chatbot provides general information only. Please consult a registered doctor for medical advice.",
                'question_si' => 'ඔබේ සායනයේ වේලාවන් මොනවාද?',
                'answer_si' => "අපගේ සායන වේලාවන් ශාඛාව අනුව වෙනස් වේ. සාමාන්‍යයෙන්, බොහෝ ශාඛා ක්‍රියාත්මක වන්නේ:\n\n• සතියේ දිනවල: පෙ.ව. 8:00 – ප.ව. 8:00\n• සෙනසුරාදා: පෙ.ව. 8:00 – ප.ව. 5:00\n• ඉරිදා: පෙ.ව. 9:00 – ප.ව. 2:00\n\nනිවාඩු දිනවල වේලාවන් වෙනස් විය හැකි බැවින්, නිශ්චිත වේලාවන් සඳහා කරුණාකර අපගේ වෙබ් අඩවිය පරීක්ෂා කරන්න හෝ ඔබ කැමති ශාඛාව අමතන්න.\n\nසටහන: මෙම චැට්බෝට් සාමාන්‍ය තොරතුරු පමණක් ලබාදේ. වෛද්‍ය උපදෙස් සඳහා ලියාපදිංචි වෛද්‍යවරයෙකු හමුවන්න.",
                'keywords' => json_encode(['hours', 'open', 'timing', 'schedule', 'when open', 'working hours', 'වේලාවන්', 'පෙන්', 'කවදා']),
                'is_active' => true,
                'priority' => 75
            ],
        ];

        foreach ($faqs as $faq) {
            DB::table('chatbot_faqs')->insert([
                'id' => (string) Str::uuid(),
                'category' => $faq['category'],
                'question_en' => $faq['question_en'],
                'answer_en' => $faq['answer_en'],
                'question_si' => $faq['question_si'] ?? null,
                'answer_si' => $faq['answer_si'] ?? null,
                'keywords' => $faq['keywords'],
                'is_active' => $faq['is_active'],
                'priority' => $faq['priority'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Clear existing disease mappings
        DB::table('chatbot_disease_mappings')->truncate();

        // Seed Disease Mappings
        $diseaseMappings = [
            [
                'disease_name' => 'allergies',
                'specialization' => 'Immunology',
                'safe_response' => 'For allergies, our doctors specializing in Immunology can help. Homeopathy offers effective treatments for various allergic conditions including hay fever, food allergies, and skin allergies. Would you like to see available doctors for this condition?',
            ],
            [
                'disease_name' => 'asthma',
                'specialization' => 'Respiratory',
                'safe_response' => 'For asthma and respiratory conditions, we have experienced doctors who can provide homeopathic treatment. Homeopathy can help manage symptoms and reduce the frequency of attacks. Would you like to book a consultation?',
            ],
            [
                'disease_name' => 'skin problems',
                'specialization' => 'Dermatology',
                'safe_response' => 'Our Dermatology specialists can help with various skin conditions like eczema, psoriasis, acne, and other skin issues using homeopathic treatments. Would you like to see our available dermatology specialists?',
            ],
            [
                'disease_name' => 'digestive issues',
                'specialization' => 'Gastroenterology',
                'safe_response' => 'For digestive problems like IBS, acid reflux, or gastritis, our Gastroenterology specialists offer homeopathic treatments that address the root cause. Would you like to explore our doctors in this field?',
            ],
            [
                'disease_name' => 'joint pain',
                'specialization' => 'Orthopedics',
                'safe_response' => 'Our specialists in Orthopedics can help with joint pain, arthritis, and musculoskeletal issues using homeopathic approaches. Would you like to see available appointment slots?',
            ],
            [
                'disease_name' => 'anxiety',
                'specialization' => 'Psychiatry',
                'safe_response' => 'For anxiety and stress-related conditions, our Psychiatry specialists offer gentle homeopathic treatments. Mental health is important, and our doctors provide compassionate care. Would you like to schedule a consultation?',
            ],
            [
                'disease_name' => 'migraine',
                'specialization' => 'Neurology',
                'safe_response' => 'Our Neurology specialists have experience in treating migraines and chronic headaches with homeopathic remedies. Treatment is personalized based on your specific symptoms. Would you like to book an appointment?',
            ],
        ];

        foreach ($diseaseMappings as $mapping) {
            DB::table('chatbot_disease_mappings')->insert([
                'id' => (string) Str::uuid(),
                'disease_name' => $mapping['disease_name'],
                'specialization' => $mapping['specialization'],
                'safe_response' => $mapping['safe_response'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
