import { api } from "./client";
import type {
  Contributor,
  KycStatus,
  Transaction,
  User,
} from "../types/domain";

interface RegisterBody {
  role: User["role"];
  email?: string;
  phone?: string;
  password: string;
  region_id?: string;
  kyc?: {
    omc_id?: string;
    masked_aadhar?: string;
  };
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface LoginBody {
  email?: string;
  phone?: string;
  password: string;
}

export async function registerUser(payload: RegisterBody) {
  const response = await api.post<{ user: User }>("/auth/register", payload);
  return response.data;
}

export async function loginUser(payload: LoginBody) {
  const response = await api.post<{ token: string }>("/auth/login", payload);
  return response.data;
}

export async function rippleSearch(payload: {
  lat: number;
  lng: number;
  urgency_score: number;
}) {
  const response = await api.post<Contributor[]>("/search/ripple", payload);
  return response.data;
}

export async function lockEscrow(payload: {
  beneficiary_id: string;
  region_id?: string;
}) {
  const response = await api.post<{ transaction: Transaction }>(
    "/escrow/lock",
    payload,
  );
  return response.data;
}

export async function calculateEscrow(payload: {
  transaction_id: string;
  actual_gas_kg: number;
}) {
  const response = await api.post<{ transaction: Transaction }>(
    "/escrow/calculate",
    payload,
  );
  return response.data;
}

export async function releaseEscrow(payload: {
  transaction_id: string;
  serial_number?: string;
}) {
  const response = await api.post<{ transaction: Transaction }>(
    "/escrow/release",
    payload,
  );
  return response.data;
}

export async function verifyTransaction(
  transactionId: string,
  payload: {
    serial_number: string;
    physical_weight: number;
    tare_weight: number;
    safety_passed: boolean;
  },
) {
  const response = await api.patch<{
    transaction: Transaction;
    refunded?: boolean;
  }>(`/tech/verify/${transactionId}`, payload);
  return response.data;
}

export async function handoverTransaction(transactionId: string) {
  const response = await api.patch<{ transaction: Transaction }>(
    `/tech/handover/${transactionId}`,
  );
  return response.data;
}

export async function updateKycStatus(userId: string, status: KycStatus) {
  const response = await api.patch<{ user: User }>(`/users/kyc/${userId}`, {
    status,
  });
  return response.data;
}

export async function getUserTransactions(userId: string) {
  const response = await api.get<{ transactions: any[] }>(
    `/users/${userId}/transactions`,
  );
  return response.data;
}

export async function getLiveMapData(regionId?: string) {
  const response = await api.get<{
    active_requests: any[];
    available_contributors: any[];
  }>(`/search/live-map`, {
    params: { region_id: regionId },
  });
  return response.data;
}
