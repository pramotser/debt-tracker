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
import { signInWithGoogle, signUpWithPassword } from "@/server/actions/auth";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signUpWithPassword, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>สมัครสมาชิก</CardTitle>
        <CardDescription>สร้างบัญชีใหม่ด้วย email หรือ Google</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
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
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex flex-col gap-3">
        <form action={signInWithGoogle} className="w-full">
          <Button type="submit" variant="outline" className="w-full">
            สมัครด้วย Google
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
