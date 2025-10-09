import { customAlphabet } from 'nanoid';

// Generate a URL-friendly ID using a custom alphabet
const generateId = customAlphabet('123456789abcdefghijkmnopqrstuvwxyz', 10);

export function generateCaseId(): string {
  return `case_${generateId()}`;
}

export function generateVariantId(): string {
  return `var_${generateId()}`;
}
