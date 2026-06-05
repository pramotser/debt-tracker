import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <section className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>แดชบอร์ด</CardTitle>
          <CardDescription>ภาพรวมหนี้ บัตร และยอดผ่อน</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          placeholder — ยังไม่ต่อ DB
        </CardContent>
      </Card>
    </section>
  );
}
