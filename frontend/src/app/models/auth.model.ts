export interface AuthUser {
  id: number;
  businessId: number;
  businessName: string;
  fullName: string;
  email: string;
  role: string;
  verified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterRequest {
  businessName: string;
  ownerName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface BusinessProfile {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  createdAt: string;
  updatedAt: string;
}
