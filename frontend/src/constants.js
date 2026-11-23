// Fixed lists shared by the public pages and the admin screens (same values as backend/utils/enums.js).
export const SCHOLARSHIP_TYPES = ['full', 'partial', 'institutional'];
export const FUNDING_SOURCES = ['government', 'institution'];
export const TEACHING_LANGUAGES = ['en', 'ru', 'zh'];
export const STUDY_LEVELS = ['any', 'bachelor', 'master', 'phd'];
export const TRANSPORT_TYPES = ['plane', 'train', 'car', 'bus', 'boat'];
export const FEE_MODES = ['none', 'single', 'range', 'text'];

export const TRANSPORT_ICONS = {
  plane: 'bi-airplane',
  train: 'bi-train-front',
  car: 'bi-car-front',
  bus: 'bi-bus-front',
  boat: 'bi-water',
};

// Pages an FAQ can be placed on (key -> label shown in the admin panel)
export const FAQ_PAGES = [
  { key: 'home', label: 'Home' },
  { key: 'about', label: 'About' },
  { key: 'services', label: 'Services' },
  { key: 'education-scholarships', label: 'Education & Scholarships' },
  { key: 'tour-packages', label: 'Tour Packages' },
  { key: 'research-support', label: 'Academic Research & Professional Support' },
  { key: 'contact', label: 'Contact' },
];

// English labels used inside the admin panel (the public site uses the translation files instead).
export const ADMIN_LABELS = {
  scholarshipType: { full: 'Fully funded', partial: 'Partially funded', institutional: 'Institutional' },
  fundingSource: { government: 'Government-based', institution: 'Institution-based' },
  language: { en: 'English', ru: 'Russian', zh: 'Chinese' },
  level: { any: 'Any level', bachelor: 'Bachelor', master: 'Master', phd: 'PhD' },
  transport: { plane: 'Plane', train: 'Train', car: 'Car', bus: 'Bus', boat: 'Boat' },
  inquiryType: { general: 'General', consultation: 'Free consultation', research: 'Research & support' },
};
