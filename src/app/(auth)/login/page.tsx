"use client";

import { AlertCircle, Loader2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";
import { PasswordInput } from "@/features/auth/password-input";
import { signInWithPassword } from "@/server/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signInWithPassword, undefined);

  return (
    <>
      <AuthBrand />
      <Card>
        <CardHeader>
          <CardTitle>เข้าสู่ระบบ</CardTitle>
          <CardDescription>ใช้บัญชีของคุณเพื่อเข้าใช้งาน</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                required
                minLength={6}
                autoComplete="current-password"
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
              {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              หรือ
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <GoogleSignInButton />
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
