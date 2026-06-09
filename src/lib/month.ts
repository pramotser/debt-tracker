export type YearMonth = {
  year: number;
  month: number; // 1-12
};

export function shiftMonth(ym: YearMonth, delta: number): YearMonth {
  let m = ym.month + delta;
  let y = ym.year;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return { year: y, month: m };
}

export function ymKey(year: number, month: number): string {
  return `${year}-${month}`;
}

// CLAUDE.md convention: เทียบเดือนด้วย year*100+month
export function ymCompare(year: number, month: number): number {
  return year * 100 + month;
}
