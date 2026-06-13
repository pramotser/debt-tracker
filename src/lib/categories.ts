// Client-side helpers for the category catalog
// - getCategoryLabel(map, id): id → name, fallback = id ดิบ (ไม่ throw)
// - getCategoryIcon(iconKey): kebab-case → Lucide component, fallback = Tag
// catalog data load ผ่าน server query `getCategories()` / `getCategoryMap()`
// แล้วส่งลงมา component → ห้าม import server query ที่นี่

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Banknote,
  Car,
  Droplet,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  MoreHorizontal,
  Package,
  PawPrint,
  PiggyBank,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Ticket,
  Users,
  Utensils,
} from "lucide-react";

import type { Category } from "@/db/schema";

const FALLBACK_LABEL = "ไม่ระบุหมวด";
const FALLBACK_COLOR_BG = "#94A3B8";
const FALLBACK_COLOR_FG = "#FFFFFF";

// kebab-case key (ของ DB) → Lucide component
// เพิ่ม key ใหม่เมื่อ catalog เพิ่ม icon ที่ยังไม่มีในนี้
const ICON_MAP: Record<string, LucideIcon> = {
  "arrow-left-right": ArrowLeftRight,
  banknote: Banknote,
  car: Car,
  droplet: Droplet,
  gift: Gift,
  "graduation-cap": GraduationCap,
  "hand-coins": HandCoins,
  "heart-pulse": HeartPulse,
  home: Home,
  "more-horizontal": MoreHorizontal,
  package: Package,
  "paw-print": PawPrint,
  "piggy-bank": PiggyBank,
  plane: Plane,
  "shield-check": ShieldCheck,
  "shopping-bag": ShoppingBag,
  ticket: Ticket,
  users: Users,
  utensils: Utensils,
};

export function getCategoryIcon(iconKey: string | null | undefined): LucideIcon {
  if (!iconKey) return Tag;
  return ICON_MAP[iconKey] ?? Tag;
}

// คืนชื่อหมวดจาก catalog · id ไม่อยู่ใน catalog → คืน id ดิบ (ไม่ throw)
// id เป็น null/undefined → "ไม่ระบุหมวด"
export function getCategoryLabel(
  map: Map<string, Category> | undefined,
  categoryId: string | null | undefined
): string {
  if (!categoryId) return FALLBACK_LABEL;
  return map?.get(categoryId)?.name ?? categoryId;
}

export type CategoryBrand = {
  iconKey: string | null;
  colorBg: string;
  colorFg: string;
};

export function getCategoryBrand(
  map: Map<string, Category> | undefined,
  categoryId: string | null | undefined
): CategoryBrand {
  const row = categoryId ? map?.get(categoryId) : undefined;
  return {
    iconKey: row?.icon ?? null,
    colorBg: row?.colorBg ?? FALLBACK_COLOR_BG,
    colorFg: row?.colorFg ?? FALLBACK_COLOR_FG,
  };
}
