"use client";

import { BilingualText } from "@/components/BilingualText";
import { CATEGORY_LABELS } from "@/constants/labels";
import { formatDisplayDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";
import type { Transaction } from "@/types/transaction";

type Props = {
  transactions: Transaction[];
  selectedId?: string;
  onSelect: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
};

function getSummary(transaction: Transaction) {
  return transaction.originalText || transaction.note || transaction.merchant || "未命名记录";
}

export function TransactionList({ transactions, selectedId, onSelect, onDelete }: Props) {
  return (
    <aside className="records-sidebar">
      <div className="sidebar-header">
        <div>
          <h2>
            <BilingualText ja="最近の記録" zh="最近记录" />
          </h2>
          <p>{transactions.length}件</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="records-empty sidebar-empty">
          <BilingualText ja="記録はまだありません" zh="还没有记录" />
        </div>
      ) : (
        <div className="sidebar-record-list">
          {transactions.map((transaction) => {
            const categoryLabel = CATEGORY_LABELS[transaction.category];

            return (
              <article
                className={selectedId === transaction.id ? "sidebar-record active" : "sidebar-record"}
                key={transaction.id}
              >
                <button className="sidebar-record-main" type="button" onClick={() => onSelect(transaction)}>
                  <span className="sidebar-record-date">{formatDisplayDate(transaction.date)}</span>
                  <strong>{getSummary(transaction)}</strong>
                  <span className="sidebar-record-category">
                    {transaction.type === "income" ? "収入 / 收入" : "支出 / 支出"} ·{" "}
                    {categoryLabel?.ja ?? transaction.category}
                  </span>
                  <span className={transaction.type === "income" ? "sidebar-amount income" : "sidebar-amount expense"}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatMoney(transaction.amount, transaction.currency)}
                  </span>
                </button>
                <button className="sidebar-delete" type="button" onClick={() => onDelete(transaction.id)}>
                  <BilingualText ja="削除" zh="删除" />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </aside>
  );
}
