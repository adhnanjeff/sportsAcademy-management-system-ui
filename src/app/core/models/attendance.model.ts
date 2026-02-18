import { AttendanceStatus } from './enums.model';

// Attendance Record Interface
export interface Attendance {
  id: number;
  studentId: number;
  studentName: string;
  studentPhotoUrl?: string;
  batchId: number;
  batchName: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  markedById?: number;
  markedByName?: string;
  markedAt?: string;
}

// Mark Attendance Request
export interface AttendanceRequest {
  studentId: number;
  batchId: number;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

// Bulk Attendance Request
export interface BulkAttendanceRequest {
  batchId: number;
  date: string;
  studentAttendances: StudentAttendanceInput[];
}

// Individual student attendance in bulk request
export interface StudentAttendanceInput {
  studentId: number;
  status: AttendanceStatus;
  notes?: string;
}

// Attendance Summary Response
export interface AttendanceSummary {
  studentId?: number;
  studentName?: string;
  batchId?: number;
  batchName?: string;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
}

// Attendance for marking (UI state)
export interface AttendanceMarkingItem {
  studentId: number;
  studentName: string;
  studentPhotoUrl?: string;
  status: AttendanceStatus;
  notes: string;
  isMarked: boolean;
}

// Daily attendance summary for a batch
export interface DailyBatchAttendance {
  batchId: number;
  batchName: string;
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  isCompleted: boolean;
}
