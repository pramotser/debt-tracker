import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CardsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>บัตร</CardTitle>
        <CardDescription>per user · มี userId</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        placeholder — บัตรเครดิต/เดบิตของผู้ใช้ (ยังไม่ต่อ DB)
      </CardContent>
    </Card>
  );
}
