export type MonthlyDemoItem = {
  name: string;
  category: string;
  color: string;
  icon: string;
  amount: number;
};

export const MONTHLY_DEMO_ITEMS: MonthlyDemoItem[] = [
  { name: "ค่าส่งรถ", category: "สินเชื่อ/เช่าซื้อ", color: "#E5484D", icon: "฿", amount: 3878.5 },
  { name: "ค่าบ้าน", category: "สินเชื่อ/เช่าซื้อ", color: "#E5484D", icon: "฿", amount: 7800 },
  { name: "ค่าไฟ", category: "ชำระบิล", color: "#E8973C", icon: "💧", amount: 1200 },
  { name: "Netflix", category: "บันเทิง", color: "#7C5CE0", icon: "🎬", amount: 201 },
];

export const DONUT_BREAKDOWN = [
  { label: "ค่าใช้จ่ายรายเดือน", pct: 51, color: "#2E9E6B" },
  { label: "ผ่อนบัตรเครดิต", pct: 48, color: "#16243F" },
  { label: "Subscription", pct: 1, color: "#E8B53C" },
];

export const CATEGORY_FLOW = [
  { name: "สินเชื่อ/เช่าซื้อ", icon: "฿", color: "#E5484D", amount: 35035, widthPct: 100 },
  { name: "ของขวัญ/บริจาค", icon: "🎁", color: "#E5484D", amount: 33860, widthPct: 96 },
  { name: "ชำระบิล", icon: "💧", color: "#E8973C", amount: 1200, widthPct: 9 },
];

export const INSTALLMENT_DEMO = {
  name: "iPad",
  card: "UOB Premier",
  current: 1,
  total: 10,
  remaining: 30474,
  monthlyAmount: 3386,
};

export const FRIEND_STEPS = [
  { no: "01", title: "สมัครด้วยอีเมลหรือ Google", body: "ใช้บัญชีไหนก็ได้ ไม่กี่วินาที" },
  { no: "02", title: "ตั้งรายการประจำ", body: "ใส่ค่าบ้าน ค่าน้ำค่าไฟ บัตร หรือยอดผ่อนที่มี" },
  { no: "03", title: "ดึงเข้าเดือนนี้ แล้วติ๊กจ่าย", body: "เห็นยอดค้างจ่ายลดลงจริง รู้ทุกเดือนว่าเหลืออะไร" },
];

export function formatDemoNumber(n: number) {
  return Math.round(n).toLocaleString("en-US");
}
