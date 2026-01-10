import { SavedCalculation } from '@/types/saved-calculations';

const STORAGE_KEY = 'pen-lighting-saved-calculations';

export function getSavedCalculations(): SavedCalculation[] {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading saved calculations:', error);
    return [];
  }
}

export function saveCalculation(calculation: SavedCalculation): void {
  try {
    const saved = getSavedCalculations();
    const updated = [calculation, ...saved];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving calculation:', error);
  }
}

export function deleteCalculation(id: string): void {
  try {
    const saved = getSavedCalculations();
    const updated = saved.filter(calc => calc.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error deleting calculation:', error);
  }
}

export function clearAllCalculations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing calculations:', error);
  }
}

export function generateCalculationId(): string {
  return `calc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
