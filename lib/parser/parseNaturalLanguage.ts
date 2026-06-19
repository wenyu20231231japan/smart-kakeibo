import { parseAmounts } from "./amountParser.ts";
import { inferCategory } from "./categoryRules.ts";
import { parseDate } from "./dateParser.ts";
import { inferMerchant } from "./merchantParser.ts";
import type { ParsedTransactionDraft, TransactionType } from "../../types/transaction";

const incomeKeywords = [
  "给了我",
  "给我",
  "收到",
  "发工资",
  "工资到账",
  "转给我",
  "转账给我",
  "打给我",
  "还给我",
  "收款",
  "入账",
  "退款",
  "奖金",
  "收入",
  "工资",
  "薪水",
  "报销",
  "到账",
  "赚了",
  "もらった",
  "受け取った",
  "給料",
  "入金",
  "返金",
  "ボーナス",
  "振込",
  "夫からもらった",
  "夫がくれた"
];

const expenseKeywords = [
  "给别人",
  "给老公",
  "付给",
  "买了",
  "花了",
  "支付",
  "付款",
  "交房租",
  "购买",
  "消费",
  "買った",
  "使った",
  "払った",
  "支払った",
  "購入",
  "家賃を払った"
];

function inferType(text: string): TransactionType {
  if (expenseKeywords.some((keyword) => text.includes(keyword))) {
    return "expense";
  }

  if (incomeKeywords.some((keyword) => text.includes(keyword))) {
    return "income";
  }

  return "expense";
}

function getSegmentForAmount(text: string, amountIndex: number, nextAmountIndex?: number) {
  const separators = ["\n", "；", ";", "。", "然后", "之后", "另外", "还有", "再加", "そして"];
  let start = 0;
  let end = nextAmountIndex ?? text.length;

  for (const separator of separators) {
    const index = text.lastIndexOf(separator, amountIndex);
    if (index >= start) {
      start = index + separator.length;
    }
  }

  for (const separator of separators) {
    const index = text.indexOf(separator, amountIndex);
    if (index !== -1 && index < end) {
      end = index;
    }
  }

  return text.slice(start, end).trim();
}

function isSalaryIncome(text: string) {
  return /工资|薪水|給料/.test(text);
}

function buildNote(segment: string, rawAmount: string, merchant: string, type: TransactionType) {
  if (type === "income" && isSalaryIncome(segment)) {
    return "工资收入";
  }

  if (type === "income" && /退款|返金/.test(segment)) {
    return "退款";
  }

  return segment
    .replace(rawAmount, "")
    .replace(/^(今天|昨日|昨天|前天|明天|明日)/, "")
    .replace(/^(在|去)/, "")
    .replace(merchant, "")
    .replace(/^(买了|买|花了|花|消费|坐|付了|付|一共|共)/, "")
    .trim();
}

function shouldUseFullTextContext(segment: string) {
  return /^(一共|共|总共|合计)/.test(segment) || segment.length <= 10;
}

export function parseNaturalLanguage(text: string, now = new Date()): ParsedTransactionDraft[] {
  const trimmed = text.trim();
  const amounts = parseAmounts(trimmed);
  const date = parseDate(trimmed, now);

  if (amounts.length === 0) {
    return [];
  }

  return amounts.map((amount, index) => {
    const nextAmount = amounts[index + 1];
    const segment = getSegmentForAmount(trimmed, amount.index, nextAmount?.index);
    const context = segment && !shouldUseFullTextContext(segment) ? segment : trimmed;
    const merchant = inferMerchant(context) || inferMerchant(trimmed);
    const noteSource = segment && !shouldUseFullTextContext(segment) ? segment : trimmed;
    const type = inferType(context);

    return {
      type,
      amount: amount.amount,
      currency: amount.currency,
      category: inferCategory(context, type),
      date,
      merchant,
      note: buildNote(noteSource, amount.raw, merchant, type)
    };
  });
}
