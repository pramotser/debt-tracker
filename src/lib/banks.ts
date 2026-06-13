// Bank placeholder config — ย้ายเป็น admin banks table ทีหลัง
// brand color เป็น **ข้อยกเว้นที่ตั้งใจ** ของกฎ "ห้าม hardcode สี"
// สีอื่น ๆ ใน UI ยังต้องผ่าน token ของ shadcn/Tailwind

export type BankBrand = {
  id: string;
  label: string;
  bg: string;
  fg: string;
};

export const BANKS: Record<string, BankBrand> = {
  "b-uob": { id: "b-uob", label: "UOB", bg: "#185FA5", fg: "#E6F1FB" },
  "b-ttb": { id: "b-ttb", label: "TTB", bg: "#1C4DA1", fg: "#E5EDF8" },
  "b-scb": { id: "b-scb", label: "SCB", bg: "#534AB7", fg: "#EEEDFE" },
  "b-kbank": { id: "b-kbank", label: "KBank", bg: "#3B6D11", fg: "#EAF3DE" },
  "b-kkp": { id: "b-kkp", label: "KKP", bg: "#1A3F66", fg: "#E5ECF3" },
  "b-ktc": { id: "b-ktc", label: "KTC", bg: "#0E7C66", fg: "#E1F2EC" },
};

export const FALLBACK_BANK: BankBrand = {
  id: "__fallback",
  label: "อื่น ๆ",
  bg: "#5F5E5A",
  fg: "#F1EFE8",
};

export function getBankBrand(bankId: string | null | undefined): BankBrand {
  if (!bankId) return FALLBACK_BANK;
  return BANKS[bankId] ?? FALLBACK_BANK;
}

export const BANK_LIST: BankBrand[] = Object.values(BANKS);

export const CARD_NETWORKS = [
  "visa",
  "mastercard",
  "jcb",
  "amex",
  "unionpay",
] as const;

export type CardNetwork = (typeof CARD_NETWORKS)[number];

const NETWORK_LABELS: Record<CardNetwork, string> = {
  visa: "VISA",
  mastercard: "Mastercard",
  jcb: "JCB",
  amex: "Amex",
  unionpay: "UnionPay",
};

export function getNetworkLabel(network: string | null | undefined): string | null {
  if (!network) return null;
  return NETWORK_LABELS[network as CardNetwork] ?? network;
}

// ธีมสีการ์ดที่ user เลือกได้ — gradient 135deg (`from` → `to`)
// ใช้บน CardFace ใน tab "บัตรของฉัน" + แสดงเป็นพื้นหลังการ์ดทุกที่
export const CARD_COLORS = ["blue", "navy", "teal", "plum"] as const;

export type CardColor = (typeof CARD_COLORS)[number];

export type CardColorTheme = {
  id: CardColor;
  label: string;
  from: string;
  to: string;
  fg: string;
};

export const CARD_COLOR_THEMES: Record<CardColor, CardColorTheme> = {
  blue: { id: "blue", label: "น้ำเงิน", from: "#2563EB", to: "#1E3A8A", fg: "#F1F5FD" },
  navy: { id: "navy", label: "กรมท่า", from: "#2B2F52", to: "#474D86", fg: "#ECEDF6" },
  teal: { id: "teal", label: "เขียวมรกต", from: "#0E7C6B", to: "#0B4F45", fg: "#E2F2EE" },
  plum: { id: "plum", label: "ม่วงพลัม", from: "#7C3AED", to: "#5B21B6", fg: "#EFE8FB" },
};

export function getCardColorTheme(color: string | null | undefined): CardColorTheme {
  if (!color) return CARD_COLOR_THEMES.blue;
  return (CARD_COLOR_THEMES as Record<string, CardColorTheme>)[color] ?? CARD_COLOR_THEMES.blue;
}
