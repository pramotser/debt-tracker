// Design tokens สถานะรวม (ชุดเดียวทั้งหน้า credit-cards)
// — รายการชำระ (tab1) ใช้ paid/due
// — รายการผ่อน (tab2) ใช้ active/nearEnd/settle
// — บัตรของฉัน (tab3) ใช้ off สำหรับบัตรปิดใช้งาน

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
  due: { bar: "#E5A30C", bg: "#FCF3DC", text: "#8A6410", label: "ค้างจ่าย" },
  active: { bar: "#2563EB", bg: "#E6EEFB", text: "#1E40AF", label: "กำลังผ่อน" },
  nearEnd: { bar: "#E5A30C", bg: "#FCF3DC", text: "#8A6410", label: "ใกล้จบ" },
  settle: { bar: "#7C3AED", bg: "#F0EAFB", text: "#5B21B6", label: "ปิดก่อนกำหนด" },
  off: { bar: "#9AA1AC", bg: "#F0F1F4", text: "#5B6473", label: "ปิดใช้งาน" },
};
