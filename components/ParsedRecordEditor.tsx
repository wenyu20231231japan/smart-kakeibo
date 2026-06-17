"use client";

import { BilingualText } from "@/components/BilingualText";
import { CATEGORIES } from "@/constants/categories";
import { CURRENCIES } from "@/constants/currencies";
import { CATEGORY_LABELS, TYPE_LABELS } from "@/constants/labels";
import { formatDisplayDate } from "@/lib/utils/date";
import type { ParsedTransactionDraft, TransactionType } from "@/types/transaction";

type Props = {
  drafts: ParsedTransactionDraft[];
  originalText: string;
  onChange: (index: number, draft: ParsedTransactionDraft) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function ParsedRecordEditor({ drafts, originalText, onChange, onSave, onCancel }: Props) {
  if (drafts.length === 0) {
    return null;
  }

  return (
    <section className="panel editor-panel">
      <div className="section-heading">
        <div>
          <h2>
            <BilingualText ja="認識結果を確認" zh="确认识别结果" />
          </h2>
          <p>
            <BilingualText ja="保存前に内容を修正できます。" zh="保存前可以修改每一项。" />
          </p>
        </div>
        <button className="ghost-button" type="button" onClick={onCancel}>
          <BilingualText ja="クリア" zh="清除" />
        </button>
      </div>

      <div className="recognition-overview">
        <div>
          <span>
            <BilingualText ja="元の入力" zh="原始输入" />
          </span>
          <p>{originalText}</p>
        </div>
      </div>

      <div className="draft-list">
        {drafts.map((draft, index) => (
          <article className="draft-card" key={`${draft.amount}-${index}`}>
            <div className="draft-title">
              <BilingualText ja={`記録 ${index + 1}`} zh={`记录 ${index + 1}`} />
            </div>

            <div className="recognition-result">
              <span>
                <BilingualText ja="認識結果" zh="识别结果" />
              </span>
              <dl>
                <div>
                  <dt>
                    <BilingualText ja="種類" zh="类型" />
                  </dt>
                  <dd>{TYPE_LABELS[draft.type].ja} / {TYPE_LABELS[draft.type].zh}</dd>
                </div>
                <div>
                  <dt>
                    <BilingualText ja="金額" zh="金额" />
                  </dt>
                  <dd>{draft.amount}</dd>
                </div>
                <div>
                  <dt>
                    <BilingualText ja="分類" zh="分类" />
                  </dt>
                  <dd>{CATEGORY_LABELS[draft.category].ja} / {CATEGORY_LABELS[draft.category].zh}</dd>
                </div>
                <div>
                  <dt>
                    <BilingualText ja="日付" zh="日期" />
                  </dt>
                  <dd>{formatDisplayDate(draft.date)}</dd>
                </div>
              </dl>
            </div>

            <div className="field-grid">
              <label>
                <BilingualText ja="種類" zh="类型" />
                <select
                  value={draft.type}
                  onChange={(event) =>
                    onChange(index, { ...draft, type: event.target.value as TransactionType })
                  }
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
                  onChange={(event) => onChange(index, { ...draft, amount: Number(event.target.value) })}
                />
              </label>

              <label>
                <BilingualText ja="通貨" zh="币种" />
                <select
                  value={draft.currency}
                  onChange={(event) => onChange(index, { ...draft, currency: event.target.value as ParsedTransactionDraft["currency"] })}
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
                  onChange={(event) => onChange(index, { ...draft, category: event.target.value as ParsedTransactionDraft["category"] })}
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
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) => onChange(index, { ...draft, date: event.target.value })}
                />
              </label>

              <label>
                <BilingualText ja="店舗" zh="商家" />
                <input
                  value={draft.merchant}
                  onChange={(event) => onChange(index, { ...draft, merchant: event.target.value })}
                  placeholder="空欄可 / 可留空"
                />
              </label>
            </div>

            <label>
              <BilingualText ja="メモ" zh="备注" />
              <textarea
                value={draft.note}
                onChange={(event) => onChange(index, { ...draft, note: event.target.value })}
                rows={2}
              />
            </label>
          </article>
        ))}
      </div>

      <button className="primary-button" type="button" onClick={onSave}>
        <BilingualText ja="確認して保存" zh="确认保存" />
      </button>
    </section>
  );
}
