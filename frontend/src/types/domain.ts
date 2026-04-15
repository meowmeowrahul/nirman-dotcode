export type Role = "BENEFICIARY" | "CONTRIBUTOR" | "TECHNICIAN" | "WARDEN";

export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface JwtPayload {
  userId: string;
  role: Role;
  region_id: string | null;
  iat: number;
  exp: number;
}

export interface User {
  _id: string;
  role: Role;
  email?: string;
  phone?: string;
  region_id?: string | null;
  kyc?: {
    status: KycStatus;
    omc_id?: string;
    masked_aadhar?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  _id: string;
  beneficiary_id: string;
  technician_id?: string | null;
  region_id?: string | null;
  status:
    | "PAID_IN_ESCROW"
    | "VERIFIED"
    | "IN_TRANSIT"
    | "COMPLETED"
    | "CANCELLED";
  escrow: {
    gas_value_deposited: number;
    metal_security_deposit: number;
    service_fee: number;
    final_gas_payout?: number | null;
    refund_to_beneficiary?: number | null;
  };
  cylinder_evidence?: {
    serial_number?: string | null;
    physical_weight?: number | null;
    tare_weight?: number | null;
    actual_gas_kg?: number | null;
    safety_passed?: boolean | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Contributor {
  _id: string;
  role: Role;
  email?: string;
  phone?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  distance_km?: number;
  urgency_score?: number;
  [key: string]: unknown;
}

export interface ApiErrorPayload {
  error: string;
  flagged?: boolean;
  capped_final_gas_payout?: number;
}
