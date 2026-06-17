"use client";

import { useRef } from "react";
import { BilingualText } from "@/components/BilingualText";

export type StorageStatus = "local" | "cloud" | "fallback";

type Props = {
  status: StorageStatus;
  recordCount: number;
  localStorageKey: string;
  importResult?: {
    importedCount: number;
    skippedCount: number;
  };
  onExport: () => void;
  onImport: (file: File) => void;
};

const STATUS_LABELS: Record<StorageStatus, { ja: string; zh: string }> = {
  local: {
    ja: "ローカルモード",
    zh: "本地模式"
  },
  cloud: {
    ja: "クラウド同期モード",
    zh: "云同步模式"
  },
  fallback: {
    ja: "クラウド同期失敗、ローカル保存済み",
    zh: "云同步失败，已保存本地"
  }
};

export function DataSafetyPanel({ status, recordCount, localStorageKey, importResult, onExport, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="panel data-safety-panel">
      <div className="data-safety-header">
        <div>
          <h2>
            <BilingualText ja="データ保護" zh="数据安全" />
          </h2>
          <p>
            <BilingualText ja={STATUS_LABELS[status].ja} zh={STATUS_LABELS[status].zh} />
          </p>
        </div>
        <span className={`storage-badge ${status}`}>
          <BilingualText ja={`${recordCount}件`} zh={`${recordCount} 条`} />
        </span>
      </div>

      <div className="backup-actions">
        <button className="ghost-button" type="button" onClick={onExport} disabled={recordCount === 0}>
          <BilingualText ja="JSONを書き出す" zh="导出备份 JSON" />
        </button>
        <button className="ghost-button" type="button" onClick={() => fileInputRef.current?.click()}>
          <BilingualText ja="JSONを読み込む" zh="导入备份 JSON" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        className="backup-file-input"
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            onImport(file);
            event.target.value = "";
          }
        }}
      />

      <p className="data-safety-note">
        <BilingualText ja={`保存キー: ${localStorageKey}`} zh={`本地保存键：${localStorageKey}`} />
      </p>

      {importResult ? (
        <p className="data-safety-note">
          <BilingualText
            ja={`読み込み: ${importResult.importedCount}件 / スキップ: ${importResult.skippedCount}件`}
            zh={`导入：${importResult.importedCount} 条 / 跳过：${importResult.skippedCount} 条`}
          />
        </p>
      ) : null}
    </section>
  );
}
