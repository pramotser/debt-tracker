import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ตั้งค่า</CardTitle>
        <CardDescription>preferences ของผู้ใช้</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        placeholder — การตั้งค่าทั่วไป (ยังไม่ต่อ DB)
      </CardContent>
    </Card>
  );
}
