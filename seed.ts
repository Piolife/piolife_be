/**
 * seed.ts — Piolife Medical Issues & Specialty Seed Script
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register seed.ts
 *
 * What it seeds:
 *   - 23 medical specialties into the `medicalissues` collection
 *   - Each specialty is selectable by patients (health issue screen)
 *     AND usable as a doctor's specialty during signup
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

// ─── Inline schema (avoids NestJS DI complexity) ─────────────────────────────
const MedicalIssueSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true, unique: true },
  image: { type: String },
  description: { type: String },
  price: { type: Number, required: true },
});

const MedicalIssue = mongoose.model('MedicalIssue', MedicalIssueSchema, 'medicalissues');

// ─── Simple Snowflake-style ID (timestamp + random) ──────────────────────────
function generateId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')}`;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
// image field: Cloudinary URL or empty string.
// Replace the placeholder URLs with your actual Cloudinary uploads.
// description lists the common conditions under each specialty.

const SPECIALTIES = [
  {
    name: 'Pulmonology (Lungs & Airway)',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/lung.png',
    description: 'Asthma, chronic cough, breathlessness, bronchitis, COPD, sleep apnea.',
  },
  {
    name: 'Cardiology (Heart & Blood Vessels)',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/heart.png',
    description: 'Heart attack, high blood pressure (hypertension), irregular heartbeat (arrhythmia), chest pain, heart failure.',
  },
  {
    name: 'Gastroenterology (Digestive System)',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/stomach.png',
    description: 'Abdominal pain, ulcers, diarrhea, jaundice, colon cancer, hemorrhoids, inflammatory bowel disease (IBD), piles, constipation.',
  },
  {
    name: 'Dermatology (Skin, Hair & Nails)',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/skin.png',
    description: 'Eczema, acne, moles, scars, hair loss, nail disorders, psoriasis, rashes, skin infections.',
  },
  {
    name: 'Endocrinology (Hormones & Metabolism)',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/endocrine.png',
    description: 'Diabetes (Type 1 & 2), thyroid problems (hypothyroidism/hyperthyroidism), hormonal imbalances, obesity, adrenal disorders.',
  },
  {
    name: 'Reproductive Health & Infertility',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/reproductive.png',
    description: 'Male and female infertility, PCOS, erectile dysfunction, hormonal fertility issues, IVF counselling.',
  },
  {
    name: 'Bone & Mineral Disorders',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/bone.png',
    description: 'Calcium deficiency, osteoporosis, vitamin D deficiency, bone pain, fracture management, rickets.',
  },
  {
    name: 'Hematology (Blood Disorders)',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/blood.png',
    description: 'Sickle cell disease, anemia, hemophilia, leukemia, blood clotting disorders, low platelet count.',
  },
  {
    name: 'Infectious Disease',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/infectious.png',
    description: 'Fevers, malaria, Lyme disease, pneumonia, tuberculosis (TB), HIV/AIDS, typhoid, COVID-19, hepatitis.',
  },
  {
    name: 'Medical Genetics',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/genetics.png',
    description: 'Genetic counselling, hereditary disease screening, chromosomal disorder assessment, family planning genetics.',
  },
  {
    name: 'Obstetrics & Gynecology',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/obgyn.png',
    description: 'Pregnancy checkups and monitoring, antenatal care, postnatal care, menstrual disorders, menopause, pelvic pain.',
  },
  {
    name: 'Oncology (Cancer)',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/oncology.png',
    description: 'Breast cancer, cervical cancer, prostate cancer, colon cancer, general cancer screening, chemotherapy guidance.',
  },
  {
    name: 'Ophthalmology (Eye Care)',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/eye.png',
    description: 'Eye infections, blurry vision, glaucoma, cataracts, dry eyes, eye injury, diabetic retinopathy.',
  },
  {
    name: 'ENT (Ear, Nose, Throat & Head)',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/ent.png',
    description: 'Ear infections, hearing loss, sinusitis, nosebleeds, sore throat, tonsillitis, snoring, neck lumps, mouth ulcers.',
  },
  {
    name: 'Nutrition & Dietetics',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/nutrition.png',
    description: 'Weight management, malnutrition, dietary planning, eating disorders, sports nutrition, diabetes diet management.',
  },
  {
    name: 'Dental & Oral Health',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/dental.png',
    description: 'Toothache, cavities, gum disease, tooth extraction guidance, bad breath, mouth ulcers, teeth whitening advice.',
  },
  {
    name: 'Physiotherapy & Rehabilitation',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/physio.png',
    description: 'Post-surgery rehab, stroke recovery, chronic pain, muscle weakness, mobility issues, posture correction.',
  },
  {
    name: 'Podiatry (Foot & Ankle)',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/podiatry.png',
    description: 'Foot pain, ankle sprains, plantar fasciitis, ingrown toenails, diabetic foot care, heel pain.',
  },
  {
    name: 'Psychiatry & Mental Health',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/mental_health.png',
    description: 'Depression, anxiety disorders, schizophrenia, substance abuse, addictive disorders, suicidal thoughts, PTSD, sexual and gender identity issues.',
  },
  {
    name: 'Rheumatology (Joints & Muscles)',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/rheumatology.png',
    description: 'Arthritis (rheumatoid & osteoarthritis), joint pain, muscle pain, bone pain, tendon pain, back pain, lupus, gout.',
  },
  {
    name: 'Sleep Medicine',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/sleep.png',
    description: 'Insomnia, sleep apnea, narcolepsy, poor sleep quality, restless leg syndrome, excessive daytime sleepiness.',
  },
  {
    name: 'Sports Medicine',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/sports.png',
    description: 'Sports injuries, ligament tears, muscle strains, fractures from physical activity, concussion, performance optimization.',
  },
  {
    name: 'Urology (Urinary & Male Health)',
    image: 'https://res.cloudinary.com/dmfb370xe/image/upload/v1/piolife/specialties/urology.png',
    description: 'Urinary tract infections (UTI), leaky bladder (incontinence), male infertility, prostate problems, kidney stones, erectile dysfunction.',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  const uri = process.env.MONGODB_URL;
  if (!uri) {
    console.error('❌  MONGODB_URL not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅  Connected to MongoDB\n');

  let inserted = 0;
  let skipped = 0;

  for (const spec of SPECIALTIES) {
    const exists = await MedicalIssue.findOne({ name: spec.name });
    if (exists) {
      console.log(`  ⏭  Already exists — skipping: ${spec.name}`);
      skipped++;
      continue;
    }

    await MedicalIssue.create({
      _id: generateId(),
      name: spec.name,
      image: spec.image,
      description: spec.description,
      price: 1500, // ₦1,500 per health issue (matches COST_PER_ISSUE in pay4Consultation.tsx)
    });

    console.log(`  ✅  Inserted: ${spec.name}`);
    inserted++;
  }

  console.log(`\n🌱  Done — ${inserted} inserted, ${skipped} already existed.`);
  console.log('\n📋  Copy these _id values into doctors\' specialty[] field:');

  const all = await MedicalIssue.find({}, { _id: 1, name: 1 }).lean();
  all.forEach((doc) => console.log(`     ${doc._id}  →  ${doc.name}`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
