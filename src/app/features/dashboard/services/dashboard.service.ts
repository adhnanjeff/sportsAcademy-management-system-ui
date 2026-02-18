import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CacheService } from '../../../core/services/cache.service';
import {
  DashboardStats,
  DashboardAttendanceTrendPoint,
  ScheduleItem,
  ActivityItem,
  Batch,
  CoachDashboard,
  ActivityType,
  SkillLevel,
  Role,
  AttendanceStatus
} from '../../../core/models';

interface StudentApiResponse {
  id: number;
  isActive?: boolean;
  firstName: string;
  lastName: string;
  fullName?: string;
  createdAt?: string;
}

interface BatchApiResponse {
  id: number;
  name: string;
  skillLevel: SkillLevel;
  coachId?: number;
  coachName?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  totalStudents: number;
  studentIds?: number[];
}

interface AttendanceApiResponse {
  id: number;
  batchId: number;
  status?: AttendanceStatus;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly cache = inject(CacheService);

  getCoachDashboard(): Observable<CoachDashboard> {
    return forkJoin({
      stats: this.getStats(),
      todaySchedule: this.getTodaySchedule(),
      myBatches: this.getMyBatches(),
      recentActivity: this.getRecentActivity()
    }).pipe(
      map(({ stats, todaySchedule, myBatches, recentActivity }) => {
        const currentUser = this.authService.currentUser();

        return {
          coach: {
            id: currentUser?.id ?? 0,
            fullName: currentUser?.fullName ?? 'Coach',
            photoUrl: currentUser?.photoUrl,
            specialization: undefined
          },
          stats,
          todaySchedule,
          myBatches,
          recentActivity
        };
      })
    );
  }

  getStats(): Observable<DashboardStats> {
    return forkJoin({
      students: this.getStudentsForCurrentUser(),
      batches: this.getBatchesForCurrentUser(),
      todaySchedule: this.getTodaySchedule()
    }).pipe(
      map(({ students, batches, todaySchedule }) => {
        const activeBatches = batches.filter(batch => batch.isActive !== false).length;
        const activeStudents = students.filter(student => student.isActive !== false).length;
        const classesToday = todaySchedule.length;
        const completedClasses = todaySchedule.filter(item => item.isCompleted).length;

        return {
          activeBatches,
          totalClasses: batches.length,
          totalStudents: students.length,
          activeStudents,
          inactiveStudents: Math.max(0, students.length - activeStudents),
          classesToday,
          pendingClasses: Math.max(0, classesToday - completedClasses),
          completedClasses
        };
      })
    );
  }

  getTodaySchedule(): Observable<ScheduleItem[]> {
    return forkJoin({
      batches: this.getBatchesForCurrentUser(),
      attendance: this.getTodayAttendanceRecords()
    }).pipe(
      map(({ batches, attendance }) => {
        const attendedBatchIds = new Set(attendance.map(record => record.batchId));

        return batches
          .filter(batch => batch.isActive !== false)
          .map(batch => ({
            id: batch.id,
            batchId: batch.id,
            batchName: batch.name,
            skillLevel: batch.skillLevel,
            startTime: batch.startTime,
            endTime: batch.endTime,
            courtNumber: 0,
            totalStudents: batch.totalStudents,
            isCompleted: attendedBatchIds.has(batch.id),
            attendanceMarked: attendedBatchIds.has(batch.id)
          }));
      })
    );
  }

  getMyBatches(): Observable<Batch[]> {
    return this.getBatchesForCurrentUser().pipe(
      map(responses => responses.map(response => this.mapBatchResponse(response)))
    );
  }

