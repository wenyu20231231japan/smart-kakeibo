export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `txn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
