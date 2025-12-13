/**
 * Validation utilities for common form validations
 */

/**
 * Finds duplicate values in an array
 * @param {Array} array - Array to check for duplicates
 * @param {function} keyFn - Optional function to extract key from each item (default: identity)
 * @returns {Array} Array of duplicate values
 */
export const findDuplicates = (array, keyFn = (item) => item) => {
  const values = array.map(keyFn);
  const seen = new Set();
  const duplicates = new Set();
  
  values.forEach((value, index) => {
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  });
  
  return Array.from(duplicates);
};

/**
 * Validates a URL
 * @param {string} url - URL to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateUrl = (url) => {
  if (!url || !url.trim()) {
    return 'URL is required';
  }
  
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return 'URL must start with http:// or https://';
    }
    return null;
  } catch (error) {
    // If URL constructor fails, try regex validation
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      return 'Please enter a valid URL starting with http:// or https://';
    }
    return null;
  }
};

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Email is required';
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

/**
 * Validates that a value is not empty
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validates a number is within a range
 * @param {number|string} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Name of the field for error messages
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateNumberRange = (value, min, max, fieldName = 'Value') => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num < min || num > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
};

