"use client";

import { useEffect, useMemo, useState } from "react";
import { AccountMenu } from "@/components/AccountMenu";
import { AuthPanel } from "@/components/AuthPanel";
import { BilingualText } from "@/components/BilingualText";
import { DataSafetyPanel, type StorageStatus } from "@/components/DataSafetyPanel";
import { LegacyMigrationPanel } from "@/components/LegacyMigrationPanel";
import { MonthlySummary } from "@/components/MonthlySummary";
import { NaturalLanguageInput } from "@/components/NaturalLanguageInput";
import { ParsedRecordEditor } from "@/components/ParsedRecordEditor";
import { TransactionDetail } from "@/components/TransactionDetail";
import { TransactionList } from "@/components/TransactionList";
import { calculateMonthlySummary } from "@/lib/calculations/monthlySummary";
import { parseNaturalLanguage } from "@/lib/parser/parseNaturalLanguage";
import {
  addTransactions,
  createTransactionsBackup,
  deleteTransaction,
  getLocalStorageKey,
  getPendingLegacyTransactions,
  isSupabaseConfigured,
  migrateLegacyTransactions,
  parseBackupTransactions,
  readTransactions,
  updateTransaction,
  type MigrationResult
} from "@/lib/storage/transactionStorage";
import { buildTransactionsFromDrafts } from "@/lib/transactions/buildTransactions";
import {
  clearStoredSession,
  isAuthConfigured,
  readSessionFromUrl,
  readStoredSession,
  refreshSessionIfNeeded,
  sendLoginEmail,
  type AuthSession
} from "@/lib/auth/supabaseAuth";
import { compressImage } from "@/lib/images/compressImage";
import type { ParsedTransactionDraft, Transaction } from "@/types/transaction";

