/**
 * বাংলাদেশ ক্যালেন্ডার এবং সময় ইউটিলিটি
 * Prepared by Eng Tanbir Rifat | MaxoraSoft
 */

class BangladeshCalendar {
  // বাংলা মাসের নাম
  static BENGALI_MONTHS = [
    'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
    'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
  ];

  // বাংলা দিনের নাম
  static BENGALI_DAYS = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
  ];

  // ইংরেজি তারিখ থেকে বাংলা তারিখ কনভার্ট (সরলীকৃত)
  static toBanglaDate(gregorianDate) {
    const date = new Date(gregorianDate);
    const day = date.getDate();
    const month = this.BENGALI_MONTHS[date.getMonth()];
    const year = date.getFullYear() - 593; // ২০২৪ - ৫৯৩ = ১৪৩১
    
    return `${day} ${month} ${year}`;
  }

  // বাংলাদেশের টাইমজোনে তারিখ ফরম্যাট
  static formatInBangladeshTimezone(date, includeTime = false) {
    const options = {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };

    const dateStr = date.toLocaleDateString('bn-BD', options);

    if (includeTime) {
      const timeOptions = {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      const timeStr = date.toLocaleTimeString('bn-BD', timeOptions);
      return `${dateStr} • ${timeStr}`;
    }

    return dateStr;
  }

  // কর্মসপ্তাহ চেক (শনি-বৃহস্পতি)
  static isBusinessDay(date = new Date()) {
    const day = date.getDay(); // 0=রবি, 6=শনি
    // শনি(6), রবি(0), সোম(1), মঙ্গল(2), বুধ(3), বৃহস্পতি(4) = কর্মদিবস
    return day === 6 || day >= 0 && day <= 4;
  }

  // পরবর্তী কর্মদিবস বের করো
  static getNextBusinessDay(date = new Date()) {
    const nextDay = new Date(date);
    
    do {
      nextDay.setDate(nextDay.getDate() + 1);
    } while (!this.isBusinessDay(nextDay));
    
    return nextDay;
  }

  // সাপ্তাহিক তারিখ রেঞ্জ (শনি-বৃহস্পতি)
  static getBusinessWeekRange(date = new Date()) {
    const currentDay = date.getDay();
    const saturday = new Date(date);
    
    // শনিবার খুঁজে বের করো
    if (currentDay === 5) { // শুক্রবার
      saturday.setDate(saturday.getDate() - 6);
    } else if (currentDay === 6) { // শনিবার
      // ইতিমধ্যে শনিবার
    } else {
      saturday.setDate(saturday.getDate() - currentDay - 1);
    }
    
    const thursday = new Date(saturday);
    thursday.setDate(thursday.getDate() + 5);
    
    return {
      startDate: saturday,
      endDate: thursday,
      weekNumber: this.getWeekNumber(saturday)
    };
  }

  // সপ্তাহ নম্বর বের করো
  static getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // বাংলা নতুন বছর চেক
  static isBanglaNewYear(date = new Date()) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    // ১৪ এপ্রিল = বাংলা নববর্ষ (সরলীকৃত)
    return month === 4 && day === 14;
  }

  // বাংলাদেশের ছুটির দিন চেক
  static isHolidayInBangladesh(date = new Date()) {
    const holidays = [
      '01-01', // নববর্ষ
      '02-21', // শহীদ দিবস
      '03-17', // জাতির জনকের জন্মদিন
      '03-26', // স্বাধীনতা দিবস
      '04-14', // বাংলা নববর্ষ
      '05-01', // মে দিবস
      '08-15', // জাতীয় শোক দিবস
      '12-16', // বিজয় দিবস
    ];

    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    return holidays.includes(monthDay) || date.getDay() === 5; // শুক্রবারও ছুটি
  }

  // তারিখ পার্থক্য বাংলায়
  static timeAgoInBangla(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'এইমাত্র';
    if (diffMins < 60) return `${diffMins} মিনিট আগে`;
    if (diffHours < 24) return `${diffHours} ঘন্টা আগে`;
    if (diffDays === 1) return 'গতকাল';
    if (diffDays < 7) return `${diffDays} দিন আগে`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} সপ্তাহ আগে`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} মাস আগে`;
    return `${Math.floor(diffDays / 365)} বছর আগে`;
  }

  // সংখ্যাকে বাংলায় কনভার্ট
  static toBanglaNumber(number) {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return number.toString().replace(/\d/g, digit => banglaDigits[digit]);
  }

  // তারিখ ভ্যালিডেশন
  static isValidBangladeshDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.getFullYear() >= 1900;
  }
}

module.exports = BangladeshCalendar;
