// format helpers — ห้าม hardcode สัญลักษณ์เงิน/รูปแบบเดือนนอกที่นี่

const THB = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** เงิน: รับ Decimal string จาก DB (เช่น "1234.50") หรือ number */
export function formatMoney(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  return THB.format(Number.isFinite(n) ? n : 0);
}

/** เดือน: เก็บ year + month (1-12) แสดง "YYYY/MM" */
export function formatYearMonth(year: number, month: number): string {
  return `${year}/${String(month).padStart(2, "0")}`;
}

/** เปรียบเทียบเดือน: year*100 + month */
export function yearMonthKey(year: number, month: number): number {
  return year * 100 + month;
}
