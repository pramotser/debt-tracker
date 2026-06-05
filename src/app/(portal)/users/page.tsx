import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ผู้ใช้</CardTitle>
        <CardDescription>admin only · ไม่มี userId</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        placeholder — รายชื่อผู้ใช้ (ยังไม่ต่อ DB)
      </CardContent>
    </Card>
  );
}
