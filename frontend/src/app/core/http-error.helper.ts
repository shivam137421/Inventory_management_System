import { HttpErrorResponse } from '@angular/common/http';

export interface ApiErrorResponse {
  status?: number;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.error && typeof error.error === 'object' && error.error.message) {
      return error.error.message;
    }
  }
  return 'Something went wrong. Please try again.';
}

export function extractFieldErrors(error: unknown): Record<string, string> | null {
  if (error instanceof HttpErrorResponse) {
    if (error.error && typeof error.error === 'object' && error.error.fieldErrors) {
      return error.error.fieldErrors;
    }
  }
  return null;
}
