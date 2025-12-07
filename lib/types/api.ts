/**
 * API Response Types
 * Standard types for API responses across the application
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

export interface ApiError {
  success: false;
  error: string;
  details?: {
    message?: string;
    stack?: string;
    code?: string;
    field?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Attendance Types
 */
export interface AttendanceTask {
  id: number;
  taskId: number;
  status: string;
  performedAt: string | null;
  completedAt: string | null;
  task: {
    id: number;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    deadline?: string | null;
    location?: string | null;
    estimatedHours?: number | null;
    actualHours?: number | null;
  };
}

export interface AttendanceRecord {
  id: number;
  checkInTime: string;
  checkOutTime: string | null;
  checkInLocation: string | null;
  checkOutLocation: string | null;
  status: string;
  hoursWorked: number | null;
  overtime: number | null;
  tasks: AttendanceTask[];
}

export interface TeamMemberWithAttendance {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  specialization?: string | null;
  profilePicture?: string | null;
  isPresent: boolean;
  attendance: AttendanceRecord | null;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  checkedIn: number;
  checkedOut: number;
  totalHours: number;
  totalTasks: number;
  completedTasks: number;
}

/**
 * Task Types
 */
export interface TaskAssignee {
  id: number;
  userId: number;
  assignedAt: string;
  assignedById?: number | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TaskRecord {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  deadline?: string | null;
  location?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  assignees?: TaskAssignee[];
  assignedToId?: number | null;
}

/**
 * User Types
 */
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  specialization?: string | null;
  profilePicture?: string | null;
  accountStatus: string;
  createdAt: string;
  companyId: number;
  company?: {
    id: number;
    name: string;
  };
}

/**
 * Prisma Error Types
 */
export interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
    cause?: string;
  };
}

/**
 * Validation Error Types
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: "Validation failed";
  errors: ValidationError[];
}

