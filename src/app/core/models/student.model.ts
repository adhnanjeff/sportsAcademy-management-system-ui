import { SkillLevel, DayOfWeek, Gender, MonthlyFeeStatus } from './enums.model';
import { AttendanceSummary } from './attendance.model';

// Student Interface (standalone entity, not a User)
export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  phoneNumber?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  nationalIdNumber?: string;
  gender?: Gender;
  skillLevel: SkillLevel;
  daysOfWeek?: DayOfWeek[];
  parentId?: number;
  parentName?: string;
  batchId?: number;
  batchName?: string;
  batchIds?: number[];
  batchNames?: string[];
  totalBatches?: number;
  totalAchievements?: number;
  attendancePercentage?: number;
  averageSkillRating?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  isActive?: boolean;
  joinDate?: string;
  createdAt?: string;
  // Additional form fields
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  feePayable?: number;
  monthlyFeeStatus?: MonthlyFeeStatus;
}

// Create/Update Student Request
export interface StudentRequest {
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth?: string;
  nationalIdNumber?: string;
  phoneNumber?: string;
  photoUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  skillLevel?: SkillLevel;
  daysOfWeek?: DayOfWeek[];
  parentId?: number;
  batchId?: number;
  feePayable?: number;
  monthlyFeeStatus?: MonthlyFeeStatus;
}

// Parent Interface
export interface Parent {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  studentIds?: number[];
  totalStudents?: number;
  isActive: boolean;
}

// Student with extended details for display
export interface StudentDetails extends Student {
  parentDetails?: Parent;
  batches?: BatchSummary[];
  recentAttendance?: AttendanceSummary;
}

// Batch Summary for student display
export interface BatchSummary {
  id: number;
  name: string;
  skillLevel: SkillLevel;
  startTime: string;
  endTime: string;
}

// Fee Payment History
export interface FeePaymentHistory {
  id?: number;
  month: string; // e.g., "January 2026"
  year: number;
  monthNumber: number;
  status: MonthlyFeeStatus;
  amountPaid: number;
  feePayable: number;
  paidDate?: string;
}
