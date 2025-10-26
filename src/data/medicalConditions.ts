export interface MedicalCondition {
  value: string;
  label: string;
  common?: boolean;
}

export interface ConditionCategory {
  category: string;
  conditions: MedicalCondition[];
}

export const medicalConditions: ConditionCategory[] = [
  {
    category: 'General',
    conditions: [
      { value: 'fever', label: 'Fever', common: true },
      { value: 'fatigue', label: 'Fatigue/Weakness', common: true },
      { value: 'dehydration', label: 'Dehydration', common: true },
      { value: 'malaise', label: 'General Malaise' },
      { value: 'weight-loss', label: 'Unexplained Weight Loss' },
      { value: 'syncope', label: 'Syncope/Fainting', common: true },
      { value: 'shock', label: 'Shock' },
    ],
  },
  {
    category: 'Cardiac',
    conditions: [
      { value: 'chest-pain', label: 'Chest Pain', common: true },
      { value: 'heart-attack', label: 'Heart Attack (MI)', common: true },
      { value: 'cardiac-arrest', label: 'Cardiac Arrest', common: true },
      { value: 'palpitations', label: 'Palpitations', common: true },
      { value: 'arrhythmia', label: 'Arrhythmia' },
      { value: 'chf', label: 'Congestive Heart Failure' },
      { value: 'angina', label: 'Angina' },
      { value: 'hypertension-crisis', label: 'Hypertensive Crisis' },
    ],
  },
  {
    category: 'Respiratory',
    conditions: [
      { value: 'shortness-breath', label: 'Shortness of Breath', common: true },
      { value: 'cough', label: 'Cough', common: true },
      { value: 'asthma', label: 'Asthma Attack', common: true },
      { value: 'pneumonia', label: 'Pneumonia', common: true },
      { value: 'copd', label: 'COPD Exacerbation' },
      { value: 'pulmonary-embolism', label: 'Pulmonary Embolism' },
      { value: 'pneumothorax', label: 'Pneumothorax' },
      { value: 'respiratory-arrest', label: 'Respiratory Arrest' },
      { value: 'choking', label: 'Choking' },
    ],
  },
  {
    category: 'Neurological',
    conditions: [
      { value: 'stroke', label: 'Stroke/CVA', common: true },
      { value: 'seizure', label: 'Seizure', common: true },
      { value: 'headache', label: 'Severe Headache', common: true },
      { value: 'altered-consciousness', label: 'Altered Level of Consciousness', common: true },
      { value: 'dizziness', label: 'Dizziness/Vertigo', common: true },
      { value: 'tia', label: 'Transient Ischemic Attack (TIA)' },
      { value: 'meningitis', label: 'Meningitis' },
      { value: 'encephalitis', label: 'Encephalitis' },
      { value: 'paralysis', label: 'Paralysis/Weakness' },
    ],
  },
  {
    category: 'Abdominal',
    conditions: [
      { value: 'abdominal-pain', label: 'Abdominal Pain', common: true },
      { value: 'nausea-vomiting', label: 'Nausea/Vomiting', common: true },
      { value: 'diarrhea', label: 'Diarrhea', common: true },
      { value: 'appendicitis', label: 'Appendicitis' },
      { value: 'gi-bleeding', label: 'GI Bleeding' },
      { value: 'bowel-obstruction', label: 'Bowel Obstruction' },
      { value: 'pancreatitis', label: 'Pancreatitis' },
      { value: 'peritonitis', label: 'Peritonitis' },
    ],
  },
  {
    category: 'Head/Neck',
    conditions: [
      { value: 'head-injury', label: 'Head Injury', common: true },
      { value: 'concussion', label: 'Concussion', common: true },
      { value: 'facial-trauma', label: 'Facial Trauma', common: true },
      { value: 'neck-pain', label: 'Neck Pain' },
      { value: 'whiplash', label: 'Whiplash' },
      { value: 'skull-fracture', label: 'Skull Fracture' },
    ],
  },
  {
    category: 'Musculoskeletal',
    conditions: [
      { value: 'fracture', label: 'Fracture', common: true },
      { value: 'dislocation', label: 'Dislocation', common: true },
      { value: 'sprain-strain', label: 'Sprain/Strain', common: true },
      { value: 'back-pain', label: 'Back Pain', common: true },
      { value: 'joint-pain', label: 'Joint Pain' },
      { value: 'amputation', label: 'Amputation' },
    ],
  },
  {
    category: 'Skin/Burns',
    conditions: [
      { value: 'burns', label: 'Burns', common: true },
      { value: 'laceration', label: 'Laceration/Cut', common: true },
      { value: 'rash', label: 'Rash', common: true },
      { value: 'abscess', label: 'Abscess' },
      { value: 'cellulitis', label: 'Cellulitis' },
      { value: 'wound-infection', label: 'Wound Infection' },
    ],
  },
  {
    category: 'Urological',
    conditions: [
      { value: 'uti', label: 'Urinary Tract Infection', common: true },
      { value: 'kidney-stones', label: 'Kidney Stones', common: true },
      { value: 'urinary-retention', label: 'Urinary Retention' },
      { value: 'hematuria', label: 'Blood in Urine' },
    ],
  },
  {
    category: 'Obstetric',
    conditions: [
      { value: 'labor', label: 'Labor/Delivery', common: true },
      { value: 'pregnancy-complications', label: 'Pregnancy Complications', common: true },
      { value: 'vaginal-bleeding', label: 'Vaginal Bleeding' },
      { value: 'eclampsia', label: 'Eclampsia/Pre-eclampsia' },
      { value: 'miscarriage', label: 'Miscarriage' },
    ],
  },
  {
    category: 'ENT',
    conditions: [
      { value: 'epistaxis', label: 'Nosebleed (Epistaxis)', common: true },
      { value: 'ear-pain', label: 'Ear Pain' },
      { value: 'sore-throat', label: 'Sore Throat' },
      { value: 'foreign-body', label: 'Foreign Body' },
    ],
  },
  {
    category: 'Endocrine',
    conditions: [
      { value: 'hypoglycemia', label: 'Hypoglycemia', common: true },
      { value: 'hyperglycemia', label: 'Hyperglycemia', common: true },
      { value: 'diabetic-emergency', label: 'Diabetic Emergency' },
      { value: 'thyroid-storm', label: 'Thyroid Storm' },
    ],
  },
  {
    category: 'Psychiatric',
    conditions: [
      { value: 'suicidal-ideation', label: 'Suicidal Ideation', common: true },
      { value: 'psychosis', label: 'Psychosis', common: true },
      { value: 'panic-attack', label: 'Panic Attack', common: true },
      { value: 'agitation', label: 'Agitation/Aggression' },
      { value: 'overdose-intentional', label: 'Intentional Overdose' },
    ],
  },
  {
    category: 'Toxicology',
    conditions: [
      { value: 'overdose', label: 'Drug Overdose', common: true },
      { value: 'poisoning', label: 'Poisoning', common: true },
      { value: 'alcohol-intoxication', label: 'Alcohol Intoxication', common: true },
      { value: 'carbon-monoxide', label: 'Carbon Monoxide Poisoning' },
      { value: 'opioid-overdose', label: 'Opioid Overdose' },
    ],
  },
  {
    category: 'Infectious',
    conditions: [
      { value: 'sepsis', label: 'Sepsis', common: true },
      { value: 'covid', label: 'COVID-19' },
      { value: 'flu', label: 'Influenza' },
      { value: 'gastroenteritis', label: 'Gastroenteritis' },
    ],
  },
  {
    category: 'Environmental',
    conditions: [
      { value: 'heat-stroke', label: 'Heat Stroke', common: true },
      { value: 'hypothermia', label: 'Hypothermia', common: true },
      { value: 'drowning', label: 'Drowning/Near Drowning' },
      { value: 'electric-shock', label: 'Electric Shock' },
      { value: 'animal-bite', label: 'Animal Bite/Sting' },
    ],
  },
  {
    category: 'Pediatric',
    conditions: [
      { value: 'febrile-seizure', label: 'Febrile Seizure', common: true },
      { value: 'croup', label: 'Croup' },
      { value: 'bronchiolitis', label: 'Bronchiolitis' },
      { value: 'dehydration-pediatric', label: 'Pediatric Dehydration' },
    ],
  },
  {
    category: 'Rare/Miscellaneous',
    conditions: [
      { value: 'allergic-reaction', label: 'Allergic Reaction/Anaphylaxis', common: true },
      { value: 'bleeding-disorder', label: 'Bleeding Disorder' },
      { value: 'sickle-cell-crisis', label: 'Sickle Cell Crisis' },
      { value: 'spinal-injury', label: 'Spinal Injury' },
      { value: 'multiple-trauma', label: 'Multiple Trauma' },
      { value: 'other', label: 'Other (specify)' },
    ],
  },
];
