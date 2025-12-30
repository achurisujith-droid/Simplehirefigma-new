/**
 * Security utilities for LLM prompt injection prevention and safe JSON parsing
 */

/**
 * Sanitize text to prevent LLM prompt injection attacks
 * Removes or escapes potentially dangerous patterns
 */
export function sanitizePrompt(text: string): string {
  if (!text) return '';

  // Remove excessive newlines that could be used to break prompt structure
  let sanitized = text.replace(/\n{3,}/g, '\n\n');

  // Remove potential prompt injection markers
  const dangerousPatterns = [
    /ignore\s+previous\s+instructions/gi,
    /ignore\s+all\s+previous/gi,
    /disregard\s+previous/gi,
    /forget\s+previous/gi,
    /system:\s*/gi,
    /assistant:\s*/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
  ];

  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Limit length to prevent excessive token usage
  const maxLength = 50000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '... [truncated]';
  }

  return sanitized.trim();
}

/**
 * Safely parse JSON with error handling
 * Returns parsed object or null on error
 */
export function safeJsonParse<T = any>(jsonString: string): T | null {
  if (!jsonString) return null;

  try {
    // Remove markdown code blocks if present
    let cleaned = jsonString.trim();

    // Remove ```json or ``` markers
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // Try to parse
    const parsed = JSON.parse(cleaned);
    return parsed as T;
  } catch (error) {
    // Try to extract JSON from text
    try {
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed as T;
      }
    } catch (e) {
      // Silent fail
    }
    return null;
  }
}

/**
 * Validate and sanitize file content before processing
 */
export function sanitizeFileContent(content: string): string {
  if (!content) return '';

  // Remove null bytes
  let sanitized = content.replace(/\0/g, '');

  // Normalize line endings
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove excessive whitespace while preserving structure
  sanitized = sanitized.replace(/[ \t]+$/gm, ''); // trailing spaces
  sanitized = sanitized.replace(/^\s*\n/gm, '\n'); // empty lines with spaces

  return sanitized;
}
