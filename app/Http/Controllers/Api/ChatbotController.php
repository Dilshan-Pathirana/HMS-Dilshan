<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatbotFaq;
use App\Models\Branch;
use App\Models\AllUsers\Doctor;
use App\Models\DoctorSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    // Safety disclaimer that must be included in medical-related responses (bilingual)
    private const MEDICAL_DISCLAIMER_EN = "This chatbot provides general information only. Please consult a registered doctor for medical advice.";
    private const MEDICAL_DISCLAIMER_SI = "මෙම චැට්බෝට් සාමාන්‍ය තොරතුරු පමණක් ලබාදේ. වෛද්‍ය උපදෙස් සඳහා ලියාපදිංචි වෛද්‍යවරයෙකු හමුවන්න.";

    // Category constants
    private const CATEGORY_GENERAL_HOMEOPATHY = 'general_homeopathy';
    private const CATEGORY_DOCTOR_INFO = 'doctor_info';
    private const CATEGORY_HOSPITAL_INFO = 'hospital_info';
    private const CATEGORY_APPOINTMENT = 'appointment';
    private const CATEGORY_CAPABILITY = 'doctor_capability';
    private const CATEGORY_ADMIN_FAQ = 'admin_faq';

    // Greeting keywords (English and Sinhala)
    private array $greetingKeywords = [
        'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
        'greetings', 'hola', 'howdy', 'sup', 'yo',
        'ආයුබෝවන්', 'හලෝ', 'හායි', 'සුබ උදෑසනක්', 'සුභ දවසක්', 'සුභ සන්ධ්‍යාවක්'
    ];

    // Keywords for classification (English and Sinhala)
    private array $categoryKeywords = [
        self::CATEGORY_GENERAL_HOMEOPATHY => [
            'homeopathy', 'homeopathic', 'what is homeopathy', 'how does homeopathy work',
            'is homeopathy safe', 'natural medicine', 'alternative medicine', 'holistic',
            'dilution', 'potency', 'remedy', 'constitutional', 'natural',
            'හෝමියෝපති', 'ස්වභාවික', 'ඖෂධ'
        ],
        self::CATEGORY_DOCTOR_INFO => [
            'doctor', 'dr', 'specialist', 'who is', 'doctors in', 'find doctor',
            'available doctor', 'doctors at', 'doctor near', 'physician', 'colombo',
            'doctors available', 'any doctor', 'doctor today', 'doctor tomorrow',
            'වෛද්‍ය', 'කොළඹ', 'ඩොක්ටර්', 'වෛද්‍යවරු', 'වෛද්‍යවරයා'
        ],
        self::CATEGORY_HOSPITAL_INFO => [
            'branch', 'clinic', 'hospital', 'center', 'location', 'address',
            'where', 'colombo', 'kandy', 'galle', 'kurunegala', 'contact', 'phone',
            'hours', 'timing', 'walk-in', 'walkin',
            'ශාඛා', 'රෝහල', 'ස්ථානය', 'වේලාව'
        ],
        self::CATEGORY_APPOINTMENT => [
            'appointment', 'book', 'schedule', 'available', 'slot', 'time',
            'today', 'tomorrow', 'next week', 'when can', 'availability',
            'හමුවක්', 'වේලාවක්', 'බුකින්'
        ],
        self::CATEGORY_CAPABILITY => [
            'treat', 'cure', 'help with', 'can doctor', 'disease', 'condition',
            'asthma', 'skin', 'allergy', 'migraine', 'arthritis', 'diabetes',
            'pain', 'anxiety', 'depression', 'digestive',
            'ඇස්මා', 'සම', 'රෝග'
        ],
    ];

    /**
     * Get disclaimer in the specified language
     */
    private function getDisclaimer(string $lang): string
    {
        return $lang === 'si' ? self::MEDICAL_DISCLAIMER_SI : self::MEDICAL_DISCLAIMER_EN;
    }

    /**
     * Process a chat message and return an appropriate response
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'question' => 'required|string|max:500',
            'session_id' => 'nullable|string|max:100',
            'language' => 'nullable|string|in:en,si',
        ]);

        $message = mb_strtolower(trim($request->input('question')), 'UTF-8');
        $sessionId = $request->input('session_id');
        $lang = $request->input('language', 'en');

        try {
            // Check if it's a greeting first
            if ($this->isGreeting($message)) {
                $greetingResponse = $this->getGreetingResponse($lang);
                $interactionId = $this->logInteraction($message, 'greeting', $greetingResponse['message'], $sessionId, $lang);
                
                return response()->json([
                    'success' => true,
                    'response' => $greetingResponse['message'],
                    'category' => 'greeting',
                    'suggestions' => $greetingResponse['suggestions'],
                    'interaction_id' => $interactionId,
                    'language' => $lang,
                ]);
            }

            // Classify the question
            $category = $this->classifyQuestion($message);

            // Get response based on category (with language support)
            $response = $this->getResponse($message, $category, $lang);

            // Log the interaction for learning and get the ID
            $interactionId = $this->logInteraction($message, $category, $response['message'], $sessionId, $lang);

            return response()->json([
                'success' => true,
                'response' => $response['message'],
                'category' => $category,
                'suggestions' => $response['suggestions'] ?? [],
                'disclaimer' => $response['disclaimer'] ?? $this->getDisclaimer($lang),
                'data' => $response['data'] ?? null,
                'interaction_id' => $interactionId,
                'language' => $lang,
            ]);
        } catch (\Exception $e) {
            Log::error('Chatbot error: ' . $e->getMessage());
            $errorMsg = $lang === 'si' 
                ? 'සමාවන්න, ඔබේ ඉල්ලීම සකසන විට දෝෂයක් ඇති විය. කරුණාකර නැවත උත්සාහ කරන්න.'
                : 'I apologize, but I encountered an error processing your request. Please try again.';
            return response()->json([
                'success' => false,
                'response' => $errorMsg,
                'category' => 'error',
                'suggestions' => [],
                'language' => $lang,
            ], 500);
        }
    }

    /**
     * Check if the message is a greeting
     */
    private function isGreeting(string $message): bool
    {
        foreach ($this->greetingKeywords as $greeting) {
            $greetingLower = mb_strtolower($greeting, 'UTF-8');
            if (str_contains($message, $greetingLower) || 
                str_contains($message, $greeting)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get greeting response
     */
    private function getGreetingResponse(string $lang = 'en'): array
    {
        $greetings = [
            'en' => [
                "Hello! 👋 Welcome to Cure.lk Homeopathic Hospital. I'm your virtual assistant, here to help you with:

• Information about homeopathy
• Finding doctors and their schedules
• Booking appointments
• Clinic locations and hours
• General inquiries

How can I assist you today?",
                "Hi there! 😊 Welcome! I'm here to help you learn about our homeopathic services, find doctors, book appointments, and answer your questions. What would you like to know?",
                "Hello! Welcome to Cure.lk! I can help you with information about homeopathy, our doctors, appointments, and more. What brings you here today?"
            ],
            'si' => [
                "ආයුබෝවන්! 👋 Cure.lk හෝමියෝපති රෝහලට සාදරයෙන් පිළිගනිමු. මම ඔබේ අතථ්‍ය සහායකයා. මට ඔබට උදව් කළ හැක්කේ:

• හෝමියෝපති පිළිබඳ තොරතුරු
• වෛද්‍යවරුන් සහ ඔවුන්ගේ කාලසටහන් සෙවීම
• හමුවීම් වෙන්කිරීම
• සායන ස්ථාන සහ වේලාවන්
• සාමාන්‍ය විමසීම්

මට අද ඔබට කොහොමද සහාය විය හැක්කේ?",
                "හායි! 😊 සාදරයෙන් පිළිගනිමු! අපගේ හෝමියෝපති සේවා, වෛද්‍යවරුන්, හමුවීම් සහ ඔබේ ප්‍රශ්න පිළිබඳ ඔබට උදව් කිරීමට මම මෙහි සිටිමි. ඔබ දැනගන්න කැමති මොකක්ද?",
                "ආයුබෝවන්! Cure.lk වෙත සාදරයෙන් පිළිගනිමු! මට හෝමියෝපති, අපගේ වෛද්‍යවරුන්, හමුවීම් සහ තවත් බොහෝ දේ පිළිබඳ තොරතුරු ලබා දිය හැක. අද ඔබ මෙහි පැමිණියේ කුමක් සඳහාද?"
            ]
        ];

        $selectedGreeting = $greetings[$lang][array_rand($greetings[$lang])];
        
        $suggestions = $lang === 'si' 
            ? ['හෝමියෝපති යනු කුමක්ද?', 'වෛද්‍යවරයෙක් සොයන්න', 'හමුවක් වෙන් කරන්න', 'ස්ථාන පෙන්වන්න']
            : ['What is homeopathy?', 'Find a doctor', 'Book appointment', 'Show locations'];

        return [
            'message' => $selectedGreeting,
            'suggestions' => $suggestions,
        ];
    }

    /**
     * Classify the question into a category
     */
    private function classifyQuestion(string $message): string
    {
        $scores = [];

        foreach ($this->categoryKeywords as $category => $keywords) {
            $score = 0;
            foreach ($keywords as $keyword) {
                if (str_contains($message, $keyword)) {
                    $score++;
                }
            }
            $scores[$category] = $score;
        }

        // Get the category with highest score
        arsort($scores);
        $topCategory = array_key_first($scores);

        // If no strong match, check admin FAQs
        if ($scores[$topCategory] === 0) {
            return self::CATEGORY_ADMIN_FAQ;
        }

        return $topCategory;
    }

    /**
     * Get response based on category
     */
    private function getResponse(string $message, string $category, string $lang = 'en'): array
    {
        switch ($category) {
            case self::CATEGORY_GENERAL_HOMEOPATHY:
                return $this->getHomeopathyResponse($message, $lang);

            case self::CATEGORY_DOCTOR_INFO:
                return $this->getDoctorInfoResponse($message, $lang);

            case self::CATEGORY_HOSPITAL_INFO:
                return $this->getHospitalInfoResponse($message, $lang);

            case self::CATEGORY_APPOINTMENT:
                return $this->getAppointmentResponse($message, $lang);

            case self::CATEGORY_CAPABILITY:
                return $this->getCapabilityResponse($message, $lang);

            case self::CATEGORY_ADMIN_FAQ:
            default:
                return $this->getAdminFaqResponse($message, $lang);
        }
    }

    /**
     * Get homeopathy knowledge response
     */
    private function getHomeopathyResponse(string $message, string $lang = 'en'): array
    {
        // Check FAQ database for bilingual content
        $faqs = ChatbotFaq::active()
            ->category(self::CATEGORY_GENERAL_HOMEOPATHY)
            ->orderBy('priority', 'desc')
            ->get();

        foreach ($faqs as $faq) {
            $keywords = $faq->keywords ?? [];
            foreach ($keywords as $keyword) {
                if (str_contains($message, strtolower($keyword))) {
                    $suggestions = $lang === 'si' 
                        ? ['හෝමියෝපති ආරක්ෂිතද?', 'වෛද්‍යවරයෙක් සොයන්න', 'හමුවක් වෙන් කරන්න']
                        : ['Is homeopathy safe?', 'Find a doctor', 'Book appointment'];
                    return [
                        'message' => $faq->getAnswer($lang),
                        'suggestions' => $suggestions,
                    ];
                }
            }
            
            // Also check if question matches
            $questionEn = strtolower($faq->question_en ?? '');
            $questionSi = strtolower($faq->question_si ?? '');
            if (str_contains($message, $questionEn) || str_contains($message, $questionSi)) {
                $suggestions = $lang === 'si' 
                    ? ['හෝමියෝපති ආරක්ෂිතද?', 'වෛද්‍යවරයෙක් සොයන්න', 'හමුවක් වෙන් කරන්න']
                    : ['Is homeopathy safe?', 'Find a doctor', 'Book appointment'];
                return [
                    'message' => $faq->getAnswer($lang),
                    'suggestions' => $suggestions,
                ];
            }
        }

        // Default response
        $defaultMsg = $lang === 'si'
            ? "හෝමියෝපති යනු වසර 200 කට වඩා වැඩි කාලයක් පුරා ක්‍රියාත්මක වන සමස්ත ස්වභාවික වෛද්‍ය ක්‍රමයකි. ඔබට නිශ්චිත ප්‍රශ්න තිබේ නම්, අපගේ සුදුසුකම් ලත් හෝමියෝපති වෛද්‍යවරුන්ගෙන් විමසන්න."
            : "Homeopathy is a holistic system of natural medicine that has been practiced for over 200 years. It works by stimulating the body's own healing mechanisms. If you have specific questions about homeopathy, feel free to ask! You can also speak with our qualified homeopathic doctors for personalized guidance.";
        
        $suggestions = $lang === 'si' 
            ? ['හෝමියෝපති යනු කුමක්ද?', 'හෝමියෝපති ආරක්ෂිතද?', 'වෛද්‍යවරයෙක් සොයන්න']
            : ['What is homeopathy?', 'Is homeopathy safe?', 'Find a doctor'];

        return [
            'message' => $defaultMsg,
            'suggestions' => $suggestions,
        ];
    }

    /**
     * Get doctor information response with live availability
     */
    private function getDoctorInfoResponse(string $message, string $lang = 'en'): array
    {
        // Check if asking about availability (today, tomorrow, etc.)
        $checkingAvailability = str_contains($message, 'available') || 
                               str_contains($message, 'today') || 
                               str_contains($message, 'tomorrow') ||
                               str_contains($message, 'ලබාගත හැකි') ||
                               str_contains($message, 'අද') ||
                               str_contains($message, 'හෙට');
        
        // Determine date based on query
        $targetDate = now()->toDateString();
        if (str_contains($message, 'tomorrow') || str_contains($message, 'හෙට')) {
            $targetDate = now()->addDay()->toDateString();
        }

        // Check if asking about doctors in a specific location
        $branches = Branch::all();
        $matchedBranch = null;

        foreach ($branches as $branch) {
            if (str_contains($message, mb_strtolower($branch->center_name ?? '', 'UTF-8')) ||
                str_contains($message, mb_strtolower($branch->division ?? '', 'UTF-8'))) {
                $matchedBranch = $branch;
                break;
            }
        }

        // If checking availability, get schedules
        if ($checkingAvailability) {
            $schedules = DoctorSchedule::where('date', $targetDate)
                ->where('is_available', true)
                ->with('doctor')
                ->get();

            if ($schedules->isEmpty()) {
                $dateText = $targetDate === now()->toDateString() 
                    ? ($lang === 'si' ? 'අද' : 'today') 
                    : ($lang === 'si' ? 'හෙට' : 'tomorrow');
                
                $msg = $lang === 'si'
                    ? "කණගාටුයි, {$dateText} වෛද්‍යවරුන් ලබාගත නොහැක. කරුණාකර වෙනත් දිනයක් තෝරන්න හෝ හමුවීම් පිටුවෙන් සම්පූර්ණ කාලසටහන බලන්න."
                    : "Sorry, no doctors are available {$dateText}. Please choose another date or check the full schedule on our booking page.";
                $suggestions = $lang === 'si' 
                    ? ['හමුව වෙන් කරන්න', 'සියලු ශාඛා', 'අප අමතන්න']
                    : ['Book appointment', 'All branches', 'Contact us'];
                return [
                    'message' => $msg,
                    'suggestions' => $suggestions,
                ];
            }

            $availableDoctors = $schedules->map(function ($schedule) use ($lang) {
                $doctor = $schedule->doctor;
                $name = trim(($doctor->first_name ?? '') . ' ' . ($doctor->last_name ?? ''));
                $time = substr($schedule->start_time, 0, 5) . ' - ' . substr($schedule->end_time, 0, 5);
                $slots = $schedule->max_sessions ?? 'N/A';
                return $lang === 'si'
                    ? "• Dr. {$name}\n  වේලාව: {$time}\n  ඉතිරි ස්ථාන: {$slots}"
                    : "• Dr. {$name}\n  Time: {$time}\n  Available slots: {$slots}";
            })->join("\n\n");

            $dateText = $targetDate === now()->toDateString() 
                ? ($lang === 'si' ? 'අද' : 'today') 
                : ($lang === 'si' ? 'හෙට' : 'tomorrow');

            $msg = $lang === 'si'
                ? "✅ {$dateText} ලබාගත හැකි වෛද්‍යවරුන්:\n\n{$availableDoctors}\n\nහමුවක් වෙන් කිරීමට ඔබ කැමතිද?"
                : "✅ Doctors available {$dateText}:\n\n{$availableDoctors}\n\nWould you like to book an appointment?";
            $suggestions = $lang === 'si' 
                ? ['හමුවක් වෙන් කරන්න', 'වෙනත් දිනයක්', 'ශාඛා පෙන්වන්න']
                : ['Book appointment', 'Another date', 'Show branches'];
            return [
                'message' => $msg,
                'suggestions' => $suggestions,
                'data' => ['schedules' => $schedules->toArray()]
            ];
        }

        // General doctor info
        $query = Doctor::query();
        $doctors = $query->take(5)->get();

        if ($doctors->isEmpty()) {
            $msg = $lang === 'si'
                ? "අපගේ මධ්‍යස්ථානවල සුදුසුකම් ලත් හෝමියෝපති වෛද්‍යවරු බොහෝ දෙනෙක් සිටිති. පවතින වෛද්‍යවරුන් සහ ඔවුන්ගේ කාලසටහන් බැලීමට අපගේ බුකින් පිටුවට පිවිසෙන්න."
                : "We have many qualified homeopathic doctors at our centers. Please visit our booking page to see available doctors and their schedules.";
            $suggestions = $lang === 'si' 
                ? ['සියලු ශාඛා පෙන්වන්න', 'හමුවක් වෙන් කරන්න', 'හෝමියෝපති යනු කුමක්ද?']
                : ['Show all branches', 'Book appointment', 'What is homeopathy?'];
            return [
                'message' => $msg,
                'suggestions' => $suggestions,
            ];
        }

        $doctorList = $doctors->map(function ($doctor) {
            $name = trim(($doctor->first_name ?? '') . ' ' . ($doctor->last_name ?? ''));
            $specialization = $doctor->areas_of_specialization ?? 'General Homeopathy';
            return "• Dr. {$name} - {$specialization}";
        })->join("\n");

        $locationInfo = $matchedBranch
            ? " at {$matchedBranch->center_name}"
            : "";

        $msg = $lang === 'si'
            ? "අපගේ වෛද්‍යවරුන්{$locationInfo}:\n\n{$doctorList}\n\nමෙම වෛද්‍යවරුන්ගෙන් කෙනෙකු සමඟ හමුවක් වෙන් කිරීමට ඔබ කැමතිද?"
            : "Here are some of our doctors{$locationInfo}:\n\n{$doctorList}\n\nWould you like to book an appointment with any of these doctors?";
        $suggestions = $lang === 'si' 
            ? ['අද වෛද්‍යවරුන්', 'හමුවක් වෙන් කරන්න', 'සියලු ශාඛා']
            : ['Doctors available today', 'Book appointment', 'All branches'];

        return [
            'message' => $msg,
            'suggestions' => $suggestions,
        ];
    }

    /**
     * Get hospital/branch information response with live data
     */
    private function getHospitalInfoResponse(string $message, string $lang = 'en'): array
    {
        $branches = Branch::all();

        if ($branches->isEmpty()) {
            $msg = $lang === 'si'
                ? "අපගේ සායන ස්ථාන පිළිබඳ තොරතුරු සඳහා කරුණාකර අපගේ වෙබ් අඩවියට පිවිසෙන්න."
                : "Please visit our website for information about our clinic locations.";
            $suggestions = $lang === 'si' 
                ? ['වෛද්‍යවරයෙක් සොයන්න', 'හමුවක් වෙන් කරන්න']
                : ['Find a doctor', 'Book appointment'];
            return [
                'message' => $msg,
                'suggestions' => $suggestions,
            ];
        }

        // Check if asking about specific location
        foreach ($branches as $branch) {
            if (str_contains($message, mb_strtolower($branch->division ?? '', 'UTF-8')) ||
                str_contains($message, mb_strtolower($branch->center_name ?? '', 'UTF-8'))) {
                
                // Get doctor count at this branch
                $doctorCount = DoctorSchedule::where('center_id', $branch->id)
                    ->where('date', '>=', now()->toDateString())
                    ->distinct('doctor_id')
                    ->count('doctor_id');
                
                $doctorInfo = $doctorCount > 0 
                    ? ($lang === 'si' ? "\nවෛද්‍යවරු: {$doctorCount} දෙනෙක්" : "\nDoctors: {$doctorCount}")
                    : '';

                $contact = $branch->owner_contact_number 
                    ? ($lang === 'si' ? "\nසම්බන්ධ: {$branch->owner_contact_number}" : "\nContact: {$branch->owner_contact_number}")
                    : '';

                $msg = $lang === 'si'
                    ? "📍 {$branch->center_name}\nස්ථානය: {$branch->division}{$doctorInfo}{$contact}\n\nමෙම ස්ථානයේ හමුවක් වෙන් කිරීමට ඔබ කැමතිද?"
                    : "📍 {$branch->center_name}\nLocation: {$branch->division}{$doctorInfo}{$contact}\n\nWould you like to book an appointment at this location?";
                $suggestions = $lang === 'si' 
                    ? ['මෙහි හමුවක් වෙන් කරන්න', 'මෙහි වෛද්‍යවරුන්', 'සියලු ශාඛා']
                    : ['Book here', 'Doctors here', 'All branches'];
                return [
                    'message' => $msg,
                    'suggestions' => $suggestions,
                    'data' => ['branch' => $branch]
                ];
            }
        }

        // List all branches
        $branchList = $branches->map(function ($branch) {
            return "📍 {$branch->center_name} - {$branch->division}";
        })->join("\n");

        $msg = $lang === 'si'
            ? "අපගේ ශාඛා:\n\n{$branchList}\n\nකුමන ශාඛාවක් ගැන වැඩි විස්තර දැනගන්න කැමතිද?"
            : "Our branches:\n\n{$branchList}\n\nWhich branch would you like to know more about?";
        $suggestions = $lang === 'si' 
            ? ['හමුවක් වෙන් කරන්න', 'වෛද්‍යවරුන් සොයන්න', 'අප අමතන්න']
            : ['Book appointment', 'Find doctors', 'Contact us'];

        return [
            'message' => $msg,
            'suggestions' => $suggestions,
            'data' => ['branches' => $branches->toArray()]
        ];
    }

    /**
     * Get hospital/branch information response (continuation)
     */
    private function getHospitalInfoResponseContinued(string $message, string $lang = 'en'): array
    {
        // This method handles overflow from getHospitalInfoResponse
        $branches = Branch::all();

        // Check if asking about specific location
        foreach ($branches as $branch) {
            if (str_contains($message, mb_strtolower($branch->division ?? '', 'UTF-8'))) {
                $msg = $lang === 'si'
                    ? "📍 {$branch->center_name}\nස්ථානය: {$branch->division}\n\nමෙම ස්ථානයේ හමුවක් වෙන් කිරීමට ඔබ කැමතිද?"
                    : "📍 {$branch->center_name}\nLocation: {$branch->division}\n\nWould you like to book an appointment at this location?";
                $suggestions = $lang === 'si' 
                    ? ['මෙහි හමුවක් වෙන් කරන්න', 'සියලු ශාඛා පෙන්වන්න', 'මෙම ශාඛාවේ වෛද්‍යවරුන්']
                    : ['Book appointment here', 'Show all branches', 'Doctors at this branch'];
                return [
                    'message' => $msg,
                    'suggestions' => $suggestions,
                ];
            }
        }

        // List all branches
        $branchList = $branches->map(function ($branch) {
            return "📍 {$branch->center_name} - {$branch->division}";
        })->join("\n");

        $msg = $lang === 'si'
            ? "අපගේ සායන ස්ථාන:\n\n{$branchList}\n\nඔබට මෙම ඕනෑම ස්ථානයක හමුවක් වෙන් කළ හැක."
            : "Our clinic locations:\n\n{$branchList}\n\nYou can book an appointment at any of these locations.";
        $suggestions = $lang === 'si' 
            ? ['හමුවක් වෙන් කරන්න', 'වෛද්‍යවරයෙක් සොයන්න', 'වැඩ කරන වේලාවන්']
            : ['Book appointment', 'Find a doctor', 'Working hours'];

        return [
            'message' => $msg,
            'suggestions' => $suggestions,
        ];
    }

    /**
     * Get appointment-related response
     */
    private function getAppointmentResponse(string $message, string $lang = 'en'): array
    {
        // Check for doctor name in message
        $doctors = Doctor::all();
        $matchedDoctor = null;

        foreach ($doctors as $doctor) {
            $fullName = strtolower(($doctor->first_name ?? '') . ' ' . ($doctor->last_name ?? ''));
            if (str_contains($message, $fullName) || 
                str_contains($message, strtolower($doctor->last_name ?? ''))) {
                $matchedDoctor = $doctor;
                break;
            }
        }

        if ($matchedDoctor) {
            // Get doctor's upcoming schedules
            $schedules = DoctorSchedule::where('doctor_id', $matchedDoctor->user_id)
                ->where('date', '>=', now()->toDateString())
                ->where('is_available', true)
                ->orderBy('date')
                ->take(3)
                ->get();

            if ($schedules->isNotEmpty()) {
                $scheduleList = $schedules->map(function ($schedule) {
                    return "• " . $schedule->date->format('l, M d') . " at " . $schedule->start_time;
                })->join("\n");

                $msg = $lang === 'si'
                    ? "Dr. {$matchedDoctor->first_name} {$matchedDoctor->last_name} මෙම දිනවල ලබාගත හැක:\n\n{$scheduleList}\n\nමෙම කාල පරාසයන්ගෙන් එකක් වෙන් කිරීමට ඔබ කැමතිද?"
                    : "Dr. {$matchedDoctor->first_name} {$matchedDoctor->last_name} is available on:\n\n{$scheduleList}\n\nWould you like to book one of these slots?";
                $suggestions = $lang === 'si' 
                    ? ['දැන් වෙන් කරන්න', 'තවත් දින පෙන්වන්න', 'වෙනත් වෛද්‍යවරුන්']
                    : ['Book now', 'Show more dates', 'Other doctors'];

                return [
                    'message' => $msg,
                    'suggestions' => $suggestions,
                ];
            }
        }

        $msg = $lang === 'si'
            ? "හමුවක් වෙන් කිරීමට, කරුණාකර අපගේ ඔන්ලයින් බුකින් පිටුවට පිවිසෙන්න:\n\n• ඔබට අවශ්‍ය ස්ථානය තෝරන්න\n• වෛද්‍යවරයෙක් තෝරන්න\n• ලබාගත හැකි වේලාවක් තෝරන්න\n• ඔබේ බුකිං සම්පූර්ණ කරන්න\n\nසහය සඳහා ඔබට අපගේ සායනය ඍජුව ඇමතීමටද හැක."
            : "To book an appointment, please visit our online booking page where you can:\n\n• Select your preferred location\n• Choose a doctor\n• Pick an available time slot\n• Complete your booking\n\nYou can also call our clinic directly for assistance.";
        $suggestions = $lang === 'si' 
            ? ['වෛද්‍යවරයෙක් සොයන්න', 'ශාඛා පෙන්වන්න', 'වැඩ කරන වේලාවන්']
            : ['Find a doctor', 'Show branches', 'Working hours'];

        return [
            'message' => $msg,
            'suggestions' => $suggestions,
        ];
    }

    /**
     * Get response for disease/treatment capability questions
     */
    private function getCapabilityResponse(string $message, string $lang = 'en'): array
    {
        // Check FAQ database first for bilingual responses
        $faqs = ChatbotFaq::active()
            ->category(self::CATEGORY_CAPABILITY)
            ->orderBy('priority', 'desc')
            ->get();

        foreach ($faqs as $faq) {
            $keywords = $faq->keywords ?? [];
            foreach ($keywords as $keyword) {
                if (str_contains($message, strtolower($keyword))) {
                    $suggestions = $lang === 'si' 
                        ? ['හමුවක් වෙන් කරන්න', 'හෝමියෝපති ගැන දැනගන්න', 'වෙනත් රෝග']
                        : ['Book appointment', 'Learn about homeopathy', 'Other conditions'];
                    return [
                        'message' => $faq->getAnswer($lang),
                        'disclaimer' => $this->getDisclaimer($lang),
                        'suggestions' => $suggestions,
                    ];
                }
            }
        }

        // Check disease mapping table
        $diseaseMapping = DB::table('chatbot_disease_mappings')
            ->where('is_active', true)
            ->get();

        foreach ($diseaseMapping as $mapping) {
            if (str_contains($message, strtolower($mapping->disease_name))) {
                // Find doctors with matching specialization
                $doctors = Doctor::where('areas_of_specialization', 'like', "%{$mapping->specialization}%")
                    ->take(3)
                    ->get();

                $doctorInfo = "";
                if ($doctors->isNotEmpty()) {
                    $doctorList = $doctors->map(fn($d) => "• Dr. {$d->first_name} {$d->last_name}")->join("\n");
                    $doctorInfoLabel = $lang === 'si' ? "\n\nඅදාළ පළපුරුද්ද ඇති වෛද්‍යවරුන්:" : "\n\nDoctors with relevant experience:";
                    $doctorInfo = "{$doctorInfoLabel}\n{$doctorList}";
                }

                $response = $mapping->safe_response ?? 
                    ($lang === 'si' 
                        ? "{$mapping->disease_name} සම්බන්ධ තත්ත්වයන් ප්‍රතිකාර කිරීමේ පළපුරුද්ද ඇති වෛද්‍යවරුන් අප සතුව සිටිති. ඔබේ තත්ත්වය විස්තරාත්මකව සාකච්ඡා කිරීමට ඔබට උපදේශනයක් වෙන් කළ හැක."
                        : "We have doctors experienced in treating conditions related to {$mapping->disease_name}. You may book a consultation to discuss your condition in detail.");

                $suggestions = $lang === 'si' 
                    ? ['හමුවක් වෙන් කරන්න', 'හෝමියෝපති ගැන දැනගන්න', 'වෙනත් රෝග']
                    : ['Book appointment', 'Learn about homeopathy', 'Other conditions'];

                return [
                    'message' => $response . $doctorInfo,
                    'disclaimer' => $this->getDisclaimer($lang),
                    'suggestions' => $suggestions,
                ];
            }
        }

        // Generic response for treatment questions
        $msg = $lang === 'si'
            ? "අපගේ සුදුසුකම් ලත් හෝමියෝපති වෛද්‍යවරුන්ට විවිධ සෞඛ්‍ය තත්ත්වයන් සඳහා සහාය විය හැක. හෝමියෝපති සමස්ත ප්‍රවේශයක් ගනියි, රෝග ලක්ෂණ පමණක් නොව සමස්ත පුද්ගලයාටම ප්‍රතිකාර කරයි.\n\nඔබේ තත්ත්වය නිසි ලෙස තක්සේරු කිරීම සඳහා, අපගේ පළපුරුදු වෛද්‍යවරුන්ගෙන් කෙනෙකු සමඟ උපදේශනයක් වෙන් කිරීම අපි නිර්දේශ කරමු."
            : "Our qualified homeopathic doctors may be able to assist with various health conditions. Homeopathy takes a holistic approach, treating the whole person rather than just symptoms.\n\nFor a proper assessment of your condition, we recommend booking a consultation with one of our experienced doctors.";
        $suggestions = $lang === 'si' 
            ? ['හමුවක් වෙන් කරන්න', 'වෛද්‍යවරයෙක් සොයන්න', 'හෝමියෝපති යනු කුමක්ද?']
            : ['Book appointment', 'Find a doctor', 'What is homeopathy?'];

        return [
            'message' => $msg,
            'disclaimer' => $this->getDisclaimer($lang),
            'suggestions' => $suggestions,
        ];
    }

    /**
     * Get response from admin-managed FAQs
     */
    private function getAdminFaqResponse(string $message, string $lang = 'en'): array
    {
        // Search in FAQ database
        $faqs = ChatbotFaq::active()
            ->orderBy('priority', 'desc')
            ->get();

        foreach ($faqs as $faq) {
            // Check question similarity (check both languages)
            $questionEn = strtolower($faq->question_en ?? '');
            $questionSi = strtolower($faq->question_si ?? '');
            
            if (similar_text($message, $questionEn) > 50 || 
                ($questionSi && similar_text($message, $questionSi) > 50)) {
                $suggestions = $lang === 'si' 
                    ? ['හමුවක් වෙන් කරන්න', 'වෛද්‍යවරයෙක් සොයන්න', 'අප අමතන්න']
                    : ['Book appointment', 'Find a doctor', 'Contact us'];
                return [
                    'message' => $faq->getAnswer($lang),
                    'suggestions' => $suggestions,
                ];
            }

            // Check keywords
            $keywords = $faq->keywords ?? [];
            foreach ($keywords as $keyword) {
                if (str_contains($message, strtolower($keyword))) {
                    $suggestions = $lang === 'si' 
                        ? ['හමුවක් වෙන් කරන්න', 'වෛද්‍යවරයෙක් සොයන්න', 'අප අමතන්න']
                        : ['Book appointment', 'Find a doctor', 'Contact us'];
                    return [
                        'message' => $faq->getAnswer($lang),
                        'suggestions' => $suggestions,
                    ];
                }
            }
        }

        // Default response
        $msg = $lang === 'si'
            ? "අපගේ හෝමියෝපති සේවා, වෛද්‍යවරුන් සහ හමුවීම් පිළිබඳ තොරතුරු ලබා දීමට මම මෙහි සිටිමි. ඔබට මෙම දේ ගැන අසන්න පුළුවන්:\n\n• හෝමියෝපති යනු කුමක්ද\n• අපගේ වෛද්‍යවරුන් සහ ඔවුන්ගේ ලබාගත හැකි අවස්ථා\n• සායන ස්ථාන සහ වේලාවන්\n• හමුවීම් වෙන් කිරීම\n\nමට අද ඔබට කොහොමද සහාය විය හැක්කේ?"
            : "I'm here to help you with information about our homeopathic services, doctors, and appointments. You can ask me about:\n\n• What is homeopathy\n• Our doctors and their availability\n• Clinic locations and hours\n• Booking appointments\n\nHow can I assist you today?";
        $suggestions = $lang === 'si' 
            ? ['හෝමියෝපති යනු කුමක්ද?', 'වෛද්‍යවරයෙක් සොයන්න', 'හමුවක් වෙන් කරන්න', 'ස්ථාන පෙන්වන්න']
            : ['What is homeopathy?', 'Find a doctor', 'Book appointment', 'Show locations'];

        return [
            'message' => $msg,
            'suggestions' => $suggestions,
        ];
    }

    /**
     * Log chat interaction for learning
     */
    private function logInteraction(string $question, string $category, string $response, ?string $sessionId, string $lang = 'en'): string
    {
        $id = (string) \Illuminate\Support\Str::uuid();
        try {
            DB::table('chatbot_logs')->insert([
                'id' => $id,
                'question' => $question,
                'category_detected' => $category,
                'response_given' => $response,
                'session_id' => $sessionId,
                'language' => $lang,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to log chatbot interaction: ' . $e->getMessage());
        }
        return $id;
    }

    /**
     * Mark a response as helpful or not
     */
    public function feedback(Request $request): JsonResponse
    {
        $request->validate([
            'interaction_id' => 'required|string',
            'was_helpful' => 'required|boolean',
        ]);

        try {
            DB::table('chatbot_logs')
                ->where('id', $request->interaction_id)
                ->update(['was_helpful' => $request->was_helpful]);

            return response()->json(['success' => true, 'message' => 'Thank you for your feedback!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to save feedback'], 500);
        }
    }

    /**
     * Get quick suggestions for the chat widget
     */
    public function getSuggestions(Request $request): JsonResponse
    {
        $lang = $request->query('language', 'en');
        
        if ($lang === 'si') {
            return response()->json([
                'suggestions' => [
                    'හෝමියෝපති යනු කුමක්ද?',
                    'වෛද්‍යවරයෙක් සොයන්න',
                    'හමුවක් වෙන් කරන්න',
                    'සායන ස්ථාන',
                    'හෝමියෝපති ආරක්ෂිතද?',
                ],
                'categories' => [
                    ['key' => 'general_homeopathy', 'label' => 'හෝමියෝපති ගැන', 'examples' => ['හෝමියෝපති යනු කුමක්ද?', 'එය ආරක්ෂිතද?']],
                    ['key' => 'doctor_info', 'label' => 'අපගේ වෛද්‍යවරුන්', 'examples' => ['වෛද්‍යවරයෙක් සොයන්න', 'වෛද්‍ය විශේෂීකරණ']],
                    ['key' => 'hospital_info', 'label' => 'ස්ථාන', 'examples' => ['සායන ස්ථාන', 'සම්බන්ධතා තොරතුරු']],
                    ['key' => 'appointment', 'label' => 'හමුවීම්', 'examples' => ['හමුවක් වෙන් කරන්න', 'ලබාගත හැකි වේලාවන්']],
                ],
                'language' => 'si',
            ]);
        }

        return response()->json([
            'suggestions' => [
                'What is homeopathy?',
                'Find a doctor',
                'Book an appointment',
                'Clinic locations',
                'Is homeopathy safe?',
            ],
            'categories' => [
                ['key' => 'general_homeopathy', 'label' => 'About Homeopathy', 'examples' => ['What is homeopathy?', 'Is it safe?']],
                ['key' => 'doctor_info', 'label' => 'Our Doctors', 'examples' => ['Find a doctor', 'Doctor specializations']],
                ['key' => 'hospital_info', 'label' => 'Locations', 'examples' => ['Clinic locations', 'Contact info']],
                ['key' => 'appointment', 'label' => 'Appointments', 'examples' => ['Book appointment', 'Available slots']],
            ],
            'language' => 'en',
        ]);
    }
}
