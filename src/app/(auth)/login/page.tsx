"use client";

import Link from "next/link";

import { AuthBrand } from "@/components/layout/auth-brand";
import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";

// --- ปิดชั่วคราว: login ด้วย email/password + สมัครสมาชิก (เหลือเฉพาะ Google) ---
// import { AlertCircle, Loader2 } from "lucide-react";
// import { useActionState } from "react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { PasswordInput } from "@/features/auth/password-input";
// import { signInWithPassword } from "@/server/actions/auth";

export default function LoginPage() {
  return (
    <>
      <AuthBrand />

      <div className="rounded-2xl border border-white/50 bg-card/70 p-7 shadow-[0_1px_2px_rgba(22,36,63,0.04),0_30px_60px_-24px_rgba(22,36,63,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-card/60">
        <div className="mb-6 text-center">
          <h1 className="text-[22px] font-semibold tracking-[-0.01em]">
            เข้าสู่ระบบ
          </h1>
          <p className="mt-1.5 text-[14px] text-[#8A99AD]">
            เข้าด้วยบัญชี Google เพื่อใช้งาน
          </p>
        </div>

        <GoogleSignInButton />
      </div>

      <p className="mt-6 text-center text-[12.5px] text-[#8A99AD]">
        เข้าสู่ระบบ = ยอมรับการใช้งานตามปกติ ·{" "}
        <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
          กลับหน้าแรก
        </Link>
      </p>
    </>
  );
}
