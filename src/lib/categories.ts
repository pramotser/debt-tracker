// Category placeholder dictionary — ย้ายเป็น admin categories table ทีหลัง
// label ที่ใช้ตรงนี้ sync กับ MOCK_CATEGORIES ของแต่ละ feature:
//   - src/features/monthly-cost/mock.ts
//   - src/features/subscription/mock.ts
//   - src/features/credit-cards/mock.ts
// TODO: เมื่อมี admin `categories` table แล้ว ให้ join แทน lookup จาก dict นี้
//       (และลบ MOCK_CATEGORIES ใน 3 feature mocks ทิ้ง)

export type CategoryLabel = {
  id: string;
  label: string;
};

export const CATEGORIES: Record<string, CategoryLabel> = {
  // monthly-cost
  "c-loan": { id: "c-loan", label: "เงินกู้" },
  "c-family": { id: "c-family", label: "ครอบครัว" },
  "c-utility": { id: "c-utility", label: "ค่าน้ำค่าไฟ" },
  // subscription
  "c-streaming": { id: "c-streaming", label: "Streaming" },
  "c-music": { id: "c-music", label: "Music" },
  "c-software": { id: "c-software", label: "Software/AI" },
  // credit-cards
  "c-food": { id: "c-food", label: "อาหาร" },
  "c-fuel": { id: "c-fuel", label: "น้ำมัน" },
  "c-shopping": { id: "c-shopping", label: "ช้อปปิ้ง" },
  "c-electronics": { id: "c-electronics", label: "อิเล็กทรอนิกส์" },
  "c-furniture": { id: "c-furniture", label: "เฟอร์นิเจอร์" },
  "c-travel": { id: "c-travel", label: "ท่องเที่ยว" },
  // shared
  "c-other": { id: "c-other", label: "อื่นๆ" },
};

const FALLBACK_LABEL = "ไม่ระบุหมวด";

export function getCategoryLabel(
  categoryId: string | null | undefined
): string {
  if (!categoryId) return FALLBACK_LABEL;
  return CATEGORIES[categoryId]?.label ?? categoryId;
}
