// User roles enum
export enum Role {
  ADMIN = 'ADMIN',
  COACH = 'COACH',
  PARENT = 'PARENT'
}

// Gender enum
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

// Skill levels enum
export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  PROFESSIONAL = 'PROFESSIONAL'
}

// Attendance status enum
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

// Achievement type enum
export enum AchievementType {
  TOURNAMENT = 'TOURNAMENT',
  COMPETITION = 'COMPETITION',
  CERTIFICATION = 'CERTIFICATION',
  MILESTONE = 'MILESTONE',
  OTHER = 'OTHER'
}

// Assessment type enum
export enum AssessmentType {
  PHYSICAL_FITNESS = 'PHYSICAL_FITNESS',
  TECHNICAL_SKILL = 'TECHNICAL_SKILL',
  ENDURANCE = 'ENDURANCE',
  SPEED = 'SPEED',
  STRENGTH = 'STRENGTH',
  FLEXIBILITY = 'FLEXIBILITY',
  COORDINATION = 'COORDINATION'
}

// Day of week enum
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

// Activity type for recent activity feed
export enum ActivityType {
  ENROLLMENT = 'ENROLLMENT',
  ATTENDANCE = 'ATTENDANCE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  BATCH_CREATED = 'BATCH_CREATED',
  ASSESSMENT = 'ASSESSMENT',
  PAYMENT = 'PAYMENT'
}

export enum MonthlyFeeStatus {
  HALF = 'HALF',
  FULL = 'FULL',
  UNPAID = 'UNPAID'
}

export enum OtpChannel {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE'
}
