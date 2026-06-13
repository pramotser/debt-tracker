# Dashboard — overview

route `/dashboard` · หน้าเดียว 2 tabs · สรุปภาระทางการเงินของ user (ไม่มี mutation)

> หน้านี้ **read-only ล้วน** — ทุก mutation อยู่ที่หน้า monthly-cost / subscription / credit-cards · dashboard แค่อ่าน `ledger_entries` + `credit_card_installments` แล้วสรุปเป็น chart/list

## โครงสร้าง

| Tab | ค่า `value` | ชื่อแสดง | spec |
|---|---|---|---|
| 1 | `this-month` (default) | เดือนนี้ต้องจ่ายอะไรบ้าง | [`this-month-tab.md`](./this-month-tab.md) |
| 2 | `overview` | ภาพรวมรายจ่าย | [`overview-tab.md`](./overview-tab.md) |

ทั้งสอง tab ใช้ `keepMounted` (ไม่ unmount เวลาสลับ) — chart ของ recharts re-mount ช้ากว่า cost ของ DOM ที่ค้างไว้

## Data fetch (server)

`src/app/(portal)/dashboard/page.tsx` (Server Component) — ไม่อ่าน `searchParams` (ไม่มี ?y=&m= เหมือนหน้าอื่น เพราะ dashboard ยึดเดือนปัจจุบันเสมอ)

```ts
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;  // 1-12
```

จากนั้น `Promise.all` 8 query (แต่ละ query กรอง `userId` ด้วย `getCurrentUser()` ตาม CLAUDE.md):

| Query | Signature | คำอธิบาย |
|---|---|---|
| `getThisMonthSummary` | `(year, month)` | KPI ของเดือนปัจจุบัน (total/paid/due/naCount/entryCount) |
| `getTrailingTotals` | `(year, month, n=6)` | ยอดรวมต่อเดือน 6 เดือนย้อนหลัง (รวมเดือนปัจจุบัน) |
| `getUpcomingTotals` | `(year, month, n=6)` | ยอดรวมต่อเดือน 6 เดือนข้างหน้า (ไม่รวมเดือนปัจจุบัน) |
| `getTypeBreakdown` | `()` | สรุปยอดตาม `ledger_entry_type` **all-time** (donut ใน overview tab) |
| `getTypeBreakdownByMonth` | `(year, month)` | สรุปยอดตาม type **เฉพาะเดือนปัจจุบัน** (donut ใน this-month tab) |
| `getCategoryFlow` | `()` | สรุปยอดตาม `categoryId` **all-time** เรียง DESC |
| `getInstallmentProgress` | `()` | แผนผ่อน active + paidCount จาก ledger + remaining amount |
| `getHeatmapByYears` | `(fallbackYear)` | 12-cell heatmap ของทุกปีที่มี ledger (เพิ่มปี fallback ถ้ายังไม่มี) |

ส่งผลรวมเป็น `data: DashboardData` ลง `<DashboardTabs>` (client component สลับ tab อย่างเดียว)

## Data model

ใช้ตารางมีอยู่แล้ว — **ไม่มี table ใหม่ของ dashboard**

```
ledger_entries          ← source หลักของทุก KPI/chart
  ├─ userId, type, categoryId
  ├─ amount?: numeric(12,2)  NULL = "ยังไม่ระบุยอด" → ไม่นับใน SUM แต่นับใน naCount
  ├─ year, month, paid
  └─ sourceId (text) ← match กับ installment.id ผ่าน ::text cast

credit_card_installments  ← feed `installment-progress` card
  ├─ userId, creditCardId, status ('active' เท่านั้นที่นับ)
  ├─ totalInstallments, installmentAmount
  └─ paidCount = COUNT(ledger WHERE sourceId = installment.id::text AND paid)

credit_cards            ← join เพื่อเอา cardName ใน installment progress
```

> **ไม่มี admin `categories` table** — `categoryId` ยังเป็น text mock ทั้ง schema · label → `lib/categories.ts` (sync กับ `MOCK_CATEGORIES` ใน 3 feature mocks)

### หลักการ aggregate
- ทุก `SUM(amount)` ห่อด้วย `COALESCE(..., 0)` กัน null ตอนไม่มี row
- `amount IS NULL` → ไม่นับยอด (แต่นับเข้า `entryCount` / `naCount`)
- `numeric` ของ Postgres → Drizzle คืนเป็น **string** → cast `Number()` ก่อนส่งกลับ
- เทียบช่วงเดือนด้วย `year*100 + month` (ใน `sumByMonthInRange` ใช้ `BETWEEN` กับสองค่า key)
- `sourceId` ของ ledger เป็น text → cast `installment.id::text` ตอน join

