import type { Transaction } from "@/types/transaction";

const STORAGE_KEY = "smart-accounting-transactions";

export function readTransactions(): Transaction[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

export function writeTransactions(transactions: Transaction[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function addTransactions(nextTransactions: Transaction[]) {
  const current = readTransactions();
  const merged = [...nextTransactions, ...current];
  writeTransactions(merged);
  return merged;
}

export function deleteTransaction(id: string) {
  const next = readTransactions().filter((transaction) => transaction.id !== id);
  writeTransactions(next);
  return next;
}
