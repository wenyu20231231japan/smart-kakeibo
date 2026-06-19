import type { Currency } from "../../types/transaction";

export type AmountMatch = {
  amount: number;
  currency: Currency;
  raw: string;
  index: number;
};

const currencyPatterns: Array<{ currency: Currency; pattern: string }> = [
  { currency: "JPY", pattern: "日元|円|yen|jpy" },
  { currency: "CNY", pattern: "人民币|元|块|rmb|cny" },
  { currency: "USD", pattern: "美元|美金|usd|\\$" },
  { currency: "EUR", pattern: "欧元|eur|€" }
];

const unitMultipliers: Record<string, number> = {
  万: 10000,
  千: 1000,
  百: 100
};

function normalizeNumber(value: string) {
  return value
    .replace(/[，,]/g, "")
    .replace(/．/g, ".")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));
}

function isSlashDateNumber(text: string, startIndex: number, rawNumber: string) {
  const endIndex = startIndex + rawNumber.length;
  const previousChar = text.slice(startIndex - 1, startIndex);
  const nextChar = text.slice(endIndex, endIndex + 1);

  return previousChar === "/" || previousChar === "." || previousChar === "-" || nextChar === "/" || nextChar === "." || nextChar === "-";
}

export function parseAmounts(text: string): AmountMatch[] {
  const matches: AmountMatch[] = [];
  const numberPattern = String.raw`([0-9０-９](?:[0-9０-９,，]*)(?:[.．][0-9０-９]+)?)`;
  const unitPattern = "万|千|百";
  const currencyPattern = currencyPatterns.map((item) => item.pattern).join("|");
  const regex = new RegExp(`${numberPattern}\\s*(${unitPattern})?\\s*(${currencyPattern})?`, "gi");

  for (const match of text.matchAll(regex)) {
    const matchIndex = match.index ?? 0;
    const rawAmount = normalizeNumber(match[1] ?? "");
    const baseAmount = Number(rawAmount);
    const multiplier = unitMultipliers[match[2] ?? ""] ?? 1;
    const amount = baseAmount * multiplier;

    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    const hasUnit = Boolean(match[2]);
    const hasCurrency = Boolean(match[3]);
    const charAfterMatch = text.slice(matchIndex + match[0].length, matchIndex + match[0].length + 1);
    if (!hasUnit && !hasCurrency && /[年月日号]/.test(charAfterMatch)) {
      continue;
    }

    if (!hasUnit && !hasCurrency && isSlashDateNumber(text, matchIndex, match[1] ?? "")) {
      continue;
    }

    const rawCurrency = match[3]?.toLowerCase() ?? "";
    const currency =
      currencyPatterns.find((item) => new RegExp(item.pattern, "i").test(rawCurrency))
        ?.currency ?? "JPY";

    matches.push({
      amount,
      currency,
      raw: match[0],
      index: matchIndex
    });
  }

  return matches;
}
