import type { Currency } from "@/types/transaction";

export const CURRENCIES: Currency[] = ["JPY", "CNY", "USD", "EUR", "OTHER"];

export const CURRENCY_LABELS: Record<Currency, string> = {
  JPY: "日元",
  CNY: "人民币",
  USD: "美元",
  EUR: "欧元",
  OTHER: "其他"
};
