"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

/**
 * Spotlight tour engine (driver.js) — เป็น "เครื่องมือ" ล้วน ไม่จัดการสถานะว่าเห็นแล้วหรือยัง
 * การตัดสินใจว่าจะเด้งหรือไม่ + จำสถานะ อยู่ที่ <Onboarding> (ผูกกับบัญชีผู้ใช้)
 */

export type TourKey =
  | "dashboard"
  | "recurring"
  | "credit-cards"
  | "ledger"
  | "settings";

type Step = {
  /** css selector · หรือ "nav:<slug>" = เมนูที่มองเห็น (sidebar/bottom-nav) */
  target: string;
  title: string;
  description: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
};

const TOURS: Record<TourKey, Step[]> = {
  dashboard: [
    {
      target: "nav:dashboard",
      title: "หน้าหลัก 👋",
      description: "ภาพรวมรายจ่ายของคุณอยู่ที่นี่ — เริ่มกันเลย",
    },
    {
      target: '[data-tour="dash-tab-thismonth"]',
      title: "เดือนนี้ต้องจ่ายอะไรบ้าง",
      description: "สรุปยอดที่ต้องจ่าย/จ่ายแล้วของเดือนปัจจุบัน",
      side: "bottom",
      align: "start",
    },
    {
      target: '[data-tour="dash-tab-overview"]',
      title: "ภาพรวมรายจ่าย",
      description: "ดูแนวโน้มย้อนหลังและภาพรวมทั้งหมด",
      side: "bottom",
      align: "start",
    },
    {
      target: "nav:recurring",
      title: "รายการค่าใช้จ่าย",
      description: "ตั้งรายการประจำ เช่น ค่าเช่า ค่าน้ำไฟ หรือ subscription",
    },
    {
      target: "nav:credit-cards",
      title: "บัตรเครดิต",
      description: "ดู statement และจัดการแผนผ่อนชำระของบัตร",
    },
    {
      target: "nav:ledger",
      title: "รายการทั้งหมด",
      description: "ค้นหาและกรองทุกธุรกรรมได้ในที่เดียว",
    },
    {
      target: "nav:settings",
      title: "ตั้งค่า",
      description: "แก้โปรไฟล์และเปลี่ยนธีมสว่าง/มืดได้ที่นี่",
    },
  ],
  recurring: [
    {
      target: '[data-tour="recurring-tab-month"]',
      title: "รายการเดือนนี้",
      description: "รายการที่ต้องจ่ายในเดือนนี้ — กดติ๊กเมื่อจ่ายแล้ว",
      side: "bottom",
      align: "start",
    },
    {
      target: '[data-tour="recurring-tab-tpl"]',
      title: "ตั้งค่ารายการประจำ",
      description: "ตั้งรายการประจำไว้ครั้งเดียว ระบบดึงเข้าให้ทุกเดือน",
      side: "bottom",
      align: "start",
    },
  ],
  "credit-cards": [
    {
      target: '[data-tour="cc-tab-statement"]',
      title: "Statement",
      description: "ยอดใช้จ่ายบัตรในแต่ละรอบเดือน",
      side: "bottom",
      align: "start",
    },
    {
      target: '[data-tour="cc-tab-installment"]',
      title: "ผ่อนชำระ",
      description: "ติดตามแผนผ่อนและความคืบหน้าแต่ละงวด",
      side: "bottom",
      align: "start",
    },
    {
      target: '[data-tour="cc-tab-mine"]',
      title: "บัตรของฉัน",
      description: "เพิ่มหรือแก้ไขบัตรเครดิตของคุณ",
      side: "bottom",
      align: "start",
    },
  ],
  ledger: [
    {
      target: '[data-tour="ledger-title"]',
      title: "รายการทั้งหมด",
      description: "รวมทุกธุรกรรมจากทุกหน้าไว้ที่เดียว",
      side: "bottom",
      align: "start",
    },
    {
      target: '[data-tour="ledger-search"]',
      title: "ค้นหา & กรอง",
      description: "พิมพ์ชื่อรายการเพื่อค้นหา หรือกรองตามเดือน/ประเภท/หมวด",
      side: "bottom",
      align: "start",
    },
  ],
  settings: [
    {
      target: '[data-tour="settings-profile"]',
      title: "ข้อมูลส่วนตัว",
      description: "แก้ไขชื่อที่แสดงของคุณได้ที่นี่",
      side: "bottom",
      align: "start",
    },
    {
      target: '[data-tour="settings-theme"]',
      title: "ธีม",
      description: "สลับโหมดสว่าง/มืดได้ตามใจ",
      side: "bottom",
      align: "start",
    },
  ],
};

export function routeToKey(pathname: string): TourKey | null {
  if (pathname === "/" || pathname === "/dashboard") return "dashboard";
  if (pathname.startsWith("/recurring")) return "recurring";
  if (pathname.startsWith("/credit-cards")) return "credit-cards";
  if (pathname.startsWith("/ledger")) return "ledger";
  if (pathname.startsWith("/settings")) return "settings";
  return null;
}

/** หา element เมนูที่ "มองเห็นจริง" (sidebar บน desktop · bottom-nav บนมือถือ) */
function resolveNav(slug: string): Element | undefined {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-tour="nav-${slug}"]`)
  );
  return els.find((el) => el.offsetParent !== null) ?? els[0];
}

/** เริ่มทัวร์ของหน้าที่ระบุทันที · onDone เรียกเมื่อจบ/ปิด (ใช้ persist สถานะ) */
export function runTour(key: TourKey, onDone?: () => void) {
  const config = TOURS[key];
  if (!config) return;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const steps: DriveStep[] = config.map((s) => {
    let element: string | Element | undefined;
    let side = s.side;
    if (s.target.startsWith("nav:")) {
      element = resolveNav(s.target.slice(4));
      side = isMobile ? "top" : "right"; // sidebar=ซ้าย→ขวา · bottom-nav=ล่าง→บน
    } else {
      element = s.target;
    }
    return {
      element,
      popover: { title: s.title, description: s.description, side, align: s.align },
    };
  });

  const d = driver({
    showProgress: true,
    progressText: "{{current}}/{{total}}",
    nextBtnText: "ถัดไป",
    prevBtnText: "ย้อนกลับ",
    doneBtnText: "เข้าใจแล้ว",
    popoverClass: "dt-tour",
    onDestroyed: () => onDone?.(),
    steps,
  });
  d.drive();
}
