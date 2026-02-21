import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, switchMap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import {
  AttendanceStatus,
  AttendanceEntryType,
  DayOfWeek,
  SkillLevel
} from '../../../core/models';
import { AttendanceAuditLog } from '../../../core/models/attendance.model';

export interface AttendanceSession {
  id: number;
  batchId: number;
  batchName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  isCompleted: boolean;
}

export interface StudentAttendance {
  studentId: number;
  studentName: string;
  profileImage?: string;
  status: AttendanceStatus;
  entryType?: AttendanceEntryType;
  compensatesForDate?: string;
  checkInTime?: string;
  notes?: string;
  isMarked?: boolean;
  wasBackdated?: boolean;
}

export interface AttendancePayload {
  batchId: number;
  date: string;
  backdateReason?: string;
  records: {
    studentId: number;
    status: AttendanceStatus;
    entryType?: AttendanceEntryType;
    compensatesForDate?: string;
    notes?: string;
  }[];
}

interface AttendanceSummaryApiResponse {
  studentId: number;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendancePercentage: number;
}

interface StudentApiResponse {
  id: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  photoUrl?: string;
  daysOfWeek?: DayOfWeek[];
}

export interface AttendanceApiResponse {
  id: number;
  studentId: number;
  studentName: string;
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

export interface AttendanceMatrixCell {
  date: string;
  status: AttendanceStatus | null;
  entryType?: AttendanceEntryType | null;
  compensatesForDate?: string | null;
  notes?: string | null;
  marked: boolean;
  futureDate: boolean;
}

export interface AttendanceMatrixDateColumn {
  date: string;
  dayLabel: string;
  futureDate: boolean;
}

export interface AttendanceMatrixStudentRow {
  studentId: number;
  studentName: string;
  attendance: AttendanceMatrixCell[];
}

export interface BatchAttendanceMatrixResponse {
  batchId: number;
  batchName: string;
  periodType: 'WEEKLY' | 'MONTHLY';
  referenceDate: string;
  startDate: string;
  endDate: string;
  displayUntil: string;
  dateColumns: AttendanceMatrixDateColumn[];
  students: AttendanceMatrixStudentRow[];
}

interface BatchApiResponse {
  id: number;
  name: string;
  skillLevel: SkillLevel;
  startTime: string;
  endTime: string;
  totalStudents: number;
  coachName?: string;
}

export interface AttendanceBatch {
  id: number;
  name: string;
  skillLevel: SkillLevel;
  startTime: string;
  endTime: string;
  totalStudents: number;
  daysOfWeek: DayOfWeek[];
  monthlyFee: number;
  status: string;
  coachName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);

  getBatchesForAttendance(): Observable<AttendanceBatch[]> {
    return this.apiService.get<BatchApiResponse[]>('/batches/active').pipe(
      map(batches => batches.map(batch => ({
        id: batch.id,
        name: batch.name,
        skillLevel: batch.skillLevel,
        startTime: batch.startTime,
        endTime: batch.endTime,
        totalStudents: batch.totalStudents || 0,
        daysOfWeek: [],
        monthlyFee: 0,
        status: 'ACTIVE',
        coachName: batch.coachName
      })))
    );
  }