## State management (`DashboardTabs`)

`src/features/dashboard/dashboard-tabs.tsx` — client wrapper บางๆ ของ shadcn `Tabs`

```ts
<Tabs defaultValue="this-month">
  <TabsList>...</TabsList>
  <TabsContent value="this-month" keepMounted>...</TabsContent>
  <TabsContent value="overview" keepMounted>...</TabsContent>
</Tabs>
```

- **ไม่มี state อื่นที่ระดับ tabs** (data มาเป็น immutable prop)
- year selector ของ heatmap เก็บ state ภายใน `MonthlyHeatmap` component (`useState<number>`) — ไม่ lift ขึ้นมา

## Server actions

**ไม่มี** — dashboard read-only ล้วน ไม่มี mutation · ทุก action อยู่ในหน้า module อื่น

## Component map

```
src/features/dashboard/
├─ dashboard-tabs.tsx          orchestrator (shadcn Tabs)
├─ types.ts                    DashboardData union type
├─ this-month-tab.tsx          tab 1 layout
│   └─ ใช้ Stat (inline helper)
├─ overview-tab.tsx            tab 2 layout (grid 2-col)
├─ monthly-trend-chart.tsx     bar chart 6 เดือนย้อนหลัง
├─ upcoming-chart.tsx          line chart 6 เดือนข้างหน้า
├─ type-breakdown-donut.tsx    donut (รับ title prop) ใช้ทั้ง 2 tab
├─ category-flow-list.tsx      bar list ตาม category (overview)
├─ installment-progress.tsx    progress per active plan (overview)
└─ monthly-heatmap.tsx         12-cell heatmap + year selector (overview)
```

## UI rules

- shadcn-only · เงินผ่าน `formatMoney` · เดือนผ่าน `formatMonthShortTh` / `formatYearMonth`
- mobile-first: KPI `grid-cols-1 sm:grid-cols-3` · trend+donut คู่ `grid-cols-1 md:grid-cols-2` · overview grid `grid-cols-1 md:grid-cols-2`
- ยอดเงิน: `whitespace-nowrap tabular-nums` กันแตกบรรทัด
- tab list: `flex-nowrap overflow-x-auto` ที่ <sm — label "เดือนนี้ต้องจ่ายอะไรบ้าง" ยาวเกินบางจอ
- chart มี **empty state** ทุกตัว (เมื่อ data ว่าง/ทั้งหมด 0)
- heatmap = GitHub-style 5 stops emerald + dark-mode invert

## Convention เฉพาะหน้านี้

- **i18n ไม่ใช้ next-intl** — string ไทย hardcode ใน component เหมือน module อื่น (ทั้ง app ยังไม่ migrate next-intl) เมื่อ migrate ทั้ง app ค่อยแยก strings ออกมา `messages/th.json`
- **type breakdown 2 ใบ** — donut ใน this-month ใช้ `getTypeBreakdownByMonth` (เดือนนี้) · donut ใน overview ใช้ `getTypeBreakdown` (all-time) · ใช้ component เดียวกัน (`TypeBreakdownDonut`) ผ่าน `title` prop
- **chart library ล็อก recharts** — `package.json` มี `recharts` + shadcn `components/ui/chart.tsx` ติดตั้งแล้ว ห้ามใช้ lib อื่นในหน้านี้

## Open questions

- **categories ยังเป็น text mock** — เมื่อทำ admin `categories` table แล้ว ให้ join `categoryId` กับ table จริงใน `getCategoryFlow` + `getTypeBreakdown*` แทน lookup จาก `lib/categories.ts`
- **เดือนปัจจุบัน fix ที่ `new Date()`** — ไม่ override ผ่าน URL (ต่างจากหน้า monthly-cost ที่มี `?y=&m=`) ถ้าต้องการ "ดู dashboard ของเดือนอื่น" ต้องเพิ่ม searchParams + ปรับ query signature
- **heatmap ปีเก่ามาก** — query โหลด ledger ทั้งหมดของ user; ถ้า user เก่ามีข้อมูลหลายปี payload โต — ตอนนี้ยังไม่มี cap; ดูแลเมื่อ user จริงเริ่มสะสมข้อมูล
- **all-time aggregate ไม่มี cache** — `getTypeBreakdown` / `getCategoryFlow` scan ledger ทั้งหมดทุก request · ตอนนี้ยอมรับได้ (ledger ยังเล็ก) แต่ถ้า user เก่าหลายพันแถวขึ้นไป ควรพิจารณา materialized view หรือ cache layer
