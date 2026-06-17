"use client";

import { useState } from "react";
import { BilingualText } from "@/components/BilingualText";
import { CATEGORY_LABELS } from "@/constants/labels";
import { formatDisplayDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";
import type { Transaction } from "@/types/transaction";

type Props = {
  transaction?: Transaction;
  onDelete: (id: string) => void;
};

export function TransactionDetail({ transaction, onDelete }: Props) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!transaction) {
    return (
      <section className="panel transaction-detail empty-detail">
        <h2>
          <BilingualText ja="記録の詳細" zh="记录详情" />
        </h2>
        <p>
          <BilingualText ja="左の一覧から記録を選択してください。" zh="请从左侧列表选择一条记录。" />
        </p>
      </section>
    );
  }

  const categoryLabel = CATEGORY_LABELS[transaction.category];

  return (
    <section className="panel transaction-detail">
      <div className="section-heading">
        <div>
          <h2>
            <BilingualText ja="記録の詳細" zh="记录详情" />
          </h2>
          <p>{formatDisplayDate(transaction.date)}</p>
        </div>
        <button className="ghost-button danger" type="button" onClick={() => onDelete(transaction.id)}>
          <BilingualText ja="削除" zh="删除" />
        </button>
      </div>

      <div className="detail-amount-row">
        <span className={transaction.type === "income" ? "income" : "expense"}>
          {transaction.type === "income" ? "収入 / 收入" : "支出 / 支出"}
        </span>
        <strong className={transaction.type === "income" ? "income" : "expense"}>
          {transaction.type === "income" ? "+" : "-"}
          {formatMoney(transaction.amount, transaction.currency)}
        </strong>
      </div>

      <div className="detail-grid">
        <div>
          <BilingualText ja="分類" zh="分类" />
          <strong>
            {categoryLabel?.ja ?? transaction.category} / {categoryLabel?.zh ?? transaction.category}
          </strong>
        </div>
        <div>
          <BilingualText ja="店舗" zh="商家" />
          <strong>{transaction.merchant || "-"}</strong>
        </div>
        <div>
          <BilingualText ja="メモ" zh="备注" />
          <strong>{transaction.note || "-"}</strong>
        </div>
      </div>

      {transaction.imageDataUrls?.length ? (
        <div className="record-image-list" aria-label="记录图片">
          {transaction.imageDataUrls.map((imageDataUrl, index) => (
            <button
              className="record-image-button"
              key={`${transaction.id}-${index}`}
              type="button"
              onClick={() => setPreviewImage(imageDataUrl)}
              aria-label={`查看图片 ${index + 1}`}
            >
              {/* data URL thumbnails come from localStorage, so Next Image optimization is not applicable. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageDataUrl} alt={`记录图片 ${index + 1}`} />
            </button>
          ))}
        </div>
      ) : null}

      <div className="original-text-block">
        <BilingualText ja="元の入力" zh="原始输入" />
        <p>{transaction.originalText}</p>
      </div>

      {previewImage ? (
        <div className="image-lightbox" role="dialog" aria-modal="true" onClick={() => setPreviewImage(null)}>
          <button className="image-lightbox-close" type="button" onClick={() => setPreviewImage(null)}>
            <BilingualText ja="閉じる" zh="关闭" />
          </button>
          {/* data URL previews come from localStorage, so Next Image optimization is not applicable. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImage} alt="放大的记录图片" />
        </div>
      ) : null}
    </section>
  );
}
