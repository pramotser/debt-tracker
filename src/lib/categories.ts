// Client-side helpers for the category catalog
// - getCategoryLabel(map, id): id → name, fallback = id ดิบ (ไม่ throw)
// - getCategoryIcon(iconKey): kebab-case → Lucide component, fallback = Tag
// catalog data load ผ่าน server query `getCategories()` / `getCategoryMap()`
// แล้วส่งลงมา component → ห้าม import server query ที่นี่

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Baby,
  Banknote,
  Bed,
  Beer,
  Bell,
  Bike,
  Book,
  Briefcase,
  Building2,
  Bus,
  Cake,
  Car,
  Coffee,
  Coins,
  Cookie,
  CreditCard,
  Droplet,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  Lamp,
  Laptop,
  MoreHorizontal,
  Music,
  Package,
  ParkingCircle,
  PartyPopper,
  PawPrint,
  Pencil,
  PiggyBank,
  Pill,
  Pizza,
  Plane,
  Printer,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sofa,
  Soup,
  Star,
  Stethoscope,
  Tag,
  Ticket,
  TrainFront,
  Trash2,
  TrendingUp,
  Tv,
  Users,
  Utensils,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react";

import type { Category } from "@/db/schema";

const FALLBACK_LABEL = "ไม่ระบุหมวด";
const FALLBACK_COLOR_BG = "#94A3B8";
const FALLBACK_COLOR_FG = "#FFFFFF";

export type CategoryIconOption = {
  key: string;
  label: string; // Thai label สำหรับ display + search
  group: string; // กลุ่ม (Thai) สำหรับ display + search
  Icon: LucideIcon;
};