  getStudentsForBatch(batchId: number, date?: string): Observable<StudentAttendance[]> {
    return this.apiService.get<StudentApiResponse[]>(`/students/batch/${batchId}`).pipe(
      switchMap((students) => {
        const studentsBySchedule = date ? this.filterStudentsByDate(students, date) : students;
        const baseStudents: StudentAttendance[] = studentsBySchedule.map(student => ({
          studentId: student.id,
          studentName: student.fullName || `${student.firstName} ${student.lastName}`,
          profileImage: student.photoUrl,
          status: AttendanceStatus.PRESENT,
          notes: '',
          isMarked: false
        }));

        if (!date) {
          return of(baseStudents);
        }

        return this.getAttendanceByBatchAndDate(batchId, date).pipe(
          map((records) => {
            const attendanceMap = new Map(records.map(record => [record.studentId, record]));
            return baseStudents.map(student => {
              const existing = attendanceMap.get(student.studentId);
              if (!existing) {
                return student;
              }
              return {
                ...student,
                status: existing.status,
                notes: existing.notes,
                isMarked: true,
                checkInTime: existing.markedAt ? new Date(existing.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
              };
            });
          })
        );
      })
    );
  }

  private filterStudentsByDate(students: StudentApiResponse[], date: string): StudentApiResponse[] {
    const dayOfWeek = this.getDayOfWeekFromDate(date);
    if (!dayOfWeek) {
      return students;
    }

    return students.filter((student) => (student.daysOfWeek || []).includes(dayOfWeek));
  }

  private getDayOfWeekFromDate(date: string): DayOfWeek | null {
    const [year, month, day] = date.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }

    const parsedDate = new Date(year, month - 1, day);
    const dayMap: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY
    ];

