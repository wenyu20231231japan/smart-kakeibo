"use client";

import { useEffect, useMemo, useState } from "react";
import { BilingualText } from "@/components/BilingualText";
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
  deleteTransaction,
  getPendingLegacyTransactions,
  migrateLegacyTransactions,
  readTransactions,
  type MigrationResult
} from "@/lib/storage/transactionStorage";
import { buildTransactionsFromDrafts } from "@/lib/transactions/buildTransactions";
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
  const [pendingLegacyCount, setPendingLegacyCount] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<Omit<MigrationResult, "transactions"> | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTransactions() {
      try {
        const savedTransactions = await readTransactions();

        if (isMounted) {
          setTransactions(savedTransactions);
          setPendingLegacyCount(getPendingLegacyTransactions(savedTransactions).length);
          setError("");
        }
      } catch {
        if (isMounted) {
          setError("Supabase設定を確認してください / 请检查 Supabase 环境变量和数据表设置。");
        }
      } finally {
        if (isMounted) {
          setIsLoadingTransactions(false);
        }
      }
    }

    loadTransactions();

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

  async function handleSave() {
    const nextTransactions = buildTransactionsFromDrafts(drafts, parsedOriginalText || input, parsedImageDataUrls);

    if (nextTransactions.length === 0) {
      setError("有効な記録が必要です / 请至少保留一条金额有效的记录。");
      return;
    }

    setIsSaving(true);

    try {
      const updatedTransactions = await addTransactions(nextTransactions);
      setTransactions(updatedTransactions);
      setSelectedTransactionId(nextTransactions[0]?.id ?? selectedTransactionId);
      setInput("");
      setImageDataUrls([]);
      setDrafts([]);
      setParsedOriginalText("");
      setParsedImageDataUrls([]);
      setError("");
    } catch {
      setError("保存に失敗しました / 保存失败，请检查 Supabase 设置。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMigrateLegacyTransactions() {
    setIsMigrating(true);
    setMigrationResult(undefined);

    try {
      const result = await migrateLegacyTransactions(transactions);
      setTransactions(result.transactions);
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

  async function handleDelete(id: string) {
    const confirmed = window.confirm("この記録を削除しますか？ / 确定删除这条记录吗？");
    if (!confirmed) {
      return;
    }

    try {
      const updatedTransactions = await deleteTransaction(id);
      setTransactions(updatedTransactions);
      if (selectedTransactionId === id) {
        setSelectedTransactionId(updatedTransactions[0]?.id ?? "");
      }
      setError("");
    } catch {
      setError("削除に失敗しました / 删除失败，请检查 Supabase 设置。");
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
            <span className="month-label">
              <BilingualText
                ja={currentMonth.toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}
                zh={currentMonth.toLocaleDateString("zh-CN", { year: "numeric", month: "long" })}
              />
            </span>
          </header>

          <MonthlySummary summary={summary} />

          <LegacyMigrationPanel
            pendingCount={pendingLegacyCount}
            isMigrating={isMigrating}
            result={migrationResult}
            onMigrate={handleMigrateLegacyTransactions}
          />

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

          {isLoadingTransactions ? (
            <section className="panel empty-detail">
              <p>読み込み中... / 正在读取 Supabase 数据...</p>
            </section>
          ) : (
            <TransactionDetail transaction={selectedTransaction} onDelete={handleDelete} />
          )}
        </section>
      </div>
    </main>
  );
}
