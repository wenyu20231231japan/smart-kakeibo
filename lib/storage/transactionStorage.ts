import type { AuthSession } from "@/lib/auth/supabaseAuth";
import type { Category, Currency, Transaction, TransactionType } from "@/types/transaction";

type TransactionRow = {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  category: Category;
  date: string;
  merchant: string | null;
  note: string | null;
  original_text: string;
  image_data_urls: string[] | null;
  created_at: string;
  updated_at: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TABLE_NAME = "transactions";
const LEGACY_STORAGE_KEY = "smart-accounting-transactions";
const USER_STORAGE_PREFIX = `${LEGACY_STORAGE_KEY}-user-`;
const MIGRATED_STORAGE_KEY = "smart-accounting-transactions-migrated-ids";
const BACKUP_VERSION = 1;

export type MigrationResult = {
  successCount: number;
  failedCount: number;
  skippedCount: number;
  transactions: Transaction[];
};

export type StorageMode = "supabase" | "local";

export type TransactionStorageResult = {
  transactions: Transaction[];
  mode: StorageMode;
  message?: string;
};

export type SaveTransactionsResult = TransactionStorageResult & {
  cloudSynced: boolean;
};

export type TransactionsBackup = {
  app: "smart-kakeibo";
  version: number;
  exportedAt: string;
  storageKey: typeof LEGACY_STORAGE_KEY;
  transactions: Transaction[];
};

export type BackupImportPreview = {
  transactions: Transaction[];
  importedCount: number;
  skippedCount: number;
};

function getSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return {
    url: SUPABASE_URL.replace(/\/$/, ""),
    key: SUPABASE_ANON_KEY
  };
}

function getAuthenticatedHeaders(session: AuthSession) {
  const { key } = getSupabaseConfig();

  return {
    apikey: key,
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json"
  };
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    currency: row.currency,
    category: row.category,
    date: row.date,
    merchant: row.merchant ?? "",
    note: row.note ?? "",
    originalText: row.original_text,
    imageDataUrls: row.image_data_urls ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toRow(transaction: Transaction): Omit<TransactionRow, "user_id"> {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    category: transaction.category,
    date: transaction.date,
    merchant: transaction.merchant || null,
    note: transaction.note || null,
    original_text: transaction.originalText,
    image_data_urls: transaction.imageDataUrls,
    created_at: transaction.createdAt,
    updated_at: transaction.updatedAt
  };
}

function normalizeLegacyTransaction(transaction: Transaction): Transaction {
  return {
    ...transaction,
    amount: Number(transaction.amount),
    merchant: transaction.merchant ?? "",
    note: transaction.note ?? "",
    imageDataUrls: transaction.imageDataUrls ?? []
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort((a, b) => {
    if (a.date === b.date) {
      return b.createdAt.localeCompare(a.createdAt);
    }

    return b.date.localeCompare(a.date);
  });
}

function readUserLocalTransactions(session: AuthSession | null): Transaction[] {
  if (typeof window === "undefined" || !session) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(getLocalStorageKey(session));
    const parsed = raw ? (JSON.parse(raw) as Transaction[]) : [];

    return parsed.map(normalizeLegacyTransaction);
  } catch {
    return [];
  }
}

function writeLocalTransactions(transactions: Transaction[], session: AuthSession | null = null) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getLocalStorageKey(session), JSON.stringify(sortTransactions(transactions)));
}

function mergeTransactions(nextTransactions: Transaction[], currentTransactions: Transaction[]) {
  const nextIds = new Set(nextTransactions.map((transaction) => transaction.id));

  return sortTransactions([
    ...nextTransactions.map(normalizeLegacyTransaction),
    ...currentTransactions.filter((transaction) => !nextIds.has(transaction.id))
  ]);
}

function isTransactionLike(value: unknown): value is Transaction {
  if (!value || typeof value !== "object") {
    return false;
  }

  const transaction = value as Partial<Transaction>;

  return (
    typeof transaction.id === "string" &&
    (transaction.type === "income" || transaction.type === "expense") &&
    typeof transaction.amount === "number" &&
    typeof transaction.currency === "string" &&
    typeof transaction.category === "string" &&
    typeof transaction.date === "string" &&
    typeof transaction.originalText === "string" &&
    typeof transaction.createdAt === "string" &&
    typeof transaction.updatedAt === "string"
  );
}

