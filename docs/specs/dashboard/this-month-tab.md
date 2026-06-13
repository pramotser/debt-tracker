# This-Month Tab — เดือนนี้ต้องจ่ายอะไรบ้าง

> ดู overview ก่อน: [`dashboard.md`](./dashboard.md)

`tab value = "this-month"` (default) · file: `src/features/dashboard/this-month-tab.tsx`

## วัตถุประสงค์

ตอบคำถามเดียว: **"เดือนนี้ต้องจ่ายอะไร · จ่ายไปแล้วเท่าไร · ยังเหลือเท่าไร"**

หลังจากนั้นเสริมด้วยบริบท: trend 6 เดือนย้อนหลัง (ดูแนวโน้ม) + breakdown ตามประเภท (ดูว่า "เดือนนี้" หนักไปทางไหน)

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ เดือน                                                            │
│ 2026/06                                                          │
│ ┌──────────────┬──────────────┬──────────────┐                  │
│ │ ยอดรวมเดือนนี้│ จ่ายแล้ว     │ ค้างจ่าย      │                  │
│ │ ฿12,500.00    │ ฿4,800.00    │ ฿7,700.00     │                  │
│ │ 8 รายการ      │ 38% ของยอดรวม│ 62% ของยอดรวม │                  │
│ │ 2 ยังไม่ระบุ  │              │              │                  │
│ └──────────────┴──────────────┴──────────────┘                  │
│ ──────────────  progress 38%  ──────────────                     │
│ ค้างอยู่ ฿7,700.00                            จ่ายแล้ว 38%       │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┬───────────────────────────────┐ │
│ │ แนวโน้ม 6 เดือนย้อนหลัง       │ รายจ่ายตามประเภทเดือนนี้     │ │
│ │ [bar chart]                  │   [donut]  + legend            │ │
│ └─────────────────────────────┴───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

- mobile (<md): KPI 1 col · trend และ donut เรียงซ้อน (1 col)
- ≥md: KPI 3 col · trend+donut เคียงกัน (2 col)

## ข้อมูลที่ใช้จาก `DashboardData`

```ts
const { year, month, summary, trailing, typeBreakdownThisMonth } = data;
```

- `summary: ThisMonthSummary` ← `getThisMonthSummary(year, month)`
- `trailing: MonthTotal[]` ← `getTrailingTotals(year, month, 6)` (รวมเดือนปัจจุบัน)
- `typeBreakdownThisMonth: TypeBreakdownItem[]` ← `getTypeBreakdownByMonth(year, month)`

## KPI summary card

shadcn `Card` ใส่ 3 ส่วนแนวตั้ง: heading "เดือน {YYYY/MM}" → 3 Stat → progress bar

### Stat component (inline helper)

```ts
function Stat({ label, value, hint?, naHint?, className? })
```

แสดง:
- `label` (caption เล็ก) → `value` (เลขใหญ่ `tabular-nums whitespace-nowrap`) → `hint` (caption เล็ก) → `naHint` (สีอำพัน — เฉพาะเมื่อ `naCount > 0`)

### 3 Stat
| label | value | hint | naHint (เฉพาะ KPI ตัวแรก) |
|---|---|---|---|
| ยอดรวมเดือนนี้ | `formatMoney(total)` | `{entryCount} รายการ` | `{naCount} รายการยังไม่ระบุยอด` ถ้า `naCount > 0` |
| จ่ายแล้ว (สีเขียว) | `formatMoney(paid)` | `{paidPct}% ของยอดรวม` (ถ้า total>0) | — |
| ค้างจ่าย (สีส้ม) | `formatMoney(due)` | `{100-paidPct}% ของยอดรวม` (ถ้า total>0) | — |

### Progress bar (เงื่อนไข)
- ถ้า `entryCount > 0` → แสดง `<Progress value={paidPct} />` (emerald-500 indicator, h-2) + แถวข้อความล่าง
- ถ้า `entryCount === 0` → แสดง `<div bg-muted/50>` ที่มีข้อความ "ยังไม่มีรายการเดือนนี้"

### Progress message (เลือก 1 ใน 4)
```ts
if (entryCount === 0) → "ยังไม่มีรายการเดือนนี้"
else if (total === 0) → "ยังไม่ระบุยอดของรายการเดือนนี้"
else if (due <= 0)    → "จ่ายครบทุกรายการแล้ว 🎉"
else                  → "ค้างอยู่ {formatMoney(due)}"
```

## Sub-section: `<MonthlyTrendChart data={trailing} />`

bar chart 6 เดือนย้อนหลัง (รวมเดือนปัจจุบัน)

- recharts `BarChart` · bar `radius={[6,6,0,0]}` · fill `var(--color-total)` (= `var(--chart-1)`)
- XAxis label = `formatMonthShortTh(month)` (ม.ค./ก.พ./...)
- YAxis tick formatter: `>=1000` → `"{k}k"` else string
- Tooltip: label = `formatYearMonth(year, month)` (จาก payload.ym) · value = `formatMoney(value)`
- Empty state: `hasAny = data.some(d => d.total > 0)` → ถ้า false แสดง "ยังไม่มีรายการใน 6 เดือนที่ผ่านมา"

> ⚠️ **chart type ต่างจากใน overview tab**: trailing ใช้ bar (อ่านง่ายเทียบเดือนต่อเดือน) · upcoming ใน overview tab ใช้ line — ตั้งใจสลับให้แยกบริบท

## Sub-section: `<TypeBreakdownDonut data={typeBreakdownThisMonth} title="รายจ่ายตามประเภทเดือนนี้" />`

donut + legend ของยอดเฉพาะเดือนนี้ แยกตาม `ledger_entry_type`

- ดู [`overview-tab.md`](./overview-tab.md#sub-section-typebreakdowndonut-data---typeBreakdown--all-time-) สำหรับรายละเอียด component (ทั้ง 2 tab ใช้ component เดียวกัน)
- ต่างกันแค่ `data` (เดือนเดียว vs all-time) + `title`

## Edge cases

- **เดือนนี้ไม่มีรายการเลย** (`entryCount === 0`) — KPI ทั้ง 3 ใบยังขึ้น `฿0.00` · ไม่แสดง progress bar (แสดง muted block แทน) · donut empty state
- **มีรายการแต่ทุกตัว amount=NULL** (`total === 0 && entryCount > 0`) — Stat โชว์ ฿0 · `naHint` ขึ้นใน KPI ตัวแรก · progress 0% · message "ยังไม่ระบุยอด..."
- **จ่ายครบ** (`due <= 0 && total > 0`) — progress 100% · message "จ่ายครบทุกรายการแล้ว 🎉"
- **เดือนก่อนหน้าไม่มีข้อมูล** (`trailing` ทุกเดือน 0) — trend chart empty state ขึ้นแทน chart

## Mobile behavior (375px)
- KPI 3 ใบเรียงซ้อน (1 col)
- progress + message wrap ได้ (`flex-wrap` บน text แถวล่าง)
- trend+donut ซ้อนกัน 2 row
- donut legend: label `truncate` (label ประเภทยาวสุด "ค่าใช้จ่ายรายเดือน" = ~20 char)
