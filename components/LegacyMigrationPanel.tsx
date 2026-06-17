"use client";

import { BilingualText } from "@/components/BilingualText";

type Props = {
  pendingCount: number;
  isMigrating: boolean;
  result?: {
    successCount: number;
    failedCount: number;
    skippedCount: number;
  };
  onMigrate: () => void;
};

export function LegacyMigrationPanel({ pendingCount, isMigrating, result, onMigrate }: Props) {
  if (pendingCount === 0 && !result) {
    return null;
  }

  return (
    <section className="panel migration-panel">
      <div>
        <h2>
          <BilingualText ja="ローカル記録をクラウドへ移行" zh="迁移本地记录到云端" />
        </h2>
        <p>
          {pendingCount > 0 ? (
            <BilingualText
              ja={`${pendingCount}件の未移行記録があります。`}
              zh={`发现 ${pendingCount} 条本地旧记录。`}
            />
          ) : (
            <BilingualText ja="移行できる未処理記録はありません。" zh="没有待迁移的本地记录。" />
          )}
        </p>
      </div>

      {pendingCount > 0 ? (
        <button className="primary-button" type="button" onClick={onMigrate} disabled={isMigrating}>
          {isMigrating ? (
            <BilingualText ja="移行中..." zh="迁移中..." />
          ) : (
            <BilingualText ja="クラウドへ移行" zh="迁移本地记录到云端" />
          )}
        </button>
      ) : null}

      {result ? (
        <div className="migration-result">
          <span>
            <BilingualText ja="移行結果" zh="迁移结果" />
          </span>
          <p>
            成功: {result.successCount} / 失败: {result.failedCount} / 跳过: {result.skippedCount}
          </p>
        </div>
      ) : null}
    </section>
  );
}
