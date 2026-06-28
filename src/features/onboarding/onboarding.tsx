"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
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
import { markOnboarded } from "@/server/actions/onboarding";

import { routeToKey, runTour, type TourKey } from "./tour";

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

/**
 * Onboarding orchestrator — ผูกกับบัญชีผู้ใช้ (prop `onboarded` มาจาก user_settings.onboarded_at)
 * - onboarded = true → ไม่ทำอะไร (เคยผ่านแล้ว)
 * - onboarded = false → เด้ง welcome modal + spotlight tour รายหน้า (ครั้งเดียวต่อบัญชี)
 *
 * mount ใน (portal)/layout.tsx → instance นี้อยู่ข้าม client navigation ระหว่างหน้าใน portal
 * จึงจำได้ว่าหน้าไหน "ทัวร์ไปแล้วในรอบนี้" ด้วย ref (ไม่ต้องพึ่ง localStorage)
 */
export function Onboarding({
  firstName,
  onboarded,
}: {
  firstName: string;
  onboarded: boolean;
}) {
  const pathname = usePathname();
  const [active, setActive] = useState(!onboarded);
  const [welcomeOpen, setWelcomeOpen] = useState(!onboarded);
  const [step, setStep] = useState(1);
  const shownPagesRef = useRef<Set<TourKey>>(new Set());
  const persistedRef = useRef(false);
  const [, startTransition] = useTransition();

  // เขียน onboarded_at ลง DB ครั้งเดียว (กันยิงซ้ำ)
  function persist() {
    if (persistedRef.current) return;
    persistedRef.current = true;
    startTransition(() => {
      void markOnboarded();
    });
  }

  // auto-run ทัวร์ของหน้าที่เข้า "ครั้งแรกในรอบ onboarding นี้"
  useEffect(() => {
    if (!active || welcomeOpen) return;
    const key = routeToKey(pathname);
    if (!key || shownPagesRef.current.has(key)) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      shownPagesRef.current.add(key);
      runTour(key);
    }, 450); // รอ chart/tab เรนเดอร์เสร็จ
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [pathname, active, welcomeOpen]);

  // ปิดแบบ X/overlay หรือกด "ข้ามทั้งหมด" → จบ onboarding ทั้งหมด
  function skip() {
    persist();
    setActive(false);
    setWelcomeOpen(false);
  }

  // "เริ่มทัวร์" → ปิด modal แล้วพาเดิน dashboard tour (รอบนี้ทัวร์หน้าอื่นยังเด้งตอน navigate)
  function startGuide() {
    persist();
    setWelcomeOpen(false);
    shownPagesRef.current.add("dashboard");
    runTour("dashboard");
  }

  // กดลิงก์ checklist → ปิด modal (ทัวร์ของหน้านั้นเด้งเองตอนไปถึง)
  function gotoPage() {
    persist();
    setWelcomeOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) skip();
    else setWelcomeOpen(true);
  }

  if (!active) return null;

  const greeting = firstName ? `ยินดีต้อนรับ ${firstName} 👋` : "ยินดีต้อนรับ 👋";

  return (
    <Dialog open={welcomeOpen} onOpenChange={handleOpenChange}>
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