// Curated lucide icons สำหรับ category picker — เลือกที่เหมาะกับหมวดค่าใช้จ่าย
// แก้ลำดับ/เพิ่มได้ตามต้องการ — picker จะใช้รายการนี้ตรง ๆ
export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  // อาหาร/เครื่องดื่ม
  { key: "utensils", label: "อาหาร", group: "อาหาร", Icon: Utensils },
  { key: "coffee", label: "กาแฟ", group: "อาหาร", Icon: Coffee },
  { key: "pizza", label: "พิซซ่า", group: "อาหาร", Icon: Pizza },
  { key: "soup", label: "ซุป", group: "อาหาร", Icon: Soup },
  { key: "beer", label: "เครื่องดื่ม", group: "อาหาร", Icon: Beer },
  { key: "cookie", label: "ขนม", group: "อาหาร", Icon: Cookie },
  { key: "cake", label: "เค้ก", group: "อาหาร", Icon: Cake },
  // ช้อปปิ้ง
  { key: "shopping-bag", label: "ช้อปปิ้ง", group: "ช้อปปิ้ง", Icon: ShoppingBag },
  { key: "shopping-cart", label: "ตะกร้าซื้อของ", group: "ช้อปปิ้ง", Icon: ShoppingCart },
  { key: "gift", label: "ของขวัญ", group: "ช้อปปิ้ง", Icon: Gift },
  { key: "shirt", label: "เสื้อผ้า", group: "ช้อปปิ้ง", Icon: Shirt },
  { key: "package", label: "พัสดุ", group: "ช้อปปิ้ง", Icon: Package },
  // เดินทาง
  { key: "car", label: "รถยนต์", group: "เดินทาง", Icon: Car },
  { key: "bike", label: "จักรยาน", group: "เดินทาง", Icon: Bike },
  { key: "bus", label: "รถบัส", group: "เดินทาง", Icon: Bus },
  { key: "train-front", label: "รถไฟ", group: "เดินทาง", Icon: TrainFront },
  { key: "plane", label: "เครื่องบิน", group: "เดินทาง", Icon: Plane },
  { key: "fuel", label: "น้ำมัน", group: "เดินทาง", Icon: Fuel },
  { key: "parking-circle", label: "ที่จอดรถ", group: "เดินทาง", Icon: ParkingCircle },
  // บ้าน/บิล
  { key: "home", label: "บ้าน", group: "บ้าน", Icon: Home },
  { key: "bed", label: "ที่นอน", group: "บ้าน", Icon: Bed },
  { key: "sofa", label: "โซฟา", group: "บ้าน", Icon: Sofa },
  { key: "lamp", label: "ตกแต่ง", group: "บ้าน", Icon: Lamp },
  { key: "zap", label: "ค่าไฟ", group: "บ้าน", Icon: Zap },
  { key: "droplet", label: "ค่าน้ำ", group: "บ้าน", Icon: Droplet },
  { key: "wifi", label: "อินเทอร์เน็ต", group: "บ้าน", Icon: Wifi },
  { key: "trash-2", label: "ค่าขยะ", group: "บ้าน", Icon: Trash2 },
  // สุขภาพ
  { key: "heart-pulse", label: "สุขภาพ", group: "สุขภาพ", Icon: HeartPulse },
  { key: "pill", label: "ยา", group: "สุขภาพ", Icon: Pill },
  { key: "stethoscope", label: "หมอ", group: "สุขภาพ", Icon: Stethoscope },
  { key: "dumbbell", label: "ฟิตเนส", group: "สุขภาพ", Icon: Dumbbell },
  // บันเทิง
  { key: "tv", label: "ทีวี", group: "บันเทิง", Icon: Tv },
  { key: "film", label: "หนัง", group: "บันเทิง", Icon: Film },
  { key: "gamepad-2", label: "เกม", group: "บันเทิง", Icon: Gamepad2 },
  { key: "music", label: "เพลง", group: "บันเทิง", Icon: Music },
  { key: "ticket", label: "ตั๋ว", group: "บันเทิง", Icon: Ticket },
  { key: "party-popper", label: "ปาร์ตี้", group: "บันเทิง", Icon: PartyPopper },
  // การศึกษา/ทำงาน
  { key: "graduation-cap", label: "การศึกษา", group: "การศึกษา", Icon: GraduationCap },
  { key: "book", label: "หนังสือ", group: "การศึกษา", Icon: Book },
  { key: "pencil", label: "เครื่องเขียน", group: "การศึกษา", Icon: Pencil },
  { key: "laptop", label: "คอมพิวเตอร์", group: "การศึกษา", Icon: Laptop },
  { key: "briefcase", label: "งาน", group: "การศึกษา", Icon: Briefcase },
  { key: "building-2", label: "ออฟฟิศ", group: "การศึกษา", Icon: Building2 },
  { key: "printer", label: "เครื่องพิมพ์", group: "การศึกษา", Icon: Printer },
  // การเงิน
  { key: "banknote", label: "เงินสด", group: "การเงิน", Icon: Banknote },
  { key: "credit-card", label: "บัตรเครดิต", group: "การเงิน", Icon: CreditCard },
  { key: "wallet", label: "กระเป๋าเงิน", group: "การเงิน", Icon: Wallet },
  { key: "piggy-bank", label: "ออมเงิน", group: "การเงิน", Icon: PiggyBank },
  { key: "coins", label: "เหรียญ", group: "การเงิน", Icon: Coins },
  { key: "hand-coins", label: "จ่ายเงิน", group: "การเงิน", Icon: HandCoins },
  { key: "arrow-left-right", label: "โอน", group: "การเงิน", Icon: ArrowLeftRight },
  { key: "trending-up", label: "ลงทุน", group: "การเงิน", Icon: TrendingUp },
  // คน/สัตว์เลี้ยง
  { key: "users", label: "ครอบครัว", group: "อื่นๆ", Icon: Users },
  { key: "baby", label: "เด็ก", group: "อื่นๆ", Icon: Baby },
  { key: "paw-print", label: "สัตว์เลี้ยง", group: "อื่นๆ", Icon: PawPrint },
  // ทั่วไป
  { key: "shield-check", label: "ประกัน", group: "อื่นๆ", Icon: ShieldCheck },
  { key: "star", label: "สำคัญ", group: "อื่นๆ", Icon: Star },
  { key: "bell", label: "แจ้งเตือน", group: "อื่นๆ", Icon: Bell },
  { key: "tag", label: "ป้าย", group: "อื่นๆ", Icon: Tag },
  { key: "more-horizontal", label: "อื่นๆ", group: "อื่นๆ", Icon: MoreHorizontal },
];

// kebab-case key (ของ DB) → Lucide component
const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map((o) => [o.key, o.Icon])
);

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