export function getLocalStorageKey(session: AuthSession | null = null) {
  return session ? `${USER_STORAGE_PREFIX}${session.user.id}` : LEGACY_STORAGE_KEY;
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

async function readSupabaseTransactions(session: AuthSession): Promise<Transaction[]> {
  const { url } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${TABLE_NAME}?select=*&order=date.desc,created_at.desc`, {
    headers: getAuthenticatedHeaders(session)
  });
  const rows = await parseResponse<TransactionRow[]>(response);

  return rows.map(toTransaction);
}

async function addSupabaseTransactions(nextTransactions: Transaction[], session: AuthSession): Promise<Transaction[]> {
  const { url } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${TABLE_NAME}`, {
    method: "POST",
    headers: {
      ...getAuthenticatedHeaders(session),
      Prefer: "return=representation"
    },
    body: JSON.stringify(nextTransactions.map(toRow))
  });
  await parseResponse<TransactionRow[]>(response);

  return readSupabaseTransactions(session);
}

async function updateSupabaseTransaction(transaction: Transaction, session: AuthSession): Promise<Transaction[]> {
  const { url } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${TABLE_NAME}?id=eq.${encodeURIComponent(transaction.id)}`, {
    method: "PATCH",
    headers: {
      ...getAuthenticatedHeaders(session),
      Prefer: "return=representation"
    },
    body: JSON.stringify(toRow({ ...transaction, updatedAt: new Date().toISOString() }))
  });
  await parseResponse<TransactionRow[]>(response);

  return readSupabaseTransactions(session);
}

async function deleteSupabaseTransaction(id: string, session: AuthSession): Promise<Transaction[]> {
  const { url } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${TABLE_NAME}?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getAuthenticatedHeaders(session)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase delete failed with status ${response.status}`);
  }

  return readSupabaseTransactions(session);
}

export async function readTransactions(session: AuthSession | null): Promise<TransactionStorageResult> {
  if (session && isSupabaseConfigured()) {
    try {
      return {
        transactions: await readSupabaseTransactions(session),
        mode: "supabase"
      };
    } catch {
      return {
        transactions: readUserLocalTransactions(session),
        mode: "local",
        message: "已使用本地存储，云同步未启用。"
      };
    }
  }

  return {
    transactions: session ? readUserLocalTransactions(session) : [],
    mode: "local",
    message: "已使用本地存储，云同步未启用。"
  };
}

export async function addTransactions(
  nextTransactions: Transaction[],
  currentTransactions: Transaction[] = readLegacyTransactions(),
  session: AuthSession | null = null
): Promise<SaveTransactionsResult> {
  if (session && isSupabaseConfigured()) {
    try {
      return {
        transactions: await addSupabaseTransactions(nextTransactions, session),
        mode: "supabase",
        cloudSynced: true
      };
    } catch {
      const updatedTransactions = mergeTransactions(nextTransactions, currentTransactions);
      writeLocalTransactions(updatedTransactions, session);

      return {
        transactions: updatedTransactions,
        mode: "local",
        cloudSynced: false,
        message: "已保存到本地，云同步未启用。"
      };
    }
  }

  const updatedTransactions = mergeTransactions(nextTransactions, currentTransactions);
  writeLocalTransactions(updatedTransactions, session);

  return {
    transactions: updatedTransactions,
    mode: "local",
    cloudSynced: false,
    message: "已保存到本地，云同步未启用。"
  };
}

export async function updateTransaction(
  transaction: Transaction,
  currentTransactions: Transaction[] = readLegacyTransactions(),
  session: AuthSession | null = null
): Promise<SaveTransactionsResult> {
  const nextTransaction = {
    ...transaction,
    updatedAt: new Date().toISOString()
  };

  if (session && isSupabaseConfigured()) {
    try {
      return {
        transactions: await updateSupabaseTransaction(nextTransaction, session),
        mode: "supabase",
        cloudSynced: true
      };
    } catch {
      const updatedTransactions = sortTransactions(
        currentTransactions.map((item) => (item.id === nextTransaction.id ? nextTransaction : item))
      );
      writeLocalTransactions(updatedTransactions, session);

      return {
        transactions: updatedTransactions,
        mode: "local",
        cloudSynced: false,
        message: "已保存到本地，云同步未启用。"
      };
    }
  }

  const updatedTransactions = sortTransactions(
    currentTransactions.map((item) => (item.id === nextTransaction.id ? nextTransaction : item))
  );
  writeLocalTransactions(updatedTransactions, session);

  return {
    transactions: updatedTransactions,
    mode: "local",
    cloudSynced: false,
    message: "已保存到本地，云同步未启用。"
  };
}

export function readLegacyTransactions(): Transaction[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Transaction[]) : [];

    return parsed.map(normalizeLegacyTransaction);
  } catch {
    return [];
  }
}

