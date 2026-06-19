import assert from "node:assert/strict";
import test from "node:test";
import { parseAmounts } from "../lib/parser/amountParser.ts";

test("parses Chinese amount units", () => {
  assert.deepEqual(parseAmounts("今天买材料花了2万日元").map((item) => item.amount), [20000]);
  assert.deepEqual(parseAmounts("装修材料3千日元").map((item) => item.amount), [3000]);
  assert.deepEqual(parseAmounts("胶带5百日元").map((item) => item.amount), [500]);
});

test("parses decimal amount units", () => {
  assert.deepEqual(parseAmounts("工具花了1.5万日元").map((item) => item.amount), [15000]);
  assert.deepEqual(parseAmounts("材料0.8万").map((item) => item.amount), [8000]);
});

test("parses Japanese yen unit expressions", () => {
  assert.deepEqual(parseAmounts("材料2万円").map((item) => item.amount), [20000]);
  assert.deepEqual(parseAmounts("昨日、夫から12万円もらった").map((item) => item.amount), [120000]);
  assert.deepEqual(parseAmounts("1.5万円").map((item) => item.amount), [15000]);
  assert.deepEqual(parseAmounts("交通费3千円").map((item) => item.amount), [3000]);
});

test("parses ordinary amount expressions", () => {
  assert.deepEqual(parseAmounts("コーナン一共12800日元").map((item) => item.amount), [12800]);
  assert.deepEqual(parseAmounts("咖啡580円").map((item) => item.amount), [580]);
});

test("does not parse date numbers as amounts", () => {
  assert.deepEqual(parseAmounts("6/17，自动販売機でジュースを一本、170円").map((item) => item.amount), [170]);
  assert.deepEqual(parseAmounts("6月17日、コンビニでお茶120円").map((item) => item.amount), [120]);
});

test("parses multiple amount expressions in one sentence", () => {
  const amounts = parseAmounts("坐地铁去难波240日元，然后买咖啡580円，再买材料1.5万日元");
  assert.deepEqual(
    amounts.map((item) => item.amount),
    [240, 580, 15000]
  );
  assert.deepEqual(
    amounts.map((item) => item.raw),
    ["240日元", "580円", "1.5万日元"]
  );
});
