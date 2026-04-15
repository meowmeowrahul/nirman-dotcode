import { AxiosError } from "axios";
import type { ApiErrorPayload } from "../types/domain";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (error instanceof AxiosError) {
    const responsePayload = error.response?.data as ApiErrorPayload | undefined;
    if (responsePayload?.error) {
      return responsePayload.error;
    }
  }
  return fallback;
}

export function getApiErrorPayload(error: unknown): ApiErrorPayload | null {
  if (error instanceof AxiosError) {
    const responsePayload = error.response?.data as ApiErrorPayload | undefined;
    if (responsePayload?.error) {
      return responsePayload;
    }
  }
  return null;
}
