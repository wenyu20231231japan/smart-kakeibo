export function inferMerchant(text: string) {
  const normalizedText = text.replace(/^(今天|昨日|昨天|前天|明天|今日|一昨日|明日)[、，,\s]*/, "");
  if (/自动販売機|自動販売機/.test(normalizedText)) {
    return normalizedText.includes("自动販売機") ? "自动販売機" : "自動販売機";
  }

  const patterns = [
    /在\s*([A-Za-z0-9一-龥ぁ-んァ-ヶー]+)\s*(?:买|花|消费|吃|付)/,
    /([A-Za-z0-9一-龥ぁ-んァ-ヶー]+)で\s*(?:.+?)(?:買った|購入|払った|支払った)/,
    /([A-Za-z0-9一-龥ぁ-んァ-ヶー]+)で\s*.+?\d+(?:\s*(?:日元|円|yen|jpy))?/i,
    /([A-Za-z0-9一-龥ぁ-んァ-ヶー]+)から\s*(?:.+?)(?:もらった|受け取った|入金|振込)/,
    /去\s*([A-Za-z0-9一-龥ぁ-んァ-ヶー]+)\s*(?:买|吃|喝|消费)?/,
    /([A-Za-z0-9一-龥ぁ-んァ-ヶー]+)\s*(?:店|超市|医院|药局|咖啡|餐厅)/
  ];

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
}
