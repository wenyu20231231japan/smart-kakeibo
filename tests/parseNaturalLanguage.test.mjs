import assert from "node:assert/strict";
import test from "node:test";
import { parseNaturalLanguage } from "../lib/parser/parseNaturalLanguage.ts";

test("parses salary income without losing the original business meaning", () => {
  const [transaction] = parseNaturalLanguage("老公发工资，给了我12万");

  assert.equal(transaction.amount, 120000);
  assert.equal(transaction.type, "income");
  assert.equal(transaction.category, "工资");
  assert.equal(transaction.note, "工资收入");
});

test("parses requested income and expense examples", () => {
  const examples = [
    {
      text: "昨天老公给了我12万",
      amount: 120000,
      type: "income",
      category: "转账收入"
    },
    {
      text: "今天发工资20万",
      amount: 200000,
      type: "income",
      category: "工资"
    },
    {
      text: "收到退款3000",
      amount: 3000,
      type: "income",
      category: "退款"
    },
    {
      text: "今天买猫粮3000",
      amount: 3000,
      type: "expense",
      category: "宠物"
    },
    {
      text: "在コーナン买地板革12800",
      amount: 12800,
      type: "expense",
      category: "装修"
    }
  ];

  for (const example of examples) {
    const [transaction] = parseNaturalLanguage(example.text);
    assert.equal(transaction.amount, example.amount, example.text);
    assert.equal(transaction.type, example.type, example.text);
    assert.equal(transaction.category, example.category, example.text);
  }
});

test("classifies transfer-to-me phrases as income and preserves direction", () => {
  const incomeExamples = [
    "老公给了我12万日元",
    "老公给我12万日元",
    "朋友转给我3000日元",
    "妈妈打给我5000",
    "同事还给我120000",
    "夫からもらった12万円",
    "夫がくれた12万円"
  ];

  for (const text of incomeExamples) {
    const [transaction] = parseNaturalLanguage(text);
    assert.equal(transaction.type, "income", text);
    assert.equal(transaction.category, "转账收入", text);
  }

  const [target] = parseNaturalLanguage("老公给了我12万日元");
  assert.equal(target.amount, 120000);
});

test("classifies giving or paying others as expense", () => {
  const expenseExamples = [
    "给别人3000日元",
    "给老公5000日元",
    "付给房东80000日元",
    "买了猫粮3000日元",
    "花了12800円",
    "支付240円"
  ];

  for (const text of expenseExamples) {
    const [transaction] = parseNaturalLanguage(text);
    assert.equal(transaction.type, "expense", text);
  }
});

test("parses Chinese, Japanese, and mixed language input", () => {
  const now = new Date(2026, 5, 16);
  const examples = [
    {
      text: "今天在コーナン买地板革12800日元",
      amount: 12800,
      type: "expense",
      category: "装修",
      date: "2026-06-16",
      merchant: "コーナン"
    },
    {
      text: "今日コーナンで床材を12800円買った",
      amount: 12800,
      type: "expense",
      category: "装修",
      date: "2026-06-16",
      merchant: "コーナン"
    },
    {
      text: "昨天老公给了我12万",
      amount: 120000,
      type: "income",
      category: "转账收入",
      date: "2026-06-15"
    },
    {
      text: "昨日、夫から12万円もらった",
      amount: 120000,
      type: "income",
      category: "转账收入",
      date: "2026-06-15",
      merchant: "夫"
    },
    {
      text: "猫砂と猫粮で3200円",
      amount: 3200,
      type: "expense",
      category: "宠物",
      date: "2026-06-16"
    },
    {
      text: "坐地铁去難波240円",
      amount: 240,
      type: "expense",
      category: "交通",
      date: "2026-06-16"
    }
  ];

  for (const example of examples) {
    const [transaction] = parseNaturalLanguage(example.text, now);
    assert.equal(transaction.amount, example.amount, example.text);
    assert.equal(transaction.type, example.type, example.text);
    assert.equal(transaction.category, example.category, example.text);
    assert.equal(transaction.date, example.date, example.text);
    if ("merchant" in example) {
      assert.equal(transaction.merchant, example.merchant, example.text);
    }
  }
});

test("parses relative and explicit dates clearly", () => {
  const now = new Date(2026, 5, 16);
  const examples = [
    {
      text: "今天买咖啡580",
      date: "2026-06-16"
    },
    {
      text: "昨天老公给了我12万",
      date: "2026-06-15"
    },
    {
      text: "前天买猫粮3000",
      date: "2026-06-14"
    },
    {
      text: "一昨日猫砂3200円",
      date: "2026-06-14"
    },
    {
      text: "明天交房租80000",
      date: "2026-06-17"
    },
    {
      text: "明日家賃を払った80000円",
      date: "2026-06-17"
    },
    {
      text: "6月15日买材料12800",
      date: "2026-06-15"
    },
    {
      text: "2026年6月15日买材料12800",
      date: "2026-06-15"
    },
    {
      text: "买咖啡580",
      date: "2026-06-16"
    }
  ];

  for (const example of examples) {
    const [transaction] = parseNaturalLanguage(example.text, now);
    assert.equal(transaction.date, example.date, example.text);
  }
});
