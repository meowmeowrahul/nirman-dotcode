import { create } from "zustand";
import type { Transaction, UserStatus, UserTransactionView } from "../types/domain";

interface TransactionState {
  latestTransaction: Transaction | null;
  activeTransaction: UserTransactionView | null;
  userStatus: UserStatus;
  setLatestTransaction: (transaction: Transaction | null) => void;
  setActiveTransaction: (transaction: UserTransactionView | null) => void;
  setUserStatus: (status: UserStatus) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  latestTransaction: null,
  activeTransaction: null,
  userStatus: "IDLE",
  setLatestTransaction: (transaction) =>
    set({ latestTransaction: transaction }),
  setActiveTransaction: (transaction) =>
    set({ activeTransaction: transaction }),
  setUserStatus: (status) =>
    set({ userStatus: status }),
}));
