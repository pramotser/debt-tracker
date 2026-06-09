import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/features/profile/profile-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลส่วนตัว</CardTitle>
          <CardDescription>
            ชื่อที่จะแสดงในระบบ — แก้ไขแล้วกดบันทึก
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaults={{
              firstName: user.firstName,
              middleName: user.middleName,
              lastName: user.lastName,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
