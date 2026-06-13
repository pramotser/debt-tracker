# Overview Tab — ภาพรวมรายจ่าย

> ดู overview ก่อน: [`dashboard.md`](./dashboard.md)

`tab value = "overview"` · file: `src/features/dashboard/overview-tab.tsx`

## วัตถุประสงค์

มุมมอง **กว้างกว่าเดือนปัจจุบัน** — ดูแนวโน้มอนาคต · เงินไหลไปทางไหน · แผนผ่อนเหลือกี่เดือน · เดือนไหนหนักสุด

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────┬───────────────────────────────┐ │
│ │ เดือนข้างหน้า 6 เดือน      │ รายจ่ายตามประเภท              │ │
│ │  [line chart]              │  [donut] + legend             │ │
│ └──────────────────────────┴───────────────────────────────┘ │
│ ┌──────────────────────────┬───────────────────────────────┐ │
│ │ เงินไหลไปหมวดไหน          │ ความคืบหน้าแผนการผ่อนชำระ      │ │
│ │  [bar list, sort DESC]    │  [per-plan progress]          │ │
│ └──────────────────────────┴───────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ความหนาแน่นภาระรายเดือน                   [ปี ▼]        │ │
│ │ [12-cell heatmap, GitHub-style emerald]                  │ │
│ │ น้อย ▢▢▢▢▢ มาก                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

CSS:
- `grid grid-cols-1 gap-4 md:grid-cols-2`
- heatmap `md:col-span-2` (กิน 2 col บน md+)
- mobile (<md): ทุกการ์ดเรียงซ้อน 1 col

## ข้อมูลที่ใช้

```ts
const { upcoming, typeBreakdown, categoryFlow, installments, heatmap, year } = data;
```

| Field | Query | กิน window ไหน |
|---|---|---|
| `upcoming` | `getUpcomingTotals(year, month, 6)` | 6 เดือนข้างหน้า (**ไม่รวม** เดือนปัจจุบัน) |
| `typeBreakdown` | `getTypeBreakdown()` | all-time |
| `categoryFlow` | `getCategoryFlow()` | all-time |
| `installments` | `getInstallmentProgress()` | all-time + status='active' |
| `heatmap` | `getHeatmapByYears(year)` | ทุกปีที่มี ledger + บังคับใส่ปีปัจจุบัน |

## Sub-section: `<UpcomingChart data={upcoming} />`

line chart ของยอด 6 เดือนข้างหน้า

- recharts `LineChart` · stroke `var(--color-total)` (= `var(--chart-1)`) · `dot={r:3}` · `activeDot={r:5}`
- XAxis label = `formatMonthShortTh(month)` · YAxis tick `>=1000` → `"{k}k"`
- Tooltip: label = `formatYearMonth(year, month)` (จาก payload.ym) · value = `formatMoney(value)`
- Empty state: ทุกเดือน 0 → "ยังไม่มีรายการล่วงหน้าใน 6 เดือนข้างหน้า"

> ⚠️ **chart type ต่างจาก trailing**: upcoming ใช้ line (ดูเทรนด์ต่อเนื่อง) · trailing ใน this-month tab ใช้ bar — ตั้งใจสลับให้บริบทต่าง

## Sub-section: `<TypeBreakdownDonut data={typeBreakdown} />` (all-time)

donut + legend ของยอด all-time แยกตาม `ledger_entry_type`

ส่วนคำนวณ:
```ts
grandTotal = sum(data.total)
chartData  = data.map(d => ({ type, label, total, color }))
```

### Label mapping (`TYPE_LABEL`)
```
CREDIT_CARD_INSTALLMENT → "ผ่อนบัตรเครดิต"
FIXED_COST              → "ค่าใช้จ่ายรายเดือน"
CREDIT_CARD             → "บัตรเครดิต"
ONE_TIME_COST           → "ค่าใช้จ่ายอื่น ๆ"
SUBSCRIPTION            → "Subscription"
```

### Color mapping (`TYPE_COLOR`) — ใช้ CSS var ของ shadcn chart
```
CREDIT_CARD_INSTALLMENT → var(--chart-1)
FIXED_COST              → var(--chart-2)
CREDIT_CARD             → var(--chart-3)
SUBSCRIPTION            → var(--chart-4)
ONE_TIME_COST           → var(--chart-5)
```

### Layout (responsive)
- <sm: donut 180×180 อยู่บน · legend list ด้านล่าง
- ≥sm: `grid-cols-[180px_1fr]` donut ซ้าย · legend ขวา

### Tooltip
hideLabel · formatter custom: `{label} · {money} ({pct}%)`

### Legend row
- color dot (2.5×2.5) · label (truncate) · ขวาสุด `{money} ({pct}%)`

### Props
- `data: TypeBreakdownItem[]` (required)
- `title?: string` (default `"รายจ่ายตามประเภท"`) — ใช้สลับเป็น `"รายจ่ายตามประเภทเดือนนี้"` ใน this-month tab

