import { create } from "zustand";
import type { Transaction } from "../types/domain";

interface TransactionState {
  latestTransaction: Transaction | null;
  setLatestTransaction: (transaction: Transaction | null) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  latestTransaction: null,
  setLatestTransaction: (transaction) =>
    set({ latestTransaction: transaction }),
}));
