import { Role, OtpChannel, MonthlyFeeStatus } from './enums.model';

// Base User Interface
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  nationalIdNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  role: Role;
  isActive: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Coach extends User
export interface Coach extends User {
  yearsOfExperience?: number;
  specialization?: string;
  batchIds?: number[];
  totalBatches?: number;
  totalStudents?: number;
}

// Authentication Response
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
}

// Register Request
export interface RegisterRequest {
  email?: string;
  password?: string;
  firstName: string;
  lastName?: string;
  dateOfBirth?: string;
  nationalIdNumber?: string;
  role?: Role;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  otp?: string;
  otpChannel?: OtpChannel;
  feePayable?: number;
  monthlyFeeStatus?: MonthlyFeeStatus;
}

// OTP Request
export interface OtpRequest {
  phoneNumber: string;
}

// OTP Verify Request
export interface OtpVerifyRequest {
  phoneNumber: string;
  otp: string;
}

// OTP Response
export interface OtpResponse {
  success: boolean;
  message: string;
  phoneNumber?: string;
  expiresInSeconds?: number;
}

export interface SignupOtpRequest {
  channel: OtpChannel;
  email?: string;
  phoneNumber?: string;
}

export interface PasswordOtpRequest {
  email: string;
}

export interface PasswordOtpVerifyRequest {
  email: string;
  otp: string;
}

export interface PasswordResetRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// Refresh Token Request
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Generic Message Response
export interface MessageResponse {
  message: string;
  success: boolean;
}
