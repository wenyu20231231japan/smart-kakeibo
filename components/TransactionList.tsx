"use client";

import { useMemo, useState } from "react";
import { BilingualText } from "@/components/BilingualText";
import { CATEGORY_LABELS } from "@/constants/labels";
import { formatDisplayDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";
import type { Category, Transaction, TransactionType } from "@/types/transaction";

type Props = {
  transactions: Transaction[];
  onDelete: (id: string) => void;
};

type TypeFilter = "all" | TransactionType;

const EXPENSE_FILTER_CATEGORIES: Category[] = [
  "食费",
  "交通",
  "房租",
  "宠物",
  "装修",
  "购物",
  "医疗",
  "水电煤网",
  "娱乐",
  "工作",
  "其他"
];

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return `${year}年${Number(month)}月`;
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

function transactionMatchesSearch(transaction: Transaction, search: string) {
  const keyword = search.trim().toLowerCase();

  if (!keyword) {
    return true;
  }

  const categoryLabel = CATEGORY_LABELS[transaction.category];
  const searchableText = [
    transaction.originalText,
    transaction.note,
    transaction.merchant,
    transaction.category,
    categoryLabel?.ja,
    categoryLabel?.zh,
    String(transaction.amount)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(keyword);
}

function groupTransactionsByMonth(transactions: Transaction[]) {
  const groups = new Map<string, Map<string, Transaction[]>>();

  for (const transaction of transactions) {
    const monthKey = getMonthKey(transaction.date);
    const dateGroup = groups.get(monthKey) ?? new Map<string, Transaction[]>();
    const dateTransactions = dateGroup.get(transaction.date) ?? [];

    dateTransactions.push(transaction);
    dateGroup.set(transaction.date, dateTransactions);
    groups.set(monthKey, dateGroup);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, dateGroup]) => ({
      monthKey,
      dates: [...dateGroup.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, records]) => ({ date, records }))
    }));
}

export function TransactionList({ transactions, onDelete }: Props) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({});
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const matchesType = typeFilter === "all" || transaction.type === typeFilter;
        const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;

        return matchesType && matchesCategory && transactionMatchesSearch(transaction, search);
      }),
    [categoryFilter, search, transactions, typeFilter]
  );

  const monthGroups = useMemo(() => groupTransactionsByMonth(filteredTransactions), [filteredTransactions]);

  function toggleMonth(monthKey: string) {
    setExpandedMonths((current) => ({
      ...current,
      [monthKey]: !current[monthKey]
    }));
  }

  function renderRecordCard(transaction: Transaction) {
    return (
      <article className="record-card" key={transaction.id}>
        <div className="record-main">
          <div>
            <div className="record-meta">
              <span>{formatDisplayDate(transaction.date)}</span>
              <span>{transaction.type === "income" ? "収入 / 收入" : "支出 / 支出"}</span>
              <span>
                {CATEGORY_LABELS[transaction.category]?.ja ?? transaction.category} /{" "}
                {CATEGORY_LABELS[transaction.category]?.zh ?? transaction.category}
              </span>
            </div>
            <h3>{transaction.originalText || transaction.note || transaction.merchant || "未命名记录"}</h3>
            {transaction.merchant ? (
              <p className="record-subline">
                <BilingualText ja="店舗" zh="商家" />：{transaction.merchant}
              </p>
            ) : null}
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
          </div>
          <strong className={transaction.type === "income" ? "income" : "expense"}>
            {transaction.type === "income" ? "+" : "-"}
            {formatMoney(transaction.amount, transaction.currency)}
          </strong>
        </div>
        <button
          className="delete-button"
          type="button"
          onClick={() => onDelete(transaction.id)}
          aria-label="删除记录"
        >
          <BilingualText ja="削除" zh="删除" />
        </button>
      </article>
    );
  }

  return (
    <section className="records-panel panel">
      <button className="records-panel-toggle" type="button" onClick={() => setIsPanelOpen((current) => !current)}>
        <span>
          <BilingualText ja="記録一覧" zh="记录列表" />
          <small>{transactions.length}件</small>
        </span>
        <strong>{isPanelOpen ? "▲" : "▼"}</strong>
      </button>

      {isPanelOpen ? (
        <div className="records-panel-body">
          <div className="record-filters">
            <label>
              <BilingualText ja="検索" zh="搜索" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="コーナン / 120000"
                type="search"
              />
            </label>

            <div className="filter-row" aria-label="收入支出筛选">
              <button
                className={typeFilter === "all" ? "filter-chip active" : "filter-chip"}
                type="button"
                onClick={() => setTypeFilter("all")}
              >
                <BilingualText ja="すべて" zh="全部" />
              </button>
              <button
                className={typeFilter === "income" ? "filter-chip active" : "filter-chip"}
                type="button"
                onClick={() => setTypeFilter("income")}
              >
                <BilingualText ja="収入" zh="收入" />
              </button>
              <button
                className={typeFilter === "expense" ? "filter-chip active" : "filter-chip"}
                type="button"
                onClick={() => setTypeFilter("expense")}
              >
                <BilingualText ja="支出" zh="支出" />
              </button>
            </div>

            <label>
              <BilingualText ja="分類" zh="分类" />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as Category | "all")}
              >
                <option value="all">すべて / 全部</option>
                {EXPENSE_FILTER_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category].zh} / {CATEGORY_LABELS[category].ja}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {transactions.length === 0 ? (
            <div className="records-empty">
              <BilingualText ja="記録はまだありません" zh="还没有记录" />
            </div>
          ) : null}

          {transactions.length > 0 && filteredTransactions.length === 0 ? (
            <div className="records-empty">
              <BilingualText ja="条件に合う記録がありません" zh="没有符合条件的记录" />
            </div>
          ) : null}

          {monthGroups.map((monthGroup) => {
            const isMonthOpen = Boolean(expandedMonths[monthGroup.monthKey]);
            const selectedDate = selectedDates[monthGroup.monthKey];
            const selectedDateGroup = monthGroup.dates.find((dateGroup) => dateGroup.date === selectedDate);

            return (
              <div className="month-group" key={monthGroup.monthKey}>
                <button className="month-toggle" type="button" onClick={() => toggleMonth(monthGroup.monthKey)}>
                  <span>{formatMonthLabel(monthGroup.monthKey)}</span>
                  <strong>{isMonthOpen ? "▼" : "▶"}</strong>
                </button>

                {isMonthOpen ? (
                  <div className="month-content">
                    <div className="date-list" aria-label="日期列表">
                      {monthGroup.dates.map((dateGroup) => (
                        <button
                          className={selectedDate === dateGroup.date ? "date-chip active" : "date-chip"}
                          key={dateGroup.date}
                          type="button"
                          onClick={() =>
                            setSelectedDates((current) => ({
                              ...current,
                              [monthGroup.monthKey]: dateGroup.date
                            }))
                          }
                        >
                          {formatShortDate(dateGroup.date)}
                          <small>{dateGroup.records.length}件</small>
                        </button>
                      ))}
                    </div>

                    {selectedDateGroup ? (
                      <div className="record-list">{selectedDateGroup.records.map(renderRecordCard)}</div>
                    ) : (
                      <div className="records-empty compact">
                        <BilingualText ja="日付を選択してください" zh="请选择日期" />
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

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
