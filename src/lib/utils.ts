import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import writtenNumber from 'written-number'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "0,00 DH";
  }
  
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount)) + ' DH';
}

export function numberToFrenchWords(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "";
  
  writtenNumber.defaults.lang = 'fr';
  
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  
  let result = writtenNumber(integerPart);
  
  if (decimalPart > 0) {
    result += ` dirhams et ${writtenNumber(decimalPart)} centimes`;
  } else {
    result += ` dirhams`;
  }
  
  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}
