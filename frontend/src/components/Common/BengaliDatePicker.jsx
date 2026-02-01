import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getBengaliDate, getBengaliDayName, BENGALI_MONTHS, BENGALI_DAYS_SHORT } from '../../utils/bengaliDate';

const BengaliDatePicker = ({ 
  value, 
  onChange, 
  label = 'তারিখ নির্বাচন', 
  required = false,
  disabled = false,
  minDate = null,
  maxDate = null
}) => {
  const { t, isBengali } = useLanguage();
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());

  // মাস পরিবর্তন
  const changeMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // তারিখ নির্বাচন
  const selectDate = (date) => {
    setSelectedDate(date);
    onChange(date);
    setShowCalendar(false);
  };

  // মাসের দিন গুলো তৈরি করো
  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // আগের মাসের শেষ দিন গুলো
    const firstDayOfWeek = firstDay.getDay();
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: true
      });
    }
    
    // বর্তমান মাসের দিন গুলো
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      
      // তারিখ ডিসএবল চেক
      let isDisabled = false;
      if (minDate && date < new Date(minDate)) isDisabled = true;
      if (maxDate && date > new Date(maxDate)) isDisabled = true;
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        isSelected,
        isDisabled
      });
    }
    
    // পরের মাসের প্রথম দিন গুলো
    const totalCells = 42; // 6 weeks * 7 days
    const nextMonthDays = totalCells - days.length;
    
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: true
      });
    }
    
    return days;
  };

  // সপ্তাহ ভাগ করো
  const getWeeks = () => {
    const days = getDaysInMonth();
    const weeks = [];
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
  };

  // বাংলা মাসের নাম
  const getBengaliMonthYear = () => {
    const banglaYear = currentYear - 593;
    const monthName = BENGALI_MONTHS[currentMonth];
    return `${monthName} ${banglaYear}`;
  };

  // ইনপুট ভ্যালু ফরম্যাট
  const formatInputValue = () => {
    if (!selectedDate) return '';
    
    if (isBengali) {
      return getBengaliDate(selectedDate);
    }
    
    return selectedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // কালেন্ডার বাইরে ক্লিক করলে বন্ধ করো
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.date-picker-container')) {
        setShowCalendar(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const weeks = getWeeks();

  return (
    <div className="relative date-picker-container">
      {/* লেবেল */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* তারিখ ইনপুট */}
      <div className="relative">
        <input
          type="text"
          value={formatInputValue()}
          readOnly
          onClick={() => !disabled && setShowCalendar(!showCalendar)}
          className={`
            w-full pl-10 pr-4 py-3 border rounded-lg
            ${disabled 
              ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' 
              : 'bg-white dark:bg-gray-900 cursor-pointer'
            }
            ${showCalendar 
              ? 'border-blue-500 ring-2 ring-blue-500/20' 
              : 'border-gray-300 dark:border-gray-700'
            }
            text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200
          `}
          disabled={disabled}
          placeholder={isBengali ? "তারিখ নির্বাচন করুন" : "Select date"}
        />
        
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Calendar className={`h-5 w-5 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
        
        {selectedDate && !disabled && (
          <button
            type="button"
            onClick={() => {
              setSelectedDate(new Date());
              onChange(new Date());
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
          >
            {isBengali ? 'আজ' : 'Today'}
          </button>
        )}
      </div>
      
      {/* ক্যালেন্ডার পপআপ */}
      {showCalendar && !disabled && (
        <div className="absolute z-50 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4">
          {/* হেডার - মাস এবং বছর */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {getBengaliMonthYear()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isBengali ? 'বাংলা তারিখ' : 'Bangla Date'}
              </div>
            </div>
            
            <button
              onClick={() => changeMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* সপ্তাহের দিন গুলো */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {BENGALI_DAYS_SHORT.map((day, index) => (
              <div
                key={index}
                className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-1"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* মাসের দিন গুলো */}
          <div className="grid grid-cols-7 gap-1">
            {weeks.map((week, weekIndex) => (
              <React.Fragment key={weekIndex}>
                {week.map((day, dayIndex) => (
                  <button
                    key={dayIndex}
                    onClick={() => !day.isDisabled && selectDate(day.date)}
                    disabled={day.isDisabled}
                    className={`
                      h-8 w-8 rounded-lg text-sm font-medium
                      flex items-center justify-center
                      transition-all duration-200
                      ${day.isDisabled
                        ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                        : day.isSelected
                          ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                          : day.isToday
                            ? 'border-2 border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                      ${!day.isCurrentMonth && 'opacity-40'}
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
          
          {/* নির্বাচিত তারিখ ডিসপ্লে */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isBengali ? 'নির্বাচিত তারিখ:' : 'Selected Date:'}
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white mt-1">
                {getBengaliDate(selectedDate)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                {getBengaliDayName(selectedDate)}
              </div>
            </div>
          </div>
          
          {/* ফুটার */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowCalendar(false)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isBengali ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BengaliDatePicker;
