"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export const CODE_RE = /^[a-z0-9-]{1,40}$/;

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  maxLength = 120,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className="h-10 rounded-xl"
      />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function CodeField({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const invalid = value !== "" && !CODE_RE.test(value);
  return (
    <TextField
      id={id}
      label="code"
      value={value}
      onChange={(v) => onChange(v.toLowerCase().replace(/\s+/g, "-"))}
      placeholder={placeholder}
      maxLength={40}
      hint={invalid ? "ใช้ได้แค่ a-z 0-9 และ -" : "ตัวระบุภาษาอังกฤษ ห้ามซ้ำ"}
    />
  );
}

export function ColorField({
  id,
  label,
  value,
  onChange,
  fallback,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  fallback: string;
}) {
  const valid = HEX_RE.test(value);
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`เลือก${label}`}
          value={valid && value.length === 7 ? value : fallback}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-10 shrink-0 cursor-pointer rounded-xl border border-border bg-transparent p-1"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          className="h-10 min-w-0 rounded-xl font-mono"
          aria-invalid={!valid}
        />
      </div>
    </div>
  );
}

export function SortActiveFields({
  idPrefix,
  sortOrder,
  setSortOrder,
  isActive,
  setIsActive,
}: {
  idPrefix: string;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-sort`}>ลำดับ</Label>
        <Input
          id={`${idPrefix}-sort`}
          inputMode="numeric"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value.replace(/\D/g, ""))}
          className="h-10 rounded-xl"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-active`}>ใช้งาน</Label>
        <div className="flex h-10 items-center">
          <Switch
            id={`${idPrefix}-active`}
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </div>
    </div>
  );
}
