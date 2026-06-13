// Category placeholder dictionary — ย้ายเป็น admin categories table ทีหลัง
// (ตอนนี้ ledger.categoryId / template.categoryId ยังเก็บเป็น text mock เช่น "c-loan")
// TODO: เมื่อมี admin `categories` table แล้ว ให้ join แทน lookup จาก dict นี้

export type CategoryLabel = {
  id: string;
  label: string;
};

export const CATEGORIES: Record<string, CategoryLabel> = {
  "c-loan": { id: "c-loan", label: "เงินกู้/สินเชื่อ" },
  "c-family": { id: "c-family", label: "ครอบครัว" },
  "c-utility": { id: "c-utility", label: "ค่าสาธารณูปโภค" },
  "c-subscription": { id: "c-subscription", label: "Subscription" },
  "c-credit-card": { id: "c-credit-card", label: "บัตรเครดิต" },
  "c-installment": { id: "c-installment", label: "ผ่อนชำระ" },
  "c-other": { id: "c-other", label: "อื่น ๆ" },
};

const FALLBACK_LABEL = "ไม่ระบุหมวด";

export function getCategoryLabel(
  categoryId: string | null | undefined
): string {
  if (!categoryId) return FALLBACK_LABEL;
  return CATEGORIES[categoryId]?.label ?? categoryId;
}
