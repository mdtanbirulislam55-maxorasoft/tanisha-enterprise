import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatBDTInput, validateBDTInput, amountToWords } from '../../utils/bdtFormatter';

const BDTInput = ({
  value,
  onChange,
  label = 'টাকার পরিমাণ',
  placeholder = 'টাকার পরিমাণ লিখুন',
  required = false,
  disabled = false,
  error = null,
  showWords = false,
  compact = false,
  maxLength = 15,
  className = ''
}) => {
  const { t, isBengali, formatCurrency } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const [validation, setValidation] = useState({ isValid: true, error: '' });
  const [focused, setFocused] = useState(false);
  const [amountInWords, setAmountInWords] = useState('');

  // প্রপস থেকে ভ্যালু সেট করো
  useEffect(() => {
    if (value !== undefined && value !== null) {
      const formatted = formatBDTInput(value.toString());
      setInputValue(formatted);
      
      // টাকার পরিমাণ শব্দে কনভার্ট
      if (showWords) {
        const words = amountToWords(parseFloat(value) || 0);
        setAmountInWords(words);
      }
    }
  }, [value, showWords]);

  // ইনপুট চেঞ্জ হ্যান্ডলার
  const handleChange = (e) => {
    const rawValue = e.target.value;
    
    // ইনপুট ফরম্যাট করো
    const formatted = formatBDTInput(rawValue);
    setInputValue(formatted);
    
    // ভ্যালিডেশন চেক করো
    const validationResult = validateBDTInput(rawValue);
    setValidation(validationResult);
    
    // প্যারেন্ট কম্পোনেন্টকে জানাও
    if (validationResult.isValid) {
      onChange(validationResult.value);
      
      // শব্দে কনভার্ট করো
      if (showWords) {
        const words = amountToWords(validationResult.value);
        setAmountInWords(words);
      }
    } else {
      onChange(null);
      setAmountInWords('');
    }
  };

  // ফোকাস হ্যান্ডলার
  const handleFocus = () => {
    setFocused(true);
    // ফোকাসে আসলে কমা সরাও
    if (inputValue) {
      const withoutCommas = inputValue.replace(/,/g, '');
      setInputValue(withoutCommas);
    }
  };

  // ব্লার হ্যান্ডলার
  const handleBlur = () => {
    setFocused(false);
    // ব্লারে গেলে আবার ফরম্যাট করো
    if (inputValue) {
      const formatted = formatBDTInput(inputValue);
      setInputValue(formatted);
    }
  };

  // ক্লিয়ার বাটন
  const handleClear = () => {
    setInputValue('');
    setValidation({ isValid: true, error: '' });
    setAmountInWords('');
    onChange(null);
  };

  // প্রি-ডিফাইন্ড অ্যামাউন্ট বাটন
  const predefinedAmounts = isBengali 
    ? ['১,০০০', '৫,০০০', '১০,০০০', '২৫,০০০', '৫০,০০০', '১,০০,০০০']
    : ['1,000', '5,000', '10,000', '25,000', '50,000', '100,000'];

  const handlePredefinedClick = (amount) => {
    const formatted = formatBDTInput(amount);
    setInputValue(formatted);
    
    const validationResult = validateBDTInput(amount);
    setValidation(validationResult);
    
    if (validationResult.isValid) {
      onChange(validationResult.value);
      
      if (showWords) {
        const words = amountToWords(validationResult.value);
        setAmountInWords(words);
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* লেবেল */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          
          {validation.isValid && value && (
            <span className="text-sm font-bold text-gray-800 dark:text-white">
              {compact 
                ? formatCurrency(value, { notation: 'compact' })
                : formatCurrency(value)
              }
            </span>
          )}
        </div>
      )}
      
      {/* মেইন ইনপুট */}
      <div className="relative">
        <div className={`
          flex items-center border rounded-lg transition-all duration-200
          ${disabled 
            ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700' 
            : focused 
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-gray-900'
              : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900'
          }
          ${validation.error || error ? 'border-red-500 ring-2 ring-red-500/20' : ''}
        `}>
          {/* কারেন্সি আইকন */}
          <div className={`
            pl-3 pr-2 py-3 border-r
            ${disabled 
              ? 'border-gray-300 dark:border-gray-700 text-gray-400' 
              : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }
          `}>
            <DollarSign className="h-5 w-5" />
          </div>
          
          {/* টাকার ইনপুট */}
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            maxLength={maxLength}
            placeholder={placeholder}
            className={`
              flex-1 px-3 py-3 bg-transparent
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
          />
          
          {/* ক্লিয়ার বাটন */}
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* এরর মেসেজ */}
        {(validation.error || error) && (
          <div className="flex items-center mt-1 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>{validation.error || error}</span>
          </div>
        )}
        
        {/* টাকার পরিমাণ শব্দে */}
        {showWords && amountInWords && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-900/30">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {isBengali ? 'টাকার পরিমাণ শব্দে:' : 'Amount in words:'}
            </div>
            <div className="text-sm font-medium text-gray-800 dark:text-white">
              {amountInWords}
            </div>
          </div>
        )}
      </div>
      
      {/* প্রি-ডিফাইন্ড অ্যামাউন্ট বাটন */}
      {!disabled && (
        <div className="flex flex-wrap gap-2 mt-2">
          {predefinedAmounts.map((amount, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handlePredefinedClick(amount)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                       rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              ৳{amount}
            </button>
          ))}
        </div>
      )}
      
      {/* কারেন্সি কনভার্টার (বোনাস) */}
      {!disabled && focused && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {isBengali ? 'কারেন্সি কনভার্টার' : 'Currency Converter'}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-700 dark:text-gray-300">USD:</div>
            <div className="text-gray-900 dark:text-white font-medium">
              ${validation.isValid ? (value / 109.5).toFixed(2) : '0.00'}
            </div>
            <div className="text-gray-700 dark:text-gray-300">EUR:</div>
            <div className="text-gray-900 dark:text-white font-medium">
              €{validation.isValid ? (value / 118.75).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BDTInput;
