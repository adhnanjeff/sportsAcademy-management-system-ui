import { AchievementType, AssessmentType } from './enums.model';

// Achievement Interface
export interface Achievement {
  id: number;
  studentId: number;
  studentName: string;
  title: string;
  description?: string;
  type: AchievementType;
  eventName?: string;
  position?: string;
  achievedDate: string;
  certificateUrl?: string;
  awardedBy?: string;
  isVerified: boolean;
  verifiedById?: number;
  verifiedByName?: string;
  verifiedAt?: string;
  createdAt?: string;
}

// Create Achievement Request
export interface AchievementCreateRequest {
  studentId: number;
  title: string;
  description?: string;
  type: AchievementType;
  eventName?: string;
  position?: string;
  achievedDate: string;
  certificateUrl?: string;
  awardedBy?: string;
}

// Skill Evaluation Interface
export interface SkillEvaluation {
  id: number;
  studentId: number;
  studentName: string;
  evaluatedById: number;
  evaluatedByName: string;
  footwork: number;
  strokes: number;
  stamina: number;
  attack: number;
  defence: number;
  agility: number;
  courtCoverage: number;
  averageScore: number;
  notes?: string;
  evaluatedAt: string;
}

// Skill Evaluation Request
export interface SkillEvaluationRequest {
  studentId: number;
  footwork: number;
  strokes: number;
  stamina: number;
  attack: number;
  defence: number;
  agility: number;
  courtCoverage: number;
  notes?: string;
}

// Assessment Interface
export interface Assessment {
  id: number;
  studentId: number;
  studentName: string;
  conductedById: number;
  conductedByName: string;
  type: AssessmentType;
  name: string;
  score: number;
  unit: string;
  targetScore: number;
  targetAchieved: boolean;
  assessmentDate: string;
  notes?: string;
  createdAt: string;
}

// Assessment Request
export interface AssessmentRequest {
  studentId: number;
  type: AssessmentType;
  name: string;
  score: number;
  unit: string;
  targetScore: number;
  assessmentDate: string;
  notes?: string;
}
