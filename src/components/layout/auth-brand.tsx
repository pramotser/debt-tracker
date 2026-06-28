import { BrandMark } from "@/components/layout/brand-mark";

// แสดงเฉพาะจอเล็ก — desktop มี brand panel ฝั่งซ้ายของ auth layout แล้ว
export function AuthBrand() {
  return (
    <div className="mb-6 flex flex-col items-center gap-2 text-center lg:hidden">
      <BrandMark size={44} />
      <h1 className="text-xl font-semibold tracking-tight">Debt Tracker</h1>
    </div>
  );
}
