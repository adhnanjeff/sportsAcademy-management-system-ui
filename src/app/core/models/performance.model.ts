// Performance Metrics Model - 8-Axis Radar
export interface PerformanceMetrics {
  smashPower: number;      // 0-10
  netControl: number;      // 0-10
  backhand: number;        // 0-10
  footwork: number;        // 0-10
  agility: number;         // 0-10
  stamina: number;         // 0-10
  tacticalAwareness: number; // 0-10
  mentalStrength: number;  // 0-10
}

// Player Performance Data
export interface PlayerPerformance {
  id: number;
  studentId: number;
  studentName: string;
  batchId: number;
  batchName: string;
  metrics: PerformanceMetrics;
  evaluatedById: number;
  evaluatedByName: string;
  evaluatedAt: string;
  month: number;
  year: number;
  notes?: string;
}

// Player Performance Create Request
export interface PlayerPerformanceRequest {
  studentId: number;
  batchId: number;
  smashPower: number;
  netControl: number;
  backhand: number;
  footwork: number;
  agility: number;
  stamina: number;
  tacticalAwareness: number;
  mentalStrength: number;
  notes?: string;
}

// Batch Average Performance
export interface BatchAveragePerformance {
  batchId: number;
  batchName: string;
  averageMetrics: PerformanceMetrics;
  totalPlayers: number;
  month: number;
  year: number;
}

// Performance Progress (comparing two time periods)
export interface PerformanceProgress {
  studentId: number;
  studentName: string;
  baseline: PerformanceMetrics;
  baselineMonth: number;
  baselineYear: number;
  current: PerformanceMetrics;
  currentMonth: number;
  currentYear: number;
  improvement: PerformanceMetrics; // Difference between current and baseline
}

// Radar Chart Data Point
export interface RadarChartData {
  label: string;
  value: number;
  maxValue: number;
}

// Radar Chart Dataset
export interface RadarChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  pointBackgroundColor?: string;
}

// Performance Axis Labels
export const PERFORMANCE_AXES: { key: keyof PerformanceMetrics; label: string; icon: string }[] = [
  { key: 'smashPower', label: 'Smash Power', icon: 'fa-solid fa-bolt' },
  { key: 'netControl', label: 'Net Control', icon: 'fa-solid fa-table-tennis-paddle-ball' },
  { key: 'backhand', label: 'Backhand', icon: 'fa-solid fa-hand-back-fist' },
  { key: 'footwork', label: 'Footwork', icon: 'fa-solid fa-shoe-prints' },
  { key: 'agility', label: 'Agility', icon: 'fa-solid fa-running' },
  { key: 'stamina', label: 'Stamina', icon: 'fa-solid fa-heart-pulse' },
  { key: 'tacticalAwareness', label: 'Tactical Awareness', icon: 'fa-solid fa-chess' },
  { key: 'mentalStrength', label: 'Mental Strength', icon: 'fa-solid fa-brain' }
];
