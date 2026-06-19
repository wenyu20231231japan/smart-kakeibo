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
    ja: "この端末に保存中",
    zh: "本机保存中，建议登录后开启云同步"
  },
  cloud: {
    ja: "ログイン済み、クラウドに保存中",
    zh: "已登录，数据正在云端保存"
  },
  fallback: {
    ja: "一時的にこの端末に保存中",
    zh: "本机保存中，建议登录后开启云同步"
  }
};

const STATUS_DESCRIPTIONS: Record<StorageStatus, { ja: string; zh: string }> = {
  local: {
    ja: "現在はこの端末だけに保存されています。端末変更やブラウザデータ削除後は表示できない場合があります。",
    zh: "当前仅保存在本机。换手机或清除浏览器数据后可能看不到记录。"
  },
  cloud: {
    ja: "クラウド同期が有効です。同じメールでログインすれば、スマホやパソコンで記録を確認できます。",
    zh: "云端同步已开启。你可以在手机、电脑上登录同一个邮箱查看记录。"
  },
  fallback: {
    ja: "クラウド同期に失敗したため、この端末に一時保存しました。接続や設定を確認してください。",
    zh: "云同步暂时失败，已先保存到本机。换手机或清除浏览器数据后可能看不到记录。"
  }
};

export function DataSafetyPanel({ status, recordCount, localStorageKey, importResult, onExport, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="panel data-safety-panel">
      <div className="data-safety-header">
        <div>
          <h2>
            <BilingualText ja="データ保存" zh="数据同步" />
          </h2>
          <p>
            <BilingualText ja={STATUS_LABELS[status].ja} zh={STATUS_LABELS[status].zh} />
          </p>
        </div>
        <span className={`storage-badge ${status}`}>
          <BilingualText ja={`${recordCount}件`} zh={`${recordCount} 条`} />
        </span>
      </div>

      <p className="data-safety-description">
        <BilingualText ja={STATUS_DESCRIPTIONS[status].ja} zh={STATUS_DESCRIPTIONS[status].zh} />
      </p>

      <div className="backup-actions">
        <button className="ghost-button" type="button" onClick={onExport} disabled={recordCount === 0}>
          <BilingualText ja="家計簿をバックアップ" zh="备份账本" />
          <small>下载一份备份文件，防止数据丢失</small>
        </button>
        <button className="ghost-button" type="button" onClick={() => fileInputRef.current?.click()}>
          <BilingualText ja="家計簿を復元" zh="恢复账本" />
          <small>从备份文件恢复记录</small>
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

      {importResult ? (
        <p className="data-safety-note">
          <BilingualText
            ja={`読み込み: ${importResult.importedCount}件 / スキップ: ${importResult.skippedCount}件`}
            zh={`导入：${importResult.importedCount} 条 / 跳过：${importResult.skippedCount} 条`}
          />
        </p>
      ) : null}

      <details className="advanced-info">
        <summary>
          <BilingualText ja="詳細情報" zh="高级信息" />
        </summary>
        <p>
          <BilingualText ja={`保存キー: ${localStorageKey}`} zh={`技术保存键：${localStorageKey}`} />
        </p>
        <p>
          <BilingualText ja="バックアップ形式: JSON" zh="备份文件格式：JSON" />
        </p>
      </details>
    </section>
  );
}
