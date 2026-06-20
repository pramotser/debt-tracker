import { BrandMark } from "@/components/layout/brand-mark";

export function AuthBrand() {
  return (
    <div className="mb-6 flex flex-col items-center gap-2 text-center">
      <BrandMark size={48} />
      <h1 className="text-2xl font-semibold tracking-tight">Debt Tracker</h1>
      <p className="text-sm text-muted-foreground">ติดตามหนี้/รายจ่ายส่วนตัว</p>
    </div>
  );
}