  getRecentActivity(): Observable<ActivityItem[]> {
    return forkJoin({
      students: this.getStudentsForCurrentUser(),
      attendance: this.getTodayAttendanceRecords()
    }).pipe(
      map(({ students, attendance }) => {
        const activity: ActivityItem[] = [];

        const newestStudent = students
          .filter(student => !!student.createdAt)
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

        if (newestStudent) {
          activity.push({
            id: 1,
            type: ActivityType.ENROLLMENT,
            title: 'New Student Enrolled',
            description: `${newestStudent.fullName || `${newestStudent.firstName} ${newestStudent.lastName}`} joined the academy`,
            timestamp: newestStudent.createdAt!,
            icon: 'fa-solid fa-user-plus',
            iconColor: 'var(--success-color)'
          });
        }

        if (attendance.length > 0) {
          activity.push({
            id: 2,
            type: ActivityType.ATTENDANCE,
            title: 'Attendance Updated',
            description: `Attendance marked for ${new Set(attendance.map(record => record.batchId)).size} batch(es) today`,
            timestamp: new Date().toISOString(),
            icon: 'fa-solid fa-clipboard-check',
            iconColor: 'var(--primary-color)'
          });
        }

        return activity;
      })
    );
  }

  markClassComplete(scheduleId: number): Observable<{ success: boolean }> {
    return of({ success: true });
  }

  getAttendanceTrend(days = 14): Observable<DashboardAttendanceTrendPoint[]> {
    const user = this.authService.currentUser();
    if (!user || (user.role !== Role.COACH && user.role !== Role.ADMIN)) {
      return of([]);
    }

    const today = new Date();
    const range = Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - index - 1));
      const isoDate = this.formatDate(date);

      return {
        date: isoDate,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });

    return forkJoin(
      range.map((day) =>
        this.getAttendanceRecordsByDate(day.date).pipe(
          map((records) => {
            const marked = records.filter((record) => !!record.status);
            const presentEntries = marked.filter(
              (record) => record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.LATE
            ).length;
            const attendanceRate = marked.length > 0 ? Math.round((presentEntries * 100) / marked.length) : 0;

            return {
              date: day.date,
              label: day.label,
              attendanceRate,
              totalEntries: marked.length
            };
          })
        )
      )
    );
  }

  private getStudentsForCurrentUser(): Observable<StudentApiResponse[]> {
    const user = this.authService.currentUser();

    if (!user) {
      return of([]);
    }

    if (user.role === Role.PARENT) {
      return this.api.get<StudentApiResponse[]>(`/students/parent/${user.id}`);
    }

    if (user.role === Role.COACH) {
      return this.api.get<StudentApiResponse[]>(`/students/coach/${user.id}`);
    }

    return this.api.get<StudentApiResponse[]>('/students');
  }

  private getBatchesForCurrentUser(): Observable<BatchApiResponse[]> {
    const user = this.authService.currentUser();

    if (!user) {
      return of([]);
    }

    if (user.role === Role.COACH) {
      return this.api.get<BatchApiResponse[]>(`/batches/coach/${user.id}/active`);
    }

    return this.api.get<BatchApiResponse[]>('/batches/active');
  }

  private getTodayAttendanceRecords(): Observable<AttendanceApiResponse[]> {
    const user = this.authService.currentUser();

    if (!user || (user.role !== Role.COACH && user.role !== Role.ADMIN)) {
      return of([]);
    }

    const today = new Date().toISOString().split('T')[0];
    if (!today) {
      return of([]);
    }

    if (user.role === Role.COACH) {
      return this.api.get<AttendanceApiResponse[]>(`/attendance/coach/${user.id}/date/${today}`);
    }

    return this.api.get<AttendanceApiResponse[]>(`/attendance/date/${today}`);
  }

  private getAttendanceRecordsByDate(date: string): Observable<AttendanceApiResponse[]> {
    const user = this.authService.currentUser();

    if (!user || (user.role !== Role.COACH && user.role !== Role.ADMIN)) {
      return of([]);
    }

    if (user.role === Role.COACH) {
      return this.api.get<AttendanceApiResponse[]>(`/attendance/coach/${user.id}/date/${date}`);
    }

    return this.api.get<AttendanceApiResponse[]>(`/attendance/date/${date}`);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private mapBatchResponse(response: BatchApiResponse): Batch {
    return {
      id: response.id,
      name: response.name,
      skillLevel: response.skillLevel,
      coachId: response.coachId,
      coachName: response.coachName,
      startTime: response.startTime,
      endTime: response.endTime,
      isActive: response.isActive,
      status: response.isActive ? 'ACTIVE' : 'INACTIVE',
      totalStudents: response.totalStudents || 0,
      studentIds: response.studentIds ? Array.from(response.studentIds) : []
    };
  }
}
