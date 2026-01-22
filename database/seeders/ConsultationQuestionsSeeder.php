<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ConsultationQuestionsSeeder extends Seeder
{
    /**
     * Seed the consultation question bank with homeopathic Materia Medica questions
     */
    public function run(): void
    {
        $questions = [
            // General Symptoms
            [
                'category' => 'general_symptoms',
                'sub_category' => 'constitution',
                'questions' => [
                    ['text' => 'How would you describe your general energy level?', 'type' => 'scale'],
                    ['text' => 'Do you feel chilly or hot most of the time?', 'type' => 'multiple_choice', 'options' => ['Chilly', 'Hot', 'Variable', 'Normal']],
                    ['text' => 'What is your thirst pattern?', 'type' => 'multiple_choice', 'options' => ['Increased thirst', 'Decreased thirst', 'Normal', 'Thirst for small sips', 'Thirst for large quantities']],
                    ['text' => 'How is your appetite?', 'type' => 'multiple_choice', 'options' => ['Increased', 'Decreased', 'Variable', 'Normal']],
                    ['text' => 'Do you have any food cravings?', 'type' => 'text'],
                    ['text' => 'Do you have any food aversions?', 'type' => 'text'],
                    ['text' => 'How is your sleep quality?', 'type' => 'scale'],
                    ['text' => 'What is your preferred sleeping position?', 'type' => 'multiple_choice', 'options' => ['On back', 'On side - left', 'On side - right', 'On abdomen', 'Changes frequently']],
                    ['text' => 'Do you have any recurring dreams?', 'type' => 'text'],
                    ['text' => 'How do you perspire?', 'type' => 'multiple_choice', 'options' => ['Profuse', 'Scanty', 'Normal', 'Offensive', 'No sweat']],
                ]
            ],
            // Mental State
            [
                'category' => 'mental_state',
                'sub_category' => 'emotional',
                'questions' => [
                    ['text' => 'How would you describe your current mood?', 'type' => 'text'],
                    ['text' => 'Do you experience anxiety?', 'type' => 'yes_no'],
                    ['text' => 'If anxious, when does it worsen?', 'type' => 'text'],
                    ['text' => 'Do you have any specific fears or phobias?', 'type' => 'text'],
                    ['text' => 'How do you handle stress?', 'type' => 'text'],
                    ['text' => 'Do you prefer company or being alone?', 'type' => 'multiple_choice', 'options' => ['Company', 'Alone', 'Depends on mood', 'No preference']],
                    ['text' => 'Are you easily irritated?', 'type' => 'yes_no'],
                    ['text' => 'Do you experience weeping or crying episodes?', 'type' => 'multiple_choice', 'options' => ['Often', 'Sometimes', 'Rarely', 'Never']],
                    ['text' => 'How is your concentration and memory?', 'type' => 'scale'],
                    ['text' => 'Do you have any obsessive thoughts or behaviors?', 'type' => 'text'],
                ]
            ],
            // Physical Symptoms
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'head',
                'questions' => [
                    ['text' => 'Do you experience headaches?', 'type' => 'yes_no'],
                    ['text' => 'Location of headache?', 'type' => 'multiple_choice', 'options' => ['Forehead', 'Temples', 'Back of head', 'One-sided', 'Top of head', 'Whole head']],
                    ['text' => 'Character of headache?', 'type' => 'multiple_choice', 'options' => ['Throbbing', 'Dull', 'Sharp', 'Pressing', 'Bursting', 'Stitching']],
                    ['text' => 'Do you have any scalp sensitivity?', 'type' => 'yes_no'],
                    ['text' => 'Any hair fall or scalp issues?', 'type' => 'text'],
                ]
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'digestive',
                'questions' => [
                    ['text' => 'Do you have any digestive complaints?', 'type' => 'yes_no'],
                    ['text' => 'Type of digestive issue?', 'type' => 'multiple_choice', 'options' => ['Bloating', 'Gas', 'Constipation', 'Diarrhea', 'Acidity', 'Nausea', 'Vomiting']],
                    ['text' => 'When do symptoms worsen?', 'type' => 'text'],
                    ['text' => 'How is your bowel movement?', 'type' => 'multiple_choice', 'options' => ['Regular', 'Irregular', 'Constipated', 'Loose', 'Alternating']],
                    ['text' => 'Do you experience heartburn or acid reflux?', 'type' => 'yes_no'],
                ]
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'respiratory',
                'questions' => [
                    ['text' => 'Do you have any breathing difficulties?', 'type' => 'yes_no'],
                    ['text' => 'Do you experience cough?', 'type' => 'multiple_choice', 'options' => ['Dry cough', 'Productive cough', 'Occasional', 'No cough']],
                    ['text' => 'Is there any expectoration?', 'type' => 'multiple_choice', 'options' => ['White', 'Yellow', 'Green', 'Blood-tinged', 'None']],
                    ['text' => 'Do you have nasal congestion or discharge?', 'type' => 'yes_no'],
                    ['text' => 'Any history of asthma or allergies?', 'type' => 'text'],
                ]
            ],
            [
                'category' => 'physical_symptoms',
                'sub_category' => 'skin',
                'questions' => [
                    ['text' => 'Do you have any skin problems?', 'type' => 'yes_no'],
                    ['text' => 'Type of skin issue?', 'type' => 'multiple_choice', 'options' => ['Dry skin', 'Oily skin', 'Eruptions', 'Itching', 'Discoloration', 'Ulcers']],
                    ['text' => 'Location of skin problem?', 'type' => 'text'],
                    ['text' => 'What makes it better or worse?', 'type' => 'text'],
                ]
            ],
            // Modalities
            [
                'category' => 'modalities',
                'sub_category' => 'aggravations',
                'questions' => [
                    ['text' => 'Does heat aggravate your symptoms?', 'type' => 'yes_no'],
                    ['text' => 'Does cold aggravate your symptoms?', 'type' => 'yes_no'],
                    ['text' => 'Does motion aggravate your symptoms?', 'type' => 'yes_no'],
                    ['text' => 'Does rest aggravate your symptoms?', 'type' => 'yes_no'],
                    ['text' => 'Time of day when symptoms worsen?', 'type' => 'multiple_choice', 'options' => ['Morning', 'Afternoon', 'Evening', 'Night', 'No specific time']],
                    ['text' => 'Does eating affect your symptoms?', 'type' => 'multiple_choice', 'options' => ['Better after eating', 'Worse after eating', 'No effect']],
                    ['text' => 'Do weather changes affect you?', 'type' => 'text'],
                ]
            ],
            [
                'category' => 'modalities',
                'sub_category' => 'ameliorations',
                'questions' => [
                    ['text' => 'What provides relief to your symptoms?', 'type' => 'text'],
                    ['text' => 'Does warmth provide relief?', 'type' => 'yes_no'],
                    ['text' => 'Does cold application provide relief?', 'type' => 'yes_no'],
                    ['text' => 'Does pressure provide relief?', 'type' => 'yes_no'],
                    ['text' => 'Does movement provide relief?', 'type' => 'yes_no'],
                    ['text' => 'Does rest provide relief?', 'type' => 'yes_no'],
                ]
            ],
        ];

        $sortOrder = 0;
        foreach ($questions as $category) {
            foreach ($category['questions'] as $question) {
                $sortOrder++;
                DB::table('consultation_question_bank')->insert([
                    'id' => Str::uuid()->toString(),
                    'question_text' => $question['text'],
                    'category' => $category['category'],
                    'sub_category' => $category['sub_category'],
                    'answer_type' => $question['type'],
                    'answer_options' => isset($question['options']) ? json_encode($question['options']) : null,
                    'is_active' => true,
                    'sort_order' => $sortOrder,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Seed common diagnoses
        $diagnoses = [
            ['name' => 'Acute Rhinitis', 'category' => 'acute', 'description' => 'Inflammation of nasal passages'],
            ['name' => 'Chronic Sinusitis', 'category' => 'chronic', 'description' => 'Long-term inflammation of sinuses'],
            ['name' => 'Allergic Rhinitis', 'category' => 'chronic', 'description' => 'Nasal allergy'],
            ['name' => 'Migraine', 'category' => 'chronic', 'description' => 'Recurring severe headaches'],
            ['name' => 'Tension Headache', 'category' => 'acute', 'description' => 'Stress-related headache'],
            ['name' => 'Gastritis', 'category' => 'acute', 'description' => 'Inflammation of stomach lining'],
            ['name' => 'GERD', 'category' => 'chronic', 'description' => 'Gastroesophageal reflux disease'],
            ['name' => 'IBS', 'category' => 'chronic', 'description' => 'Irritable bowel syndrome'],
            ['name' => 'Constipation', 'category' => 'acute', 'description' => 'Difficulty in bowel movements'],
            ['name' => 'Eczema', 'category' => 'chronic', 'description' => 'Chronic skin inflammation'],
            ['name' => 'Psoriasis', 'category' => 'chronic', 'description' => 'Autoimmune skin condition'],
            ['name' => 'Acne', 'category' => 'chronic', 'description' => 'Skin condition with pimples'],
            ['name' => 'Urticaria', 'category' => 'acute', 'description' => 'Hives/skin rash'],
            ['name' => 'Anxiety Disorder', 'category' => 'constitutional', 'description' => 'Chronic anxiety condition'],
            ['name' => 'Depression', 'category' => 'constitutional', 'description' => 'Mood disorder'],
            ['name' => 'Insomnia', 'category' => 'chronic', 'description' => 'Difficulty sleeping'],
            ['name' => 'Arthritis', 'category' => 'chronic', 'description' => 'Joint inflammation'],
            ['name' => 'Back Pain', 'category' => 'acute', 'description' => 'Lower or upper back pain'],
            ['name' => 'Sciatica', 'category' => 'chronic', 'description' => 'Nerve pain from lower back to legs'],
            ['name' => 'Bronchitis', 'category' => 'acute', 'description' => 'Inflammation of bronchial tubes'],
            ['name' => 'Asthma', 'category' => 'chronic', 'description' => 'Chronic respiratory condition'],
            ['name' => 'Upper Respiratory Infection', 'category' => 'acute', 'description' => 'Common cold/flu'],
            ['name' => 'Tonsillitis', 'category' => 'acute', 'description' => 'Inflammation of tonsils'],
            ['name' => 'Pharyngitis', 'category' => 'acute', 'description' => 'Sore throat'],
            ['name' => 'Hypertension', 'category' => 'chronic', 'description' => 'High blood pressure'],
            ['name' => 'Diabetes Mellitus', 'category' => 'chronic', 'description' => 'Blood sugar disorder'],
            ['name' => 'Hypothyroidism', 'category' => 'chronic', 'description' => 'Underactive thyroid'],
            ['name' => 'Hyperthyroidism', 'category' => 'chronic', 'description' => 'Overactive thyroid'],
            ['name' => 'PCOS', 'category' => 'chronic', 'description' => 'Polycystic ovary syndrome'],
            ['name' => 'Menstrual Disorders', 'category' => 'chronic', 'description' => 'Irregular or painful periods'],
        ];

        foreach ($diagnoses as $diagnosis) {
            DB::table('diagnosis_master')->insert([
                'id' => Str::uuid()->toString(),
                'diagnosis_name' => $diagnosis['name'],
                'category' => $diagnosis['category'],
                'description' => $diagnosis['description'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
