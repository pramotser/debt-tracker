import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FixCostPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ค่าใช้จ่ายประจำ</CardTitle>
        <CardDescription>per user · มี userId</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        placeholder — รายการค่าใช้จ่ายคงที่ต่อเดือน (ยังไม่ต่อ DB)
      </CardContent>
    </Card>
  );
}
