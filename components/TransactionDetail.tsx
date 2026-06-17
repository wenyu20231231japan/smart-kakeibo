"use client";

import { useEffect, useState } from "react";
import { BilingualText } from "@/components/BilingualText";
import { CATEGORIES } from "@/constants/categories";
import { CURRENCIES } from "@/constants/currencies";
import { CATEGORY_LABELS, TYPE_LABELS } from "@/constants/labels";
import { formatDisplayDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";
import type { ParsedTransactionDraft, Transaction, TransactionType } from "@/types/transaction";

type Props = {
  transaction?: Transaction;
  onDelete: (id: string) => void;
  onUpdate: (transaction: Transaction) => void;
  isUpdating?: boolean;
};

export function TransactionDetail({ transaction, onDelete, onUpdate, isUpdating = false }: Props) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Transaction | undefined>(transaction);

  useEffect(() => {
    setDraft(transaction);
    setIsEditing(false);
  }, [transaction]);

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
        <div className="detail-actions">
          <button className="ghost-button" type="button" onClick={() => setIsEditing((current) => !current)}>
            <BilingualText ja={isEditing ? "表示" : "編集"} zh={isEditing ? "查看" : "编辑"} />
          </button>
          <button className="ghost-button danger" type="button" onClick={() => onDelete(transaction.id)}>
            <BilingualText ja="削除" zh="删除" />
          </button>
        </div>
      </div>

      {isEditing && draft ? (
        <div className="detail-edit-form">
          <div className="field-grid">
            <label>
              <BilingualText ja="種類" zh="类型" />
              <select
                value={draft.type}
                onChange={(event) => setDraft({ ...draft, type: event.target.value as TransactionType })}
              >
                <option value="expense">支出 / 支出</option>
                <option value="income">収入 / 收入</option>
              </select>
            </label>

            <label>
              <BilingualText ja="金額" zh="金额" />
              <input
                inputMode="decimal"
                type="number"
                min="0"
                value={draft.amount}
                onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })}
              />
            </label>

            <label>
              <BilingualText ja="通貨" zh="币种" />
              <select
                value={draft.currency}
                onChange={(event) =>
                  setDraft({ ...draft, currency: event.target.value as ParsedTransactionDraft["currency"] })
                }
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <BilingualText ja="分類" zh="分类" />
              <select
                value={draft.category}
                onChange={(event) =>
                  setDraft({ ...draft, category: event.target.value as ParsedTransactionDraft["category"] })
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category].ja} / {CATEGORY_LABELS[category].zh}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <BilingualText ja="日付" zh="日期" />
              <input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
            </label>

            <label>
              <BilingualText ja="店舗" zh="商家" />
              <input value={draft.merchant} onChange={(event) => setDraft({ ...draft, merchant: event.target.value })} />
            </label>
          </div>

          <label>
            <BilingualText ja="メモ" zh="备注" />
            <textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} rows={2} />
          </label>

          <button className="primary-button" type="button" disabled={isUpdating} onClick={() => onUpdate(draft)}>
            {isUpdating ? <BilingualText ja="保存中..." zh="保存中..." /> : <BilingualText ja="変更を保存" zh="保存修改" />}
          </button>
        </div>
      ) : null}

      <div className="detail-amount-row">
        <span className={transaction.type === "income" ? "income" : "expense"}>
          {TYPE_LABELS[transaction.type].ja} / {TYPE_LABELS[transaction.type].zh}
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
