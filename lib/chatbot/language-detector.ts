/**
 * Language Detection Utility
 * Detects the language of user input to ensure chatbot responds in the same language
 */

/**
 * Detect if text is primarily Arabic
 */
export function isArabic(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  
  // Arabic Unicode range: \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  
  // Count Arabic characters
  const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  
  // If more than 30% of characters are Arabic, consider it Arabic
  if (totalChars === 0) return false;
  return (arabicChars / totalChars) > 0.3 || arabicRegex.test(text);
}

/**
 * Detect if text is primarily English
 */
export function isEnglish(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  
  // English uses Latin characters
  const englishRegex = /^[a-zA-Z0-9\s.,!?'"();:\[\]{}@#$%^&*+=<>\/\\|`~\-_]+$/;
  
  // Check if text is primarily English (no Arabic characters)
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  
  return !hasArabic && englishRegex.test(text);
}

/**
 * Detect the primary language of text
 * Returns 'ar' for Arabic, 'en' for English, or 'mixed' for mixed content
 */
export function detectLanguage(text: string): 'ar' | 'en' | 'mixed' {
  if (!text || text.trim().length === 0) return 'en'; // Default to English
  
  const hasArabic = isArabic(text);
  const hasEnglish = isEnglish(text);
  
  if (hasArabic && hasEnglish) {
    // Count characters to determine primary language
    const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    
    return arabicChars > englishChars ? 'ar' : 'en';
  }
  
  if (hasArabic) return 'ar';
  if (hasEnglish) return 'en';
  
  return 'en'; // Default to English
}

/**
 * Get language detection instruction for AI prompt
 */
export function getLanguageDetectionInstruction(detectedLanguage: 'ar' | 'en' | 'mixed'): string {
  if (detectedLanguage === 'ar') {
    return `CRITICAL: The user is writing in Arabic. You MUST respond ONLY in Arabic. Use proper Arabic text with clear, natural language. Do not use English words unless they are technical terms that are commonly used in Arabic (like "generator" or "ATS").`;
  } else if (detectedLanguage === 'en') {
    return `CRITICAL: The user is writing in English. You MUST respond ONLY in English. Use clear, professional English.`;
  } else {
    return `CRITICAL: The user's message contains mixed languages. Respond in the language that appears most frequently, or in Arabic if it's a tie.`;
  }
}

