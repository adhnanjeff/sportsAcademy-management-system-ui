import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Student, Gender, SkillLevel, DayOfWeek, Role, MonthlyFeeStatus, FeePaymentHistory } from '../../../core/models';

export interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  nationalIdNumber?: string;
  phone?: string;
  dateOfBirth?: string;
  gender: Gender;
  skillLevel?: SkillLevel;
  daysOfWeek?: DayOfWeek[];
  batchId?: number;
  parentId?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  photoUrl?: string;
  feePayable?: number;
  monthlyFeeStatus?: MonthlyFeeStatus;
}

interface StudentApiResponse {
  id: number;
  email?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  nationalIdNumber?: string;
  gender?: Gender;
  phoneNumber?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  address?: string;
  skillLevel: SkillLevel;
  daysOfWeek?: DayOfWeek[];
  parentId?: number;
  parentName?: string;
  batchIds?: number[];
  batchNames?: string[];
  totalBatches?: number;
  totalAchievements?: number;
  attendancePercentage?: number;
  averageSkillRating?: number;
  isActive?: boolean;
  createdAt?: string;
  feePayable?: number;
  monthlyFeeStatus?: MonthlyFeeStatus;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  private mapStudentResponse(response: StudentApiResponse): Student {
    return {
      id: response.id,
      firstName: response.firstName,
      lastName: response.lastName,
      fullName: response.fullName || `${response.firstName} ${response.lastName}`,
      nationalIdNumber: response.nationalIdNumber,
      gender: response.gender,
      phone: response.phoneNumber,
      phoneNumber: response.phoneNumber,
      photoUrl: response.photoUrl,
      dateOfBirth: response.dateOfBirth,
      address: response.address,
      skillLevel: response.skillLevel,
      daysOfWeek: response.daysOfWeek,
      parentId: response.parentId,
      parentName: response.parentName,
      batchId: response.batchIds && response.batchIds.length > 0 ? response.batchIds[0] : undefined,
      batchName: response.batchNames && response.batchNames.length > 0 ? response.batchNames[0] : undefined,
      batchIds: response.batchIds,
      batchNames: response.batchNames,
      totalBatches: response.totalBatches,
      totalAchievements: response.totalAchievements,
      attendancePercentage: response.attendancePercentage,
      averageSkillRating: response.averageSkillRating,
      isActive: response.isActive,
      status: response.isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: response.createdAt,
      feePayable: response.feePayable,
      monthlyFeeStatus: response.monthlyFeeStatus
    };
  }

  getStudents(): Observable<Student[]> {
    const user = this.authService.currentUser();

    // Parents can only see their children
    if (user?.role === Role.PARENT) {
      return this.apiService.get<StudentApiResponse[]>(`/students/parent/${user.id}`).pipe(
        map(responses => responses.map(r => this.mapStudentResponse(r)))
      );
    }

    // Admin and Coach can see all students
    return this.apiService.get<StudentApiResponse[]>('/students').pipe(
      map(responses => responses.map(r => this.mapStudentResponse(r)))
    );
  }

  getStudentById(id: number): Observable<Student | undefined> {
    return this.apiService.get<StudentApiResponse>(`/students/${id}`).pipe(
      map(r => this.mapStudentResponse(r))
    );
  }

  getStudentsByBatch(batchId: number): Observable<Student[]> {
    return this.apiService.get<StudentApiResponse[]>(`/students/batch/${batchId}`).pipe(
      map(responses => responses.map(r => this.mapStudentResponse(r)))
    );
  }

  createStudent(data: CreateStudentRequest): Observable<Student> {
    const createPayload = {
      firstName: data.firstName,
      lastName: data.lastName?.trim() || undefined,
      gender: data.gender || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      nationalIdNumber: data.nationalIdNumber || undefined,
      phoneNumber: data.phone || undefined,
      photoUrl: data.photoUrl || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      skillLevel: data.skillLevel || undefined,
      daysOfWeek: data.daysOfWeek,
      parentId: data.parentId || undefined,
      batchId: data.batchId || undefined,
      feePayable: data.feePayable || undefined,
      monthlyFeeStatus: data.monthlyFeeStatus || undefined
    };

    return this.apiService.post<StudentApiResponse>('/students', createPayload).pipe(
      map(response => this.mapStudentResponse(response))
    );
  }

  updateStudent(id: number, data: Partial<CreateStudentRequest>): Observable<Student> {
    const updatePayload = {
      firstName: data.firstName || undefined,
      lastName: data.lastName?.trim() || undefined,
      gender: data.gender || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      nationalIdNumber: data.nationalIdNumber || undefined,
      phoneNumber: data.phone || undefined,
      photoUrl: data.photoUrl || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      skillLevel: data.skillLevel || undefined,
      daysOfWeek: data.daysOfWeek,
      parentId: data.parentId || undefined,
      feePayable: data.feePayable,
      monthlyFeeStatus: data.monthlyFeeStatus
    };

    return this.apiService.put<StudentApiResponse>(`/students/${id}`, updatePayload).pipe(
      map(r => this.mapStudentResponse(r))
    );
  }

  deleteStudent(id: number): Observable<void> {
    return this.apiService.delete(`/students/${id}`);
  }

  assignToBatch(studentId: number, batchId: number): Observable<Student> {
    return this.apiService.post<unknown>(`/batches/${batchId}/students/${studentId}`, {}).pipe(
      switchMap(() => this.getStudentById(studentId)),
      map(student => {
        if (!student) {
          throw new Error('Student assignment succeeded but student details not found');
        }
        return student;
      })
    );
  }

  removeFromBatch(studentId: number, batchId: number): Observable<Student> {
    return this.apiService.delete<unknown>(`/batches/${batchId}/students/${studentId}`).pipe(
      switchMap(() => this.getStudentById(studentId)),
      map(student => {
        if (!student) {
          throw new Error('Student removal succeeded but student details not found');
        }
        return student;
      })
    );
  }

  getFeePaymentHistory(studentId: number): Observable<FeePaymentHistory[]> {
    // Try to fetch from backend API
    return this.apiService.get<FeePaymentHistory[]>(`/students/${studentId}/fee-history`).pipe(
      map(history => history || [])
    );
  }
}
