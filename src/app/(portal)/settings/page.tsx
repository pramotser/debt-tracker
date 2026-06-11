import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/features/profile/profile-form";
import { ThemeForm } from "@/features/settings/theme-form";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/server/actions/auth";

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

      <Card>
        <CardHeader>
          <CardTitle>ธีม</CardTitle>
          <CardDescription>
            เลือกโทนสว่าง/มืด หรือให้ตามอุปกรณ์
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeForm />
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>ออกจากระบบ</CardTitle>
          <CardDescription>
            ออกจากระบบในอุปกรณ์นี้ — ต้องเข้าสู่ระบบใหม่ครั้งถัดไป
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="destructive">
              <LogOut />
              ออกจากระบบ
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
