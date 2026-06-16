import { LandingFinalCta } from "@/features/landing/components/landing-final-cta";
import { LandingFriendSteps } from "@/features/landing/components/landing-friend-steps";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { LandingHero } from "@/features/landing/components/landing-hero";
import { LandingZones } from "@/features/landing/components/landing-zones";

export const metadata = {
  title: "Debt Tracker — หนี้ ผ่อน บัตร รู้หมดในที่เดียว",
  description:
    "แอปคุมหนี้/รายจ่ายส่วนตัว ใช้เอง 100% เปิดให้เพื่อนลอง — ค่าใช้จ่ายประจำ ยอดผ่อน บิลบัตรเครดิต รวมไว้ที่เดียว",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingZones />
        <LandingFriendSteps />
        <LandingFinalCta />
      </main>
    </div>
  );
}
