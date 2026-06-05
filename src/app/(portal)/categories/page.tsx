import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CategoriesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>หมวดหมู่</CardTitle>
        <CardDescription>admin only · ไม่มี userId</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        placeholder — หมวดหมู่รายจ่าย (ยังไม่ต่อ DB)
      </CardContent>
    </Card>
  );
}
