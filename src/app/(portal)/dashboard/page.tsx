import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ภาพรวม</CardTitle>
        <CardDescription>สรุปหนี้ ค่าใช้จ่าย และยอดผ่อน</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        placeholder — ยังไม่ต่อ DB
      </CardContent>
    </Card>
  );
}
