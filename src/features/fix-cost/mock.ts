import type {
  Category,
  FixCostItem,
  MonthClose,
  Template,
  YearMonth,
} from "./types";

export const CURRENT_YM: YearMonth = (() => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
})();

export const MOCK_CATEGORIES: Category[] = [
  { id: "c-loan", name: "เงินกู้", color: "#ef4444" },
  { id: "c-family", name: "ครอบครัว", color: "#f59e0b" },
  { id: "c-utility", name: "ค่าน้ำค่าไฟ", color: "#3b82f6" },
  { id: "c-other", name: "อื่นๆ", color: "#8b5cf6" },
];

export const MOCK_TEMPLATES: Template[] = [
  { id: "tpl-home-loan", name: "Home loan", amount: 7800, categoryId: "c-loan" },
  { id: "tpl-car-loan", name: "Car Loan", amount: 3878.5, categoryId: "c-loan" },
  { id: "tpl-dad", name: "Money for Dad", amount: 4000, categoryId: "c-family" },
  { id: "tpl-electric", name: "Electricity bill", categoryId: "c-utility" },
  { id: "tpl-water", name: "Water bill", categoryId: "c-utility" },
];

export const MOCK_ITEMS: FixCostItem[] = [
  { id: "it-1", year: CURRENT_YM.year, month: CURRENT_YM.month, name: "Home loan", amount: 7800, categoryId: "c-loan", paid: true },
  { id: "it-2", year: CURRENT_YM.year, month: CURRENT_YM.month, name: "Car Loan", amount: 3878.5, categoryId: "c-loan", paid: false },
  { id: "it-3", year: CURRENT_YM.year, month: CURRENT_YM.month, name: "Money for Dad", amount: 4000, categoryId: "c-family", paid: false },
  { id: "it-4", year: CURRENT_YM.year, month: CURRENT_YM.month, name: "Electricity bill", categoryId: "c-utility", paid: false },
  { id: "it-5", year: CURRENT_YM.year, month: CURRENT_YM.month, name: "Water bill", amount: 53.27, categoryId: "c-utility", paid: true },
];

export const MOCK_MONTH_CLOSES: MonthClose[] = [];
