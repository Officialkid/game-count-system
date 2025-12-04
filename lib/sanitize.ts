// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeString(input: string, maxLength: number = 255): string {
  // Remove HTML tags
  const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  // Trim whitespace
  const trimmed = cleaned.trim();
  // Enforce length
  return trimmed.slice(0, maxLength);
}
