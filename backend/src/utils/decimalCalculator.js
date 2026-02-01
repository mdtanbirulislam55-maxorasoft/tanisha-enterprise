/**
 * সঠিক দশমিক গণনা ইউটিলিটি
 * Prepared by Eng Tanbir Rifat | MaxoraSoft
 */

class DecimalCalculator {
  /**
   * দশমিক সংখ্যা যোগ করো
   */
  static add(...numbers) {
    return numbers.reduce((sum, num) => {
      const num1 = parseFloat(sum) || 0;
      const num2 = parseFloat(num) || 0;
      return parseFloat((num1 + num2).toFixed(2));
    }, 0);
  }

  /**
   * দশমিক সংখ্যা বিয়োগ করো
   */
  static subtract(...numbers) {
    return numbers.reduce((result, num, index) => {
      if (index === 0) return parseFloat(num) || 0;
      const num1 = parseFloat(result) || 0;
      const num2 = parseFloat(num) || 0;
      return parseFloat((num1 - num2).toFixed(2));
    }, 0);
  }

  /**
   * দশমিক সংখ্যা গুণ করো
   */
  static multiply(...numbers) {
    return numbers.reduce((product, num) => {
      const num1 = parseFloat(product) || 1;
      const num2 = parseFloat(num) || 1;
      return parseFloat((num1 * num2).toFixed(2));
    }, 1);
  }

  /**
   * দশমিক সংখ্যা ভাগ করো
   */
  static divide(dividend, divisor) {
    const num1 = parseFloat(dividend) || 0;
    const num2 = parseFloat(divisor) || 1;
    
    if (num2 === 0) {
      throw new Error('Division by zero');
    }
    
    return parseFloat((num1 / num2).toFixed(2));
  }

  /**
   * শতাংশ বের করো
   */
  static percentage(part, total) {
    const num1 = parseFloat(part) || 0;
    const num2 = parseFloat(total) || 1;
    
    if (num2 === 0) {
      return 0;
    }
    
    return parseFloat(((num1 / num2) * 100).toFixed(2));
  }

  /**
   * মার্জিন ক্যালকুলেট করো
   */
  static calculateMargin(costPrice, sellPrice) {
    const cost = parseFloat(costPrice) || 0;
    const sell = parseFloat(sellPrice) || 0;
    
    if (cost === 0) {
      return 100;
    }
    
    const profit = sell - cost;
    return parseFloat(((profit / sell) * 100).toFixed(2));
  }

  /**
   * মার্কআপ ক্যালকুলেট করো
   */
  static calculateMarkup(costPrice, sellPrice) {
    const cost = parseFloat(costPrice) || 0;
    const sell = parseFloat(sellPrice) || 0;
    
    if (cost === 0) {
      return 0;
    }
    
    const profit = sell - cost;
    return parseFloat(((profit / cost) * 100).toFixed(2));
  }

  /**
   * ট্যাক্স ক্যালকুলেট করো
   */
  static calculateTax(amount, taxRate) {
    const amt = parseFloat(amount) || 0;
    const rate = parseFloat(taxRate) || 0;
    
    return parseFloat((amt * (rate / 100)).toFixed(2));
  }

  /**
   * ডিসকাউন্ট ক্যালকুলেট করো
   */
  static calculateDiscount(amount, discountRate) {
    const amt = parseFloat(amount) || 0;
    const rate = parseFloat(discountRate) || 0;
    
    return parseFloat((amt * (rate / 100)).toFixed(2));
  }

  /**
   * সংখ্যাকে টাকায় কনভার্ট করো (পয়সা সহ)
   */
  static toBDT(amount) {
    const amt = parseFloat(amount) || 0;
    const taka = Math.floor(amt);
    const poisha = Math.round((amt - taka) * 100);
    
    return {
      taka,
      poisha,
      formatted: `৳${taka.toLocaleString('bn-BD')}.${poisha.toString().padStart(2, '0')}`
    };
  }

  /**
   * টাকা থেকে সংখ্যায় কনভার্ট করো
   */
  static fromBDT(bdtString) {
    const cleaned = bdtString.replace(/[৳,]/g, '');
    return parseFloat(cleaned) || 0;
  }

  /**
   * সংখ্যা রাউন্ড করো (বাংলাদেশি টাকার জন্য)
   */
  static roundForBDT(amount) {
    const amt = parseFloat(amount) || 0;
    return Math.round(amt * 100) / 100;
  }

  /**
   * সংখ্যা ভ্যালিডেশন
   */
  static isValidNumber(value) {
    if (value === null || value === undefined) return false;
    
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  }

  /**
   * সংখ্যা রেঞ্জ চেক
   */
  static isInRange(value, min, max) {
    if (!this.isValidNumber(value)) return false;
    
    const num = parseFloat(value);
    return num >= min && num <= max;
  }
}

module.exports = DecimalCalculator;
