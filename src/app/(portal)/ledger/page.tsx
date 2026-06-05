import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LedgerPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>รายการทั้งหมด</CardTitle>
        <CardDescription>per user · มี userId</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        placeholder — รวมธุรกรรมทุกประเภท (ยังไม่ต่อ DB)
      </CardContent>
    </Card>
  );
}
