"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { AuthBrand } from "@/components/layout/auth-brand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/server/actions/auth";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <>
      <AuthBrand />
      <Card>
        <CardHeader className="text-center">
          <CardTitle>ลืมรหัสผ่าน</CardTitle>
          <CardDescription>
            กรอก email ที่ใช้สมัคร เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {state?.sent ? (
            <Alert>
              <CheckCircle2 />
              <AlertDescription>
                ถ้า email นี้มีในระบบ คุณจะได้รับลิงก์ตั้งรหัสผ่านใหม่ในไม่กี่นาที — กรุณาเช็คกล่องจดหมาย (รวม spam)
              </AlertDescription>
            </Alert>
          ) : (
            <form action={action} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </div>
              {state?.error ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {pending ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
