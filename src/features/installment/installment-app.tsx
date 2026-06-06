import { MOCK_PLANS, MOCK_UPCOMING } from "./mock";
import { PlanCard } from "./plan-card";
import { RemainingBalanceCard } from "./remaining-balance-card";
import { SummaryCard } from "./summary-card";
import { UpcomingList } from "./upcoming-list";

export function InstallmentApp() {
  const active = MOCK_PLANS.filter((p) => p.status === "active");
  const nearEnd = MOCK_PLANS.filter((p) => p.status === "near-end");
  const completed = MOCK_PLANS.filter((p) => p.status === "completed");
  const early = MOCK_PLANS.filter((p) => p.status === "early-settlement");

  const dueThisMonth = MOCK_UPCOMING.reduce((s, p) => s + p.amount, 0);

  const inProgressPlans = [...active, ...nearEnd];
  const totalRemaining = inProgressPlans.reduce(
    (s, p) => s + p.remainingAmount,
    0
  );
  const totalInstallments = inProgressPlans.reduce(
    (s, p) => s + p.totalInstallments,
    0
  );
  const paidInstallments = inProgressPlans.reduce(
    (s, p) => s + p.paidInstallments,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">ผ่อนชำระ</h1>
      <p className="-mt-4 text-sm text-muted-foreground">
        ติดตามภาระการผ่อนทั้งหมดของคุณ
      </p>

      <SummaryCard
        dueThisMonth={dueThisMonth}
        totalRemaining={totalRemaining}
        activeCount={active.length}
        nearEndCount={nearEnd.length}
      />

      <Section title="ภาระการผ่อนคงเหลือ">
        <RemainingBalanceCard
          totalRemaining={totalRemaining}
          totalInstallments={totalInstallments}
          paidInstallments={paidInstallments}
        />
      </Section>

      <Section title="งวดที่กำลังจะถึง">
        <UpcomingList items={MOCK_UPCOMING} />
      </Section>

      {active.length > 0 && (
        <Section title="กำลังผ่อน">
          <div className="flex flex-col gap-3">
            {active.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>
        </Section>
      )}

      {nearEnd.length > 0 && (
        <Section title="ใกล้จบ">
          <div className="flex flex-col gap-3">
            {nearEnd.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>
        </Section>
      )}

      {completed.length > 0 && (
        <Section title="ผ่อนครบแล้ว">
          <div className="flex flex-col gap-3">
            {completed.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>
        </Section>
      )}

      {early.length > 0 && (
        <Section title="ปิดก่อนกำหนด">
          <div className="flex flex-col gap-3">
            {early.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
