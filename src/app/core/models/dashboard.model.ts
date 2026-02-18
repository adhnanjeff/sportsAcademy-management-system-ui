import { ActivityType } from './enums.model';
import { Batch } from './batch.model';

// Schedule Item (Today's classes)
export interface ScheduleItem {
  id: number;
  batchId: number;
  batchName: string;
  skillLevel: string;
  startTime: string;
  endTime: string;
  courtNumber: number;
  totalStudents: number;
  isCompleted: boolean;
  attendanceMarked: boolean;
}

// Dashboard Statistics
export interface DashboardStats {
  activeBatches: number;
  totalClasses: number;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  classesToday: number;
  pendingClasses: number;
  completedClasses: number;
}

export interface DashboardAttendanceTrendPoint {
  date: string;
  label: string;
  attendanceRate: number;
  totalEntries: number;
}

// Recent Activity Item
export interface ActivityItem {
  id: number;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
  icon?: string;
  iconColor?: string;
}

// Quick Action
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  route?: string;
  action?: string;
  color?: string;
}

// Sidebar Navigation Item
export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  iconImage?: string;
  route: string;
  badge?: number;
  badgeColor?: string;
  children?: NavItem[];
  isExpanded?: boolean;
}

// Coach Dashboard Summary
export interface CoachDashboard {
  coach: {
    id: number;
    fullName: string;
    photoUrl?: string;
    specialization?: string;
  };
  stats: DashboardStats;
  todaySchedule: ScheduleItem[];
  myBatches: Batch[];
  recentActivity: ActivityItem[];
}

// Notification
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  link?: string;
}
