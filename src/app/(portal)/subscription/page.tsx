import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SubscriptionPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>สมาชิก/บริการ</CardTitle>
        <CardDescription>per user · มี userId</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        placeholder — Subscription ที่ตัดเงินเป็นรอบ (ยังไม่ต่อ DB)
      </CardContent>
    </Card>
  );
}
