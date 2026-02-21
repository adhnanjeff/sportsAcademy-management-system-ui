import { AttendanceStatus, AttendanceEntryType } from './enums.model';

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
  entryType?: AttendanceEntryType;
  compensatesForDate?: string;
  notes?: string;
  markedById?: number;
  markedByName?: string;
  markedAt?: string;
  wasBackdated?: boolean;
}

// Mark Attendance Request
export interface AttendanceRequest {
  studentId: number;
  batchId: number;
  date: string;
  status: AttendanceStatus;
  entryType?: AttendanceEntryType;
  compensatesForDate?: string;
  notes?: string;
  backdateReason?: string;
}

// Bulk Attendance Request
export interface BulkAttendanceRequest {
  batchId: number;
  date: string;
  studentAttendances: StudentAttendanceInput[];
  backdateReason?: string;
}

// Individual student attendance in bulk request
export interface StudentAttendanceInput {
  studentId: number;
  status: AttendanceStatus;
  entryType?: AttendanceEntryType;
  compensatesForDate?: string;
  notes?: string;
}

// Attendance Audit Log
export interface AttendanceAuditLog {
  id: number;
  attendanceId: number;
  studentId: number;
  studentName: string;
  batchId: number;
  batchName: string;
  attendanceDate: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  previousStatus?: AttendanceStatus;
  previousEntryType?: AttendanceEntryType;
  previousNotes?: string;
  newStatus?: AttendanceStatus;
  newEntryType?: AttendanceEntryType;
  newNotes?: string;
  changedById?: number;
  changedByName?: string;
  changedByRole: 'COACH' | 'ADMIN';
  reason?: string;
  wasBackdated: boolean;
  changedAt: string;
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
