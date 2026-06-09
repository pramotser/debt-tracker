import { redirect } from "next/navigation";

import { AuthBrand } from "@/components/layout/auth-brand";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ต้องมาจากลิงก์ใน email (callback → exchange code → มี session) เท่านั้น
  if (!user) {
    redirect("/login?error=reset_link_invalid");
  }

  return (
    <>
      <AuthBrand />
      <Card>
        <CardHeader className="text-center">
          <CardTitle>ตั้งรหัสผ่านใหม่</CardTitle>
          <CardDescription>กรอกรหัสผ่านใหม่ที่ต้องการใช้</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </>
  );
}
