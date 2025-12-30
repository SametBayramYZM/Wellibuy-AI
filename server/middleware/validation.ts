import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

/**
 * 🔐 Input Validation Middleware
 * 
 * Sanitizes and validates all user inputs
 * Prevents SQL injection, XSS, and other attacks
 */

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && validator.isEmail(email);
};

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate phone number (international format E.164)
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Sanitize input strings
 */
export const sanitizeString = (str: string): string => {
  return validator.trim(validator.escape(str));
};

/**
 * Validate credit card number using Luhn algorithm
 */
export const validateCardNumber = (cardNumber: string): boolean => {
  const sanitized = cardNumber.replace(/\s/g, '');
  
  if (!/^\d{13,19}$/.test(sanitized)) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * Validate CVV (3 or 4 digits)
 */
export const validateCVV = (cvv: string): boolean => {
  return /^\d{3,4}$/.test(cvv);
};

/**
 * Validate expiry date (MM/YY or MM/YYYY)
 */
export const validateExpiryDate = (expiry: string): boolean => {
  const [month, year] = expiry.split('/');
  
  if (!month || !year) {
    return false;
  }
  
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  // Check valid month
  if (monthNum < 1 || monthNum > 12) {
    return false;
  }
  
  // Check valid year (accept 2-digit or 4-digit)
  const currentYear = new Date().getFullYear();
  let fullYear = yearNum;
  
  if (yearNum < 100) {
    fullYear = 2000 + yearNum;
  }
  
  if (fullYear < currentYear) {
    return false;
  }
  
  // Check not too far in future
  if (fullYear > currentYear + 20) {
    return false;
  }
  
  return true;
};

/**
 * Middleware to validate and sanitize request body
 */
export const validateInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Sanitize all string fields in body
    if (req.body) {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          (req.body as any)[key] = sanitizeString(value);
        }
      }
    }
    
    next();
    
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
};

/**
 * Validate registration data
 */
export const validateRegisterData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.email) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (!data.password) {
    errors.push('Password is required');
  } else if (!validatePassword(data.password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
  }
  
  if (data.firstName && typeof data.firstName !== 'string') {
    errors.push('First name must be a string');
  }
  
  if (data.lastName && typeof data.lastName !== 'string') {
    errors.push('Last name must be a string');
  }
  
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Invalid phone number format');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate login data
 */
export const validateLoginData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.email) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (!data.password) {
    errors.push('Password is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate password change data
 */
export const validatePasswordChangeData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.currentPassword) {
    errors.push('Current password is required');
  }
  
  if (!data.newPassword) {
    errors.push('New password is required');
  } else if (!validatePassword(data.newPassword)) {
    errors.push('New password must be at least 8 characters with uppercase, lowercase, number, and special character');
  }
  
  if (data.currentPassword === data.newPassword) {
    errors.push('New password must be different from current password');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate payment method data
 */
export const validatePaymentMethodData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.cardNumber) {
    errors.push('Card number is required');
  } else if (!validateCardNumber(data.cardNumber)) {
    errors.push('Invalid card number');
  }
  
  if (!data.cardHolder) {
    errors.push('Card holder name is required');
  } else if (data.cardHolder.length < 3 || data.cardHolder.length > 100) {
    errors.push('Card holder name must be between 3 and 100 characters');
  }
  
  if (!data.expiry) {
    errors.push('Expiry date is required');
  } else if (!validateExpiryDate(data.expiry)) {
    errors.push('Invalid expiry date');
  }
  
  if (!data.cvv) {
    errors.push('CVV is required');
  } else if (!validateCVV(data.cvv)) {
    errors.push('Invalid CVV');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
