// Design tokens สถานะรวมทั้งโปรเจ็กต์
// — paid/due ใช้ทุก list รายการจ่าย (monthly-cost / subscription / credit-cards statement)
// — active/nearEnd/settle/off ใช้กับแผนผ่อน + การ์ดบัตรเครดิต

export type StatusKey =
  | "paid"
  | "due"
  | "active"
  | "nearEnd"
  | "settle"
  | "off";

export type StatusToken = {
  bar: string;
  bg: string;
  text: string;
  label: string;
};

export const STATUS: Record<StatusKey, StatusToken> = {
  paid: { bar: "#16A34A", bg: "#E7F6EC", text: "#15803D", label: "จ่ายแล้ว" },
  due: { bar: "#EA580C", bg: "#FFF7ED", text: "#C2410C", label: "ค้างจ่าย" },
  active: { bar: "#2563EB", bg: "#E6EEFB", text: "#1E40AF", label: "กำลังผ่อน" },
  nearEnd: { bar: "#D97706", bg: "#FEF3C7", text: "#92400E", label: "ใกล้จบ" },
  settle: { bar: "#7C3AED", bg: "#F0EAFB", text: "#5B21B6", label: "ปิดก่อนกำหนด" },
  off: { bar: "#9AA1AC", bg: "#F0F1F4", text: "#5B6473", label: "ปิดใช้งาน" },
};
