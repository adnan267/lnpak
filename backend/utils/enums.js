// Fixed lists shared by several routes. The frontend keeps the same lists in src/constants.js.
module.exports = {
  FEE_MODES: ['none', 'single', 'range', 'text'],
  SCHOLARSHIP_TYPES: ['full', 'partial', 'institutional'], // Fully funded, Partially funded, Institutional
  FUNDING_SOURCES: ['government', 'institution'], // Government-based, Institution-based
  TEACHING_LANGUAGES: ['en', 'ru', 'zh'], // English, Russian, Chinese
  STUDY_LEVELS: ['any', 'bachelor', 'master', 'phd'],
  TRANSPORT_TYPES: ['plane', 'train', 'car', 'bus', 'boat'],
  INQUIRY_TYPES: ['general', 'consultation', 'research'],
  // Pages an FAQ can be shown on
  FAQ_PAGES: ['home', 'about', 'services', 'education-scholarships', 'tour-packages', 'research-support', 'contact'],
};
