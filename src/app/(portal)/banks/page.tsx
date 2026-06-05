import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BanksPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ธนาคาร</CardTitle>
        <CardDescription>admin only · ไม่มี userId</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        placeholder — รายการธนาคาร (ยังไม่ต่อ DB)
      </CardContent>
    </Card>
  );
}
