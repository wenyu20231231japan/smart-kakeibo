import { getCurrentMonthKey } from "@/lib/utils/date";
import type { Transaction } from "@/types/transaction";

export type MonthlySummary = {
  income: number;
  expense: number;
  balance: number;
};

export function calculateMonthlySummary(transactions: Transaction[], monthKey = getCurrentMonthKey()): MonthlySummary {
  const monthTransactions = transactions.filter((transaction) => transaction.date.startsWith(monthKey));

  const income = monthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const expense = monthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    income,
    expense,
    balance: income - expense
  };
}
