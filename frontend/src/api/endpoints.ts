import { api } from "./client";
import type {
  Contributor,
  KycStatus,
  Transaction,
  User,
} from "../types/domain";

interface RegisterBody {
  role: User["role"];
  name: string;
  email?: string;
  phone?: string;
  password: string;
  city?: string;
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
  city?: string;
  region_id?: string;
  requester_user_id?: string;
}) {
  const response = await api.post<Contributor[]>("/search/ripple", payload);
  return response.data;
}

export async function lockEscrow(payload: {
  beneficiary_id: string;
  contributor_id?: string;
  city?: string;
  region_id?: string;
}) {
  const response = await api.post<{ transaction: Transaction }>(
    "/escrow/lock",
    payload,
  );
  return response.data;
}

export async function updateMyLocation(payload: { lat: number; lng: number }) {
  const response = await api.patch<{
    location: { user_id: string; lat: number; lng: number };
  }>("/users/location/me", payload);
  return response.data;
}

export async function activateContributorListing(payload: {
  lat?: number;
  lng?: number;
  city?: string;
  region_id?: string;
}) {
  const response = await api.post<{
    listing: { user_id: string; status: "LISTED" | "UNLISTED"; listed_at: string };
  }>("/contributor/list", payload);
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
    beneficiary_user_id: string;
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
    params: { city: regionId },
  });
  return response.data;
}

export interface RegionalActivityItem {
  id: string;
  city: string;
  region: string;
  technicianName: string;
  manualWeightKg: number;
  ocrWeightKg: number;
  status: string;
}

export async function getRegionalActivity() {
  const response = await api.get<{ activity: RegionalActivityItem[] }>(
    "/transactions/regional-activity",
  );
  return response.data;
}

export interface WardenKycForm {
  id: string;
  user: {
    id: string;
    name: string | null;
    role: User["role"];
    email: string | null;
    phone: string | null;
    city: string | null;
    region_id: string | null;
    kyc_status: KycStatus | null;
  } | null;
  aadhar_doc_photo: {
    url: string;
    mime_type: string | null;
  };
  pan_doc_photo: {
    url: string;
    mime_type: string | null;
  };
  verification_selfie: {
    url: string;
    mime_type: string | null;
  };
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export async function getWardenKycForm(userId: string) {
  const response = await api.get<{ kyc_form: WardenKycForm }>(
    `/users/kyc-form/${userId}`,
  );
  return response.data;
}

export interface PendingKycItem {
  user_id: string;
  name: string;
  submitted_at: string;
  kyc_status: KycStatus;
}

export async function getPendingKycForms(regionId?: string) {
  const response = await api.get<{ items: PendingKycItem[] }>(
    "/users/kyc-form/pending",
    {
      params: { city: regionId },
    },
  );
  return response.data;
}

export interface TechnicianAvailabilityItem {
  id: string;
  name: string;
  phone: string | null;
  rating: number | null;
  status: "AVAILABLE" | "BUSY" | "OFFLINE" | string;
  city: string | null;
  region_id: string | null;
}

export async function getTechnicianAvailability(regionId?: string) {
  const response = await api.get<{ technicians: TechnicianAvailabilityItem[] }>(
    "/technicians/availability",
    {
      params: { city: regionId },
    },
  );
  return response.data;
}

export async function acknowledgeContributorLock(transactionId: string) {
  const response = await api.patch<{
    success: boolean;
    transaction_id: string;
    contributor_acknowledgement: {
      status: "ACKNOWLEDGED";
      acknowledged_at: string;
    };
  }>(`/transactions/${transactionId}/contributor-acknowledge`);
  return response.data;
}

export interface ComplaintItem {
  id: string;
  reporter_user_id: string;
  accused_user_id: string;
  category: string;
  description: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  created_at: string;
}

export async function getComplaints(params?: {
  city?: string;
  region_id?: string;
  status?: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
}) {
  const response = await api.get<{ complaints: ComplaintItem[] }>(
    "/complaints",
    {
      params,
    },
  );
  return response.data;
}

export async function updateComplaintStatus(
  complaintId: string,
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED",
) {
  const response = await api.patch<{
    complaint: { id: string; status: string };
  }>(`/complaints/${complaintId}/status`, { status });
  return response.data;
}
