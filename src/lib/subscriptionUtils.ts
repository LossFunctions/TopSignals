// Utility functions for subscription handling

import { SIGNAL_CONFIG, type SignalKey } from '../types/subscription';

/**
 * Validates a phone number format (basic E.164 check)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Basic E.164 format: +[country code][number] (1-15 digits total after +)
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone.trim());
}

/**
 * Formats a phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Add + if not present
  if (!cleaned.startsWith('+')) {
    // Assume US number if no country code
    if (cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length > 0 && !cleaned.startsWith('+')) {
      // For any other length, assume it needs +1 prefix if it's not already international
      cleaned = '+1' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Display formatter for phone numbers (for UI display)
 */
export function displayPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as US number if it's 10 or 11 digits
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `1-${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return as-is if not a standard US format
}

/**
 * Validates signal preferences object
 */
export function validateSignalPreferences(signals: Record<string, boolean>): boolean {
  const validKeys = Object.keys(SIGNAL_CONFIG);
  const providedKeys = Object.keys(signals);
  
  // Check if all provided keys are valid
  return providedKeys.every(key => validKeys.includes(key));
}

/**
 * Gets array of enabled signal keys from preferences
 */
export function getEnabledSignals(signals: Record<string, boolean>): SignalKey[] {
  return Object.entries(signals)
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => key as SignalKey);
}

/**
 * Creates a default signal preferences object (all false)
 */
export function createDefaultSignalPreferences(): Record<SignalKey, boolean> {
  const defaults: Record<string, boolean> = {};
  Object.keys(SIGNAL_CONFIG).forEach(key => {
    defaults[key] = false;
  });
  return defaults as Record<SignalKey, boolean>;
}

/**
 * Validates subscription request payload
 */
export function validateSubscriptionRequest(data: any): {
  isValid: boolean;
  errors: string[];
  phone?: string;
  signals?: Record<string, boolean>;
} {
  const errors: string[] = [];
  
  // Validate phone
  if (!data.phone || typeof data.phone !== 'string') {
    errors.push('Phone number is required');
  } else if (!validatePhoneNumber(data.phone)) {
    errors.push('Invalid phone number format. Use format: +1234567890');
  }
  
  // Validate signals
  if (!data.signals || typeof data.signals !== 'object') {
    errors.push('Signal preferences are required');
  } else if (!validateSignalPreferences(data.signals)) {
    errors.push('Invalid signal preferences provided');
  } else {
    // Check if at least one signal is enabled
    const enabledSignals = getEnabledSignals(data.signals);
    if (enabledSignals.length === 0) {
      errors.push('At least one signal must be selected');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    phone: data.phone ? formatPhoneNumber(data.phone) : undefined,
    signals: data.signals
  };
}