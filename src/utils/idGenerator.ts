let idCounter = 0;

/**
 * Generate unique IDs for circles and transformations
 */
export function generateId(prefix: string): string {
  return `${prefix}_${++idCounter}_${Date.now()}`;
}
