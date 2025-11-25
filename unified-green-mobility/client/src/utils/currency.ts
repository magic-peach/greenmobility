/**
 * Currency formatting utilities for Indian Rupees (₹)
 */

/**
 * Format a number as Indian Rupees
 * @param amount - Amount in rupees
 * @param showDecimals - Whether to show decimal places (default: false)
 * @returns Formatted string with ₹ symbol
 */
export function formatINR(amount: number | string | null | undefined, showDecimals: boolean = false): string {
  if (amount === null || amount === undefined || amount === '') {
    return '₹0';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '₹0';
  }

  const formatted = showDecimals 
    ? numAmount.toFixed(2)
    : Math.round(numAmount).toString();

  // Add Indian number formatting (lakhs, crores)
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `₹${parts.join('.')}`;
}

/**
 * Format fare amount for display
 */
export function formatFare(amount: number | string | null | undefined): string {
  return formatINR(amount, false);
}

/**
 * Format coupon value for display
 */
export function formatCouponValue(amount: number | string | null | undefined): string {
  return formatINR(amount, false);
}

