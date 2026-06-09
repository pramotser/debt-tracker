"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/server/actions/profile";

type Props = {
  defaults: {
    firstName: string;
    middleName: string | null;
    lastName: string;
  };
};

export function ProfileForm({ defaults }: Props) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="firstName">ชื่อ</Label>
        <Input
          id="firstName"
          name="firstName"
          required
          maxLength={50}
          defaultValue={defaults.firstName}
          autoComplete="given-name"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="middleName">ชื่อกลาง (ถ้ามี)</Label>
        <Input
          id="middleName"
          name="middleName"
          maxLength={50}
          defaultValue={defaults.middleName ?? ""}
          autoComplete="additional-name"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lastName">นามสกุล</Label>
        <Input
          id="lastName"
          name="lastName"
          required
          maxLength={50}
          defaultValue={defaults.lastName}
          autoComplete="family-name"
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-600">บันทึกแล้ว</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "กำลังบันทึก..." : "บันทึก"}
      </Button>
    </form>
  );
}
