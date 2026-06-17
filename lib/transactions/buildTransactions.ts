import type { ParsedTransactionDraft, Transaction } from "../../types/transaction";

function createTransactionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `txn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function buildTransactionsFromDrafts(
  drafts: ParsedTransactionDraft[],
  originalText: string,
  imageDataUrls: string[] = [],
  now = new Date().toISOString(),
  createIdFn = createTransactionId
): Transaction[] {
  return drafts
    .filter((draft) => Number.isFinite(draft.amount) && draft.amount > 0 && draft.date)
    .map<Transaction>((draft) => ({
      ...draft,
      id: createIdFn(),
      originalText,
      imageDataUrls,
      createdAt: now,
      updatedAt: now
    }));
}