export function readMigratedLegacyIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(MIGRATED_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markLegacyTransactionsMigrated(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const mergedIds = [...new Set([...readMigratedLegacyIds(), ...ids])];
  window.localStorage.setItem(MIGRATED_STORAGE_KEY, JSON.stringify(mergedIds));
}

export function createTransactionsBackup(transactions: Transaction[]): TransactionsBackup {
  return {
    app: "smart-kakeibo",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    storageKey: LEGACY_STORAGE_KEY,
    transactions: sortTransactions(transactions).map(normalizeLegacyTransaction)
  };
}

export function parseBackupTransactions(fileText: string, currentTransactions: Transaction[]): BackupImportPreview {
  const parsed = JSON.parse(fileText) as unknown;
  const candidateTransactions = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && "transactions" in parsed
      ? (parsed as { transactions?: unknown }).transactions
      : undefined;

  if (!Array.isArray(candidateTransactions)) {
    throw new Error("Backup file does not contain transactions.");
  }

  const currentIds = new Set(currentTransactions.map((transaction) => transaction.id));
  const importedIds = new Set<string>();
  const transactions = candidateTransactions
    .filter(isTransactionLike)
    .map(normalizeLegacyTransaction)
    .filter((transaction) => {
      if (currentIds.has(transaction.id) || importedIds.has(transaction.id)) {
        return false;
      }

      importedIds.add(transaction.id);
      return true;
    });

  return {
    transactions,
    importedCount: transactions.length,
    skippedCount: candidateTransactions.length - transactions.length
  };
}

export function getPendingLegacyTransactions(existingTransactions: Transaction[] = []) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const migratedIds = new Set(readMigratedLegacyIds());
  const existingIds = new Set(existingTransactions.map((transaction) => transaction.id));

  return readLegacyTransactions().filter(
    (transaction) => !migratedIds.has(transaction.id) && !existingIds.has(transaction.id)
  );
}

export async function migrateLegacyTransactions(
  existingTransactions: Transaction[] = [],
  session: AuthSession | null = null
): Promise<MigrationResult> {
  if (!session || !isSupabaseConfigured()) {
    return {
      successCount: 0,
      failedCount: 0,
      skippedCount: readLegacyTransactions().length,
      transactions: existingTransactions
    };
  }

  const pendingTransactions = getPendingLegacyTransactions(existingTransactions);

  if (pendingTransactions.length === 0) {
    return {
      successCount: 0,
      failedCount: 0,
      skippedCount: readLegacyTransactions().length,
      transactions: existingTransactions
    };
  }

  const { url } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${TABLE_NAME}?on_conflict=id`, {
    method: "POST",
    headers: {
      ...getAuthenticatedHeaders(session),
      Prefer: "resolution=ignore-duplicates,return=representation"
    },
    body: JSON.stringify(pendingTransactions.map(toRow))
  });

  if (!response.ok) {
    return {
      successCount: 0,
      failedCount: pendingTransactions.length,
      skippedCount: readLegacyTransactions().length - pendingTransactions.length,
      transactions: existingTransactions
    };
  }

  const insertedRows = await parseResponse<TransactionRow[]>(response);
  const insertedIds = insertedRows.map((row) => row.id);
  const duplicateIds = pendingTransactions
    .map((transaction) => transaction.id)
    .filter((id) => !insertedIds.includes(id));

  markLegacyTransactionsMigrated([...insertedIds, ...duplicateIds]);

  return {
    successCount: insertedIds.length,
    failedCount: 0,
    skippedCount: readLegacyTransactions().length - insertedIds.length,
    transactions: await readSupabaseTransactions(session)
  };
}

export async function deleteTransaction(
  id: string,
  currentTransactions: Transaction[] = readLegacyTransactions(),
  session: AuthSession | null = null
): Promise<TransactionStorageResult> {
  if (session && isSupabaseConfigured()) {
    try {
      return {
        transactions: await deleteSupabaseTransaction(id, session),
        mode: "supabase"
      };
    } catch {
      const updatedTransactions = currentTransactions.filter((transaction) => transaction.id !== id);
      writeLocalTransactions(updatedTransactions, session);

      return {
        transactions: updatedTransactions,
        mode: "local",
        message: "已从本地删除，云同步未启用。"
      };
    }
  }

  const updatedTransactions = currentTransactions.filter((transaction) => transaction.id !== id);
  writeLocalTransactions(updatedTransactions, session);

  return {
    transactions: updatedTransactions,
    mode: "local",
    message: "已从本地删除，云同步未启用。"
  };
}