## Sub-section: `<CategoryFlowList data={categoryFlow} />`

bar list เรียง DESC ตาม `total`

### Per row
```
[label]                                         [฿ amount]
[█████████████░░░░░░░░░░░░░░░]   ← bar width = total / max * 100%
```

- `label` = `getCategoryLabel(d.categoryId)` (lookup จาก `lib/categories.ts`)
- bar width: `Math.max(ratio * 100, 2)%` (กัน 0px เมื่อ ratio ใกล้ 0)
- height 2 · `bg-primary` indicator · `bg-muted` track

### Empty state
`data.length === 0` → ขึ้น "ยังไม่มีรายการ" h-180

> **categories ยัง mock** — categoryId ที่ไม่มีใน dict (`lib/categories.ts`) จะ fallback แสดง categoryId เอง (เช่น `"c-unknown"` แทน label ไทย) เพื่อช่วย debug

## Sub-section: `<InstallmentProgress data={installments} />`

list ของแผนผ่อน active แต่ละแผน

### Per row
```
[plan name (bold)]                         {paidCount}/{total} งวด
[card name (mute)]                         เหลือ ฿{remaining}
[━━━━━░░░░░░░░] ← progress bar 1.5px, paidCount/total
```

- progress value = `paidCount / totalInstallments * 100` (= 0 ถ้า total = 0)
- `remaining` = `(total - paidCount) * installmentAmount`
- name + cardName ใส่ `truncate` กันยาวเกิน

### Empty state
`data.length === 0` → "ไม่มีแผนผ่อนที่ active" h-180

> filter ฝั่ง query แล้วด้วย `status = 'active'` — completed/early_settled ไม่โผล่

## Sub-section: `<MonthlyHeatmap data={heatmap} initialYear={year} />`

12-cell heatmap (GitHub-style) + year selector

### Props
```ts
data: HeatmapByYear = { years: number[], byYear: Record<number, HeatmapCell[]> }
initialYear: number   // ปี default ตอนเปิด (= ปีปัจจุบัน)
```

### Year selector
- ใช้ shadcn `<Select>` แสดงเฉพาะเมื่อ `data.years.length > 1`
- ถ้า 1 ปี → แสดงเป็น static `<span>` ขวาบน
- fallback ถ้า `initialYear` ไม่อยู่ใน `byYear` → ใช้ปีล่าสุดที่มีข้อมูล

### Color scale (GitHub-inspired)
```
[0] bg-muted                                      ← ไม่มี/0
[1] bg-emerald-200 dark:bg-emerald-900            ← น้อยสุด
[2] bg-emerald-400 dark:bg-emerald-700
[3] bg-emerald-600 dark:bg-emerald-500
[4] bg-emerald-800 dark:bg-emerald-300            ← มากสุด
```

dark mode invert (gradient ย้อน) — เพื่อให้ contrast กับพื้นหลังเข้ม

### Intensity calculation
```ts
function intensityClass(value, max):
  if max <= 0 or value <= 0 → STOPS[0]
  ratio = value / max
  idx   = min(STOPS.length - 1, 1 + floor(ratio * (STOPS.length - 1 - epsilon)))
```

`epsilon = 0.0001` กัน floating-point ทำให้ ratio = 1 ตกขอบ

### Grid
- `grid-cols-6 sm:grid-cols-12` — mobile 2 row × 6 col · ≥sm = 1 row × 12 col
- cell h-10 + label `formatMonthShortTh(month)` ใต้
- `title` attribute = `"ม.ค. · ฿1,234.00"` (tooltip native)

### Legend (ขวาล่าง)
```
น้อย ▢▢▢▢▢ มาก
```

5 swatch ขนาด 3×3 ใช้ class เดียวกับ INTENSITY_STOPS

## Edge cases

- **ไม่มี ledger เลย** — donut/list/heatmap ทุกตัวขึ้น empty state ตามลำดับ; year selector มีปีปัจจุบันให้เลือกอย่างเดียว
- **เดือนข้างหน้ายังไม่มี ledger** — upcoming line chart empty state · heatmap ของปีปัจจุบันยังโชว์ (เดือนถัดไปเป็น 0 cell ทั้งหมด)
- **ปี ledger ใหม่กว่า initialYear** — เปิดมาขึ้นปีปัจจุบัน (มี fallback row 0 ทุกเดือน) · user เลือกปีอื่นจาก dropdown ได้
- **`categoryId` ใหม่ที่ไม่มีใน dict** — fallback แสดง id ดิบ (เช่น `"c-coffee"`) — จงใจ เพื่อช่วย dev เห็นว่าต้องไป update `lib/categories.ts`

## Mobile behavior (375px)
- 5 การ์ดเรียงซ้อน 1 col
- heatmap grid 6-col × 2 row — แต่ละ cell h-10 w-full พอดี
- donut card: chart 180×180 อยู่บน · legend 100% width ด้านล่าง
