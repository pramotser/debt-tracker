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
