import assert from "node:assert/strict";
import test from "node:test";
import { buildTransactionsFromDrafts } from "../lib/transactions/buildTransactions.ts";

test("preserves originalText exactly as the user entered it", () => {
  const originalText = "老公发工资，给了我12万";
  const transactions = buildTransactionsFromDrafts(
    [
      {
        type: "income",
        amount: 120000,
        currency: "JPY",
        category: "工作",
        date: "2026-06-16",
        merchant: "",
        note: "工资收入"
      }
    ],
    originalText,
    ["data:image/jpeg;base64,test"],
    "2026-06-16T00:00:00.000Z",
    () => "txn_test"
  );

  assert.equal(transactions[0].originalText, originalText);
  assert.equal(transactions[0].amount, 120000);
  assert.equal(transactions[0].type, "income");
  assert.equal(transactions[0].category, "工作");
  assert.equal(transactions[0].note, "工资收入");
  assert.deepEqual(transactions[0].imageDataUrls, ["data:image/jpeg;base64,test"]);
});

test("preserves originalText for requested examples", () => {
  const examples = [
    "昨天老公给了我12万",
    "今天发工资20万",
    "收到退款3000",
    "今天买猫粮3000",
    "在コーナン买地板革12800"
  ];

  for (const originalText of examples) {
    const [transaction] = buildTransactionsFromDrafts(
      [
        {
          type: "income",
          amount: 1,
          currency: "JPY",
          category: "其他收入",
          date: "2026-06-16",
          merchant: "",
          note: ""
        }
      ],
      originalText,
      [],
      "2026-06-16T00:00:00.000Z",
      () => "txn_test"
    );

    assert.equal(transaction.originalText, originalText);
  }
});
