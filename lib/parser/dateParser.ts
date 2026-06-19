import { toDateInputValue } from "../utils/date.ts";

export function parseDate(text: string, now = new Date()) {
  const today = new Date(now);

  if (/前天|一昨日/.test(text)) {
    today.setDate(today.getDate() - 2);
    return toDateInputValue(today);
  }

  if (/昨天|昨日/.test(text)) {
    today.setDate(today.getDate() - 1);
    return toDateInputValue(today);
  }

  if (/明天|明日|明日/.test(text)) {
    today.setDate(today.getDate() + 1);
    return toDateInputValue(today);
  }

  const fullDate = text.match(new RegExp(String.raw`(20\d{2})[年\-/.](\d{1,2})[月\-/.](\d{1,2})日?`));
  if (fullDate) {
    return toDateInputValue(new Date(Number(fullDate[1]), Number(fullDate[2]) - 1, Number(fullDate[3])));
  }

  const monthDay = text.match(/(\d{1,2})月(\d{1,2})日?/);
  if (monthDay) {
    return toDateInputValue(new Date(today.getFullYear(), Number(monthDay[1]) - 1, Number(monthDay[2])));
  }

  const slashMonthDay = text.match(/(?:^|[^\d])(\d{1,2})[/.](\d{1,2})(?:[^\d]|$)/);
  if (slashMonthDay) {
    return toDateInputValue(new Date(today.getFullYear(), Number(slashMonthDay[1]) - 1, Number(slashMonthDay[2])));
  }

  return toDateInputValue(today);
}
