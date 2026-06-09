import { Wallet } from "lucide-react";

export function AuthBrand() {
  return (
    <div className="mb-6 flex flex-col items-center gap-2 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Wallet className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Debt Tracker</h1>
      <p className="text-sm text-muted-foreground">ติดตามหนี้/รายจ่ายส่วนตัว</p>
    </div>
  );
}
