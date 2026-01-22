<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DiagnosisMasterSeeder extends Seeder
{
    /**
     * Homeopathy-relevant diagnoses for the Cure Hospital Management System.
     */
    public function run(): void
    {
        // Clear existing diagnoses
        DB::table('diagnosis_master')->truncate();

        $diagnoses = [
            // ========================================
            // ACUTE CONDITIONS
            // ========================================
            // Respiratory
            ['name' => 'Acute Rhinitis', 'category' => 'acute', 'code' => 'J00', 'description' => 'Common cold, acute coryza'],
            ['name' => 'Acute Sinusitis', 'category' => 'acute', 'code' => 'J01', 'description' => 'Acute inflammation of sinuses'],
            ['name' => 'Acute Pharyngitis', 'category' => 'acute', 'code' => 'J02', 'description' => 'Sore throat, acute throat inflammation'],
            ['name' => 'Acute Tonsillitis', 'category' => 'acute', 'code' => 'J03', 'description' => 'Acute inflammation of tonsils'],
            ['name' => 'Acute Laryngitis', 'category' => 'acute', 'code' => 'J04', 'description' => 'Acute inflammation of larynx'],
            ['name' => 'Acute Bronchitis', 'category' => 'acute', 'code' => 'J20', 'description' => 'Acute inflammation of bronchi'],
            ['name' => 'Influenza', 'category' => 'acute', 'code' => 'J11', 'description' => 'Flu, viral respiratory infection'],
            
            // Gastrointestinal
            ['name' => 'Acute Gastritis', 'category' => 'acute', 'code' => 'K29.1', 'description' => 'Acute stomach inflammation'],
            ['name' => 'Acute Gastroenteritis', 'category' => 'acute', 'code' => 'K52.9', 'description' => 'Stomach flu, food poisoning'],
            ['name' => 'Acute Diarrhea', 'category' => 'acute', 'code' => 'A09', 'description' => 'Acute loose stools'],
            ['name' => 'Acute Constipation', 'category' => 'acute', 'code' => 'K59.0', 'description' => 'Acute difficulty in bowel movement'],
            ['name' => 'Acute Nausea and Vomiting', 'category' => 'acute', 'code' => 'R11', 'description' => 'Acute digestive upset'],
            
            // Pain conditions
            ['name' => 'Acute Headache', 'category' => 'acute', 'code' => 'R51', 'description' => 'Sudden onset headache'],
            ['name' => 'Acute Migraine', 'category' => 'acute', 'code' => 'G43.9', 'description' => 'Migraine attack'],
            ['name' => 'Acute Back Pain', 'category' => 'acute', 'code' => 'M54.5', 'description' => 'Sudden onset back pain'],
            ['name' => 'Acute Neck Pain', 'category' => 'acute', 'code' => 'M54.2', 'description' => 'Sudden onset neck pain'],
            
            // Skin conditions
            ['name' => 'Acute Urticaria', 'category' => 'acute', 'code' => 'L50', 'description' => 'Hives, acute skin rash'],
            ['name' => 'Acute Eczema', 'category' => 'acute', 'code' => 'L30.9', 'description' => 'Acute dermatitis flare'],
            ['name' => 'Acute Allergic Reaction', 'category' => 'acute', 'code' => 'T78.4', 'description' => 'Acute allergy symptoms'],
            
            // Fever/Infection
            ['name' => 'Acute Fever', 'category' => 'acute', 'code' => 'R50.9', 'description' => 'Fever of unknown origin'],
            ['name' => 'Viral Fever', 'category' => 'acute', 'code' => 'B34.9', 'description' => 'Viral infection with fever'],
            ['name' => 'Dengue Fever', 'category' => 'acute', 'code' => 'A90', 'description' => 'Dengue viral infection'],
            
            // Urinary
            ['name' => 'Acute Cystitis', 'category' => 'acute', 'code' => 'N30.0', 'description' => 'Urinary tract infection'],
            
            // Other Acute
            ['name' => 'Acute Conjunctivitis', 'category' => 'acute', 'code' => 'H10', 'description' => 'Pink eye, eye inflammation'],
            ['name' => 'Acute Otitis Media', 'category' => 'acute', 'code' => 'H66.9', 'description' => 'Middle ear infection'],
            ['name' => 'Acute Vertigo', 'category' => 'acute', 'code' => 'H81.1', 'description' => 'Sudden dizziness'],
            
            // ========================================
            // CHRONIC CONDITIONS
            // ========================================
            // Respiratory
            ['name' => 'Chronic Rhinitis', 'category' => 'chronic', 'code' => 'J31.0', 'description' => 'Chronic nasal inflammation'],
            ['name' => 'Allergic Rhinitis', 'category' => 'chronic', 'code' => 'J30.4', 'description' => 'Hay fever, allergic nasal symptoms'],
            ['name' => 'Chronic Sinusitis', 'category' => 'chronic', 'code' => 'J32', 'description' => 'Chronic sinus inflammation'],
            ['name' => 'Chronic Bronchitis', 'category' => 'chronic', 'code' => 'J42', 'description' => 'Chronic bronchial inflammation'],
            ['name' => 'Bronchial Asthma', 'category' => 'chronic', 'code' => 'J45', 'description' => 'Chronic asthmatic condition'],
            ['name' => 'COPD', 'category' => 'chronic', 'code' => 'J44', 'description' => 'Chronic obstructive pulmonary disease'],
            
            // Gastrointestinal
            ['name' => 'Chronic Gastritis', 'category' => 'chronic', 'code' => 'K29.5', 'description' => 'Chronic stomach inflammation'],
            ['name' => 'GERD', 'category' => 'chronic', 'code' => 'K21', 'description' => 'Gastroesophageal reflux disease'],
            ['name' => 'Peptic Ulcer Disease', 'category' => 'chronic', 'code' => 'K27', 'description' => 'Stomach or duodenal ulcer'],
            ['name' => 'Irritable Bowel Syndrome', 'category' => 'chronic', 'code' => 'K58', 'description' => 'IBS, functional bowel disorder'],
            ['name' => 'Chronic Constipation', 'category' => 'chronic', 'code' => 'K59.0', 'description' => 'Long-standing constipation'],
            ['name' => 'Hemorrhoids', 'category' => 'chronic', 'code' => 'K64', 'description' => 'Piles, rectal varices'],
            ['name' => 'Fatty Liver Disease', 'category' => 'chronic', 'code' => 'K76.0', 'description' => 'NAFLD, hepatic steatosis'],
            
            // Musculoskeletal
            ['name' => 'Osteoarthritis', 'category' => 'chronic', 'code' => 'M15', 'description' => 'Degenerative joint disease'],
            ['name' => 'Rheumatoid Arthritis', 'category' => 'chronic', 'code' => 'M06.9', 'description' => 'Autoimmune joint inflammation'],
            ['name' => 'Cervical Spondylosis', 'category' => 'chronic', 'code' => 'M47.8', 'description' => 'Neck spine degeneration'],
            ['name' => 'Lumbar Spondylosis', 'category' => 'chronic', 'code' => 'M47.9', 'description' => 'Lower back spine degeneration'],
            ['name' => 'Chronic Back Pain', 'category' => 'chronic', 'code' => 'M54.5', 'description' => 'Persistent back pain'],
            ['name' => 'Fibromyalgia', 'category' => 'chronic', 'code' => 'M79.7', 'description' => 'Chronic widespread pain'],
            ['name' => 'Gout', 'category' => 'chronic', 'code' => 'M10', 'description' => 'Uric acid crystal arthritis'],
            
            // Skin
            ['name' => 'Chronic Eczema', 'category' => 'chronic', 'code' => 'L20', 'description' => 'Atopic dermatitis'],
            ['name' => 'Psoriasis', 'category' => 'chronic', 'code' => 'L40', 'description' => 'Chronic skin condition'],
            ['name' => 'Acne Vulgaris', 'category' => 'chronic', 'code' => 'L70.0', 'description' => 'Common acne'],
            ['name' => 'Vitiligo', 'category' => 'chronic', 'code' => 'L80', 'description' => 'Skin pigmentation disorder'],
            ['name' => 'Alopecia', 'category' => 'chronic', 'code' => 'L63', 'description' => 'Hair loss'],
            ['name' => 'Chronic Urticaria', 'category' => 'chronic', 'code' => 'L50.8', 'description' => 'Chronic hives'],
            
            // Metabolic/Endocrine
            ['name' => 'Type 2 Diabetes Mellitus', 'category' => 'chronic', 'code' => 'E11', 'description' => 'Adult-onset diabetes'],
            ['name' => 'Hypothyroidism', 'category' => 'chronic', 'code' => 'E03', 'description' => 'Underactive thyroid'],
            ['name' => 'Hyperthyroidism', 'category' => 'chronic', 'code' => 'E05', 'description' => 'Overactive thyroid'],
            ['name' => 'Obesity', 'category' => 'chronic', 'code' => 'E66', 'description' => 'Excess body weight'],
            ['name' => 'PCOS', 'category' => 'chronic', 'code' => 'E28.2', 'description' => 'Polycystic ovary syndrome'],
            
            // Cardiovascular
            ['name' => 'Essential Hypertension', 'category' => 'chronic', 'code' => 'I10', 'description' => 'High blood pressure'],
            ['name' => 'Hyperlipidemia', 'category' => 'chronic', 'code' => 'E78.5', 'description' => 'High cholesterol'],
            ['name' => 'Varicose Veins', 'category' => 'chronic', 'code' => 'I83', 'description' => 'Dilated leg veins'],
            
            // Neurological
            ['name' => 'Chronic Migraine', 'category' => 'chronic', 'code' => 'G43.7', 'description' => 'Recurring migraines'],
            ['name' => 'Tension Headache', 'category' => 'chronic', 'code' => 'G44.2', 'description' => 'Chronic tension-type headache'],
            ['name' => 'Peripheral Neuropathy', 'category' => 'chronic', 'code' => 'G62.9', 'description' => 'Nerve damage, tingling/numbness'],
            ['name' => 'Trigeminal Neuralgia', 'category' => 'chronic', 'code' => 'G50.0', 'description' => 'Facial nerve pain'],
            
            // Mental Health
            ['name' => 'Generalized Anxiety Disorder', 'category' => 'chronic', 'code' => 'F41.1', 'description' => 'Chronic anxiety'],
            ['name' => 'Depression', 'category' => 'chronic', 'code' => 'F32', 'description' => 'Depressive disorder'],
            ['name' => 'Insomnia', 'category' => 'chronic', 'code' => 'G47.0', 'description' => 'Chronic sleep disorder'],
            ['name' => 'Panic Disorder', 'category' => 'chronic', 'code' => 'F41.0', 'description' => 'Recurrent panic attacks'],
            
            // Urinary/Reproductive
            ['name' => 'Recurrent UTI', 'category' => 'chronic', 'code' => 'N39.0', 'description' => 'Chronic urinary infections'],
            ['name' => 'Benign Prostatic Hyperplasia', 'category' => 'chronic', 'code' => 'N40', 'description' => 'Enlarged prostate'],
            ['name' => 'Chronic Kidney Disease', 'category' => 'chronic', 'code' => 'N18', 'description' => 'Progressive kidney dysfunction'],
            ['name' => 'Kidney Stones', 'category' => 'chronic', 'code' => 'N20', 'description' => 'Renal calculi'],
            
            // Women's Health
            ['name' => 'Dysmenorrhea', 'category' => 'chronic', 'code' => 'N94.6', 'description' => 'Painful menstruation'],
            ['name' => 'Premenstrual Syndrome', 'category' => 'chronic', 'code' => 'N94.3', 'description' => 'PMS symptoms'],
            ['name' => 'Menopausal Syndrome', 'category' => 'chronic', 'code' => 'N95.1', 'description' => 'Menopausal symptoms'],
            ['name' => 'Uterine Fibroids', 'category' => 'chronic', 'code' => 'D25', 'description' => 'Benign uterine tumors'],
            ['name' => 'Endometriosis', 'category' => 'chronic', 'code' => 'N80', 'description' => 'Endometrial tissue outside uterus'],
            
            // ========================================
            // CONSTITUTIONAL CONDITIONS
            // ========================================
            ['name' => 'Constitutional Weakness', 'category' => 'constitutional', 'code' => 'CONST-01', 'description' => 'Inherent vital force weakness'],
            ['name' => 'Chronic Fatigue Syndrome', 'category' => 'constitutional', 'code' => 'G93.3', 'description' => 'ME/CFS, persistent fatigue'],
            ['name' => 'Low Immunity', 'category' => 'constitutional', 'code' => 'D89.9', 'description' => 'Frequent infections, poor immunity'],
            ['name' => 'Growth and Development Issues', 'category' => 'constitutional', 'code' => 'R62.8', 'description' => 'Child growth concerns'],
            ['name' => 'Hereditary Predisposition', 'category' => 'constitutional', 'code' => 'CONST-02', 'description' => 'Family history of chronic disease'],
            ['name' => 'Miasmatic Tendency - Psoric', 'category' => 'constitutional', 'code' => 'CONST-03', 'description' => 'Psoric miasm predominance'],
            ['name' => 'Miasmatic Tendency - Sycotic', 'category' => 'constitutional', 'code' => 'CONST-04', 'description' => 'Sycotic miasm predominance'],
            ['name' => 'Miasmatic Tendency - Syphilitic', 'category' => 'constitutional', 'code' => 'CONST-05', 'description' => 'Syphilitic miasm predominance'],
            ['name' => 'Autoimmune Tendency', 'category' => 'constitutional', 'code' => 'CONST-06', 'description' => 'Autoimmune disease predisposition'],
            ['name' => 'Allergic Constitution', 'category' => 'constitutional', 'code' => 'CONST-07', 'description' => 'Multiple allergies tendency'],
        ];

        foreach ($diagnoses as $d) {
            DB::table('diagnosis_master')->insert([
                'id' => Str::uuid()->toString(),
                'diagnosis_code' => $d['code'],
                'diagnosis_name' => $d['name'],
                'description' => $d['description'],
                'category' => $d['category'],
                'is_active' => true,
                'created_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('✅ Seeded ' . count($diagnoses) . ' diagnoses into diagnosis_master');
    }
}
