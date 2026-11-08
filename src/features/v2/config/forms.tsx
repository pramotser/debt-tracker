"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { Bank, CardNetwork, Category } from "@/db/schema-v2";
import { IconPicker } from "@/features/admin/icon-picker";
import { saveConfigItem, type ActionResult } from "@/server/actions/v2/config";

import {
  CODE_RE,
  CodeField,
  ColorField,
  HEX_RE,
  SortActiveFields,
  TextField,
} from "./fields";
import { CategoryIcon } from "./category-icon";
import { FormShell } from "./form-shell";

type BaseProps<T> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: T | null;
};

// state กลางของทุกฟอร์ม: pending + error + ปิดเมื่อสำเร็จ
// ฟอร์ม remount ทุกครั้งที่เปิด (key จาก ConfigApp) → state เริ่มจาก initial ได้เลย ไม่ต้อง useEffect
function useSave(onOpenChange: (o: boolean) => void, label: string) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const save = (fn: () => Promise<ActionResult>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(`บันทึก${label}แล้ว`);
        onOpenChange(false);
      } else {
        setError(res.error);
      }
    });
  };
  return { pending, error, save };
}

const toSort = (v: string) => (v === "" ? 0 : Number(v));

// ---------- ธนาคาร ----------
const BANK_BG = "#5F5E5A";
const BANK_FG = "#F1EFE8";

export function BankForm({ open, onOpenChange, initial }: BaseProps<Bank>) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [shortName, setShortName] = useState(initial?.shortName ?? "");
  const [nameTh, setNameTh] = useState(initial?.nameTh ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [brandBg, setBrandBg] = useState(initial?.brandBg ?? BANK_BG);
  const [brandFg, setBrandFg] = useState(initial?.brandFg ?? BANK_FG);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const { pending, error, save } = useSave(onOpenChange, "ธนาคาร");


  const canSubmit =
    CODE_RE.test(code) &&
    shortName.trim() !== "" &&
    nameTh.trim() !== "" &&
    HEX_RE.test(brandBg) &&
    HEX_RE.test(brandFg);

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "แก้ไขธนาคาร" : "เพิ่มธนาคาร"}
      error={error}
      pending={pending}
      canSubmit={canSubmit}
      onSubmit={() =>
        save(() =>
          saveConfigItem("bank", initial?.id ?? null, {
            code,
            shortName,
            nameTh,
            nameEn,
            brandBg,
            brandFg,
            sortOrder: toSort(sortOrder),
            isActive,
          })
        )
      }
    >
      <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
        <BankLogo shortName={shortName || "ตัวอย่าง"} bg={brandBg} fg={brandFg} />
        <span className="min-w-0 truncate text-sm font-medium">
          {nameTh || "ชื่อธนาคาร"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="bank-short"
          label="ชื่อย่อ"
          value={shortName}
          onChange={(v) => {
            setShortName(v);
            if (!initial) setCode(v.toLowerCase().replace(/[^a-z0-9]+/g, ""));
          }}
          placeholder="KBank"
          maxLength={20}
          autoFocus
        />
        <CodeField id="bank-code" value={code} onChange={setCode} placeholder="kbank" />
      </div>
      <TextField id="bank-th" label="ชื่อไทย" value={nameTh} onChange={setNameTh} placeholder="ธนาคารกสิกรไทย" />
      <TextField id="bank-en" label="ชื่ออังกฤษ (ไม่บังคับ)" value={nameEn} onChange={setNameEn} placeholder="Kasikornbank" />
      <div className="grid grid-cols-2 gap-3">
        <ColorField id="bank-bg" label="สีพื้น" value={brandBg} onChange={setBrandBg} fallback={BANK_BG} />
        <ColorField id="bank-fg" label="สีตัวอักษร" value={brandFg} onChange={setBrandFg} fallback={BANK_FG} />
      </div>
      <SortActiveFields
        idPrefix="bank"
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        isActive={isActive}
        setIsActive={setIsActive}
      />
    </FormShell>
  );
}

