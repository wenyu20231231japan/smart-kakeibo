import type { Category, TransactionType } from "../../types/transaction";

const incomeRules: Array<{ category: Category; keywords: string[] }> = [
  {
    category: "工资",
    keywords: ["工资", "薪水", "发工资", "工资到账", "給料"]
  },
  {
    category: "奖金",
    keywords: ["奖金", "ボーナス"]
  },
  {
    category: "退款",
    keywords: ["退款", "退回", "返金"]
  },
  {
    category: "转账收入",
    keywords: [
      "给了我",
      "给我",
      "转给我",
      "转账给我",
      "打给我",
      "还给我",
      "收到",
      "收款",
      "入账",
      "夫からもらった",
      "夫がくれた",
      "もらった",
      "くれた",
      "受け取った",
      "入金",
      "振込"
    ]
  }
];

const expenseRules: Array<{ category: Category; keywords: string[] }> = [
  {
    category: "食费",
    keywords: ["咖啡", "饭", "餐", "拉面", "寿司", "便当", "超市", "便利店", "奶茶", "面包", "早餐", "午饭", "晚饭", "食材", "コーヒー", "ご飯", "ラーメン", "弁当", "スーパー", "コンビニ", "食材"]
  },
  {
    category: "交通",
    keywords: ["地铁", "电车", "公交", "巴士", "出租", "打车", "难波", "難波", "梅田", "车票", "交通", "icoca", "suica", "地下鉄", "電車", "バス", "タクシー", "交通費"]
  },
  {
    category: "房租",
    keywords: ["房租", "家賃", "租金", "管理费", "家賃を払った"]
  },
  {
    category: "宠物",
    keywords: ["猫", "狗", "宠物", "猫粮", "狗粮", "猫砂", "动物医院", "ペット", "キャットフード", "ドッグフード", "猫砂", "動物病院"]
  },
  {
    category: "装修",
    keywords: ["コーナン", "装修", "地板", "地板革", "墙纸", "防潮纸", "胶带", "工具", "建材", "油漆", "螺丝", "木板", "リフォーム", "床材", "壁紙", "工具", "建材", "塗料", "木材"]
  },
  {
    category: "购物",
    keywords: ["买了", "购买", "购物", "衣服", "鞋", "包", "亚马逊", "amazon", "乐天", "rakuten", "日用品", "買った", "購入", "買い物", "服", "靴", "楽天"]
  },
  {
    category: "医疗",
    keywords: ["医院", "药", "体检", "牙医", "诊所", "医疗", "看病", "病院", "薬", "歯医者", "医療"]
  },
  {
    category: "水电煤网",
    keywords: ["水费", "电费", "煤气", "燃气", "网费", "手机费", "宽带", "电力", "水道", "光熱費", "通信費", "電気", "ガス", "ネット", "携帯"]
  },
  {
    category: "娱乐",
    keywords: ["电影", "游戏", "演唱会", "门票", "娱乐", "订阅", "netflix", "spotify", "酒吧", "映画", "ゲーム", "ライブ", "娯楽", "サブスク"]
  },
  {
    category: "工作",
    keywords: ["报销", "客户", "项目", "工作", "仕事", "経費", "クライアント", "プロジェクト"]
  }
];

export function inferCategory(text: string, type: TransactionType): Category {
  const normalized = text.toLowerCase();
  const rules = type === "income" ? incomeRules : expenseRules;
  const fallback: Category = type === "income" ? "其他收入" : "其他";

  return rules.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())))?.category ?? fallback;
}
