import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TransactionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ธุรกรรม</CardTitle>
        <CardDescription>per user · มี userId</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        placeholder — รายการใช้จ่ายต่อเดือน (ยังไม่ต่อ DB)
      </CardContent>
    </Card>
  );
}
