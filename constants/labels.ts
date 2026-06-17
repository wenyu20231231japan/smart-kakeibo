import type { Category, TransactionType } from "@/types/transaction";

export const CATEGORY_LABELS: Record<Category, { ja: string; zh: string }> = {
  工资: { ja: "給料", zh: "工资" },
  奖金: { ja: "ボーナス", zh: "奖金" },
  转账收入: { ja: "振込収入", zh: "转账收入" },
  退款: { ja: "返金", zh: "退款" },
  其他收入: { ja: "その他収入", zh: "其他收入" },
  食费: { ja: "食費", zh: "食费" },
  交通: { ja: "交通費", zh: "交通" },
  房租: { ja: "家賃", zh: "房租" },
  宠物: { ja: "ペット", zh: "宠物" },
  装修: { ja: "リフォーム", zh: "装修" },
  购物: { ja: "買い物", zh: "购物" },
  医疗: { ja: "医療", zh: "医疗" },
  水电煤网: { ja: "光熱費・通信費", zh: "水电煤网" },
  娱乐: { ja: "娯楽", zh: "娱乐" },
  工作: { ja: "仕事", zh: "工作" },
  其他: { ja: "その他", zh: "其他" }
};

export const TYPE_LABELS: Record<TransactionType, { ja: string; zh: string }> = {
  income: { ja: "収入", zh: "收入" },
  expense: { ja: "支出", zh: "支出" }
};
