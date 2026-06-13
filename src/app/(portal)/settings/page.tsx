import { LogOut, Mail } from "lucide-react";

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
import { getUserSettings } from "@/server/queries/user-settings";

export default async function SettingsPage() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getUserSettings(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลส่วนตัว</CardTitle>
          <CardDescription>
            ชื่อที่จะแสดงในระบบ — แก้ไขแล้วกดบันทึก
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">อีเมล</span>
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <Mail className="size-4 shrink-0" />
              <span className="truncate">{user.email || "—"}</span>
            </div>
          </div>
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
            เลือกโทนสว่าง/มืด หรือให้ตามอุปกรณ์ — บันทึกอัตโนมัติ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeForm initialTheme={settings.theme} />
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
