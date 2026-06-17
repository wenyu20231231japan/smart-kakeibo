export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getCurrentMonthKey(date = new Date()) {
  return toDateInputValue(date).slice(0, 7);
}

export function formatDisplayDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}
