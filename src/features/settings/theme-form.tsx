"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OPTIONS: { value: string; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System (ตามอุปกรณ์)" },
];

export function ThemeForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const value = mounted ? theme ?? "system" : "system";

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="theme">ธีม</Label>
      <Select value={value} onValueChange={(v) => v && setTheme(v)}>
        <SelectTrigger id="theme" className="w-full sm:w-64" disabled={!mounted}>
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
