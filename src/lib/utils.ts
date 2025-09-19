// lib/utils.ts
/**
 * Utility functions for formatting and common operations
 */

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: KES for Kenyan Shilling)
 * @param locale - The locale for formatting (default: en-KE)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'KES', 
  locale: string = 'en-KE'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Fallback formatting if Intl.NumberFormat fails
    return `${currency} ${amount.toLocaleString()}`
  }
}

/**
 * Format a date string or Date object
 * @param date - The date to format (string, Date, or number)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }

    return new Intl.DateTimeFormat('en-KE', defaultOptions).format(dateObj)
  } catch {
    return 'Invalid Date'
  }
}

/**
 * Format a date as a short date string (MM/DD/YYYY)
 * @param date - The date to format
 * @returns Short date string
 */
export function formatShortDate(date: string | Date | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Format a date with time
 * @param date - The date to format
 * @returns Date and time string
 */
export function formatDateTime(date: string | Date | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Calculate the number of days between two dates
 * @param startDate - Start date
 * @param endDate - End date (default: current date)
 * @returns Number of days between dates
 */
export function daysBetween(
  startDate: string | Date | number,
  endDate: string | Date | number = new Date()
): number {
  try {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)
    
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch {
    return 0
  }
}

/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if the date is today
 */
export function isToday(date: string | Date | number): boolean {
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    const today = new Date()
    
    return dateObj.toDateString() === today.toDateString()
  } catch {
    return false
  }
}

/**
 * Get a relative time string (e.g., "2 days ago", "in 3 hours")
 * @param date - The date to compare
 * @param baseDate - The base date to compare against (default: current date)
 * @returns Relative time string
 */
export function getRelativeTime(
  date: string | Date | number,
  baseDate: Date = new Date()
): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    const diffMs = dateObj.getTime() - baseDate.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (Math.abs(diffDays) >= 1) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ${diffDays > 0 ? 'from now' : 'ago'}`
    } else if (Math.abs(diffHours) >= 1) {
      return `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ${diffHours > 0 ? 'from now' : 'ago'}`
    } else if (Math.abs(diffMinutes) >= 1) {
      return `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) > 1 ? 's' : ''} ${diffMinutes > 0 ? 'from now' : 'ago'}`
    } else {
      return 'just now'
    }
  } catch {
    return 'unknown time'
  }
}

/**
 * Capitalize the first letter of a string
 * @param str - The string to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert a string to title case
 * @param str - The string to convert
 * @returns Title case string
 */
export function toTitleCase(str: string): string {
  if (!str) return ''
  return str.split(' ').map(word => capitalize(word)).join(' ')
}

/**
 * Generate initials from a name
 * @param name - The full name
 * @param maxInitials - Maximum number of initials (default: 2)
 * @returns Initials string
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  if (!name) return ''
  
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, maxInitials)
    .map(word => word[0].toUpperCase())
    .join('')
}

/**
 * Format a phone number for display
 * @param phone - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format based on length (assuming Kenyan format)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    // 0712345678 -> 0712 345 678
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
  } else if (cleaned.length === 12 && cleaned.startsWith('254')) {
    // 254712345678 -> +254 712 345 678
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '+$1 $2 $3 $4')
  } else if (cleaned.length === 9) {
    // 712345678 -> 712 345 678
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
  }
  
  // Return original if no pattern matches
  return phone
}

/**
 * Truncate text to a specified length
 * @param text - The text to truncate
 * @param maxLength - Maximum length (default: 100)
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated text
 */
export function truncateText(
  text: string, 
  maxLength: number = 100, 
  suffix: string = '...'
): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Generate a random ID string
 * @param prefix - Optional prefix for the ID
 * @param length - Length of the random part (default: 8)
 * @returns Random ID string
 */
export function generateId(prefix?: string, length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return prefix ? `${prefix}${result}` : result
}
