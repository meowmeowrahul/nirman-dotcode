import { jwtDecode } from "jwt-decode";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JwtPayload, KycStatus, Role } from "../types/domain";

interface AuthState {
  token: string | null;
  role: Role | null;
  userId: string | null;
  regionId: string | null;
  username: string | null;
  kycStatus: KycStatus | null;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      userId: null,
      regionId: null,
      username: null,
      kycStatus: null,
      login: (token) => {
        const payload = jwtDecode<JwtPayload>(token);
        set({
          token,
          role: payload.role,
          userId: payload.userId,
          regionId: payload.region_id,
          username: payload.name ?? payload.username ?? null,
          kycStatus: payload.kyc_status ?? null,
        });
      },
      logout: () =>
        set({
          token: null,
          role: null,
          userId: null,
          regionId: null,
          username: null,
          kycStatus: null,
        }),
    }),
    {
      name: "securelpg-auth",
    },
  ),
);
