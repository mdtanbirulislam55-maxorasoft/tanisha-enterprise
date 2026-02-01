/**
 * Format number to Bangladeshi Taka (BDT) currency
 * @param {number} amount - Amount to format
 * @param {boolean} compact - Whether to use compact notation (K, Lac, Cr)
 * @returns {string} Formatted BDT string
 */
export const formatBDT = (amount, compact = false) => {
  if (amount === null || amount === undefined) return '৳ 0';
  
  const num = Number(amount);
  
  if (isNaN(num)) return '৳ 0';
  
  if (compact) {
    if (num >= 10000000) {
      // Crore
      return `৳ ${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
      // Lac
      return `৳ ${(num / 100000).toFixed(2)} Lac`;
    } else if (num >= 1000) {
      // Thousand
      return `৳ ${(num / 1000).toFixed(1)} K`;
    }
  }
  
  // Regular formatting with commas
  const formatted = new Intl.NumberFormat('bn-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
  
  return `৳ ${formatted}`;
};

/**
 * Format number for display in charts/tables
 * @param {number} value - Value to format
 * @returns {string} Formatted string
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  
  const num = Number(value);
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('bn-BD').format(num);
};

/**
 * Calculate percentage change
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change
 */
export const calculateChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100);
};