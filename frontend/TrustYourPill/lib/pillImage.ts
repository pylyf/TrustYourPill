import type { ImageSourcePropType } from 'react-native';
import type { UserMedication } from './api';

// ─── Asset map ────────────────────────────────────────────────────────────────

const IMAGES = {
  pill1:   require('../assets/pill1.png'),   // oblong caplet / capsule
  pill2:   require('../assets/pill2.png'),   // round tablet
  drops:   require('../assets/drops.png'),
  syrup:   require('../assets/syrup.png'),
  cream:   require('../assets/cream.png'),
  inhaler: require('../assets/inhaler.png'),
  syringe: require('../assets/syringe.png'),
} as const;

type Form = keyof typeof IMAGES;

// ─── Known drug name → form ───────────────────────────────────────────────────

const KNOWN: Array<{ names: string[]; form: Form }> = [
  // Injectables / biologics
  { names: ['ozempic', 'semaglutide', 'wegovy', 'rybelsus'], form: 'syringe' },
  { names: ['mounjaro', 'tirzepatide', 'zepbound'], form: 'syringe' },
  { names: ['humira', 'adalimumab', 'dupixent', 'dupilumab'], form: 'syringe' },
  { names: ['victoza', 'liraglutide', 'saxenda', 'trulicity', 'dulaglutide'], form: 'syringe' },
  { names: ['lantus', 'levemir', 'toujeo', 'tresiba', 'basaglar', 'glargine', 'insulin'], form: 'syringe' },
  { names: ['novolog', 'humalog', 'fiasp', 'admelog'], form: 'syringe' },
  { names: ['enbrel', 'etanercept', 'remicade', 'infliximab'], form: 'syringe' },
  { names: ['xgeva', 'prolia', 'denosumab', 'botox', 'botulinum'], form: 'syringe' },
  // Inhalers
  { names: ['advair', 'seretide', 'salmeterol', 'spiriva', 'tiotropium'], form: 'inhaler' },
  { names: ['ventolin', 'albuterol', 'salbutamol', 'symbicort', 'budesonide', 'formoterol'], form: 'inhaler' },
  { names: ['breo', 'anoro', 'incruse', 'qvar', 'flovent', 'pulmicort'], form: 'inhaler' },
  { names: ['combivent', 'ipratropium', 'atrovent'], form: 'inhaler' },
  // Eye / ear / nose drops
  { names: ['xalatan', 'latanoprost', 'travatan', 'bimatoprost', 'timolol', 'dorzolamide'], form: 'drops' },
  { names: ['pataday', 'zaditor', 'olopatadine', 'ciprodex', 'tobradex'], form: 'drops' },
  { names: ['flonase', 'nasonex', 'nasacort', 'mometasone'], form: 'drops' },
  // Topicals
  { names: ['voltaren', 'diclofenac gel', 'diclofenac topical'], form: 'cream' },
  { names: ['clobetasol', 'betamethasone cream', 'triamcinolone cream', 'hydrocortisone cream'], form: 'cream' },
  { names: ['lidoderm', 'duragesic', 'fentanyl patch', 'lidocaine patch'], form: 'cream' },
  { names: ['tretinoin', 'retin-a', 'differin', 'adapalene', 'tacrolimus cream', 'protopic'], form: 'cream' },
  // Oral liquids
  { names: ['amoxicillin suspension', 'augmentin suspension', 'azithromycin suspension'], form: 'syrup' },
  { names: ['lactulose', 'polyethylene glycol', 'miralax'], form: 'syrup' },
  // Known caplets / oblong tablets
  { names: ['tylenol', 'acetaminophen', 'paracetamol', 'advil', 'ibuprofen', 'motrin'], form: 'pill1' },
  { names: ['amoxicillin', 'augmentin', 'azithromycin', 'doxycycline', 'ciprofloxacin', 'metformin'], form: 'pill1' },
  { names: ['omeprazole', 'pantoprazole', 'esomeprazole', 'lansoprazole'], form: 'pill1' },
  { names: ['gabapentin', 'pregabalin', 'sertraline', 'fluoxetine', 'escitalopram', 'citalopram'], form: 'pill1' },
  { names: ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin'], form: 'pill2' },
  { names: ['lisinopril', 'enalapril', 'ramipril', 'amlodipine', 'losartan', 'valsartan'], form: 'pill2' },
  { names: ['metoprolol', 'atenolol', 'carvedilol', 'bisoprolol'], form: 'pill2' },
  { names: ['levothyroxine', 'synthroid', 'armour thyroid'], form: 'pill2' },
  { names: ['warfarin', 'coumadin', 'aspirin', 'clopidogrel', 'plavix'], form: 'pill2' },
];

// ─── Keyword rules (checked in order, first match wins) ──────────────────────

const FORM_KEYWORDS: Array<{ keywords: string[]; form: Form }> = [
  { keywords: ['inhaler', 'aerosol', 'nebulizer', 'nebuliser', 'mdi', 'dpi'], form: 'inhaler' },
  { keywords: ['injection', 'injectable', 'subcutaneous', 'intramuscular', 'intravenous', 'iv solution', 'pen injector', 'autoinjector', 'prefilled syringe'], form: 'syringe' },
  { keywords: ['cream', 'ointment', 'lotion', 'topical gel', 'transdermal', 'patch'], form: 'cream' },
  { keywords: ['eye drop', 'ear drop', 'nasal drop', 'ophthalmic', 'otic', 'nasal spray'], form: 'drops' },
  { keywords: ['syrup', 'oral liquid', 'oral solution', 'suspension', 'elixir'], form: 'syrup' },
  // Caplet / capsule (oblong) — pill1
  { keywords: ['capsule', 'caplet', 'extended-release', ' er ', ' xr ', ' xl ', ' sr ', 'delayed-release', ' dr ', 'enteric'], form: 'pill1' },
  // Generic tablet (round) — pill2
  { keywords: ['tablet', ' tab ', ' tabs '], form: 'pill2' },
];

// ─── Public helper ────────────────────────────────────────────────────────────

export function getPillImage(med: UserMedication): ImageSourcePropType {
  const haystack = [med.displayName, med.normalizedName, med.dosageText ?? '', med.inputName]
    .join(' ')
    .toLowerCase();

  // 1. Known drug names
  for (const entry of KNOWN) {
    if (entry.names.some((n) => haystack.includes(n))) return IMAGES[entry.form];
  }

  // 2. Dosage-form keywords
  for (const rule of FORM_KEYWORDS) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) return IMAGES[rule.form];
  }

  // 3. Default — round tablet
  return IMAGES.pill2;
}
