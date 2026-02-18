import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Batch, SkillLevel } from '../../../core/models';

export interface CreateBatchRequest {
  name: string;
  skillLevel: SkillLevel;
  coachId: number;
  startTime: string;
  endTime: string;
  courtNumber?: number;
  description?: string;
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

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private apiService = inject(ApiService);

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

  getBatches(): Observable<Batch[]> {
    return this.apiService.get<BatchApiResponse[]>('/batches').pipe(
      map(responses => responses.map(r => this.mapBatchResponse(r)))
    );
  }

  getBatchById(id: number): Observable<Batch | undefined> {
    return this.apiService.get<BatchApiResponse>(`/batches/${id}`).pipe(
      map(r => this.mapBatchResponse(r))
    );
  }

  createBatch(data: CreateBatchRequest): Observable<Batch> {
    const createPayload = {
      name: data.name,
      skillLevel: data.skillLevel,
      coachId: data.coachId,
      startTime: data.startTime,
      endTime: data.endTime
    };

    return this.apiService.post<BatchApiResponse>('/batches', createPayload).pipe(
      map(r => this.mapBatchResponse(r))
    );
  }

  updateBatch(id: number, data: Partial<CreateBatchRequest>): Observable<Batch> {
    const updatePayload = {
      name: data.name,
      skillLevel: data.skillLevel,
      coachId: data.coachId,
      startTime: data.startTime,
      endTime: data.endTime
    };

    return this.apiService.put<BatchApiResponse>(`/batches/${id}`, updatePayload).pipe(
      map(r => this.mapBatchResponse(r))
    );
  }

  deleteBatch(id: number): Observable<void> {
    return this.apiService.delete(`/batches/${id}`);
  }

  getMyBatches(): Observable<Batch[]> {
    return this.apiService.get<BatchApiResponse[]>('/batches/active').pipe(
      map(responses => responses.map(r => this.mapBatchResponse(r)))
    );
  }
}
