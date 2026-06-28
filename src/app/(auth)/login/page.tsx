"use client";

import { AuthBrand } from "@/components/layout/auth-brand";
import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";

// --- ปิดชั่วคราว: login ด้วย email/password + สมัครสมาชิก (เหลือเฉพาะ Google) ---
// import { AlertCircle, Loader2 } from "lucide-react";
// import Link from "next/link";
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

      <div className="rounded-[24px] border border-foreground/10 bg-card p-7 shadow-[0_1px_2px_rgba(22,36,63,0.04),0_24px_56px_-28px_rgba(22,36,63,0.32)] sm:p-8">
        <div className="mb-7 text-center">
          <h1 className="text-[24px] font-bold tracking-[-0.01em]">
            เข้าสู่ระบบ
          </h1>
          <p className="mt-2 text-[14.5px] text-[#4B5B73]">
            ใช้บัญชี Google ของคุณเพื่อเริ่มใช้งานได้เลย
          </p>
        </div>

        <GoogleSignInButton />

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-[#8A99AD]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l7 3v6c0 4.4-3 8.4-7 9.5C8 19.4 5 15.4 5 11V5l7-3z"
              stroke="#2E9E6B"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          ล็อกอินปลอดภัยด้วย Google · ข้อมูลของแต่ละคนแยกกัน
        </p>
      </div>

      <p className="mt-6 text-center text-[13px] text-[#8A99AD]">
        แอปนี้ทำไว้ใช้เอง เปิดให้เพื่อนที่สนใจลองด้วยครับ
      </p>
    </>
  );
}
