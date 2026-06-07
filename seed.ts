/**
 * seed.ts — Piolife Medical Issues Seed Script
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register seed.ts
 *
 * Clears old specialties and inserts the new 21-item list.
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const MedicalIssueSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true, unique: true },
  image: { type: String },
  description: { type: String },
  price: { type: Number, required: true },
});

const MedicalIssue = mongoose.model('MedicalIssue', MedicalIssueSchema, 'medicalissues');

function generateId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')}`;
}

const SPECIALTIES = [
  { name: 'Ear', description: 'Ear infections, hearing loss, tinnitus, earache, wax blockage, otitis media.' },
  { name: 'Nose', description: 'Sinusitis, nasal congestion, nosebleeds, allergic rhinitis, nasal polyps, loss of smell.' },
  { name: 'Head', description: 'Headache, migraine, head injury, dizziness, scalp conditions, facial pain.' },
  { name: 'Mouth', description: 'Mouth ulcers, sore throat, tonsillitis, bad breath, oral infections, difficulty swallowing.' },
  { name: 'Neck', description: 'Neck pain, stiff neck, swollen lymph nodes, thyroid problems, cervical spondylosis.' },
  { name: 'Lung and Trachea (Respiratory)', description: 'Asthma, cough, breathlessness, bronchitis, COPD, pneumonia, tuberculosis, sleep apnea.' },
  { name: 'Heart (Cardiovascular)', description: 'Chest pain, high blood pressure, irregular heartbeat, heart failure, palpitations, stroke risk.' },
  { name: 'Gastrointestinal Tract (Gastrointestinal)', description: 'Abdominal pain, ulcers, diarrhoea, jaundice, constipation, piles, IBD, colon cancer, nausea.' },
  { name: 'Endocrine', description: 'Diabetes, thyroid disorders, hormonal imbalance, obesity, adrenal disorders, PCOS.' },
  { name: 'Brain - Spinal (Neurology)', description: 'Stroke, seizures, epilepsy, Parkinson\'s, memory loss, back pain, nerve pain, numbness.' },
  { name: 'Kidney (Renal)', description: 'Kidney stones, UTI, renal failure, frequent urination, swollen ankles, blood in urine.' },
  { name: 'Skin (Dermatology)', description: 'Eczema, acne, rashes, psoriasis, skin infections, hair loss, nail disorders, itching.' },
  { name: 'Bone (Osteology)', description: 'Fractures, osteoporosis, bone pain, arthritis, joint swelling, osteomyelitis.' },
  { name: 'Breast (Mamo)', description: 'Breast lumps, breast pain, nipple discharge, mastitis, breast cancer screening.' },
  { name: 'Bladder (Urology)', description: 'Bladder infections, incontinence, blood in urine, prostate problems, kidney stones, UTI.' },
  { name: 'Eye (Ophthalmology)', description: 'Eye infection, blurry vision, red eye, glaucoma, cataracts, dry eyes, eye pain.' },
  { name: 'Mental Health', description: 'Depression, anxiety, stress, insomnia, PTSD, schizophrenia, addiction, suicidal thoughts.' },
  { name: 'Physiotherapy', description: 'Post-surgery rehab, muscle weakness, back pain, mobility issues, sports injuries, stroke recovery.' },
  { name: 'Pain', description: 'Chronic pain, acute pain, unexplained body pain, joint pain, nerve pain, fibromyalgia.' },
  { name: 'Fever', description: 'High temperature, malaria, typhoid, infections, unexplained fever, chills, night sweats.' },
  { name: 'Others', description: 'Any condition not listed above — patient specifies during consultation.' },
];

async function seed() {
  const uri = process.env.MONGODB_URL;
  if (!uri) { console.error('❌  MONGODB_URL not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('✅  Connected to MongoDB\n');

  const deleted = await MedicalIssue.deleteMany({});
  console.log(`🗑   Cleared ${deleted.deletedCount} old specialties\n`);

  let inserted = 0;
  for (const spec of SPECIALTIES) {
    await MedicalIssue.create({ _id: generateId(), name: spec.name, image: '', description: spec.description, price: 1500 });
    console.log(`  ✅  ${spec.name}`);
    inserted++;
  }

  console.log(`\n🌱  Done — ${inserted} specialties inserted.\n`);

  const all = await MedicalIssue.find({}, { _id: 1, name: 1 }).lean();
  all.forEach((doc) => console.log(`  ${doc._id}  →  ${doc.name}`));

  await mongoose.disconnect();
}

seed().catch((err) => { console.error('❌  Seed failed:', err); process.exit(1); });