export default function Home() {
  const [input, setInput] = useState("");
  const [drafts, setDrafts] = useState<ParsedTransactionDraft[]>([]);
  const [parsedOriginalText, setParsedOriginalText] = useState("");
  const [imageDataUrls, setImageDataUrls] = useState<string[]>([]);
  const [parsedImageDataUrls, setParsedImageDataUrls] = useState<string[]>([]);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>("");
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingLegacyCount, setPendingLegacyCount] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<Omit<MigrationResult, "transactions"> | undefined>();
  const [storageStatus, setStorageStatus] = useState<StorageStatus>("local");
  const [importResult, setImportResult] = useState<{ importedCount: number; skippedCount: number } | undefined>();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        if (!isAuthConfigured()) {
          setAuthMessage("Supabase環境変数が未設定です / Supabase 环境变量未配置。");
          return;
        }

        const urlSession = await readSessionFromUrl();
        const storedSession = urlSession ?? readStoredSession();
        const activeSession = await refreshSessionIfNeeded(storedSession);

        if (!activeSession) {
          setAuthMessage("メールでログインしてください / 请使用邮箱登录后记账。");
          return;
        }

        const result = await readTransactions(activeSession);

        if (isMounted) {
          setSession(activeSession);
          setTransactions(result.transactions);
          setStorageStatus(result.mode === "supabase" ? "cloud" : isSupabaseConfigured() ? "fallback" : "local");
          setPendingLegacyCount(result.mode === "supabase" ? getPendingLegacyTransactions(result.transactions).length : 0);
          setAuthMessage(urlSession ? "ログインしました / 登录成功。" : "");
          setError(result.message ?? "");
        }
      } catch {
        clearStoredSession();
        if (isMounted) {
          setSession(null);
          setTransactions([]);
          setAuthMessage("ログイン状態を確認できませんでした / 无法确认登录状态，请重新登录。");
        }
      } finally {
        if (isMounted) {
          setIsLoadingTransactions(false);
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort((a, b) => {
        if (a.date === b.date) {
          return b.createdAt.localeCompare(a.createdAt);
        }

        return b.date.localeCompare(a.date);
      }),
    [transactions]
  );

  const summary = useMemo(() => calculateMonthlySummary(transactions), [transactions]);
  const selectedTransaction = useMemo(
    () => sortedTransactions.find((transaction) => transaction.id === selectedTransactionId) ?? sortedTransactions[0],
    [selectedTransactionId, sortedTransactions]
  );
  const currentMonth = new Date();

  function handleParse() {
    if (!session) {
      setError("ログイン後に記録できます / 请登录后再记账。");
      return;
    }

    const trimmed = input.trim();

    if (!trimmed) {
      setError("入力してください / 请先输入一段记账内容。");
      return;
    }

    const parsed = parseNaturalLanguage(trimmed);

    if (parsed.length === 0) {
      setError("金額が見つかりません / 没有识别到金额。例：咖啡580日元");
      setDrafts([]);
      return;
    }

    setError("");
    setParsedOriginalText(input);
    setParsedImageDataUrls(imageDataUrls);
    setDrafts(parsed);
  }

  function handleDraftChange(index: number, draft: ParsedTransactionDraft) {
    setDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? draft : item)));
  }

  async function handleSendLoginEmail(email: string) {
    try {
      await sendLoginEmail(email);
      setAuthMessage("ログインメールを送信しました / 登录邮件已发送，请查看邮箱。");
      setError("");
    } catch {
      setAuthMessage("ログインメールを送信できませんでした / 登录邮件发送失败，请检查 Supabase 设置。");
    }
  }

  function handleSignOut() {
    clearStoredSession();
    setSession(null);
    setTransactions([]);
    setSelectedTransactionId("");
    setDrafts([]);
    setPendingLegacyCount(0);
    setStorageStatus("local");
    setAuthMessage("ログアウトしました / 已退出登录。");
    setError("");
  }

  async function handleSave() {
    if (!session) {
      setError("ログイン後に保存できます / 请登录后再保存。");
      return;
    }

    const nextTransactions = buildTransactionsFromDrafts(drafts, parsedOriginalText || input, parsedImageDataUrls);

    if (nextTransactions.length === 0) {
      setError("有効な記録が必要です / 请至少保留一条金额有效的记录。");
      return;
    }

    setIsSaving(true);

    try {
      const result = await addTransactions(nextTransactions, transactions, session);
      setTransactions(result.transactions);
      setStorageStatus(result.cloudSynced ? "cloud" : isSupabaseConfigured() ? "fallback" : "local");
      setPendingLegacyCount(result.mode === "supabase" ? getPendingLegacyTransactions(result.transactions).length : 0);
      setSelectedTransactionId(nextTransactions[0]?.id ?? selectedTransactionId);
      setInput("");
      setImageDataUrls([]);
      setDrafts([]);
      setParsedOriginalText("");
      setParsedImageDataUrls([]);
      setError(result.message ?? "");
    } catch {
      setError("保存に失敗しました / 保存失败，请稍后再试。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMigrateLegacyTransactions() {
    if (!session || !isSupabaseConfigured()) {
      setError("ログイン後に移行できます / 请登录后再迁移。");
      return;
    }

    setIsMigrating(true);
    setMigrationResult(undefined);

    try {
      const result = await migrateLegacyTransactions(transactions, session);
      setTransactions(result.transactions);
      setStorageStatus("cloud");
      setPendingLegacyCount(getPendingLegacyTransactions(result.transactions).length);
      setMigrationResult({
        successCount: result.successCount,
        failedCount: result.failedCount,
        skippedCount: result.skippedCount
      });
      setError("");
    } catch {
      setMigrationResult({
        successCount: 0,
        failedCount: pendingLegacyCount,
        skippedCount: 0
      });
      setError("移行に失敗しました / 迁移失败，请检查 Supabase 设置。");
    } finally {
      setIsMigrating(false);
    }
  }

  async function handleImagesSelected(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setIsCompressingImage(true);
    setError("");

    try {
      const compressedImages = await Promise.all(Array.from(files).map((file) => compressImage(file)));
      setImageDataUrls((current) => [...current, ...compressedImages]);
    } catch {
      setError("画像処理に失敗しました / 图片处理失败，请换一张图片再试。");
    } finally {
      setIsCompressingImage(false);
    }
  }

  function handleRemoveImage(index: number) {
    setImageDataUrls((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleExportBackup() {
    if (!session) {
      setError("ログイン後に書き出せます / 请登录后再导出。");
      return;
    }

    if (transactions.length === 0) {
      setError("書き出す記録がありません / 当前没有可导出的记录。");
      return;
    }

    const backup = createTransactionsBackup(transactions);
    const backupUrl = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json"
      })
    );
    const link = document.createElement("a");
    link.href = backupUrl;
    link.download = `smart-kakeibo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(backupUrl);
    setError("");
  }

  async function handleImportBackup(file: File) {
    if (!session) {
      setError("ログイン後に読み込めます / 请登录后再导入。");
      return;
    }

    try {
      const fileText = await file.text();
      const preview = parseBackupTransactions(fileText, transactions);

      if (preview.importedCount === 0) {
        setImportResult({
          importedCount: 0,
          skippedCount: preview.skippedCount
        });
        setError("新しい記録はありません / 没有新的记录需要导入。");
        return;
      }

      const result = await addTransactions(preview.transactions, transactions, session);
      setTransactions(result.transactions);
      setStorageStatus(result.cloudSynced ? "cloud" : isSupabaseConfigured() ? "fallback" : "local");
      setPendingLegacyCount(result.mode === "supabase" ? getPendingLegacyTransactions(result.transactions).length : 0);
      setImportResult({
        importedCount: preview.importedCount,
        skippedCount: preview.skippedCount
      });
      setError(result.message ?? "");
    } catch {
      setError("読み込みに失敗しました / 导入失败，请选择正确的 JSON 备份文件。");
    }
  }

  async function handleUpdateTransaction(transaction: Transaction) {
    if (!session) {
      setError("ログイン後に編集できます / 请登录后再编辑。");
      return;
    }

    setIsUpdating(true);

    try {
      const result = await updateTransaction(transaction, transactions, session);
      setTransactions(result.transactions);
      setStorageStatus(result.cloudSynced ? "cloud" : isSupabaseConfigured() ? "fallback" : "local");
      setError(result.message ?? "");
    } catch {
      setError("更新に失敗しました / 编辑保存失败，请稍后再试。");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!session) {
      setError("ログイン後に削除できます / 请登录后再删除。");
      return;
    }

    const confirmed = window.confirm("この記録を削除しますか？ / 确定删除这条记录吗？");
    if (!confirmed) {
      return;
    }

    try {
      const result = await deleteTransaction(id, transactions, session);
      setTransactions(result.transactions);
      setStorageStatus(result.mode === "supabase" ? "cloud" : isSupabaseConfigured() ? "fallback" : "local");
      setPendingLegacyCount(result.mode === "supabase" ? getPendingLegacyTransactions(result.transactions).length : 0);
      if (selectedTransactionId === id) {
        setSelectedTransactionId(result.transactions[0]?.id ?? "");
      }
      setError(result.message ?? "");
    } catch {
      setError("削除に失敗しました / 删除失败，请稍后再试。");
    }
  }

  return (
    <main className="app-shell">
      <div className="app-layout">
        <TransactionList
          transactions={sortedTransactions}
          selectedId={selectedTransaction?.id}
          onSelect={(transaction) => setSelectedTransactionId(transaction.id)}
          onDelete={handleDelete}
        />

        <section className="workspace-panel">
          <header className="app-header">
            <div>
              <p className="eyebrow">
                <BilingualText ja="自然言語の家計簿" zh="自然语言记账" />
              </p>
              <h1>
                <BilingualText ja="スマート家計簿" zh="智能记账" />
              </h1>
            </div>
            <div className="header-actions">
              <span className="month-label">
                <BilingualText
                  ja={currentMonth.toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}
                  zh={currentMonth.toLocaleDateString("zh-CN", { year: "numeric", month: "long" })}
                />
              </span>
              <AccountMenu session={session} isSynced={storageStatus === "cloud"} onSignOut={handleSignOut} />
            </div>
          </header>

          <MonthlySummary summary={summary} />

          {!session ? (
            <section className="panel login-needed-panel">
              <h2>
                <BilingualText ja="ログインが必要です" zh="需要登录" />
              </h2>
              <p>
                <BilingualText ja="メールログイン後、クラウドに記録を保存できます。" zh="邮箱登录后，记录会保存到云端。" />
              </p>
            </section>
          ) : null}

          {session ? (
            <>
              <NaturalLanguageInput
                value={input}
                onChange={setInput}
                imageDataUrls={imageDataUrls}
                isCompressingImage={isCompressingImage}
                onImagesSelected={handleImagesSelected}
                onRemoveImage={handleRemoveImage}
                onParse={handleParse}
                error={error}
              />

              <ParsedRecordEditor
                drafts={drafts}
                originalText={parsedOriginalText}
                isSaving={isSaving}
                onChange={handleDraftChange}
                onSave={handleSave}
                onCancel={() => {
                  setDrafts([]);
                  setParsedOriginalText("");
                  setParsedImageDataUrls([]);
                  setError("");
                }}
              />
            </>
          ) : null}

          {isLoadingTransactions ? (
            <section className="panel empty-detail">
              <p>読み込み中... / 正在读取记账数据...</p>
            </section>
          ) : (
            <TransactionDetail
              transaction={session ? selectedTransaction : undefined}
              onDelete={handleDelete}
              onUpdate={handleUpdateTransaction}
              isUpdating={isUpdating}
            />
          )}

          {session ? (
            <section className="footer-settings">
              <details>
                <summary>
                  <BilingualText ja="設定" zh="设置" />
                </summary>
                <details className="settings-account">
                  <summary>
                    <BilingualText ja="アカウント" zh="账号" />
                  </summary>
                  <AuthPanel
                    session={session}
                    isConfigured={isAuthConfigured()}
                    isLoading={isLoadingTransactions}
                    message={authMessage}
                    onSendLoginEmail={handleSendLoginEmail}
                    onSignOut={handleSignOut}
                  />
                </details>
                <details className="settings-data-management">
                  <summary>
                    <BilingualText ja="データ管理" zh="数据管理" />
                  </summary>
                  {pendingLegacyCount > 0 ? (
                    <LegacyMigrationPanel
                      compact
                      pendingCount={pendingLegacyCount}
                      isMigrating={isMigrating}
                      result={migrationResult}
                      onMigrate={handleMigrateLegacyTransactions}
                    />
                  ) : null}
                  <DataSafetyPanel
                    compact
                    status={storageStatus}
                    recordCount={transactions.length}
                    localStorageKey={getLocalStorageKey(session)}
                    importResult={importResult}
                    onExport={handleExportBackup}
                    onImport={handleImportBackup}
                  />
                </details>
              </details>
            </section>
          ) : null}
          {!session ? (
            <section className="footer-settings">
              <details>
                <summary>
                  <BilingualText ja="設定" zh="设置" />
                </summary>
                <details className="settings-account" open>
                  <summary>
                    <BilingualText ja="アカウント" zh="账号" />
                  </summary>
                  <AuthPanel
                    session={session}
                    isConfigured={isAuthConfigured()}
                    isLoading={isLoadingTransactions}
                    message={authMessage}
                    onSendLoginEmail={handleSendLoginEmail}
                    onSignOut={handleSignOut}
                  />
                </details>
              </details>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