    return dayMap[parsedDate.getDay()] ?? null;
  }

  getAttendanceByBatchAndDate(batchId: number, date: string): Observable<AttendanceApiResponse[]> {
    return this.apiService.get<AttendanceApiResponse[]>(
      `/attendance/batch/${batchId}/range?startDate=${date}&endDate=${date}`
    );
  }

  getAttendanceByDate(date: string): Observable<AttendanceApiResponse[]> {
    return this.apiService.get<AttendanceApiResponse[]>(`/attendance/date/${date}`);
  }

  getAttendanceByBatchAndRange(batchId: number, startDate: string, endDate: string): Observable<AttendanceApiResponse[]> {
    return this.apiService.get<AttendanceApiResponse[]>(
      `/attendance/batch/${batchId}/range?startDate=${startDate}&endDate=${endDate}`
    );
  }

  getBatchWeeklyAttendanceMatrix(batchId: number, referenceDate: string): Observable<BatchAttendanceMatrixResponse> {
    return this.apiService.get<BatchAttendanceMatrixResponse>(
      `/attendance/batch/${batchId}/weekly?referenceDate=${referenceDate}`
    );
  }

  getBatchMonthlyAttendanceMatrix(
    batchId: number,
    year: number,
    month: number,
    referenceDate: string
  ): Observable<BatchAttendanceMatrixResponse> {
    return this.apiService.get<BatchAttendanceMatrixResponse>(
      `/attendance/batch/${batchId}/monthly?year=${year}&month=${month}&referenceDate=${referenceDate}`
    );
  }

  submitAttendance(payload: AttendancePayload): Observable<{ success: boolean; message: string }> {
    const request = {
      batchId: payload.batchId,
      date: payload.date,
      backdateReason: payload.backdateReason,
      studentAttendances: payload.records.map(record => ({
        studentId: record.studentId,
        status: record.status,
        entryType: record.entryType || AttendanceEntryType.REGULAR,
        compensatesForDate: record.compensatesForDate,
        notes: record.notes
      }))
    };

    return this.apiService.post<AttendanceApiResponse[]>('/attendance/bulk', request).pipe(
      map((saved) => ({
        success: true,
        message: `Attendance saved for ${saved.length} student(s)`
      }))
    );
  }

  // ==================== AUDIT LOG METHODS ====================

  getAuditLogByAttendanceId(attendanceId: number): Observable<AttendanceAuditLog[]> {
    return this.apiService.get<AttendanceAuditLog[]>(`/attendance/${attendanceId}/audit-log`);
  }

  getAuditLogByStudentId(studentId: number): Observable<AttendanceAuditLog[]> {
    return this.apiService.get<AttendanceAuditLog[]>(`/attendance/student/${studentId}/audit-log`);
  }

  getAuditLogByBatchId(batchId: number): Observable<AttendanceAuditLog[]> {
    return this.apiService.get<AttendanceAuditLog[]>(`/attendance/batch/${batchId}/audit-log`);
  }

  getAllBackdatedChanges(): Observable<AttendanceAuditLog[]> {
    return this.apiService.get<AttendanceAuditLog[]>('/attendance/audit-log/backdated');
  }

  // ==================== MAKEUP ATTENDANCE METHODS ====================

  getEligibleAbsencesForMakeup(studentId: number, batchId: number): Observable<AttendanceApiResponse[]> {
    return this.apiService.get<AttendanceApiResponse[]>(
      `/attendance/student/${studentId}/batch/${batchId}/eligible-absences`
    );
  }

  /**
   * Get all students for a batch (without date filtering)
   * Used for adding makeup students who aren't scheduled for the current day
   */
  getAllStudentsForBatch(batchId: number): Observable<StudentAttendance[]> {
    return this.apiService.get<StudentApiResponse[]>(`/students/batch/${batchId}`).pipe(
      map(students => students.map(student => ({
        studentId: student.id,
        studentName: student.fullName || `${student.firstName} ${student.lastName}`,
        profileImage: student.photoUrl,
        status: AttendanceStatus.PRESENT,
        entryType: AttendanceEntryType.MAKEUP,
        notes: '',
        isMarked: false
      })))
    );
  }

  /**
   * Check if a date is within the backdating window for the current user
   */
  isWithinBackdateWindow(date: string, isAdmin: boolean = false): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Coaches: 7 days, Admins: 30 days
    const windowDays = isAdmin ? 30 : 7;
    
    return diffDays >= 0 && diffDays <= windowDays;
  }

  /**
   * Check if a date requires backdate reason (is in the past)
   */
  requiresBackdateReason(date: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return targetDate.getTime() < today.getTime();
  }

  getAttendanceHistory(batchId: number, startDate: string, endDate: string): Observable<AttendanceSession[]> {
    return this.apiService.get<AttendanceApiResponse[]>(
      `/attendance/batch/${batchId}/range?startDate=${startDate}&endDate=${endDate}`
    ).pipe(
      map(records => {
        const grouped = new Map<string, {
          batchName: string;
          studentIds: Set<number>;
          presentCount: number;
          lateCount: number;
          absentCount: number;
        }>();

        for (const record of records) {
          const date = record.date;
          if (!grouped.has(date)) {
            grouped.set(date, {
              batchName: record.batchName,
              studentIds: new Set<number>(),
              presentCount: 0,
              lateCount: 0,
              absentCount: 0
            });
          }

          const group = grouped.get(date)!;
          group.studentIds.add(record.studentId);

          if (record.status === AttendanceStatus.PRESENT) group.presentCount += 1;
          if (record.status === AttendanceStatus.LATE) group.lateCount += 1;
          if (record.status === AttendanceStatus.ABSENT) group.absentCount += 1;
        }

        return Array.from(grouped.entries())
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, group], index) => ({
            id: index + 1,
            batchId,
            batchName: group.batchName,
            date,
            startTime: '--',
            endTime: '--',
            totalStudents: group.studentIds.size,
            presentCount: group.presentCount,
            absentCount: group.absentCount,
            lateCount: group.lateCount,
            isCompleted: true
          }));
      })
    );
  }

  getStudentAttendanceStats(studentId: number): Observable<{ present: number; absent: number; late: number; percentage: number }> {
    return this.apiService.get<AttendanceSummaryApiResponse>(`/attendance/student/${studentId}/summary`).pipe(
      map(summary => ({
        present: summary.presentCount || 0,
        absent: summary.absentCount || 0,
        late: summary.lateCount || 0,
        percentage: Math.round(summary.attendancePercentage || 0)
      }))
    );
  }

  downloadDailyReport(date: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/attendance/report/daily?date=${date}`, {
      responseType: 'blob'
    });
  }

  downloadMonthlyReport(month: number, year: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/attendance/report/monthly?month=${month}&year=${year}`, {
      responseType: 'blob'
    });
  }
}
