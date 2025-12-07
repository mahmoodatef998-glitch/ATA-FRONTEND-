/**
 * Internationalized Error Messages
 * Centralized error messages with i18n support
 */

import { Language } from './index';

export interface ErrorMessages {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const ERROR_MESSAGES: ErrorMessages = {
  // Authentication
  UNAUTHORIZED: {
    en: "Unauthorized. Please log in to continue.",
    ar: "غير مصرح. يرجى تسجيل الدخول للمتابعة.",
  },
  FORBIDDEN: {
    en: "Access denied. You don't have permission to perform this action.",
    ar: "تم رفض الوصول. ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  },
  INVALID_CREDENTIALS: {
    en: "Invalid email or password.",
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  },

  // Validation
  VALIDATION_FAILED: {
    en: "Validation failed. Please check your input.",
    ar: "فشل التحقق. يرجى التحقق من المدخلات.",
  },
  REQUIRED_FIELD: {
    en: "This field is required.",
    ar: "هذا الحقل مطلوب.",
  },
  INVALID_EMAIL: {
    en: "Please enter a valid email address.",
    ar: "يرجى إدخال عنوان بريد إلكتروني صحيح.",
  },
  INVALID_PHONE: {
    en: "Please enter a valid phone number.",
    ar: "يرجى إدخال رقم هاتف صحيح.",
  },

  // Orders
  ORDER_NOT_FOUND: {
    en: "Order not found.",
    ar: "الطلب غير موجود.",
  },
  ORDER_ALREADY_COMPLETED: {
    en: "This order is already completed.",
    ar: "هذا الطلب مكتمل بالفعل.",
  },
  ORDER_ALREADY_CANCELLED: {
    en: "This order is already cancelled.",
    ar: "هذا الطلب ملغي بالفعل.",
  },

  // Quotations
  QUOTATION_NOT_FOUND: {
    en: "Quotation not found.",
    ar: "العرض غير موجود.",
  },
  QUOTATION_ALREADY_SENT: {
    en: "This quotation has already been sent.",
    ar: "تم إرسال هذا العرض بالفعل.",
  },

  // Files
  FILE_TOO_LARGE: {
    en: "File size exceeds the maximum allowed size.",
    ar: "حجم الملف يتجاوز الحد الأقصى المسموح به.",
  },
  INVALID_FILE_TYPE: {
    en: "Invalid file type. Please upload a valid file.",
    ar: "نوع ملف غير صحيح. يرجى رفع ملف صحيح.",
  },
  FILE_UPLOAD_FAILED: {
    en: "Failed to upload file. Please try again.",
    ar: "فشل رفع الملف. يرجى المحاولة مرة أخرى.",
  },

  // Database
  DATABASE_ERROR: {
    en: "A database error occurred. Please try again later.",
    ar: "حدث خطأ في قاعدة البيانات. يرجى المحاولة لاحقاً.",
  },
  RECORD_NOT_FOUND: {
    en: "Record not found.",
    ar: "السجل غير موجود.",
  },
  DUPLICATE_RECORD: {
    en: "A record with this information already exists.",
    ar: "سجل بهذه المعلومات موجود بالفعل.",
  },

  // Network
  NETWORK_ERROR: {
    en: "Network error. Please check your connection and try again.",
    ar: "خطأ في الشبكة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.",
  },
  REQUEST_TIMEOUT: {
    en: "Request timeout. Please try again.",
    ar: "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.",
  },

  // Generic
  UNEXPECTED_ERROR: {
    en: "An unexpected error occurred. Please try again.",
    ar: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
  },
  OPERATION_FAILED: {
    en: "Operation failed. Please try again.",
    ar: "فشلت العملية. يرجى المحاولة مرة أخرى.",
  },
  SERVER_ERROR: {
    en: "Server error. Please try again later.",
    ar: "خطأ في الخادم. يرجى المحاولة لاحقاً.",
  },

  // Team Module
  TEAM_MEMBER_NOT_FOUND: {
    en: "Team member not found.",
    ar: "عضو الفريق غير موجود.",
  },
  ATTENDANCE_NOT_FOUND: {
    en: "Attendance record not found.",
    ar: "سجل الحضور غير موجود.",
  },
  TASK_NOT_FOUND: {
    en: "Task not found.",
    ar: "المهمة غير موجودة.",
  },
  INSUFFICIENT_PERMISSIONS: {
    en: "You don't have permission to perform this action.",
    ar: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  },
};

/**
 * Get error message in specified language
 */
export function getErrorMessage(key: string, language: Language = 'en'): string {
  const message = ERROR_MESSAGES[key];
  if (!message) {
    return language === 'ar' 
      ? 'حدث خطأ غير متوقع'
      : 'An unexpected error occurred';
  }
  return message[language];
}

/**
 * Get error message with fallback
 */
export function getErrorMessageSafe(
  key: string,
  language: Language = 'en',
  fallback?: string
): string {
  try {
    return getErrorMessage(key, language);
  } catch {
    return fallback || (language === 'ar' ? 'حدث خطأ' : 'An error occurred');
  }
}

