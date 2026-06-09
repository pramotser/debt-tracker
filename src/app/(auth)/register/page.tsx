"use client";

import Link from "next/link";
import { useActionState } from "react";

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
import { signUpWithPassword } from "@/server/actions/auth";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signUpWithPassword, undefined);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>สมัครสมาชิก</CardTitle>
        <CardDescription>สร้างบัญชีใหม่ด้วย email</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">ชื่อ</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                maxLength={50}
                autoComplete="given-name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">นามสกุล</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                maxLength={50}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="middleName">ชื่อกลาง (ถ้ามี)</Label>
            <Input
              id="middleName"
              name="middleName"
              maxLength={50}
              autoComplete="additional-name"
            />
          </div>
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
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
