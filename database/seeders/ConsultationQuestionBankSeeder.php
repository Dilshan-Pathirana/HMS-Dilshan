<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ConsultationQuestionBankSeeder extends Seeder
{
    /**
     * Homeopathy Question Bank based on Materia Medica repertory.
     * Categories: General Symptoms, Mental State, Physical Symptoms, Modalities
     */
    public function run(): void
    {
        // Clear existing questions
        DB::table('consultation_question_bank')->truncate();

        $questions = [
            // ========================================
            // GENERAL SYMPTOMS
            // ========================================
            [
                'category' => 'general_symptoms',
                'sub_category' => 'energy_vitality',
                'question_text' => 'How would you describe your overall energy level?',
                'answer_type' => 'scale',
                'answer_options' => json_encode(['min' => 1, 'max' => 10, 'labels' => ['Very Low', 'Low', 'Moderate', 'Good', 'Excellent']]),
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'energy_vitality',
                'question_text' => 'At what time of day do you feel most energetic?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Morning', 'Midday', 'Afternoon', 'Evening', 'Night', 'No pattern']),
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'energy_vitality',
                'question_text' => 'Do you experience sudden weakness or fatigue?',
                'answer_type' => 'yes_no',
                'answer_options' => null,
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'temperature',
                'question_text' => 'Are you generally a warm or cold person?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Very chilly', 'Chilly', 'Normal', 'Warm', 'Very warm/hot']),
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'temperature',
                'question_text' => 'Do you perspire easily or excessively?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Rarely/Never', 'Normal', 'Often', 'Profusely', 'Only at night']),
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'temperature',
                'question_text' => 'Do you have any specific areas where you sweat more?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'sleep',
                'question_text' => 'How would you describe your sleep quality?',
                'answer_type' => 'scale',
                'answer_options' => json_encode(['min' => 1, 'max' => 10, 'labels' => ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent']]),
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'sleep',
                'question_text' => 'What is your preferred sleeping position?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['On back', 'On right side', 'On left side', 'On stomach', 'Varies', 'Cannot lie flat']),
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'sleep',
                'question_text' => 'Do you have difficulty falling asleep or staying asleep?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['No difficulty', 'Difficulty falling asleep', 'Wake frequently', 'Early morning waking', 'Both falling and staying asleep']),
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'sleep',
                'question_text' => 'Do you have recurring dreams or nightmares?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'appetite_thirst',
                'question_text' => 'How would you describe your appetite?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Very poor', 'Reduced', 'Normal', 'Increased', 'Ravenous']),
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'appetite_thirst',
                'question_text' => 'How would you describe your thirst level?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Thirstless', 'Low thirst', 'Normal', 'Increased', 'Excessive']),
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'appetite_thirst',
                'question_text' => 'Do you crave any specific foods or drinks?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'appetite_thirst',
                'question_text' => 'Are there any foods you have an aversion to?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'appetite_thirst',
                'question_text' => 'Do any foods or drinks disagree with you (cause symptoms)?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'weather_sensitivity',
                'question_text' => 'Are you sensitive to weather changes?',
                'answer_type' => 'yes_no',
                'answer_options' => null,
            ],
            [
                'category' => 'general_symptoms',
                'sub_category' => 'weather_sensitivity',
                'question_text' => 'Which weather conditions affect you most?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Cold', 'Heat', 'Humidity', 'Dry weather', 'Storm/Before storm', 'Wind', 'Seasonal changes']),
            ],

            // ========================================
            // MENTAL STATE
            // ========================================
            [
                'category' => 'mental_state',
                'sub_category' => 'mood',
                'question_text' => 'How would you describe your general mood?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Depressed', 'Sad/Low', 'Neutral', 'Content', 'Happy', 'Variable']),
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'mood',
                'question_text' => 'Do you experience mood swings?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Never', 'Rarely', 'Sometimes', 'Often', 'Very frequently']),
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'anxiety',
                'question_text' => 'Do you experience anxiety or worry?',
                'answer_type' => 'scale',
                'answer_options' => json_encode(['min' => 1, 'max' => 10, 'labels' => ['None', 'Mild', 'Moderate', 'Severe', 'Extreme']]),
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'anxiety',
                'question_text' => 'What are your main sources of anxiety or worry?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'anxiety',
                'question_text' => 'Do you have any specific fears or phobias?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'anxiety',
                'question_text' => 'Do you experience anticipatory anxiety (worry before events)?',
                'answer_type' => 'yes_no',
                'answer_options' => null,
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'anger_irritability',
                'question_text' => 'How easily do you become angry or irritated?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Very rarely', 'Sometimes', 'Often', 'Very easily', 'Constantly irritable']),
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'anger_irritability',
                'question_text' => 'How do you typically express anger?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Suppress it', 'Silent/Withdraw', 'Verbal outburst', 'Physical expression', 'Cry']),
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'sadness_grief',
                'question_text' => 'Are you carrying any grief or emotional pain?',
                'answer_type' => 'yes_no',
                'answer_options' => null,
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'sadness_grief',
                'question_text' => 'Have you experienced any significant losses or trauma?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'concentration',
                'question_text' => 'How is your ability to concentrate?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Very poor', 'Difficulty concentrating', 'Normal', 'Good', 'Excellent']),
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'concentration',
                'question_text' => 'Do you experience mental fatigue or brain fog?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Never', 'Rarely', 'Sometimes', 'Often', 'Constantly']),
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'social',
                'question_text' => 'Do you prefer company or solitude?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Strong preference for solitude', 'Prefer to be alone', 'Balance of both', 'Prefer company', 'Need to be with people']),
            ],
            [
                'category' => 'mental_state',
                'sub_category' => 'social',
                'question_text' => 'How do you feel when you receive consolation from others?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Aggravates/Makes worse', 'Uncomfortable', 'Neutral', 'Appreciate it', 'Need it/Helps greatly']),
            ],

            // ========================================
            // PHYSICAL SYMPTOMS
            // ========================================
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'head',
                'question_text' => 'Do you experience headaches?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Never', 'Rarely', 'Monthly', 'Weekly', 'Daily']),
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'head',
                'question_text' => 'Where is the headache typically located?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Forehead', 'Temples', 'One-sided', 'Back of head', 'Top of head', 'Whole head', 'Changes location']),
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'head',
                'question_text' => 'Describe the type of headache pain',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Throbbing/Pulsating', 'Pressing/Dull', 'Sharp/Stabbing', 'Bursting', 'Tight band', 'Boring']),
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'digestive',
                'question_text' => 'Do you have any digestive complaints?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'digestive',
                'question_text' => 'How is your bowel regularity?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Constipated', 'Irregular', 'Regular (daily)', 'Loose/Frequent', 'Alternating']),
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'digestive',
                'question_text' => 'Do you experience bloating or gas?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Never', 'Rarely', 'Sometimes', 'Often', 'Always']),
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'digestive',
                'question_text' => 'Do you have heartburn or acid reflux?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Never', 'Rarely', 'Sometimes', 'Often', 'Daily']),
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'respiratory',
                'question_text' => 'Do you have any respiratory complaints (cough, breathing difficulty)?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'respiratory',
                'question_text' => 'Do you have any nasal congestion or discharge?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['No', 'Occasional', 'Chronic congestion', 'Runny nose', 'Post-nasal drip']),
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'musculoskeletal',
                'question_text' => 'Do you have any joint or muscle pain?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'musculoskeletal',
                'question_text' => 'Is there any stiffness in your joints?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['No', 'Morning stiffness', 'After rest', 'After activity', 'Constant']),
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'skin',
                'question_text' => 'Do you have any skin complaints (rashes, itching, dryness)?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'skin',
                'question_text' => 'How would you describe your skin type?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Very dry', 'Dry', 'Normal', 'Oily', 'Combination']),
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'urinary',
                'question_text' => 'Do you have any urinary complaints?',
                'answer_type' => 'text',
                'answer_options' => null,
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'urinary',
                'question_text' => 'How often do you urinate?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Less than 4 times/day', '4-6 times/day', '7-10 times/day', 'More than 10 times', 'Wake at night to urinate']),
            ],

            // ========================================
            // MODALITIES (Aggravations/Ameliorations)
            // ========================================
            [
                'category' => 'modalities',
                'sub_category' => 'time',
                'question_text' => 'At what time of day are your symptoms typically worse?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Morning', 'Forenoon', 'Afternoon', 'Evening', 'Night', 'After midnight', 'No pattern']),
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'time',
                'question_text' => 'At what time of day do you feel best?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Morning', 'Forenoon', 'Afternoon', 'Evening', 'Night', 'After midnight', 'No pattern']),
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'temperature_modality',
                'question_text' => 'Are your symptoms better or worse with heat?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Much worse', 'Worse', 'No change', 'Better', 'Much better']),
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'temperature_modality',
                'question_text' => 'Are your symptoms better or worse with cold?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Much worse', 'Worse', 'No change', 'Better', 'Much better']),
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'temperature_modality',
                'question_text' => 'Do warm or cold applications help your symptoms?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Warm helps', 'Cold helps', 'Neither helps', 'Both aggravate', 'Depends on symptom']),
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'motion',
                'question_text' => 'Are your symptoms better or worse with motion/movement?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Much worse', 'Worse', 'No change', 'Better', 'Much better', 'Initial motion worse, then better']),
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'motion',
                'question_text' => 'Are your symptoms better or worse with rest?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Much worse', 'Worse', 'No change', 'Better', 'Much better']),
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'position',
                'question_text' => 'Are your symptoms affected by lying down?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Worse lying down', 'Better lying down', 'Worse on one side', 'No change']),
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'position',
                'question_text' => 'Does pressure affect your symptoms?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Pressure makes worse', 'Pressure helps', 'Hard pressure helps', 'No effect']),
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'eating',
                'question_text' => 'How do your symptoms relate to eating?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Worse before eating', 'Worse after eating', 'Better after eating', 'No relation to eating']),
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'open_air',
                'question_text' => 'How do you feel in open/fresh air?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Much worse', 'Worse', 'No change', 'Better', 'Much better', 'Desire for open air']),
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'seasons',
                'question_text' => 'Are your symptoms worse in any particular season?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Summer', 'Monsoon/Rainy', 'Autumn', 'Winter', 'Spring', 'No seasonal pattern']),
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'menstrual',
                'question_text' => 'For females: Are symptoms related to menstrual cycle?',
                'answer_type' => 'multiple_choice',
                'answer_options' => json_encode(['Not applicable', 'Before menses', 'During menses', 'After menses', 'No relation', 'Around ovulation']),
            ],
        ];

        foreach ($questions as $index => $q) {
            DB::table('consultation_question_bank')->insert([
                'id' => Str::uuid()->toString(),
                'question_text' => $q['question_text'],
                'category' => $q['category'],
                'sub_category' => $q['sub_category'],
                'answer_type' => $q['answer_type'],
                'answer_options' => $q['answer_options'],
                'is_active' => true,
                'sort_order' => $index,
                'created_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('✅ Seeded ' . count($questions) . ' homeopathy questions into consultation_question_bank');
    }
}
