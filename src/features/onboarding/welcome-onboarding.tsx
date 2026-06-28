"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CreditCard,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  markWelcomeSeen,
  skipAllTours,
  startDashboardTour,
  WELCOME_KEY,
} from "./tour";

type ChecklistItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const checklist: ChecklistItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "ดูภาพรวมรายจ่ายเดือนนี้ + แนวโน้ม",
    icon: LayoutDashboard,
  },
  {
    href: "/recurring",
    label: "รายการค่าใช้จ่าย",
    description: "ตั้งรายการประจำ — ค่าเช่า/ค่าน้ำไฟ/subscription",
    icon: ListChecks,
  },
  {
    href: "/credit-cards",
    label: "บัตรเครดิต",
    description: "statement บัตร + แผนผ่อนชำระ",
    icon: CreditCard,
  },
  {
    href: "/ledger",
    label: "รายการทั้งหมด",
    description: "ค้นหา/กรองทุกธุรกรรมในที่เดียว",
    icon: ScrollText,
  },
  {
    href: "/settings",
    label: "ตั้งค่า",
    description: "แก้โปรไฟล์ + เปลี่ยนธีม",
    icon: Settings,
  },
];

export function WelcomeOnboarding({ firstName }: { firstName: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  // เช็คหลัง mount เท่านั้น — server render = ปิดเสมอ ไม่มี hydration mismatch
  useEffect(() => {
    try {
      // localStorage อ่านได้เฉพาะ client → ต้องเช็คใน effect (เลี่ยง hydration mismatch)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(WELCOME_KEY)) setOpen(true);
    } catch {
      // localStorage ใช้ไม่ได้ (private mode ฯลฯ) — ไม่ต้องเด้ง
    }
  }, []);

  // ปิดแบบ X / overlay หรือกด "ข้ามทั้งหมด" → ไม่ให้ทัวร์รายหน้าเด้งอีก
  function skip() {
    skipAllTours();
    setOpen(false);
  }

  // กด "เริ่มทัวร์" → ปิด modal แล้วเริ่ม spotlight tour ของ dashboard
  function startGuide() {
    setOpen(false);
    startDashboardTour();
  }

  // กดลิงก์ checklist → จำว่าเห็น welcome แล้ว (ทัวร์ของหน้านั้นจะเด้งเองตอนไปถึง)
  function gotoPage() {
    markWelcomeSeen();
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) skipAllTours();
    setOpen(next);
  }

  const greeting = firstName ? `ยินดีต้อนรับ ${firstName} 👋` : "ยินดีต้อนรับ 👋";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" />
            ขั้นตอน {step}/2
          </Badge>
          {step === 1 ? (
            <>
              <DialogTitle>{greeting}</DialogTitle>
              <DialogDescription>
                แอปนี้ช่วยติดตามหนี้และรายจ่ายส่วนตัวของคุณแบบครบจบในที่เดียว
                (แทน Notion tracker) — มาดูกันว่าเริ่มจากตรงไหนได้บ้าง
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle>เริ่มต้นใช้งาน</DialogTitle>
              <DialogDescription>
                กด &quot;เริ่มทัวร์&quot; ให้พาเดินทีละจอ หรือแตะหัวข้อที่สนใจเพื่อไปเองได้เลย
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {step === 2 && (
          <ul className="flex flex-col gap-1">
            {checklist.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={gotoPage}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary/60"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* dot indicator */}
        <div className="flex justify-center gap-1.5">
          {[1, 2].map((n) => (
            <span
              key={n}
              aria-hidden
              className={cn(
                "size-1.5 rounded-full transition-colors",
                n === step ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={skip}>
                ข้ามทั้งหมด
              </Button>
              <Button onClick={() => setStep(2)}>ถัดไป</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep(1)}>
                ย้อนกลับ
              </Button>
              <Button onClick={startGuide}>เริ่มทัวร์ 🎯</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
