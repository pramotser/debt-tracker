"use client";

import { useEffect, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTheme } from "@/server/actions/user-settings";

const OPTIONS: { value: string; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System (ตามอุปกรณ์)" },
];

type Props = {
  initialTheme: string;
};

export function ThemeForm({ initialTheme }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => setMounted(true), []);

  const value = mounted ? theme ?? initialTheme : initialTheme;

  const handleChange = (v: string | null) => {
    if (!v || v === value) return;
    setTheme(v);
    startTransition(async () => {
      const result = await updateTheme(v);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("บันทึกธีมแล้ว");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="theme">ธีม</Label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger
          id="theme"
          className="w-full sm:w-64"
          disabled={!mounted || pending}
        >
          <SelectValue>
            {(v: string | null) =>
              OPTIONS.find((o) => o.value === v)?.label ?? ""
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value} label={o.label}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
