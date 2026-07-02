# DB Schema

## Enums
- `ledger_entry_type`: `FIXED_COST` | `CREDIT_CARD` | `CREDIT_CARD_INSTALLMENT` | `ONE_TIME_COST`
- `cycle_type`: `monthly` | `yearly` (ใช้กับ `recurring_templates`)
- `installment_status`: `active` | `early_settled` (completed/near-end = derive ฝั่ง UI)
- `user_role`: `admin` | `user`

## users — บัญชีผู้ใช้ (id ตรงกับ auth.users.id ของ Supabase Auth)
- id: uuid PK · firstName: text · middleName: text? · lastName: text
- role: user_role (default user) · createdAt/updatedAt: timestamptz

## user_settings — ตั้งค่ารายผู้ใช้
- id: uuid PK · userId: FK→users · currency: text (THB) · language: text (th) · theme: text (light)

## banks — ⭐ admin · ธนาคารกลาง (global, ไม่ผูก user)
- id: text PK (slug `b-<short>` เช่น `b-kbank`) · shortName: text · name: text
- brandBg: text (#hex) · brandFg: text (#hex) · active: bool · sortOrder: int
- `credit_cards.bankId` → `banks.id` (logical, ไม่มี FK formal)

## categories — ⭐ admin · หมวดหมู่กลาง (global, แชร์ทุก user)
- id: text PK · name: text · icon: text (Lucide name) · colorBg: text · colorFg: text
- ownerId: uuid? (NULL = catalog ระบบ · != NULL = user สร้างเอง — เผื่ออนาคต)
- isSystem: bool (system = ลบไม่ได้) · sortOrder: int · active: bool
- `ledger_entries.categoryId` / `recurring_templates.categoryId` อ้างเป็น text เปล่า (ไม่มี FK — ตั้งใจ)

## credit_cards — บัตรเครดิตของ user
- id: uuid PK · userId: FK→users · bankId: text (logical → banks.id) · name: text
- lastFourDigits: text? · cardNetwork: text? · statementDate: int? (1-31) · dueDate: int? (1-31)
- color: text (default "blue") · active: bool

## credit_card_installments — แผนผ่อน (ledger rows generate ตอน create)
- id: uuid PK · userId: FK→users · creditCardId: FK→credit_cards (restrict) · categoryId: text
- name: text · totalAmount: numeric(12,2) · installmentAmount: numeric(12,2) ต่องวด
- installmentPrincipal: numeric? · installmentInterest: numeric? (NULL = mode 3 ยังไม่รู้ split)
- totalInstallments: int · startYear: int · startMonth: int (1-12)
- hasInterest: bool · status: installment_status (default active)
- settlementAmount: numeric? · closedAt: timestamptz?

## recurring_templates — template รายจ่ายประจำ (รวม fixed cost + subscription)
- id: uuid PK · userId: FK→users · categoryId: text · name: text
- defaultAmount: numeric(12,2)? (NULL ได้ — กรอกทีหลังแบบค่าไฟ)
- billingCycle: cycle_type (default `monthly` · `yearly` = renew เฉพาะเดือนตรงตาม renewDate)
- renewDate: date? (monthly=day, yearly=month+day) · active: bool

## ledger_entries — ตารางกลางรายจ่ายจริงทุกประเภท ⭐
- id: uuid PK · userId: FK→users · categoryId: text
- sourceType: text? (เช่น "recurring_template") · sourceId: text? (id ต้นทาง)
- type: ledger_entry_type · name: text
- amount: numeric? (ยอดรวม) · principalAmount: numeric? · interestAmount: numeric? (ใช้กับผ่อน)
- year: int · month: int (1-12) · paid: bool · paidAt: timestamptz? · note: text?
- index: (userId, year, month, type) · (sourceType, sourceId)

> ⚠️ `categoryId` ใน ledger/templates เป็น text เปล่า (ไม่มี FK formal) — ตั้งใจให้ join ฝั่ง app ห้ามเปลี่ยน type เป็น uuid · `bankId` ใน credit_cards = logical FK → `banks.id` (ตอนนี้มีตารางจริงแล้ว)
