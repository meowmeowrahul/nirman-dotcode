import { jwtDecode } from "jwt-decode";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JwtPayload, Role } from "../types/domain";

interface AuthState {
  token: string | null;
  role: Role | null;
  userId: string | null;
  regionId: string | null;
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
      login: (token) => {
        const payload = jwtDecode<JwtPayload>(token);
        set({
          token,
          role: payload.role,
          userId: payload.userId,
          regionId: payload.region_id,
        });
      },
      logout: () =>
        set({
          token: null,
          role: null,
          userId: null,
          regionId: null,
        }),
    }),
    {
      name: "securelpg-auth",
    },
  ),
);
