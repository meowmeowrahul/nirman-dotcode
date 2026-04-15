import { jwtDecode } from "jwt-decode";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JwtPayload, Role } from "../types/domain";

interface ProfileFormData {
  omcId: string;
  maskedAadhar: string;
}

interface AuthState {
  token: string | null;
  role: Role | null;
  userId: string | null;
  regionId: string | null;
  profileCompleted: boolean;
  profileData: ProfileFormData | null;
  profileByUser: Record<string, ProfileFormData>;
  login: (token: string) => void;
  logout: () => void;
  completeProfile: (payload: ProfileFormData) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      userId: null,
      regionId: null,
      profileCompleted: false,
      profileData: null,
      profileByUser: {},
      login: (token) => {
        const payload = jwtDecode<JwtPayload>(token);
        const existingProfile =
          useAuthStore.getState().profileByUser[payload.userId] ?? null;
        set({
          token,
          role: payload.role,
          userId: payload.userId,
          regionId: payload.region_id,
          profileCompleted: Boolean(existingProfile),
          profileData: existingProfile,
        });
      },
      logout: () =>
        set({
          token: null,
          role: null,
          userId: null,
          regionId: null,
          profileCompleted: false,
          profileData: null,
        }),
      completeProfile: (payload) => {
        const currentUserId = useAuthStore.getState().userId;

        if (!currentUserId) {
          set({
            profileCompleted: true,
            profileData: payload,
          });
          return;
        }

        set({
          profileCompleted: true,
          profileData: payload,
          profileByUser: {
            ...useAuthStore.getState().profileByUser,
            [currentUserId]: payload,
          },
        });
      },
    }),
    {
      name: "securelpg-auth",
    },
  ),
);
