import { SkillLevel } from './enums.model';

// Batch Interface
export interface Batch {
  id: number;
  name: string;
  description?: string;
  skillLevel: SkillLevel;
  coachId?: number;
  coachName?: string;
  startTime: string;
  endTime: string;
  courtNumber?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  isActive?: boolean;
  totalStudents: number;
  studentIds?: number[];
  createdAt?: string;
}

// Create Batch Request
export interface BatchCreateRequest {
  name: string;
  skillLevel: SkillLevel;
  coachId: number;
  startTime: string;
  endTime: string;
  courtNumber?: number;
}

// Update Batch Request
export interface BatchUpdateRequest {
  name?: string;
  skillLevel?: SkillLevel;
  coachId?: number;
  startTime?: string;
  endTime?: string;
  courtNumber?: number;
  isActive?: boolean;
}

// Batch with student details
export interface BatchDetails extends Batch {
  students?: BatchStudent[];
}

// Student in batch context
export interface BatchStudent {
  id: number;
  fullName: string;
  photoUrl?: string;
  skillLevel: SkillLevel;
  attendancePercentage?: number;
  isActive: boolean;
}
