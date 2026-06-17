import type { Currency } from "@/types/transaction";

const locales: Record<Currency, string> = {
  JPY: "ja-JP",
  CNY: "zh-CN",
  USD: "en-US",
  EUR: "de-DE",
  OTHER: "ja-JP"
};

export function formatMoney(amount: number, currency: Currency = "JPY") {
  if (currency === "OTHER") {
    return amount.toLocaleString("ja-JP");
  }

  return new Intl.NumberFormat(locales[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2
  }).format(amount);
}
