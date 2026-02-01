/**
 * Get current date in Bengali format
 * @returns {string} Bengali formatted date
 */
export const getBengaliDate = () => {
  const now = new Date();
  
  // Bengali month names
  const bengaliMonths = [
    'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
    'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
  ];
  
  // Bengali day names
  const bengaliDays = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
  ];
  
  // Convert to Bengali numerals
  const toBengaliNumerals = (num) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
  };
  
  const day = toBengaliNumerals(now.getDate());
  const month = bengaliMonths[now.getMonth()];
  const year = toBengaliNumerals(now.getFullYear());
  const dayName = bengaliDays[now.getDay()];
  
  return `${dayName}, ${day} ${month} ${year}`;
};

/**
 * Convert Gregorian date to Bengali date
 * @param {Date} date - Date to convert
 * @returns {Object} Bengali date object
 */
export const toBengaliDate = (date) => {
  const banglaMonths = [
    'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
    'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
  ];
  
  const banglaDays = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
  ];
  
  // Simple conversion (for demo)
  // In production, use proper Bengali calendar conversion
  const day = date.getDate();
  const month = banglaMonths[date.getMonth()];
  const year = date.getFullYear() - 593; // Approximate Bengali year
  const dayName = banglaDays[date.getDay()];
  
  return {
    day,
    month,
    year,
    dayName,
    formatted: `${dayName}, ${day} ${month} ${year}`
  };
};

/**
 * Format date for display based on language
 * @param {Date} date - Date to format
 * @param {string} language - Language code ('bn' or 'en')
 * @returns {string} Formatted date
 */
export const formatDate = (date, language = 'en') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (language === 'bn') {
    return getBengaliDate();
  }
  
  // English format
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};