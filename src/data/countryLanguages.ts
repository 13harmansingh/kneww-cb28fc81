// ISO 639-1 language codes mapped to countries (ISO 3166-1 alpha-2)
// Includes official and widely spoken languages

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
}

export const COUNTRY_LANGUAGES: Record<string, LanguageInfo[]> = {
  // North America
  US: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  ],
  CA: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "fr", name: "French", nativeName: "Français" },
  ],
  MX: [
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  
  // Europe
  GB: [
    { code: "en", name: "English", nativeName: "English" },
  ],
  DE: [
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  FR: [
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  IT: [
    { code: "it", name: "Italian", nativeName: "Italiano" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  ES: [
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "ca", name: "Catalan", nativeName: "Català" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  RU: [
    { code: "ru", name: "Russian", nativeName: "Русский" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  PL: [
    { code: "pl", name: "Polish", nativeName: "Polski" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  NL: [
    { code: "nl", name: "Dutch", nativeName: "Nederlands" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  BE: [
    { code: "nl", name: "Dutch", nativeName: "Nederlands" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  CH: [
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "it", name: "Italian", nativeName: "Italiano" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  PT: [
    { code: "pt", name: "Portuguese", nativeName: "Português" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  GR: [
    { code: "el", name: "Greek", nativeName: "Ελληνικά" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  
  // Asia
  CN: [
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  IN: [
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা" },
    { code: "mr", name: "Marathi", nativeName: "मराठी" },
  ],
  JP: [
    { code: "ja", name: "Japanese", nativeName: "日本語" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  KR: [
    { code: "ko", name: "Korean", nativeName: "한국어" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  TH: [
    { code: "th", name: "Thai", nativeName: "ไทย" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  VN: [
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  PK: [
    { code: "ur", name: "Urdu", nativeName: "اردو" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  ],
  BD: [
    { code: "bn", name: "Bengali", nativeName: "বাংলা" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  ID: [
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  MY: [
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
  ],
  PH: [
    { code: "tl", name: "Filipino", nativeName: "Filipino" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  SG: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  ],
  
  // Middle East
  SA: [
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  AE: [
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  TR: [
    { code: "tr", name: "Turkish", nativeName: "Türkçe" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  IL: [
    { code: "he", name: "Hebrew", nativeName: "עברית" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  IR: [
    { code: "fa", name: "Persian", nativeName: "فارسی" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  IQ: [
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "ku", name: "Kurdish", nativeName: "کوردی" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  EG: [
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  
  // Africa
  ZA: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
    { code: "zu", name: "Zulu", nativeName: "isiZulu" },
  ],
  NG: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "ha", name: "Hausa", nativeName: "Hausa" },
    { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
  ],
  KE: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  ],
  TD: [
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  MA: [
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  
  // South America
  BR: [
    { code: "pt", name: "Portuguese", nativeName: "Português" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  AR: [
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  CL: [
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  CO: [
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  
  // Oceania
  AU: [
    { code: "en", name: "English", nativeName: "English" },
  ],
  NZ: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "mi", name: "Māori", nativeName: "Te Reo Māori" },
  ],
};

// Default languages for global/ocean clicks
export const GLOBAL_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "fr", name: "French", nativeName: "Français" },
];

export const getCountryLanguages = (countryCode: string): LanguageInfo[] => {
  return COUNTRY_LANGUAGES[countryCode] || [{ code: "en", name: "English", nativeName: "English" }];
};
