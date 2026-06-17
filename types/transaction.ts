export type TransactionType = "income" | "expense";

export type Currency = "JPY" | "CNY" | "USD" | "EUR" | "OTHER";

export type ExpenseCategory =
  | "食费"
  | "交通"
  | "房租"
  | "宠物"
  | "装修"
  | "购物"
  | "医疗"
  | "水电煤网"
  | "娱乐"
  | "工作"
  | "其他";

export type IncomeCategory =
  | "工资"
  | "奖金"
  | "转账收入"
  | "退款"
  | "其他收入";

export type Category = ExpenseCategory | IncomeCategory;

export type ParsedTransactionDraft = {
  type: TransactionType;
  amount: number;
  currency: Currency;
  category: Category;
  date: string;
  merchant: string;
  note: string;
};

export type Transaction = ParsedTransactionDraft & {
  id: string;
  originalText: string;
  imageDataUrls: string[];
  createdAt: string;
  updatedAt: string;
};