export function BankLogo({
  shortName,
  bg,
  fg,
}: {
  shortName: string;
  bg: string;
  fg: string;
}) {
  return (
    <span
      className="inline-flex h-8 min-w-14 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-semibold whitespace-nowrap"
      style={{
        backgroundColor: HEX_RE.test(bg) ? bg : BANK_BG,
        color: HEX_RE.test(fg) ? fg : BANK_FG,
      }}
    >
      {shortName}
    </span>
  );
}

// ---------- หมวดหมู่ ----------
const CAT_BG = "#94A3B8";
const CAT_FG = "#FFFFFF";

export function CategoryForm({ open, onOpenChange, initial }: BaseProps<Category>) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [nameTh, setNameTh] = useState(initial?.nameTh ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "tag");
  const [colorBg, setColorBg] = useState(initial?.colorBg ?? CAT_BG);
  const [colorFg, setColorFg] = useState(initial?.colorFg ?? CAT_FG);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const { pending, error, save } = useSave(onOpenChange, "หมวดหมู่");


  const canSubmit =
    CODE_RE.test(code) &&
    nameTh.trim() !== "" &&
    icon !== "" &&
    HEX_RE.test(colorBg) &&
    HEX_RE.test(colorFg);

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
      error={error}
      pending={pending}
      canSubmit={canSubmit}
      onSubmit={() =>
        save(() =>
          saveConfigItem("category", initial?.id ?? null, {
            code,
            nameTh,
            nameEn,
            icon,
            colorBg,
            colorFg,
            sortOrder: toSort(sortOrder),
            isActive,
          })
        )
      }
    >
      <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
        <span
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: HEX_RE.test(colorBg) ? colorBg : CAT_BG,
            color: HEX_RE.test(colorFg) ? colorFg : CAT_FG,
          }}
        >
          <CategoryIcon icon={icon} className="size-4" />
        </span>
        <span className="min-w-0 truncate text-sm font-medium">
          {nameTh || "ชื่อหมวดหมู่"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="cat-th" label="ชื่อไทย" value={nameTh} onChange={setNameTh} placeholder="อาหาร" autoFocus />
        <CodeField id="cat-code" value={code} onChange={setCode} placeholder="food" />
      </div>
      <TextField id="cat-en" label="ชื่ออังกฤษ (ไม่บังคับ)" value={nameEn} onChange={setNameEn} placeholder="Food" />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">ไอคอน</span>
        <IconPicker value={icon} onChange={setIcon} bgPreview={colorBg} fgPreview={colorFg} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ColorField id="cat-bg" label="สีพื้น" value={colorBg} onChange={setColorBg} fallback={CAT_BG} />
        <ColorField id="cat-fg" label="สีไอคอน" value={colorFg} onChange={setColorFg} fallback={CAT_FG} />
      </div>
      <SortActiveFields
        idPrefix="cat"
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        isActive={isActive}
        setIsActive={setIsActive}
      />
    </FormShell>
  );
}

// ---------- เครือข่ายบัตร ----------
export function NetworkForm({ open, onOpenChange, initial }: BaseProps<CardNetwork>) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const { pending, error, save } = useSave(onOpenChange, "เครือข่ายบัตร");


  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "แก้ไขเครือข่ายบัตร" : "เพิ่มเครือข่ายบัตร"}
      error={error}
      pending={pending}
      canSubmit={CODE_RE.test(code) && name.trim() !== ""}
      onSubmit={() =>
        save(() =>
          saveConfigItem("network", initial?.id ?? null, {
            code,
            name,
            sortOrder: toSort(sortOrder),
            isActive,
          })
        )
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="net-name"
          label="ชื่อ"
          value={name}
          onChange={(v) => {
            setName(v);
            if (!initial) setCode(v.toLowerCase().replace(/[^a-z0-9]+/g, ""));
          }}
          placeholder="Visa"
          maxLength={60}
          autoFocus
        />
        <CodeField id="net-code" value={code} onChange={setCode} placeholder="visa" />
      </div>
      <SortActiveFields
        idPrefix="net"
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        isActive={isActive}
        setIsActive={setIsActive}
      />
    </FormShell>
  );
}
