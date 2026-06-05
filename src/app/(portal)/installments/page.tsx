import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InstallmentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ผ่อนชำระ</CardTitle>
        <CardDescription>Credit Cost · ผ่อน 0% / มีดอก / ปิดยอด</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        placeholder — module นี้มี spec แยก ยังไม่ implement logic
      </CardContent>
    </Card>
  );
}
