"use client";

import { BilingualText } from "@/components/BilingualText";
import { formatMoney } from "@/lib/utils/format";
import type { MonthlySummary as MonthlySummaryType } from "@/lib/calculations/monthlySummary";

type Props = {
  summary: MonthlySummaryType;
};

export function MonthlySummary({ summary }: Props) {
  return (
    <section className="summary-grid" aria-label="本月概览">
      <div className="summary-item">
        <BilingualText ja="今月の収入" zh="本月收入" />
        <strong className="income">{formatMoney(summary.income)}</strong>
      </div>
      <div className="summary-item">
        <BilingualText ja="今月の支出" zh="本月支出" />
        <strong className="expense">{formatMoney(summary.expense)}</strong>
      </div>
      <div className="summary-item balance">
        <BilingualText ja="残高" zh="余额" />
        <strong>{formatMoney(summary.balance)}</strong>
      </div>
    </section>
  );
}
